import { type NextRequest } from 'next/server';
import { updateSession } from '@/src/shared/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  const start = Date.now();
  const response = await updateSession(request);
  const end = Date.now();
  
  // prefetch 요청 등을 제외한 실제 요청에 대해서만 로그 출력
  console.log(`[PERF] middleware total (proxy) - ${end - start}ms (path: ${request.nextUrl.pathname})`);
  
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
