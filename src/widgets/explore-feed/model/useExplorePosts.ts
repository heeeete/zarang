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
  // firstSyncDone: 하이드레이션 이후 첫 필터 동기화가 완료되었는지 여부
  const firstSyncDone = useRef(false);
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
      
      // 첫 진입 시(firstSyncDone이 false일 때) 발생하는 리셋 페칭은 
      // 이미 서버 데이터(initialPosts)가 있으므로 로딩 상태를 트리거하지 않습니다.
      const isInitialReset = isReset && !firstSyncDone.current;
      if (!isInitialReset) {
        setLoading(true);
      }

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
          firstSyncDone.current = true; // 첫 동기화 완료 표시
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
    [categoryId, keyword, supabase], // posts.length 제거로 함수 인스턴스 안정화
  );

  // 필터 변경 시 리셋 로직
  useEffect(() => {
    // 마운트 직후 한 번 실행하여 서버 데이터와 클라이언트 필터 상태를 맞춥니다.
    // 이때 fetchPosts 내부에서 setLoading(true)를 생략하므로 깜빡임이 없습니다.
    fetchPosts(0, true);
  }, [fetchPosts]); // fetchPosts가 안정적이므로 무한 루프가 발생하지 않습니다.

  const fetchNextPage = useCallback(() => {
    if (!hasMore || loadingRef.current) return;
    fetchPosts(page);
  }, [hasMore, page, fetchPosts]);

  return { posts, loading, hasMore, fetchNextPage };
};
