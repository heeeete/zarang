'use client';

import { useSearchParams } from 'next/navigation';
import { createClient } from '@/src/shared/lib/supabase/client';
import { Button } from '@/src/shared/ui/button';
import { Provider } from '@supabase/supabase-js';
import { GoogleIcon, KakaoIcon } from '@/src/shared/ui/SocialIcons';

export const SocialLoginButtons = () => {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const next = searchParams?.get('next') || '/';

  const handleLogin = async (provider: 'google' | 'kakao' | 'naver') => {
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo,
        queryParams: provider === 'kakao' ? { scope: 'profile_nickname' } : undefined,
      },
    });

    if (error) {
      console.log('login error:', error);
    }
  };
  return (
    <div className="flex w-full max-w-[320px] flex-col gap-3">
      <Button
        onClick={() => handleLogin('google')}
        variant="outline"
        className="relative h-12 w-full border-neutral-300 text-base font-semibold"
      >
        <div className="absolute left-4 flex items-center justify-center">
          <GoogleIcon className="size-5" />
        </div>
        Google로 시작하기
      </Button>
      <Button
        onClick={() => handleLogin('kakao')}
        className="relative h-12 w-full border-none bg-[#FEE500] text-base font-semibold text-[#191919] hover:bg-[#FEE500]/90"
      >
        <div className="absolute left-4 flex items-center justify-center">
          <KakaoIcon className="size-5" />
        </div>
        카카오로 시작하기
      </Button>
    </div>
  );
};
