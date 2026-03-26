import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/src/shared/types/database';
import { ChatRoom, Message } from '../model/types';

/**
 * 내가 참여 중인 채팅방 목록을 가져옵니다.
 */
export const fetchChatRooms = async (supabase: SupabaseClient<Database>, userId: string): Promise<ChatRoom[]> => {
  // 1. 내가 참여 중인 방 ID 목록을 가져옵니다.
  const { data: myParticipations, error: partError } = await supabase
    .from('chat_participants' as 'profiles')
    .select('room_id')
    .eq('user_id', userId);

  if (partError) throw partError;
  
  const participations = (myParticipations as unknown as { room_id: string }[]) || [];
  const roomIds = participations.map((p) => p.room_id);
  if (roomIds.length === 0) return [];

  // 2. 해당 방들의 정보, 참여자 프로필, 그리고 '최신 메시지 1개'만 가져옵니다.
  const { data: roomsData, error: roomsError } = await supabase
    .from('chat_rooms' as 'profiles')
    .select(`
      id,
      created_at,
      participants:chat_participants (
        user_id,
        last_read_at,
        deleted_at,
        user:profiles (id, username, avatar_url)
      ),
      messages (
        id,
        content,
        created_at,
        sender_id
      )
    `)
    .in('id', roomIds)
    .order('created_at', { referencedTable: 'messages', ascending: false })
    .limit(1, { referencedTable: 'messages' });

  if (roomsError) throw roomsError;

  const rawRooms = (roomsData as unknown as (ChatRoom & { messages: Message[] })[]) || [];

  // 정확한 안 읽은 개수를 가져오기 위한 추가 쿼리 (병렬 실행)
  const unreadCounts = await Promise.all(
    roomIds.map(async (roomId) => {
      const roomInfo = rawRooms.find(r => r.id === roomId);
      const myPart = roomInfo?.participants.find(p => p.user_id === userId);
      const lastReadAt = myPart?.last_read_at || new Date(0).toISOString();
      const deletedAt = myPart?.deleted_at || new Date(0).toISOString();
      
      // 안 읽은 개수는 마지막 읽은 시간 뿐만 아니라 삭제 시점도 고려해야 함
      const thresholdTime = lastReadAt > deletedAt ? lastReadAt : deletedAt;
      
      const { count } = await supabase
        .from('messages' as 'profiles')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .neq('sender_id', userId)
        .gt('created_at', thresholdTime);
        
      return { roomId, count: count || 0 };
    })
  );

  return rawRooms
    .filter(room => {
      const myPart = room.participants.find(p => p.user_id === userId);
      const deletedAt = myPart?.deleted_at;
      
      // 만약 삭제한 적이 없다면 당연히 보여줌
      if (!deletedAt) return true;
      
      // 삭제한 적이 있다면, 마지막 메시지가 삭제된 이후에 왔을 때만 보여줌
      // (혹은 방금 생성된 빈 방인 경우도 숨김)
      return room.messages && room.messages.length > 0 && room.messages[0].created_at > deletedAt;
    })
    .map(room => {
      const unreadInfo = unreadCounts.find(uc => uc.roomId === room.id);

      return {
        ...room,
        last_message: room.messages?.[0],
        unread_count: unreadInfo?.count || 0
      };
    });
};
