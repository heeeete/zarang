'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/shared/ui/button';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface CommentInputProps {
  postId: string;
  replyingTo?: {
    parentId: string;
    username: string;
  } | null;
  onCancelReply?: () => void;
}

export const CommentInput = ({ postId, replyingTo, onCancelReply }: CommentInputProps) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // 답글 달기 버튼 클릭 시 입력창에 멘션 추가 및 포커스
  useEffect(() => {
    if (replyingTo) {
      setContent(`@${replyingTo.username} `);
      inputRef.current?.focus();
    }
  }, [replyingTo]);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
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
          toast.error('로그인이 필요한 서비스예요.');
        } else {
          throw new Error('댓글을 등록하지 못했어요.');
        }
      } else {
        setContent('');
        if (onCancelReply) onCancelReply();
        toast.success(replyingTo ? '답글을 남겼어요.' : '댓글을 남겼어요.');
        router.refresh();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 에러가 발생했어요.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-16 left-1/2 z-50 flex w-full max-w-[420px] -translate-x-1/2 flex-col gap-2 border-t bg-white p-2 px-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {/* 답글 상태 표시줄 */}
      {replyingTo && (
        <div className="flex items-center justify-between px-2 pt-1">
          <p className="text-[11px] text-neutral-500">
            <span className="font-bold text-primary">{replyingTo.username}</span> 님에게 답글 남기는
            중
          </p>
          <button onClick={onCancelReply} className="text-neutral-400 hover:text-neutral-600">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          placeholder={replyingTo ? '답글을 입력하세요...' : '댓글을 입력하세요...'}
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
          게시
        </Button>
      </div>
    </div>
  );
};
