'use client';

import { useEffect, useRef } from 'react';

export const useChatScroll = <T,>(deps: T[], _currentUserId?: string) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef<number>(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const currentScrollHeight = el.scrollHeight;
    const prevHeight = prevScrollHeight.current;
    prevScrollHeight.current = currentScrollHeight;

    // 초기 로딩 시 바닥으로 즉시 이동
    if (prevHeight === 0 || deps.length === 0) {
      el.scrollTop = currentScrollHeight;
      return;
    }

    // 스마트 스크롤 조건: 
    // 1. 내가 방금 보낸 메시지인 경우 (마지막 메시지 sender_id 확인 로직은 외부에서 처리하거나 여기서 간단히 추정)
    // 2. 현재 스크롤이 바닥 근처(150px 이내)에 있는 경우
    const isNearBottom = el.scrollTop + el.clientHeight >= prevHeight - 150;

    if (isNearBottom) {
      el.scrollTo({
        top: currentScrollHeight,
        behavior: 'smooth',
      });
    }
  }, [deps]);

  return { scrollRef };
};
