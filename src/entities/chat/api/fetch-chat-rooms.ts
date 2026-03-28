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

  // 3. (최적화) RPC를 통해 모든 방의 안 읽은 메시지 개수를 한 번에 가져옵니다.
  const { data: unreadCounts, error: unreadError } = await supabase.rpc('get_unread_counts', {
    p_user_id: userId
  });

  if (unreadError) throw unreadError;

  const rawRooms = (roomsData as unknown as (ChatRoom & { messages: Message[] })[]) || [];
  const countsMap = new Map((unreadCounts as unknown as { room_id: string; unread_count: number }[]).map(c => [c.room_id, c.unread_count]));

  return rawRooms
    .filter(room => {
      const myPart = room.participants.find(p => p.user_id === userId);
      const deletedAt = myPart?.deleted_at;
      
      // 만약 삭제한 적이 없다면 당연히 보여줌
      if (!deletedAt) return true;
      
      // 삭제한 적이 있다면, 마지막 메시지가 삭제된 이후에 왔을 때만 보여줌
      return room.messages && room.messages.length > 0 && room.messages[0].created_at > deletedAt;
    })
    .map(room => {
      return {
        ...room,
        last_message: room.messages?.[0],
        unread_count: Number(countsMap.get(room.id) || 0)
      };
    });
};
