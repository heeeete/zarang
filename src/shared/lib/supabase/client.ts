import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/src/shared/types/database'

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

/**
 * Supabase 브라우저 클라이언트를 반환합니다.
 * 싱글톤 패턴을 사용하여 앱 전체에서 단 하나의 인스턴스만 공유합니다.
 */
export function createClient() {
  if (client) return client

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return client
}
