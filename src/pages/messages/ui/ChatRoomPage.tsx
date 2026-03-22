'use client';

import { useEffect, useState, useRef, useCallback, memo } from 'react';
import { createClient } from '@/src/shared/lib/supabase/client';
import { Message, ChatUserProfile } from '@/src/entities/chat/model/types';
import { fetchMessages, sendMessage, getOrCreateChatRoom } from '@/src/entities/chat/api/chat-api';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';
import { Send, ChevronLeft } from 'lucide-react';
import { Button } from '@/src/shared/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/src/app/providers/AuthProvider';

/**
 * 성능 최적화: 입력창 컴포넌트 분리
 */
const MessageInput = memo(({ onSend, disabled }: { onSend: (content: string) => void; disabled: boolean }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || disabled) return;
    onSend(content.trim());
    setContent('');
  };

  return (
    <div className="shrink-0 bg-white border-t p-3 pb-safe-offset-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="메시지를 입력하세요..."
          className="flex-1 rounded-full bg-neutral-100 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
        />
        <Button type="submit" size="icon" className="rounded-full shrink-0 h-10 w-10 shadow-sm" disabled={!content.trim() || disabled}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';

/**
 * 실시간 채팅방 페이지 컴포넌트 (FSD Pages 레이어)
 */
export const ChatRoomPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const { user: authUser } = useAuth();

  // URL에서 방 ID를 가져옵니다. (/messages/new 인 경우 'new'가 됨)
  const initialRoomId = params?.id as string;
  const targetUserId = searchParams?.get('target');

  const [roomId, setRoomId] = useState<string | null>(initialRoomId === 'new' ? null : initialRoomId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(authUser);
  const [isLoading, setIsLoading] = useState(true);
  
  const participantsCache = useRef<Record<string, ChatUserProfile>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. 유저 정보 동기화 및 초기 데이터 로드
  useEffect(() => {
    if (!authUser) {
      // 훅에서 아직 유저 정보를 못 가져왔을 때만 잠시 대기
      if (!isLoading) router.push('/login');
      return;
    }
    setCurrentUser(authUser);

    const init = async () => {
      try {
        // [케이스 A] 이미 방 ID가 있는 경우: 메시지 로드 및 구독 시작
        if (roomId) {
          const { data: participants } = await supabase
            .from('chat_participants' as never)
            .select('user:profiles(id, username, avatar_url)')
            .eq('room_id', roomId);
          
          const rawParticipants = (participants as unknown as { user: ChatUserProfile }[]) || [];
          rawParticipants.forEach((p) => {
            if (p.user) participantsCache.current[p.user.id] = p.user;
          });

          const initialMessages = await fetchMessages(supabase, roomId);
          setMessages(initialMessages);
        } 
        // [케이스 B] 방 ID는 없는데 target 유저 ID가 있는 경우: 기존 방이 있는지 비밀리에 검색
        else if (targetUserId) {
          const existingRoomId = await getOrCreateChatRoom(supabase, user.id, targetUserId);
          if (existingRoomId) {
            setRoomId(existingRoomId);
            // URL을 자연스럽게 실제 방 ID로 교체 (히스토리에 남지 않게 replace)
            router.replace(`/messages/${existingRoomId}`);
          } else {
            // 진짜 첫 대화라면 상대방 프로필 정보만 미리 캐싱해둠
            const { data: targetProfile } = await supabase.from('profiles').select('id, username, avatar_url').eq('id', targetUserId).single();
            if (targetProfile) {
              participantsCache.current[targetProfile.id] = targetProfile as ChatUserProfile;
            }
          }
        }
      } catch (err) {
        console.error('채팅 초기화 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [roomId, initialRoomId, targetUserId, supabase, router]);

  // 2. 실시간 구독 설정
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`chat-room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const newMessage = payload.new as Message;
          let sender = participantsCache.current[newMessage.sender_id];
          if (!sender) {
            const { data } = await supabase.from('profiles').select('id, username, avatar_url').eq('id', newMessage.sender_id).single();
            const profileData = data as unknown as ChatUserProfile | null;
            if (profileData) {
              sender = profileData;
              participantsCache.current[profileData.id] = profileData;
            }
          }
          setMessages((prev) => [...prev, { ...newMessage, sender: sender || undefined }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase]);

  // 3. 메시지 전송 핸들러 (지연 생성 로직 포함)
  const handleSend = useCallback(async (content: string) => {
    if (!currentUser) return;

    let currentRoomId = roomId;

    try {
      // 만약 아직 방이 없다면 (첫 메시지), 이때 방을 생성합니다. ✨
      if (!currentRoomId && targetUserId) {
        currentRoomId = await getOrCreateChatRoom(supabase, currentUser.id, targetUserId);
        setRoomId(currentRoomId);
        router.replace(`/messages/${currentRoomId}`);
      }

      if (currentRoomId) {
        await sendMessage(supabase, currentRoomId, currentUser.id, content);
      }
    } catch (err) {
      console.error('메시지 전송 실패:', err);
      toast.error('메시지를 보내지 못했어요.');
    }
  }, [roomId, targetUserId, supabase, currentUser, router]);

  // 🚨 성능 및 UX 최적화: 스마트 스크롤 (Smart Scroll)
  const prevScrollHeight = useRef<number>(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const currentScrollHeight = el.scrollHeight;
    const prevHeight = prevScrollHeight.current;
    prevScrollHeight.current = currentScrollHeight;

    const lastMessage = messages[messages.length - 1];
    const isMyMessage = lastMessage?.sender_id === currentUser?.id;

    // 1. 초기 로딩 시 무조건 바닥으로 이동 (깜빡임 없이)
    if (prevHeight === 0 || messages.length === 0) {
      el.scrollTop = currentScrollHeight;
      return;
    }

    // 2. 스마트 스크롤 조건: 
    // - 내가 방금 보낸 메시지인 경우
    // - 스크롤이 바닥에서 150px 이내로 근접해 있던 경우 (최신 대화를 보고 있던 중)
    const isNearBottom = el.scrollTop + el.clientHeight >= prevHeight - 150;

    if (isMyMessage || isNearBottom) {
      el.scrollTo({
        top: currentScrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, currentUser]);

  if (isLoading) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-neutral-50 overflow-hidden max-w-[420px] mx-auto shadow-2xl">
      <header className="shrink-0 flex h-14 w-full items-center gap-2 border-b bg-white px-4 shadow-sm">
        <button onClick={() => router.back()} className="p-1 text-neutral-600 hover:text-neutral-900 transition-colors">
          <ChevronLeft className="size-6" />
        </button>
        <h1 className="text-base font-bold text-neutral-900">채팅</h1>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center py-20 text-neutral-400">
            <p className="text-xs font-medium">대화를 시작해 보세요!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUser?.id;
          return (
            <div key={msg.id} className={`flex items-start gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
              {!isMine && (
                <div className="relative size-8 shrink-0 overflow-hidden rounded-full border bg-white">
                  {msg.sender?.avatar_url ? (
                    <Image src={msg.sender.avatar_url} alt="avatar" fill className="object-cover" />
                  ) : (
                    <div className="bg-neutral-200 h-full w-full" />
                  )}
                </div>
              )}
              <div className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                {!isMine && <span className="text-[10px] font-bold text-neutral-500 ml-1">{msg.sender?.username}</span>}
                <div className={`max-w-[260px] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMine ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-neutral-800 rounded-tl-none border border-neutral-100'}`}>
                  {msg.content}
                </div>
                <span className="text-[9px] text-neutral-400 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput onSend={handleSend} disabled={!currentUser} />
    </div>
  );
};
