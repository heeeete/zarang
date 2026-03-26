'use client';

import { useCommentContext } from '../ui/CommentProvider';
import { toast } from 'sonner';

/**
 * 댓글의 수정 및 삭제 행위를 관리하는 훅 (FSD Model Layer)
 */
export const useCommentActions = (commentId: string, content: string) => {
  const { setEditingComment, setReplyingTo, refetchComments } = useCommentContext();

  const handleEdit = () => {
    setReplyingTo(null);
    setEditingComment({ id: commentId, content });
  };

  const handleDelete = async () => {
    if (!confirm('댓글을 정말 삭제할까요?')) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('댓글을 삭제하지 못했어요.');

      toast.success('댓글을 삭제했습니다.');

      // 댓글 목록 새로고침 트리거
      refetchComments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '에러가 발생했습니다.');
    }
  };

  return { handleEdit, handleDelete };
};

