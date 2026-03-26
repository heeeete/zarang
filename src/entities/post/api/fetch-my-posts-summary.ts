import { SupabaseClient } from '@supabase/supabase-js';
import { Post } from '../model/types';

/**
 * [ENTITY] 마이페이지 그리드용 가벼운 게시물 조회 ✨
 * 조인을 최소화하여 성능을 극대화합니다.
 */
export const fetchMyPostsSummary = async (
  supabase: SupabaseClient,
  userId: string
): Promise<Post[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, thumbnail_url, audio_url, created_at,
      images:post_images(width, height)
    `)
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .range(0, 99);

  if (error) throw error;

  interface RawMyPostResponse {
    id: string;
    thumbnail_url: string | null;
    audio_url: string | null;
    created_at: string;
    images: { width: number; height: number }[];
  }

  return (data as unknown as RawMyPostResponse[]).map((post) => ({
    id: post.id,
    thumbnail_url: post.thumbnail_url,
    audio_url: post.audio_url,
    created_at: post.created_at,
    width: post.images?.[0]?.width || 800,
    height: post.images?.[0]?.height || 800,
    // 마이페이지 그리드에서 사용하지 않는 필드는 기본값 처리
    author_id: userId,
    description: '',
    author: { username: '', avatar_url: null },
    _count: { post_likes: 0, comments: 0 },
  }));
};
