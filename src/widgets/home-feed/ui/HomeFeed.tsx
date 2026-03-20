'use client';

import { useHomePosts } from '../model/useHomePosts';
import { useIntersectionObserver } from '@/src/shared/lib/hooks/useIntersectionObserver';
import { PostGrid } from '@/src/widgets/explore-feed/ui/PostGrid';
import { Post } from '@/src/entities/post/model/types';
import { InfiniteScrollTrigger } from '@/src/widgets/explore-feed/ui/InfiniteScrollTrigger';

interface HomeFeedProps {
  initialPosts: Post[];
}

/**
 * 홈 피드 무한 스크롤 위젯입니다.
 */
export const HomeFeed = ({ initialPosts }: HomeFeedProps) => {
  const { posts, loading, hasMore, fetchNextPage } = useHomePosts(initialPosts);
  const observerRef = useIntersectionObserver(fetchNextPage);

  return (
    <div className="flex flex-col gap-4 px-2 py-4">
      {/* 게시글 그리드 (Masonry) */}
      <PostGrid posts={posts} loading={loading} />

      {/* 하단 무한 스크롤 감지 및 로딩 표시 */}
      <InfiniteScrollTrigger
        ref={observerRef}
        loading={loading}
        hasMore={hasMore}
        postsCount={posts.length}
      />
    </div>
  );
};
