'use client'

import { createClient } from '@/src/shared/lib/supabase/client'
import { Button } from '@/src/shared/ui/button'

export const SocialLoginButtons = () => {
  const supabase = createClient()

  const handleLogin = async (provider: 'google' | 'kakao' | 'naver') => {
    // 디버깅을 위해 전달된 프로바이더 확인
    console.log('Attempting login with provider:', provider);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      alert(error.message)
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-[320px]">
      <Button
        onClick={() => handleLogin('google')}
        variant="outline"
        className="w-full h-12 text-base font-semibold border-neutral-300"
      >
        Google로 시작하기
      </Button>
      <Button
        onClick={() => handleLogin('kakao')}
        className="w-full h-12 text-base font-semibold bg-[#FEE500] text-[#191919] hover:bg-[#FEE500]/90 border-none"
      >
        카카오로 시작하기
      </Button>
      <Button
        onClick={() => handleLogin('naver')}
        className="w-full h-12 text-base font-semibold bg-[#03C75A] text-white hover:bg-[#03C75A]/90 border-none"
      >
        네이버로 시작하기
      </Button>
    </div>
  )
}
