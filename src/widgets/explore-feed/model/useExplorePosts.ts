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
    [categoryId, keyword, supabase],
  );

  // 필터 변경 시 리셋 로직 최적화
  useEffect(() => {
    // 1. 첫 렌더링 시점(서버 데이터 사용 중)에는 아무것도 하지 않습니다.
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    // 2. 만약 필터 값이 초기 상태(전체 카테고리, 검색어 없음)라면 
    // 이미 서버에서 받아온 initialPosts와 동일한 조건이므로 요청을 보내지 않습니다.
    // 진입 시점에 불필요한 재로딩(스켈레톤 노출)을 막는 핵심 로직입니다.
    if (categoryId === null && keyword === '') {
      return;
    }

    // 3. 실제 유저가 검색어를 입력하거나 카테고리를 바꿨을 때만 데이터를 리셋하고 새로 가져옵니다.
    fetchPosts(0, true);
  }, [categoryId, keyword, fetchPosts]);

  const fetchNextPage = useCallback(() => {
    if (!hasMore || loadingRef.current) return;
    fetchPosts(page);
  }, [hasMore, page, fetchPosts]);

  return { posts, loading, hasMore, fetchNextPage };
};
