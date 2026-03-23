'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * 좋아요 기능의 비즈니스 로직 및 낙관적 업데이트를 담당하는 훅
 */
export const useLike = (postId: string, initialLikeCount: number, initialIsLiked: boolean) => {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const toggleLike = async () => {
    if (isLoading) return;

    // 1. 낙관적 업데이트 (UI 즉시 반응)
    const previousIsLiked = isLiked;
    const previousLikeCount = likeCount;

    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    setIsLoading(true);

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST', // 기존 로직에서 POST만 사용함
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          // 원복
          setIsLiked(previousIsLiked);
          setLikeCount(previousLikeCount);
          return;
        }
        throw new Error();
      }
      
      const result = await response.json();
      // 서버에서 확정된 정확한 수치로 업데이트
      setLikeCount(result.likeCount);
      setIsLiked(result.liked);
      
    } catch {
      // 에러 시 상태 원복
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);
      toast.error('좋아요 처리에 실패했어요.');
    } finally {
      setIsLoading(false);
    }
  };

  return { isLiked, likeCount, toggleLike };
};
