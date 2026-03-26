import { SupabaseClient } from '@supabase/supabase-js';
import { Post, RawHomePostResponse } from '../model/types';

/**
 * [ENTITY] 홈 피드 게시글 조회 (RPC 사용)
 */
export const fetchHomePosts = async (
  supabase: SupabaseClient, 
  options: { from: number; to: number; userId?: string | null }
): Promise<Post[]> => {
  const { data, error } = await supabase.rpc('get_home_feed', { 
    p_user_id: options.userId, 
    p_limit: options.to - options.from + 1, 
    p_offset: options.from 
  });
  
  if (error) throw error;
  
  return (data as unknown as RawHomePostResponse[]).map((post) => ({
    id: post.id,
    author_id: post.author_id,
    description: post.description,
    thumbnail_url: post.thumbnail_url,
    audio_url: post.audio_url,
    created_at: post.created_at,
    width: post.width,
    height: post.height,
    author: { 
      username: post.author_username || '알 수 없음', 
      avatar_url: post.author_avatar_url 
    },
    _count: { 
      post_likes: Number(post.likes_count), 
      comments: Number(post.comments_count) 
    },
  }));
};
