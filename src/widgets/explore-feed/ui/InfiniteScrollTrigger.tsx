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
        {loading && <PostSkeleton />}
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
