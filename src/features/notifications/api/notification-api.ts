import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/src/shared/types/database';

export type NotificationWithDetails = Database['public']['Tables']['notifications']['Row'] & {
  actor: {
    username: string;
    avatar_url: string | null;
  } | null;
  post: {
    thumbnail_url: string | null;
  } | null;
};

export const fetchNotifications = async (supabase: SupabaseClient<Database>, userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      actor:actor_id (username, avatar_url),
      post:post_id (thumbnail_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) throw error;
  
  return data as unknown as NotificationWithDetails[];
};

export const markAsRead = async (supabase: SupabaseClient<Database>, notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
    
  if (error) throw error;
};

export const markAllAsRead = async (supabase: SupabaseClient<Database>, userId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
};
