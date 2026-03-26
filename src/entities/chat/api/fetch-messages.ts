import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/src/shared/types/database';
import { Message } from '../model/types';

/**
 * 특정 채팅방의 메시지 내역을 가져옵니다 (커서 기반 페이지네이션 지원).
 */
export const fetchMessages = async (
  supabase: SupabaseClient<Database>,
  roomId: string,
  options?: { lastCreatedAt?: string; limit?: number }
): Promise<Message[]> => {
  const limit = options?.limit || 50;
  
  const query = supabase
    .from('messages' as 'profiles')
    .select(`
      *,
      sender:profiles (id, username, avatar_url)
    `)
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (options?.lastCreatedAt) {
    query.lt('created_at', options.lastCreatedAt);
  }

  const { data, error } = await (query as unknown as Promise<{ data: Message[] | null; error: unknown }>);
  if (error) throw error;
  
  const messages = data || [];
  return [...messages].reverse();
};
