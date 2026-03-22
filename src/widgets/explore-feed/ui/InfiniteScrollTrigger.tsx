import { forwardRef } from 'react';
import PostSkeleton from '@/src/entities/post/ui/PostSkeleton';

interface InfiniteScrollTriggerProps {
  loading: boolean;
  hasMore: boolean;
  postsCount: number;
}

export const InfiniteScrollTrigger = forwardRef<HTMLDivElement, InfiniteScrollTriggerProps>(
  ({ loading, hasMore, postsCount }, ref) => {
    return (
      <div ref={ref} className="justify-center">
        {/* 첫 페이지 데이터가 로드된 이후(postsCount > 0)에만 추가 로딩 UI를 보여줍니다. */}
        {loading && postsCount > 0 && (
          <div className="py-4">
            <PostSkeleton />
          </div>
        )}
        {!hasMore && postsCount > 0 && (
          <p className="py-10 text-center text-xs text-muted-foreground italic">
            더 많이 자랑해주세요
          </p>
        )}
      </div>
    );
  },
);

InfiniteScrollTrigger.displayName = 'InfiniteScrollTrigger';
