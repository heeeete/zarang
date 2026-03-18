import { NextResponse } from 'next/server';
import { createClient } from '@/src/shared/lib/supabase/server';

/**
 * 소셜 로그인 완료 후 Supabase가 인증 코드를 보내주는 콜백 라우트입니다.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // 1. x-forwarded-host 헤더 확인 (ngrok이나 프록시 사용 시 실제 주소)
      const forwardedHost = request.headers.get('x-forwarded-host');
      const forwardedProto = request.headers.get('x-forwarded-proto') || 'http';
      
      // 2. 만약 프록시 주소가 있다면 그 주소를 사용하고, 없으면 현재 요청의 origin을 사용합니다.
      if (forwardedHost) {
        return NextResponse.redirect(`${forwardedProto}://${forwardedHost}${next}`);
      }
      
      // 3. 일반 IP 접속이나 localhost 접속 시에는 들어온 주소 그대로 리다이렉트합니다.
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 인증 실패 시 에러 페이지로 이동
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
