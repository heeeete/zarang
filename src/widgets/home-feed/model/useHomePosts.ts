import { useState, useCallback, useRef, useEffect } from 'react';
import { createClient } from '@/src/shared/lib/supabase/client';
import { Post } from '@/src/entities/post/model/types';
import { fetchHomePosts } from '@/src/entities/post/api/post-api';
import { useAuth } from '@/src/app/providers/AuthProvider';

const PAGE_SIZE = 12;

/**
 * 홈 피드의 추천 알고리즘 게시물 페칭 및 페이지네이션 로직을 관리하는 훅입니다.
 */
export const useHomePosts = (initialPosts: Post[]) => {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length >= PAGE_SIZE);
  const [page, setPage] = useState(1);

  useEffect(() => {
    // 초기 데이터가 변경될 때마다 상태를 업데이트합니다.
    setPosts(initialPosts);
    setHasMore(initialPosts.length >= PAGE_SIZE);
    setPage(1);
  }, [initialPosts]);

  // 🚨 성능 최적화: 동기적 락(Lock)을 통해 중복 페칭을 완벽히 차단합니다.
  const loadingRef = useRef(false);

  // AuthProvider에서 유저 정보를 가져와 공유합니다 (중복 fetch 제거).
  const { user } = useAuth();
  const userId = user?.id || null;

  const supabase = createClient();

  const fetchNextPage = useCallback(async () => {
    // loadingRef를 통해 비동기 상태 지연으로 인한 중복 실행을 100% 막습니다.
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setLoading(true);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    try {
      const newPosts = await fetchHomePosts(supabase, {
        from,
        to,
        userId,
      });

      if (newPosts.length < PAGE_SIZE) {
        setHasMore(false);
      }

      setPosts((prev) => [...prev, ...newPosts]);
      setPage((prev) => prev + 1);
    } catch (err) {
      console.error('홈 피드 추천 데이터 로드 실패:', err);
      setHasMore(false);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [hasMore, page, supabase, userId]);

  return {
    posts,
    loading,
    hasMore,
    fetchNextPage,
  };
};
