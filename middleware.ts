import { type NextRequest } from 'next/server';
import { updateSession } from '@/src/shared/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 모든 페이지 요청에서 미들웨어가 실행되도록 하여 세션을 안전하게 유지합니다.
     * 단, 정적 파일 및 이미지는 제외합니다.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
