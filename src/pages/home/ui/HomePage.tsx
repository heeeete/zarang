import { createClient } from '@/src/shared/lib/supabase/server';
import { HomeFeed } from '@/src/widgets/home-feed/ui/HomeFeed';
import { fetchHomePosts } from '@/src/entities/post/api/post-api';

/**
 * 홈페이지 컴포넌트입니다 (서버 컴포넌트).
 * 추천 알고리즘이 적용된 초기 데이터 12개를 서버에서 페칭하여 클라이언트 위젯에 전달합니다.
 */
export default async function HomePage() {
  const supabase = await createClient();

  // 현재 유저 정보를 안전하게 가져옵니다.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 초기 12개의 추천 게시물 목록을 가져옵니다.
  const initialPosts = await fetchHomePosts(supabase, {
    from: 0,
    to: 11,
    userId: user?.id,
  });

  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1">
        <HomeFeed initialPosts={initialPosts} isAuthenticated={!!user} />
      </main>
    </div>
  );
}
