import { SupabaseClient } from '@supabase/supabase-js';
import { Post, RawPostResponse } from '../model/types';

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
    ${useView ? 'author_username, author_avatar_url,' : 'author:profiles!posts_author_id_fkey(username, avatar_url),'}
    images:post_images(width, height),
    post_likes:post_likes!post_likes_post_id_fkey(count),
    comments:comments!comments_post_id_fkey(count)
  `)
  .order('created_at', { ascending: false })
  .order('sort_order', { foreignTable: 'post_images', ascending: true })
  .range(from, to);

  if (categoryId) query = query.eq('category_id', categoryId);
  if (authorId) query = query.eq('author_id', authorId);
  if (keyword?.trim()) query = query.or(`description.ilike.%${keyword}%,${useView ? 'author_username' : 'profiles.username'}.ilike.%${keyword}%`);

  const { data, error } = await query;
  if (error) throw error;

  return (data as unknown as RawPostResponse[]).map((post) => ({
    id: post.id,
    author_id: post.author_id,
    description: post.description,
    thumbnail_url: post.thumbnail_url,
    audio_url: post.audio_url,
    created_at: post.created_at,
    width: post.images?.[0]?.width || 800,
    height: post.images?.[0]?.height || 800,
    author: {
      username: useView ? post.author_username || '알 수 없음' : post.author?.username || '알 수 없음',
      avatar_url: useView ? post.author_avatar_url : post.author?.avatar_url,
    },
    _count: {
      post_likes: post.post_likes?.[0]?.count ?? 0,
      comments: post.comments?.[0]?.count ?? 0,
    },
  }));
};
