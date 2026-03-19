import { useEffect, useRef } from 'react';

/**
 * 요소가 화면에 교차되는지 관찰하는 훅입니다.
 */
export const useIntersectionObserver = (
  callback: () => void,
  options?: IntersectionObserverInit,
) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback();
        }
      },
      { threshold: 0.1, ...options },
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
  }, [callback, options]);

  return ref;
};
