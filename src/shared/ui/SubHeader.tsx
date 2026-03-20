'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/src/shared/lib/utils';

interface SubHeaderProps {
  title?: string;
  rightElement?: React.ReactNode;
  className?: string;
}

/**
 * 상세 페이지나 수정 페이지 등 서브 페이지에서 공통으로 사용하는 헤더 컴포넌트입니다.
 * 뒤로가기 버튼, 중앙 제목, 우측 커스텀 요소를 포함합니다.
 */
export const SubHeader = ({ title, rightElement, className }: SubHeaderProps) => {
  const router = useRouter();

  const handleBack = () => {
    // 히스토리가 있으면 뒤로가기, 없으면 홈으로 이동
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-white/90 px-4 backdrop-blur-md',
        className
      )}
    >
      <div className="flex w-10 justify-start">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="-ml-2 hover:bg-transparent"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>

      <h2 className="max-w-[200px] truncate text-sm font-semibold text-center flex-1">
        {title}
      </h2>

      <div className="flex w-10 justify-end">
        {rightElement || <div className="size-8" />}
      </div>
    </header>
  );
};
