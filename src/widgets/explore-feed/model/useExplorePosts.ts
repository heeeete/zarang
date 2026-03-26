import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/src/shared/lib/supabase/client';
import { Post } from '@/src/entities/post/model/types';
import { fetchPostsData } from '@/src/entities/post/api/fetch-posts-data';

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

  useEffect(() => {
    setPosts(initialPosts);
    setHasMore(initialPosts.length === PAGE_SIZE);
    setPage(1);
  }, [initialPosts]);

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
    [categoryId, keyword, supabase],
  );

  // 필터 변경 시 리셋 로직 최적화
  useEffect(() => {
    // 1. 첫 렌더링 시점(서버 데이터 사용 중)에는 아무것도 하지 않습니다.
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    // 🚨 수정된 로직: 검색어를 지우거나 카테고리를 전체로 바꿨을 때(초기 상태로의 회귀)
    // 서버 데이터를 다시 불러와서 피드를 초기화해야 합니다.
    fetchPosts(0, true);
  }, [categoryId, keyword, fetchPosts]);

  const fetchNextPage = useCallback(() => {
    if (!hasMore || loadingRef.current) return;
    fetchPosts(page);
  }, [hasMore, page, fetchPosts]);

  return { posts, loading, hasMore, fetchNextPage };
};
