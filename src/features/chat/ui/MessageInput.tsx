'use client';

import { useState, memo, useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/src/shared/ui/button';
import { Textarea } from '@/src/shared/ui/textarea';
import { useAutoResizeTextarea } from '@/src/shared/lib/hooks/useAutoResizeTextarea';
import { useIsMobile } from '@/src/shared/lib/hooks/useIsMobile';

interface MessageInputProps {
  onSend: (content: string) => Promise<void> | void;
  disabled: boolean;
  placeholder?: string;
}

/**
 * 메시지 전송 입력 필드 (Feature)
 */
export const MessageInput = memo(
  ({ onSend, disabled, placeholder = '메시지를 입력하세요...' }: MessageInputProps) => {
    const [content, setContent] = useState('');
    const [isPending, setIsPending] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isMobile = useIsMobile();
    
    useAutoResizeTextarea(textareaRef, content, 116);

    const handleSend = async () => {
      if (!content.trim() || disabled || isPending) return;
      
      const messageToSend = content.trim();
      setContent(''); // 전송 시 즉시 비움 (UX 개선)
      
      setIsPending(true);
      try {
        await onSend(messageToSend);
      } catch (error) {
        console.error('메시지 전송 실패:', error);
        setContent(messageToSend); // 실패 시 내용 복구
      } finally {
        setIsPending(false);
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSend();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
        e.preventDefault();
        handleSend();
      }
    };

    return (
      <div className="pb-safe-offset-2 shrink-0 border-t bg-white p-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 min-h-[40px] max-h-[116px] resize-none rounded-[20px] bg-neutral-100 px-4 py-2.5 whitespace-pre-wrap transition-all outline-none focus:bg-white focus:ring-2 focus:ring-primary/10"
            rows={1}
          />
          <Button
            type="submit"
            size="icon"
            onMouseDown={(e) => e.preventDefault()} // 클릭 시 포커스 이동 방지 (키패드 유지)
            className="h-10 w-10 shrink-0 rounded-full shadow-sm transition-transform active:scale-95"
            disabled={!content.trim() || disabled}
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    );
  },
);

MessageInput.displayName = 'MessageInput';
