import { cache } from 'react';
import { createPublicClient } from '@/src/shared/lib/supabase/server';
import { DetailPost } from '../model/types';

/**
 * [ENTITY] 게시글 상세 조회 (메모이제이션 적용)
 * React cache를 사용하여 동일 요청(Request) 내에서 중복 호출을 제거합니다.
 */
export const fetchPostDetail = cache(async (id: string) => {
  // eslint-disable-next-line react-hooks/purity
  const startTime = Date.now();
  
  const supabase = createPublicClient();
  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *, author:profiles!posts_author_id_fkey(id, username, avatar_url),
      images:post_images(id, image_url, width, height),
      likes:post_likes(count),
      comments:comments(count)
    `)
    .eq('id', id)
    .order('sort_order', { foreignTable: 'post_images', ascending: true })
    .single();

  // eslint-disable-next-line react-hooks/purity
  const endTime = Date.now();
  console.log(`[DB PERF] fetchPostDetail(${id}) - ${endTime - startTime}ms`);

  if (error || !post) return null;
  return post as unknown as DetailPost;
});
