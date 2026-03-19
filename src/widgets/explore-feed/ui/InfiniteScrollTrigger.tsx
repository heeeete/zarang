import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollTriggerProps {
  loading: boolean;
  hasMore: boolean;
  postsCount: number;
}

export const InfiniteScrollTrigger = forwardRef<HTMLDivElement, InfiniteScrollTriggerProps>(
  ({ loading, hasMore, postsCount }, ref) => {
    return (
      <div ref={ref} className="flex justify-center py-10">
        {loading && (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-[10px] font-medium text-muted-foreground">취향을 찾아보는 중...</p>
          </div>
        )}
        {!hasMore && postsCount > 0 && (
          <p className="text-[10px] text-muted-foreground italic">
            취향 지도의 끝에 도달했어요! ✨
          </p>
        )}
      </div>
    );
  }
);

InfiniteScrollTrigger.displayName = 'InfiniteScrollTrigger';
