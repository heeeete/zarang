import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/src/shared/lib/supabase/client';
import { ExplorePost, RawExplorePost } from './types';

export const PAGE_SIZE = 12;

/**
 * Explore 페이지의 게시물 페칭 및 페이지네이션 로직을 관리하는 훅입니다.
 */
export const useExplorePosts = (
  initialPosts: ExplorePost[],
  categoryId: string | null,
  keyword: string,
) => {
  const [posts, setPosts] = useState<ExplorePost[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialPosts.length === PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  
  const loadingRef = useRef(false);
  const isInitialRender = useRef(true);
  const supabase = createClient();

  const fetchPosts = useCallback(
    async (pageNum: number, isReset = false) => {
      if (loadingRef.current && !isReset) return;

      loadingRef.current = true;
      setLoading(true);

      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      try {
        let query = supabase
          .from('explore_posts_with_author')
          .select(`
            id,
            title,
            description,
            thumbnail_url,
            audio_url,
            author_username,
            images:post_images(width, height),
            post_likes:post_likes!post_likes_post_id_fkey(count),
            comments:comments!comments_post_id_fkey(count)
          `)
          .order('created_at', { ascending: false })
          .order('sort_order', { foreignTable: 'post_images', ascending: true })
          .range(from, to);

        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }

        if (keyword.trim()) {
          query = query.or(
            `title.ilike.%${keyword}%,description.ilike.%${keyword}%,author_username.ilike.%${keyword}%`
          );
        }

        const { data, error } = await query;

        if (error) throw error;

        const rawPosts = (data as any) || [];
        const newPosts: ExplorePost[] = rawPosts.map((post: any) => ({
          id: post.id,
          title: post.title,
          thumbnail_url: post.thumbnail_url,
          audio_url: post.audio_url,
          width: post.images?.[0]?.width || 800,
          height: post.images?.[0]?.height || 800,
          author: { username: post.author_username || '알 수 없음' },
          _count: {
            post_likes: post.post_likes?.[0]?.count ?? 0,
            comments: post.comments?.[0]?.count ?? 0,
          },
        }));

        if (isReset) {
          setPosts(newPosts);
          setPage(1);
          setHasMore(rawPosts.length === PAGE_SIZE);
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
          setPage(pageNum + 1);
          setHasMore(rawPosts.length === PAGE_SIZE);
        }
      } catch (err) {
        console.error('구경하기 데이터 로드 실패:', err);
        setHasMore(false);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [categoryId, keyword, supabase]
  );

  // 필터 변경 시 리셋
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    fetchPosts(0, true);
  }, [categoryId, keyword, fetchPosts]);

  const fetchNextPage = useCallback(() => {
    if (!hasMore || loadingRef.current) return;
    fetchPosts(page);
  }, [hasMore, page, fetchPosts]);

  return { posts, loading, hasMore, fetchNextPage };
};
