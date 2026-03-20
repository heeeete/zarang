import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/src/shared/lib/supabase/client';
import { Post } from '@/src/entities/post/model/types';
import { fetchPostsData } from '@/src/entities/post/api/post-api';

export const PAGE_SIZE = 12;

/**
 * Explore 페이지의 게시물 페칭 및 페이지네이션 로직을 관리하는 훅입니다.
 */
export const useExplorePosts = (
  initialPosts: Post[],
  categoryId: string | null,
  keyword: string,
) => {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
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
        const newPosts = await fetchPostsData(supabase, {
          from,
          to,
          categoryId,
          keyword,
        });

        if (isReset) {
          setPosts(newPosts);
          setPage(1);
          setHasMore(newPosts.length === PAGE_SIZE);
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
          setPage(pageNum + 1);
          setHasMore(newPosts.length === PAGE_SIZE);
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
