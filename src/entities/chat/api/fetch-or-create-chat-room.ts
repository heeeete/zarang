import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/src/shared/types/database';
import { findExistingChatRoom } from './find-existing-chat-room';

/**
 * 두 유저 사이의 채팅방을 찾거나 새로 생성합니다 (1:1 채팅).
 */
export const fetchOrCreateChatRoom = async (
  supabase: SupabaseClient<Database>,
  myId: string,
  targetUserId: string
): Promise<string> => {
  const existingRoomId = await findExistingChatRoom(supabase, myId, targetUserId);
  if (existingRoomId) return existingRoomId;

  const { data: newRoom, error: roomError } = await supabase
    .from('chat_rooms' as 'profiles')
    .insert({} as unknown as Database['public']['Tables']['profiles']['Insert'])
    .select()
    .single();

  if (roomError) throw roomError;

  const createdRoom = newRoom as unknown as { id: string };

  await supabase.from('chat_participants' as 'profiles').insert([
    { room_id: createdRoom.id, user_id: myId },
    { room_id: createdRoom.id, user_id: targetUserId }
  ] as unknown as Database['public']['Tables']['profiles']['Insert'][]);

  return createdRoom.id;
};
