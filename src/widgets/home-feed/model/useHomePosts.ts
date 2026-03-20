import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/src/shared/lib/supabase/client';
import { Post } from '@/src/entities/post/model/types';
import { fetchPostsData } from '@/src/entities/post/api/post-api';

const PAGE_SIZE = 12;

/**
 * 홈 피드의 게시물 페칭 및 페이지네이션 로직을 관리하는 훅입니다.
 */
export const useHomePosts = (initialPosts: Post[]) => {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length >= PAGE_SIZE);
  const [page, setPage] = useState(1);
  const supabase = createClient();

  const fetchNextPage = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    try {
      const newPosts = await fetchPostsData(supabase, {
        from,
        to,
        useView: true,
      });

      if (newPosts.length < PAGE_SIZE) {
        setHasMore(false);
      }

      setPosts((prev) => [...prev, ...newPosts]);
      setPage((prev) => prev + 1);
    } catch (err) {
      console.error('홈 피드 데이터 로드 실패:', err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, supabase]);

  return {
    posts,
    loading,
    hasMore,
    fetchNextPage,
  };
};
