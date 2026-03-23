'use client';

import { useLayoutEffect, useEffect, useRef, useState } from 'react';

export const useChatScroll = <T>(deps: T[], currentUserId?: string) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef<number>(0); // 이전 스크롤 높이 (바닥 근처 여부 계산용)
  const isInitialScroll = useRef(true); // 최초 진입 여부
  const [isReady, setIsReady] = useState(false); // 초기 스크롤 완료 여부 (깜빡임 방지용)

  // 초기 진입 시 즉시 바닥으로 이동
  // useLayoutEffect: 브라우저 paint 이전에 실행되므로 맨 위가 잠깐 보이는 깜빡임 방지
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (!isInitialScroll.current || deps.length === 0) return;

    const currentScrollHeight = el.scrollHeight;
    el.scrollTop = currentScrollHeight; // 즉시 바닥으로 이동 (애니메이션 없이)
    isInitialScroll.current = false;
    prevScrollHeight.current = currentScrollHeight;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsReady(true);
  }, [deps]);

  // 새 메시지 수신 시 스크롤 처리
  useEffect(() => {
    const el = scrollRef.current;
    // 초기 스크롤 전이면 실행하지 않음 (useLayoutEffect와 중복 방지)
    if (!el || isInitialScroll.current) return;

    const currentScrollHeight = el.scrollHeight;
    const prevHeight = prevScrollHeight.current;
    prevScrollHeight.current = currentScrollHeight;

    const lastMessage = deps[deps.length - 1] as unknown as { sender_id: string };
    const isMyMessage = lastMessage?.sender_id === currentUserId; // 내가 보낸 메시지인지
    const isNearBottom = el.scrollTop + el.clientHeight >= prevHeight - 150; // 스크롤이 바닥 근처(150px)인지

    // 내가 보낸 메시지이거나 바닥 근처에 있을 때만 부드럽게 스크롤
    // → 위쪽 메시지를 읽는 중이라면 스크롤 위치를 강제로 변경하지 않음
    if (isMyMessage || isNearBottom) {
      el.scrollTo({
        top: currentScrollHeight,
        behavior: 'smooth',
      });
    }
  }, [deps, currentUserId]);

  return { scrollRef, isReady };
};
