import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/src/shared/types/database';
import { Message } from '../model/types';

/**
 * 메시지를 전송합니다.
 */
export const sendMessage = async (
  supabase: SupabaseClient<Database>,
  roomId: string,
  senderId: string,
  content: string
) => {
  const { data, error } = await supabase
    .from('messages' as 'profiles')
    .insert({
      room_id: roomId,
      sender_id: senderId,
      content
    } as unknown as Database['public']['Tables']['profiles']['Insert'])
    .select()
    .single();

  if (error) throw error;
  return data as unknown as Message;
};
