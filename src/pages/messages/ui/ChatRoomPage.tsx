import { createClient } from '@/src/shared/lib/supabase/server';
import { fetchMessages } from '@/src/entities/chat/api/fetch-messages';
import { findExistingChatRoom } from '@/src/entities/chat/api/find-existing-chat-room';
import { ChatRoomClient } from './ChatRoomClient';
import { Message, ChatUserProfile } from '@/src/entities/chat/model/types';
import { redirect } from 'next/navigation';
import { getServerUserId } from '@/src/shared/lib/supabase/server-auth';

interface ChatRoomPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ target?: string }>;
}

/**
 * 실시간 채팅방 페이지 (서버 컴포넌트)
 */
export const ChatRoomPage = async ({ params, searchParams }: ChatRoomPageProps) => {
  const { id: initialRoomId } = await params;
  const { target: targetUserId } = await searchParams;
  
  const supabase = await createClient();
  const userId = await getServerUserId();
  
  if (!userId) {
    redirect('/login');
  }

  const roomId: string | null = initialRoomId === 'new' ? null : initialRoomId;
  let initialMessages: Message[] = [];
  let targetProfile: ChatUserProfile | null = null;
  let existingRoomId: string | null = null;

  // 1. 기존 방이 있는지 확인 (리다이렉트 처리를 위해 try...catch 밖에서 수행할 데이터 준비)
  if (roomId === null && targetUserId) {
    existingRoomId = await findExistingChatRoom(supabase, userId, targetUserId);
  }

  // 2. 리다이렉트 결정 (try...catch 밖에서 수행)
  if (existingRoomId) {
    redirect(`/messages/${existingRoomId}`);
  }

  // 3. 데이터 페칭
  try {
    if (roomId) {
      initialMessages = await fetchMessages(supabase, roomId);
    } else if (targetUserId) {
      // 신규 채팅 시작 시 상대방 프로필만 가져옴 (방은 생성하지 않음)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', targetUserId)
        .single();
      
      if (profile) {
        targetProfile = profile as ChatUserProfile;
      }
    }
  } catch (err) {
    console.error('채팅 데이터 페칭 실패:', err);
  }

  return (
    <ChatRoomClient 
      initialRoomId={roomId}
      initialMessages={initialMessages}
      targetUserId={targetUserId}
      targetProfile={targetProfile}
    />
  );
};
