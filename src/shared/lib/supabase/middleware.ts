import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * 미들웨어에서 세션을 갱신하고 보호된 경로를 관리합니다.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 1. 홈페이지(/)와 구경하기(/explore)는 인증이 필수가 아니므로 즉시 리턴하여 최적화합니다. ✨
  if (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/explore')) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 2. 유저 정보 가져오기 (세션 갱신 포함)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 3. 보호된 경로 정의 (로그인이 반드시 필요한 페이지들)
  const pathname = request.nextUrl.pathname
  const isProtectedRoute =
    pathname.startsWith('/write') || 
    pathname.startsWith('/me') || 
    pathname.startsWith('/messages') ||
    pathname.startsWith('/users')

  // 4. 비로그인 유저가 보호된 경로에 접근할 경우 리다이렉트
  // explore 페이지는 여기 포함되지 않으므로 비로그인 유저도 자유롭게 볼 수 있습니다. ✨
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return response
}
