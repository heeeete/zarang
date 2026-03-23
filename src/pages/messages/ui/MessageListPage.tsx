import { createClient } from '@/src/shared/lib/supabase/server';
import { redirect } from 'next/navigation';
import { fetchChatRooms } from '@/src/entities/chat/api/chat-api';
import { SubHeader } from '@/src/shared/ui/SubHeader';
import { MessageListClient } from './MessageListClient';

/**
 * 메시지 목록 페이지 컴포넌트입니다 (서버 컴포넌트).
 * 초기 데이터를 서버에서 페칭하여 클라이언트 컴포넌트로 전달합니다.
 */
export const MessageListPage = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/messages');
  }

  // 초기 채팅방 목록 페칭
  const initialRooms = await fetchChatRooms(supabase, user.id);

  return (
    <div className="flex flex-col bg-white min-h-full">
      <SubHeader title="메시지" />
      
      <MessageListClient 
        userId={user.id} 
        initialRooms={initialRooms} 
      />
    </div>
  );
};
