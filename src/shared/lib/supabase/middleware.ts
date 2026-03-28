import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  let supabaseResponse = NextResponse.next({
    request,
  });

  if (pathname === '/' || pathname.startsWith('/explore')) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // createServerClient 와 getClaims 사이에는 다른 로직 넣지 않는 게 안전
  const authStart = Date.now();
  const { data } = await supabase.auth.getClaims();
  const authEnd = Date.now();

  // 모든 요청마다 로그가 찍히면 너무 많을 수 있으므로
  // 실제 세션 확인이 필요한 경로(로그인/보호된 경로 등)에서 유의미하게 확인합니다.
  console.log(`[PERF] middleware getClaims - ${authEnd - authStart}ms (path: ${pathname})`);

  const claims = data?.claims;
  const userId = claims?.sub ?? null;

  const isProtectedRoute =
    pathname.startsWith('/write') ||
    pathname.startsWith('/me') ||
    pathname.startsWith('/messages') ||
    pathname.startsWith('/users');

  if (isProtectedRoute && !userId) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);

    const redirectResponse = NextResponse.redirect(url);

    // 중요: supabaseResponse에 들어있는 쿠키를 복사
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  }

  if (userId) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', userId);

    const finalResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    supabaseResponse.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie);
    });

    return finalResponse;
  }

  return supabaseResponse;
}
