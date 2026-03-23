'use client';

import { Button } from '@/src/shared/ui/button';
import { X } from 'lucide-react';
import { useCommentInput } from '../model/useCommentInput';

interface CommentInputProps {
  postId: string;
}

/**
 * 댓글 입력창 (View 전용 Component)
 * 비즈니스 로직은 useCommentInput 훅으로 위임합니다.
 */
export const CommentInput = ({
  postId,
}: CommentInputProps) => {
  const {
    content,
    setContent,
    isSubmitting,
    inputRef,
    replyingTo,
    isEditing,
    handleSubmit,
    onCancelReply,
    onCancelEdit,
  } = useCommentInput(postId);

  return (
    <div
      className="fixed inset-x-0 bottom-16 z-50 mx-auto flex w-full max-w-[420px] flex-col gap-2 border-t bg-white p-2 px-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
      style={{ right: 'var(--removed-body-scroll-bar-size, 0px)' }}
    >
      {/* 상태 표시줄 (답글 또는 수정) */}
      {(replyingTo || isEditing) && (
        <div className="flex items-center justify-between px-2 pt-1">
          <p className="text-[11px] text-neutral-500">
            {isEditing ? (
              <span className="font-bold text-primary">댓글 수정 중</span>
            ) : (
              <>
                <span className="font-bold text-primary">{replyingTo?.username}</span> 님에게 답글
                남기는 중
              </>
            )}
          </p>
          <button
            onClick={isEditing ? onCancelEdit : onCancelReply}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          placeholder={
            isEditing
              ? '수정할 내용을 입력하세요...'
              : replyingTo
                ? '답글을 입력하세요...'
                : '댓글을 입력하세요...'
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          className="flex-1 rounded-full bg-muted px-4 py-2 text-[16px] outline-none disabled:opacity-50"
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSubmit}
          disabled={isSubmitting || !content.trim()}
          className="font-bold text-primary hover:bg-transparent"
        >
          {isEditing ? '수정' : '게시'}
        </Button>
      </div>
    </div>
  );
};
