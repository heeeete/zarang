import { RefObject, useEffect } from 'react';

export const useAutoResizeTextarea = (
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
  maxHeight: number = 116 // 대략 5줄 (line-height + padding 고려)
) => {
  useEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    if (textarea.scrollHeight > maxHeight) {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.height = `${textarea.scrollHeight}px`;
      textarea.style.overflowY = 'hidden';
    }
  }, [value, maxHeight]);
};
