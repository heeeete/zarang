'use client';

import { useCommentScroll } from '../model/useCommentScroll';

interface CommentScrollManagerProps {
  commentCount: number;
  latestCommentId?: string;
}

/**
 * 새 댓글 등록 시 스크롤 이동을 관리하는 컴포넌트 (Client Bridge)
 * 비즈니스 로직은 useCommentScroll 훅으로 분리되었습니다.
 */
export const CommentScrollManager = ({ commentCount, latestCommentId }: CommentScrollManagerProps) => {
  useCommentScroll({ commentCount, latestCommentId });

  return null;
};
