import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/src/shared/types/database';

/**
 * 특정 채팅방의 마지막 읽은 시간을 업데이트합니다.
 * @param lastCreatedAt 특정 메시지의 생성 시점을 전달하면 해당 시간으로 업데이트하고, 
 *                      전달하지 않으면 서버 시간(now())을 사용합니다.
 */
export const updateLastReadAt = async (
  supabase: SupabaseClient<Database>,
  roomId: string,
  userId: string,
  lastCreatedAt?: string
) => {
  // 클라이언트 시간 대신 서버 시간 또는 전달받은 메시지 시간을 사용하여 정밀도 문제를 해결합니다.
  const updateData = lastCreatedAt 
    ? { last_read_at: lastCreatedAt }
    : { last_read_at: new Date().toISOString() };

  await supabase
    .from('chat_participants')
    .update(updateData)
    .eq('room_id', roomId)
    .eq('user_id', userId);
};
