'use client';

import { useEffect, useRef } from 'react';

interface UseCommentScrollProps {
  commentCount: number;
  latestCommentId?: string;
}

/**
 * 새 댓글 등록 시 최신 댓글로 스크롤을 이동시키는 로직을 담당하는 훅 (Model Layer)
 */
export const useCommentScroll = ({ commentCount, latestCommentId }: UseCommentScrollProps) => {
  const prevCount = useRef(commentCount);

  useEffect(() => {
    if (commentCount > prevCount.current && latestCommentId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`comment-${latestCommentId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      prevCount.current = commentCount;
      return () => clearTimeout(timer);
    }
    prevCount.current = commentCount;
  }, [commentCount, latestCommentId]);
};
