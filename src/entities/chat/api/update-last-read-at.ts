import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/src/shared/types/database';

/**
 * 특정 채팅방의 마지막 읽은 시간을 현재로 업데이트합니다.
 */
export const updateLastReadAt = async (
  supabase: SupabaseClient<Database>,
  roomId: string,
  userId: string
) => {
  await supabase
    .from('chat_participants' as 'profiles')
    .update({ last_read_at: new Date().toISOString() } as unknown as Database['public']['Tables']['profiles']['Insert'])
    .eq('room_id', roomId)
    .eq('user_id', userId);
};
