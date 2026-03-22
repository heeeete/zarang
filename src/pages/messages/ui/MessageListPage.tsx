import { createClient } from '@/src/shared/lib/supabase/server';
import { redirect } from 'next/navigation';
import { fetchChatRooms } from '@/src/entities/chat/api/chat-api';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronRight, MessageSquare } from 'lucide-react';
import { SubHeader } from '@/src/shared/ui/SubHeader';

/**
 * 메시지 목록 페이지 컴포넌트입니다 (FSD Pages 레이어).
 */
export const MessageListPage = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/messages');
  }

  const rooms = await fetchChatRooms(supabase, user.id);

  return (
    <div className="flex flex-col bg-white">
      <SubHeader title="메시지" />
      
      <div className="flex flex-col">
        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-neutral-400">
            <div className="flex size-16 items-center justify-center rounded-full bg-neutral-50">
              <MessageSquare className="size-8" />
            </div>
            <p className="text-sm font-medium text-neutral-500">
              아직 주고받은 메시지가 없어요.
            </p>
          </div>
        ) : (
          rooms.map((room) => {
            const otherParticipant = room.participants.find(p => p.user_id !== user.id);
            const otherUser = otherParticipant?.user;

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
                    <div className="flex h-full w-full items-center justify-center text-neutral-300">
                      <MessageSquare className="size-6 opacity-20" />
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
                  <p className="truncate text-xs text-neutral-500 font-medium">
                    {room.last_message?.content || '대화를 시작해보세요!'}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-neutral-300" />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};
