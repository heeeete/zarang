'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCommentContext } from '../ui/CommentProvider';

/**
 * 댓글 입력창의 비즈니스 로직을 담당하는 훅 (FSD Model Layer)
 */
export const useCommentInput = (postId: string) => {
  const { replyingTo, editingComment, setReplyingTo, setEditingComment } = useCommentContext();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const onCancelReply = () => setReplyingTo(null);
  const onCancelEdit = () => setEditingComment(null);

  // 답글 모드 진입 시 멘션 추가 및 포커스
  useEffect(() => {
    if (replyingTo) {
      setContent(`@${replyingTo.username} `);
      inputRef.current?.focus();
    }
  }, [replyingTo]);

  // 수정 모드 진입 시 기존 내용 채우기 및 포커스
  useEffect(() => {
    if (editingComment) {
      setContent(editingComment.content);
      inputRef.current?.focus();
    }
  }, [editingComment]);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const isEditing = !!editingComment;
      const url = isEditing
        ? `/api/comments/${editingComment.id}`
        : `/api/posts/${postId}/comments`;
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          parent_id: replyingTo?.parentId || null,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
        } else {
          throw new Error(isEditing ? '댓글을 수정하지 못했어요.' : '댓글을 등록하지 못했어요.');
        }
      } else {
        setContent('');
        if (isEditing) {
          onCancelEdit();
          toast.success('댓글을 수정했습니다.');
        } else {
          onCancelReply();
          toast.success(replyingTo ? '답글을 남겼어요.' : '댓글을 남겼어요.');
        }
        router.refresh();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 에러가 발생했어요.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    content,
    setContent,
    isSubmitting,
    inputRef,
    replyingTo,
    isEditing: !!editingComment,
    handleSubmit,
    onCancelReply,
    onCancelEdit,
  };
};
