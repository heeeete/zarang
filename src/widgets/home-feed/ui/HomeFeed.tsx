'use client';

import { useHomePosts } from '../model/useHomePosts';
import { useIntersectionObserver } from '@/src/shared/lib/hooks/useIntersectionObserver';
import { PostGrid } from '@/src/widgets/explore-feed/ui/PostGrid';
import { Post } from '@/src/entities/post/model/types';
import { InfiniteScrollTrigger } from '@/src/widgets/explore-feed/ui/InfiniteScrollTrigger';
import { useTour } from '@/src/shared/lib/hooks/useTour';

interface HomeFeedProps {
  initialPosts: Post[];
  isAuthenticated?: boolean;
}

/**
 * 홈 피드 무한 스크롤 위젯입니다.
 */
export const HomeFeed = ({ initialPosts, isAuthenticated = false }: HomeFeedProps) => {
  const { posts, loading, hasMore, fetchNextPage } = useHomePosts(initialPosts);
  const observerRef = useIntersectionObserver(fetchNextPage, {
    rootMargin: '200px',
  });

  // 홈페이지 사용자 가이드 설정
  useTour({
    key: 'home',
    isAuthenticated,
    shouldStart: posts.length > 0, // 게시글이 로드된 후에 시작
    steps: [
      {
        element: '#home-feed-grid',
        popover: {
          title: '반가워요! 👋',
          description:
            '사용자님이 좋아하실 만한 게시글들을 모아봤어요. 아래로 내리며 구경해 볼까요?',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#notification-bell',
        popover: {
          title: '반가운 알림 🔔',
          description: '누군가 내 글에 댓글을 남기면 여기서 바로 알려드려요!',
          side: 'bottom',
          align: 'end',
        },
      },
    ],
  });

  return (
    <div id="home-feed-grid" className="flex flex-col py-2">
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
