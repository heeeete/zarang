import { createClient } from '@/src/shared/lib/supabase/server';
import { HomeFeed } from '@/src/widgets/home-feed/ui/HomeFeed';
import { fetchHomePosts } from '@/src/entities/post/api/fetch-home-posts';
import { getServerUserId } from '@/src/shared/lib/supabase/server-auth';

/**
 * 홈페이지 컴포넌트입니다 (서버 컴포넌트).
 * 추천 알고리즘이 적용된 초기 데이터 12개를 서버에서 페칭하여 클라이언트 위젯에 전달합니다.
 */
export default async function HomePage() {
  const supabase = await createClient();

  // 현재 유저 ID를 미들웨어 헤더에서 가져옵니다.
  const userId = await getServerUserId();

  // 초기 12개의 추천 게시물 목록을 가져옵니다.
  const initialPosts = await fetchHomePosts(supabase, {
    from: 0,
    to: 11,
    userId: userId ?? undefined,
  });

  return (
    <div className="flex min-h-full flex-col">
      <h1 className="sr-only">자랑 (ZARANG) - 당신의 취향과 아이템을 자랑하는 커뮤니티</h1>
      <HomeFeed initialPosts={initialPosts} isAuthenticated={!!userId} />
    </div>
  );
}
