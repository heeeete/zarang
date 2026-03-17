import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * 서버 컴포넌트, 액션, 라우트 핸들러에서 사용할 Supabase 클라이언트를 생성합니다.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set({ name, value, ...options })
            )
          } catch {
            // 서버 컴포넌트에서 호출될 경우 setAll이 실패할 수 있으나,
            // 미들웨어에서 세션을 갱신하므로 무시해도 안전합니다.
          }
        },
      },
    }
  )
}
