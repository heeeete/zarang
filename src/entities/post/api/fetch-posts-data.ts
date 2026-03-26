import { SupabaseClient } from '@supabase/supabase-js';
import { Post } from '../model/types';

interface FetchPostResponse {
  id: string;
  author_id: string;
  description: string;
  thumbnail_url: string;
  audio_url: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  thumbnail_width: number | null;
  thumbnail_height: number | null;
  author_username?: string;
  author_avatar_url?: string | null;
  author?: {
    username: string;
    avatar_url: string | null;
  };
}

/**
 * [ENTITY] 게시글 목록 조회 (Explore 페이지용)
 */
export const fetchPostsData = async (
  supabase: SupabaseClient,
  options: { 
    from: number; 
    to: number; 
    categoryId?: string | null; 
    keyword?: string; 
    authorId?: string; 
    useView?: boolean; 
  }
): Promise<Post[]> => {
  const { from, to, categoryId, keyword, authorId, useView = true } = options;
  let query = supabase.from(useView ? 'explore_posts_with_author' : 'posts').select(`
    id, author_id, description, thumbnail_url, audio_url, created_at,
    likes_count, comments_count, thumbnail_width, thumbnail_height,
    ${useView ? 'author_username, author_avatar_url' : 'author:profiles!posts_author_id_fkey(username, avatar_url)'}
  `)
  .order('created_at', { ascending: false })
  .range(from, to);

  if (categoryId) query = query.eq('category_id', categoryId);
  if (authorId) query = query.eq('author_id', authorId);
  if (keyword?.trim()) query = query.or(`description.ilike.%${keyword}%,${useView ? 'author_username' : 'profiles.username'}.ilike.%${keyword}%`);

  const { data, error } = await query;
  if (error) throw error;

  return (data as unknown as FetchPostResponse[]).map((post) => ({
    id: post.id,
    author_id: post.author_id,
    description: post.description,
    thumbnail_url: post.thumbnail_url,
    audio_url: post.audio_url,
    created_at: post.created_at,
    width: post.thumbnail_width || 800,
    height: post.thumbnail_height || 800,
    author: {
      username: useView ? post.author_username || '알 수 없음' : post.author?.username || '알 수 없음',
      avatar_url: useView ? post.author_avatar_url : post.author?.avatar_url,
    },
    _count: {
      post_likes: post.likes_count ?? 0,
      comments: post.comments_count ?? 0,
    },
  }));
};
