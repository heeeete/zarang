'use client';

import { useState, memo } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/src/shared/ui/button';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled: boolean;
  placeholder?: string;
}

/**
 * 메시지 전송 입력 필드 (Feature)
 */
export const MessageInput = memo(({ onSend, disabled, placeholder = '메시지를 입력하세요...' }: MessageInputProps) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || disabled) return;
    onSend(content.trim());
    setContent('');
  };

  return (
    <div className="shrink-0 bg-white border-t p-3 pb-safe-offset-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-full bg-neutral-100 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
        />
        <Button 
          type="submit" 
          size="icon" 
          className="rounded-full shrink-0 h-10 w-10 shadow-sm transition-transform active:scale-95" 
          disabled={!content.trim() || disabled}
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';
