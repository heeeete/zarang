'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/src/app/providers/AuthProvider';
import { Message, ChatUserProfile } from '@/src/entities/chat/model/types';
import { useChatMessages } from '@/src/entities/chat/model/useChatMessages';
import { useChatActions } from '@/src/features/chat/model/useChatActions';
import { MessageInput } from '@/src/features/chat/ui/MessageInput';
import { useChatScroll } from '../lib/useChatScroll';
import { cn } from '@/src/shared/lib/utils';
import { useIntersectionObserver } from '@/src/shared/lib/hooks/useIntersectionObserver';

interface ChatRoomClientProps {
  initialRoomId: string | null;
  initialMessages: Message[];
  targetUserId?: string | null;
  targetProfile?: ChatUserProfile | null;
}

/**
 * 채팅방 클라이언트 (Page Layer / Widget-like)
 */
export const ChatRoomClient = ({
  initialRoomId,
  initialMessages,
  targetUserId,
  targetProfile,
}: ChatRoomClientProps) => {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [roomId, setRoomId] = useState<string | null>(initialRoomId);

  // 1. 메시지 상태 및 실시간 구독 (Entities)
  const { messages, loadPreviousMessages, isLoadingMore, hasMore } = useChatMessages(
    roomId,
    initialMessages,
    targetProfile,
    authUser?.id,
  );

  // 2. 메시지 전송 및 방 생성 로직 (Features)
  const { handleSend } = useChatActions(roomId, setRoomId, targetUserId);

  // 3. 스마트 스크롤 관리 (Pages/Lib)
  const { scrollRef, isReady } = useChatScroll(messages, authUser?.id);

  // 4. 상단 스크롤 도달 시 이전 메시지 로드 (Infinite Scroll)
  const observerRef = useIntersectionObserver(loadPreviousMessages, {
    enabled: hasMore && !isLoadingMore,
    rootMargin: '100px', // 상단 도달 전 미리 로딩
  });

  useEffect(() => {
    return () => {
      setTimeout(() => {
        router.refresh();
      }, 100);
    };
  }, [router]);

  const onSendMessage = async (content: string) => {
    if (authUser) await handleSend(content, authUser.id);
  };

  return (
    <div className="fixed inset-0 z-[60] mx-auto flex max-w-[420px] flex-col overflow-hidden bg-neutral-50 shadow-2xl">
      <header className="relative flex h-14 w-full shrink-0 items-center gap-2 border-b bg-white px-4 shadow-sm">
        <button
          onClick={() => router.back()}
          className="p-1 text-neutral-600 transition-colors hover:text-neutral-900"
        >
          <ChevronLeft className="size-6" />
        </button>
        <h1 className="text-base font-bold text-neutral-900">채팅</h1>
        
        {/* 로딩 인디케이터를 헤더 하단에 고정하여 스크롤 높이에 영향을 주지 않음 */}
        {isLoadingMore && (
          <div className="absolute inset-x-0 -bottom-8 z-10 flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 shadow-sm backdrop-blur-sm border">
              <Loader2 className="size-3 animate-spin text-primary" />
              <span className="text-[10px] font-medium text-neutral-500">이전 메시지 로딩 중</span>
            </div>
          </div>
        )}
      </header>

      <div
        ref={scrollRef}
        style={{ overflowAnchor: 'none' }} // 브라우저 자동 보정 끄기
        className={cn(
          'flex flex-1 flex-col gap-4 overflow-y-auto p-4',
          isReady ? 'visible' : 'invisible',
        )}
      >
        {/* 역방향 인피니트 스크롤용 감지 엘리먼트 (높이 최소화) */}
        {hasMore && <div ref={observerRef} className="h-1 shrink-0" />}

        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center py-20 text-neutral-400">
            <p className="text-xs font-medium">대화를 시작해 보세요!</p>
          </div>
        )}
        
        {messages.map((msg) => {
          const isMine = msg.sender_id === authUser?.id;
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {!isMine && (
                <div className="relative size-8 shrink-0 overflow-hidden rounded-full border bg-white">
                  {msg.sender?.avatar_url ? (
                    <Image src={msg.sender.avatar_url} alt="avatar" fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full bg-neutral-200" />
                  )}
                </div>
              )}
              <div className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                {!isMine && (
                  <span className="ml-1 text-[10px] font-bold text-neutral-500">
                    {msg.sender?.username}
                  </span>
                )}
                <div
                  className={`max-w-[260px] rounded-2xl px-4 py-2 text-sm break-words whitespace-pre-wrap shadow-sm ${isMine ? 'rounded-tr-none bg-primary text-white' : 'rounded-tl-none border border-neutral-100 bg-white text-neutral-800'}`}
                >
                  {msg.content}
                </div>
                <span className="px-1 text-[9px] text-neutral-400">
                  {new Date(msg.created_at).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput onSend={onSendMessage} disabled={!authUser} />
    </div>
  );
};
