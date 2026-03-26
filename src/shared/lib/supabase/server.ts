import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';

/**
 * [PUBLIC] 쿠키를 사용하지 않는 Supabase 클라이언트를 생성합니다.
 * React cache를 사용하여 동일 요청 내에서는 동일한 인스턴스를 재사용합니다.
 */
export const createPublicClient = cache(() => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          /* No-op in public mode */
        },
      },
    },
  );
});

/**
 * [AUTH] 쿠키를 사용하는 Supabase 클라이언트를 생성합니다.
 * 사용자 인증 세션이 필요하거나 쓰기 작업(Server Action 등)을 수행할 때 사용합니다.
 */
export async function createAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set({ name, value, ...options }),
            );
          } catch {
            // 서버 컴포넌트에서 호출될 경우 setAll이 실패할 수 있으나,
            // 미들웨어에서 세션을 갱신하므로 무시해도 안전합니다.
          }
        },
      },
    },
  );
}

/**
 * 기존 createClient는 createAuthClient를 사용하도록 유지합니다 (호환성).
 */
export const createClient = createAuthClient;
