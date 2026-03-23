'use client';

import { Heart } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';
import { useLike } from '../model/useLike';

interface LikeButtonProps {
  postId: string;
  initialLikeCount: number;
  initialIsLiked: boolean;
}

/**
 * 좋아요 버튼 (View 전용)
 * 비즈니스 로직 및 낙관적 업데이트는 useLike 훅으로 분리되었습니다.
 */
export const LikeButton = ({ postId, initialLikeCount, initialIsLiked }: LikeButtonProps) => {
  const { isLiked, likeCount, toggleLike } = useLike(postId, initialLikeCount, initialIsLiked);

  return (
    <div
      onClick={toggleLike}
      className={cn(
        'flex cursor-pointer items-center gap-1.5 transition-colors select-none active:scale-95 transition-transform',
        isLiked ? 'text-red-500' : 'text-neutral-600 hover:text-neutral-900',
      )}
    >
      <Heart className={cn('h-5.5 w-5.5 transition-colors', isLiked && 'fill-current')} />
      <span className="text-sm font-semibold">{likeCount}</span>
    </div>
  );
};
