import { useEffect, useRef } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  enabled?: boolean;
}

/**
 * 요소가 화면에 교차되는지 관찰하는 훅입니다.
 */
export const useIntersectionObserver = (
  callback: () => void,
  options?: UseIntersectionObserverOptions,
) => {
  const ref = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(callback); // 콜백 최신화 유지용 Ref

  // 콜백 함수가 바뀌어도 Observer를 재설정하지 않도록 Ref에 최신 콜백을 담습니다.
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 옵션들을 개별적으로 추출하여 useEffect 의존성 안정성 확보
  const { 
    enabled = true, 
    threshold = 0.1, 
    root = null, 
    rootMargin = '0px' 
  } = options || {};

  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Ref를 통해 최신 콜백을 호출함으로써 의존성에서 callback을 제거할 수 있습니다.
          callbackRef.current();
        }
      },
      { threshold, root, rootMargin },
    );

    const currentTarget = ref.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
    // callbackRef를 사용하므로 의존성 배열에서 callback을 제거하여 무한 루프를 원천 차단합니다.
  }, [enabled, threshold, root, rootMargin]);

  return ref;
};
