'use client';

import { useSearchParams } from 'next/navigation';
import { createClient } from '@/src/shared/lib/supabase/client';
import { Button } from '@/src/shared/ui/button';
import { Provider } from '@supabase/supabase-js';

export const SocialLoginButtons = () => {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const next = searchParams?.get('next') || '/';

  const handleLogin = async (provider: 'google' | 'kakao' | 'naver') => {
    console.log('--- LOGIN START ---');
    console.log('provider:', provider);
    console.log('origin:', window.location.origin);
    console.log('next:', next);

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    console.log('redirectTo:', redirectTo);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo,
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
        className="h-12 w-full border-neutral-300 text-base font-semibold"
      >
        Google로 시작하기
      </Button>
      <Button
        onClick={() => handleLogin('kakao')}
        className="h-12 w-full border-none bg-[#FEE500] text-base font-semibold text-[#191919] hover:bg-[#FEE500]/90"
      >
        카카오로 시작하기
      </Button>
      <Button
        onClick={() => handleLogin('naver')}
        className="h-12 w-full border-none bg-[#03C75A] text-base font-semibold text-white hover:bg-[#03C75A]/90"
      >
        네이버로 시작하기
      </Button>
    </div>
  );
};
