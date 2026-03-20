'use client';

import { useState } from 'react';
import { Category } from '@/src/entities/post/model/schema';
import { useIntersectionObserver } from '@/src/shared/lib/hooks/useIntersectionObserver';
import { useExploreFilter } from '../model/useExploreFilter';
import { useExplorePosts } from '../model/useExplorePosts';
import { Post } from '@/src/entities/post/model/types';
import { ExploreSearchBar } from './ExploreSearchBar';
import { CategoryDrawer } from './CategoryDrawer';
import { PostGrid } from './PostGrid';
import { InfiniteScrollTrigger } from './InfiniteScrollTrigger';

interface ExploreFeedProps {
  categories: Category[];
  initialPosts: Post[];
}

export const ExploreFeed = ({ categories, initialPosts }: ExploreFeedProps) => {
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

  const observerRef = useIntersectionObserver(fetchNextPage);

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
      <div className="w-full flex-1 px-2 py-3">
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
