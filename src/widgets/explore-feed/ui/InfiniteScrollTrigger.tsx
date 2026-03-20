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
            축하해요! 모든 게시물을 다 봤어요! 🎉
          </p>
        )}
      </div>
    );
  },
);

InfiniteScrollTrigger.displayName = 'InfiniteScrollTrigger';
