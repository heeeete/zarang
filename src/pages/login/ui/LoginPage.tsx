import { SocialLoginButtons } from '@/src/features/auth/ui/SocialLoginButtons';
import { Suspense } from 'react';

export const LoginPage = () => {
  return (
    <div className="flex h-[calc(100vh-56px-64px)] flex-col items-center justify-center px-6">
      <div className="mb-10 text-center">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">반가워요!</h1>
        <p className="text-muted-foreground">소셜 계정으로 1초 만에 로그인하세요.</p>
      </div>
      <Suspense fallback={<div>로딩 중...</div>}>
        <SocialLoginButtons />
      </Suspense>
    </div>
  );
};
