import { SocialLoginButtons } from '@/src/features/auth/ui/SocialLoginButtons';
import { Suspense } from 'react';

export const LoginPage = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="mb-10 text-center">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">취향을 보여주세요</h1>
        <p className="text-muted-foreground">당신의 세팅과 컬렉션을 공유해보세요</p>
      </div>
      <Suspense fallback={<div>로딩 중...</div>}>
        <SocialLoginButtons />
      </Suspense>
    </div>
  );
};
