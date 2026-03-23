'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/src/shared/lib/supabase/client';
import { ChatRoom } from '@/src/entities/chat/model/types';
import { fetchChatRooms } from '@/src/entities/chat/api/chat-api';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronRight, MessageSquare, User as UserIcon } from 'lucide-react';

interface MessageListClientProps {
  userId: string;
  initialRooms: ChatRoom[];
}

export const MessageListClient = ({ userId, initialRooms }: MessageListClientProps) => {
  const [rooms, setRooms] = useState<ChatRoom[]>(initialRooms);
  const supabase = createClient();

  useEffect(() => {
    setRooms(initialRooms);
  }, [initialRooms]);

  // 실시간 구독: 내 채팅방들과 관련된 새 메시지가 올 때 목록 갱신
  useEffect(() => {
    const channel = supabase
      .channel('message-list-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async () => {
          // 메시지가 삽입되면 목록을 다시 가져와서 최신 상태 유지
          // (더 효율적으로 상태만 변경할 수도 있지만, 읽음 상태나 안 읽은 개수 계산을 위해 재조회가 안전함)
          const updatedRooms = await fetchChatRooms(supabase, userId);
          setRooms(updatedRooms);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  // 최신 메시지 순으로 정렬 (주고받은 메시지 기준)
  const sortedRooms = [...rooms].sort((a, b) => {
    const aTime = a.last_message
      ? new Date(a.last_message.created_at).getTime()
      : new Date(a.created_at).getTime();
    const bTime = b.last_message
      ? new Date(b.last_message.created_at).getTime()
      : new Date(b.created_at).getTime();
    return bTime - aTime;
  });

  if (sortedRooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-neutral-400">
        <div className="flex size-16 items-center justify-center rounded-full bg-neutral-50">
          <MessageSquare className="size-8" />
        </div>
        <p className="text-sm font-medium text-neutral-500">아직 주고받은 메시지가 없어요.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {sortedRooms.map((room) => {
        const otherParticipant = room.participants.find((p) => p.user_id !== userId);
        const otherUser = otherParticipant?.user;
        const unreadCount = room.unread_count || 0;

        return (
          <Link
            key={room.id}
            href={`/messages/${room.id}`}
            className="flex items-center gap-4 border-b border-neutral-50 p-4 transition-colors hover:bg-neutral-50 active:bg-neutral-100"
          >
            <div className="relative size-12 shrink-0 overflow-hidden rounded-full border bg-neutral-100">
              {otherUser?.avatar_url ? (
                <Image
                  src={otherUser.avatar_url}
                  alt={otherUser.username || 'avatar'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-neutral-50 text-neutral-300">
                  <UserIcon className="size-6" />
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span className="truncate text-sm font-bold text-neutral-900">
                  {otherUser?.username || '알 수 없는 사용자'}
                </span>
                {room.last_message && (
                  <span className="shrink-0 text-[10px] text-neutral-400">
                    {formatDistanceToNow(new Date(room.last_message.created_at), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <p
                  className={`flex-1 truncate text-xs ${unreadCount > 0 ? 'font-bold text-neutral-900' : 'font-medium text-neutral-500'}`}
                >
                  {unreadCount > 1
                    ? `새 메시지 ${unreadCount}개`
                    : room.last_message?.content || '대화를 시작해보세요!'}
                </p>
                {unreadCount > 0 && <div className="size-2 shrink-0 rounded-full bg-primary" />}
              </div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-neutral-300" />
          </Link>
        );
      })}
    </div>
  );
};
