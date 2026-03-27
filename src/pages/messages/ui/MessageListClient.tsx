'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/src/shared/lib/supabase/client';
import { ChatRoom, Message } from '@/src/entities/chat/model/types';
import { deleteChatRoom } from '@/src/entities/chat/api/delete-chat-room';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronRight, MessageSquare, User as UserIcon, Trash2 } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/src/shared/ui/context-menu";
import { toast } from 'sonner';

interface MessageListClientProps {
  userId: string;
  initialRooms: ChatRoom[];
}

export const MessageListClient = ({ userId, initialRooms }: MessageListClientProps) => {
  const [rooms, setRooms] = useState<ChatRoom[]>(initialRooms);
  const supabase = createClient();

  // 채팅방 삭제 처리
  const handleDeleteRoom = async (roomId: string) => {
    try {
      await deleteChatRoom(supabase, roomId, userId);
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      toast.success('채팅방을 삭제했어요.');
    } catch (error) {
      console.error('Failed to delete room:', error);
      toast.error('채팅방 삭제에 실패했어요.');
    }
  };


  useEffect(() => {
    setRooms(initialRooms);
  }, [initialRooms]);

  // 실시간 메시지 수신 시 목록 갱신 (NotificationListener에서 이벤트 수신)
  useEffect(() => {
    const handleRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<Message>;
      const newMessage = customEvent.detail;
      
      // 내가 보낸 메시지가 아닐 때만 목록 갱신
      if (newMessage.sender_id !== userId) {
        setRooms((prev) => 
          prev.map((room) => {
            if (room.id === newMessage.room_id) {
              return {
                ...room,
                last_message: newMessage,
                unread_count: (room.unread_count || 0) + 1,
              };
            }
            return room;
          })
        );
      }
    };

    window.addEventListener('zarang:refresh-messages', handleRefresh as EventListener);

    return () => {
      window.removeEventListener('zarang:refresh-messages', handleRefresh as EventListener);
    };
  }, [userId]);

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
          <ContextMenu key={room.id}>
            <ContextMenuTrigger>
              <Link
                href={`/messages/${room.id}`}
                className="flex items-center gap-4 border-b border-neutral-50 p-4 transition-colors hover:bg-neutral-50 active:bg-neutral-100"
                prefetch={false}
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
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
              <ContextMenuItem 
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteRoom(room.id);
                }}
              >
                <Trash2 data-icon="inline-start" />
                삭제하기
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        );
      })}
    </div>
  );
};

