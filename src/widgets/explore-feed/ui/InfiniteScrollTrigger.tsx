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
      <div ref={ref} className="flex min-h-[100px] flex-col items-center justify-center">
        {/* 추가 데이터 로딩 시 심플한 스피너 표시 */}
        {loading && hasMore && (
          <div className="py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground/50" />
          </div>
        )}
        
        {/* 모든 데이터를 불러왔을 때 표시 */}
        {!hasMore && postsCount > 0 && (
          <p className="py-10 text-center text-[11px] text-muted-foreground/60 italic tracking-tight">
            더 많이 자랑해주세요
          </p>
        )}
      </div>
    );
  },
);

InfiniteScrollTrigger.displayName = 'InfiniteScrollTrigger';
