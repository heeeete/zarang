'use client';

import { useLayoutEffect, useRef, useState } from 'react';

/**
 * 채팅방 스크롤 관리 훅 (단순화 버전)
 * - 첫 진입 시 최하단 이동
 * - 메시지 추가 시 스크롤 위치 관리
 */
export const useChatScroll = <T extends { id: string | number; sender_id: string }>(
  messages: T[], 
  currentUserId?: string
) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  
  const prevMessagesRef = useRef<T[]>([]);
  const prevScrollHeightRef = useRef<number>(0);
  const isInitialScrollRef = useRef(true);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container || messages.length === 0) return;

    // 1. 초기 진입: 최하단으로 즉시 이동
    if (isInitialScrollRef.current) {
      container.scrollTop = container.scrollHeight;
      isInitialScrollRef.current = false;
      
      // useEffect 내 동기 setState로 인한 cascading render 방지를 위해 requestAnimationFrame 사용
      requestAnimationFrame(() => {
        setIsReady(true);
      });
    } 
    // 2. 데이터 업데이트 시
    else if (messages.length > prevMessagesRef.current.length) {
      const isPrepended = messages[0]?.id !== prevMessagesRef.current[0]?.id;
      
      if (isPrepended) {
        // [과거 메시지 로딩] ⚡
        // 늘어난 높이만큼 scrollTop을 보정하여 현재 보고 있는 메시지 위치를 완벽하게 유지합니다.
        const currentScrollHeight = container.scrollHeight;
        const heightDiff = currentScrollHeight - prevScrollHeightRef.current;
        container.scrollTop = container.scrollTop + heightDiff;
      } else {
        // [새 메시지 수신]
        // 내가 보냈거나 바닥 근처일 때만 하단으로 부드럽게 이동합니다.
        const lastMessage = messages[messages.length - 1];
        const isMyMessage = lastMessage?.sender_id === currentUserId;
        const isNearBottom = container.scrollTop + container.clientHeight >= prevScrollHeightRef.current - 150;

        if (isMyMessage || isNearBottom) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }
      }
    }

    prevScrollHeightRef.current = container.scrollHeight;
    prevMessagesRef.current = messages;
  }, [messages, currentUserId]);

  return { scrollRef, isReady };
};
