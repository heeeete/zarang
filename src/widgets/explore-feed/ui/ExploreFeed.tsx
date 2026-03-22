'use client';

import { useState } from 'react';
import { Category } from '@/src/entities/post/model/schema';
import { useIntersectionObserver } from '@/src/shared/lib/hooks/useIntersectionObserver';
import { useExploreFilter } from '../model/useExploreFilter';
import { useExplorePosts } from '../model/useExplorePosts';
import { Post } from '@/src/entities/post/model/types';
import { ExploreSearchBar } from './ExploreSearchBar';
import { CategoryDrawer } from '@/src/entities/post/ui/CategoryDrawer';
import { PostGrid } from './PostGrid';
import { InfiniteScrollTrigger } from './InfiniteScrollTrigger';
import { useTour } from '@/src/shared/lib/hooks/useTour';

interface ExploreFeedProps {
  categories: Category[];
  initialPosts: Post[];
  isAuthenticated?: boolean;
}

export const ExploreFeed = ({
  categories,
  initialPosts,
  isAuthenticated = false,
}: ExploreFeedProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const {
    selectedCategoryId,
    setSelectedCategoryId,
    searchKeyword,
    setSearchKeyword,
    debouncedKeyword,
  } = useExploreFilter();

  const { posts, loading, hasMore, fetchNextPage } = useExplorePosts(
    initialPosts,
    selectedCategoryId,
    debouncedKeyword,
  );

  const observerRef = useIntersectionObserver(fetchNextPage, {
    rootMargin: '50px',
  });

  // 탐색 페이지 사용자 가이드 설정
  useTour({
    key: 'explore',
    isAuthenticated,
    shouldStart: posts.length > 0,
    steps: [
      {
        element: '#explore-feed-grid',
        popover: {
          title: '따끈따끈한 최신글',
          description: '지금 이 순간, 다른 분들이 올린 새로운 소식들을 바로 확인할 수 있어요.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#explore-search-bar',
        popover: {
          title: '원하는 글 찾기 🔍',
          description: '궁금한 내용이나 좋아하는 작성자가 있다면 여기서 바로 검색해 보세요!',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#category-filter-trigger',
        popover: {
          title: '취향대로 골라보기 🏷️',
          description: '키보드, 피규어 등 관심 있는 카테고리만 쏙쏙 골라볼 수 있답니다.',
          side: 'bottom',
          align: 'start',
        },
      },
    ],
  });

  return (
    <div className="flex min-h-full flex-col">
      {/* 상단 검색바 & 카테고리 필터 버튼 */}
      <div className="sticky top-0 z-40 flex flex-col gap-2.5 border-b bg-white/95 px-4 py-3 backdrop-blur-sm">
        <ExploreSearchBar value={searchKeyword} onChange={setSearchKeyword} />
        <CategoryDrawer
          categories={categories}
          selected={selectedCategoryId}
          onSelect={setSelectedCategoryId}
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
        />
      </div>

      {/* Masonry 피드 영역 */}
      <div id="explore-feed-grid" className="w-full flex-1 py-2">
        <PostGrid posts={posts} loading={loading} />
        <InfiniteScrollTrigger
          ref={observerRef}
          loading={loading}
          hasMore={hasMore}
          postsCount={posts.length}
        />
      </div>
    </div>
  );
};
