import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/src/shared/types/database';

/**
 * 채팅방을 삭제(나에게만 숨김)합니다.
 * 실제 방을 지우지 않고 chat_participants의 deleted_at을 현재 시간으로 업데이트합니다.
 */
export const deleteChatRoom = async (
  supabase: SupabaseClient<Database>,
  roomId: string,
  userId: string // userId 인자 추가 필요
) => {
  const { error } = await supabase
    .from('chat_participants' as 'profiles')
    .update({ deleted_at: new Date().toISOString() } as unknown as Database['public']['Tables']['profiles']['Insert'])
    .eq('room_id', roomId)
    .eq('user_id', userId);

  if (error) throw error;
};

