import { createClient } from '@/src/shared/lib/supabase/server';
import { HomeFeed } from '@/src/widgets/home-feed/ui/HomeFeed';
// import { Button } from '@/src/shared/ui/button';
// import Link from 'next/link';
// import { PlusCircle } from 'lucide-react';
import { fetchPostsData } from '@/src/entities/post/api/post-api';

/**
 * 홈페이지 컴포넌트입니다 (서버 컴포넌트).
 * 초기 데이터 12개를 서버에서 페칭하여 클라이언트 위젯에 전달합니다.
 */
export default async function HomePage() {
  const supabase = await createClient();

  // 초기 12개의 게시물 목록을 통합 API를 통해 가져옵니다.
  const initialPosts = await fetchPostsData(supabase, { from: 0, to: 11 });

  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1">
        {/* {initialPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <PlusCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-xl font-bold">아직 자랑이 없어요</h2>
            <p className="mb-6 text-muted-foreground">첫 번째로 당신의 아이템을 자랑해보세요!</p>
            <Button
              variant="default"
              size="lg"
              render={<Link href="/write" />}
              nativeButton={false}
            >
              자랑하기
            </Button>
          </div>
        ) : ( */}
        <HomeFeed initialPosts={initialPosts} />
        {/* )} */}
      </main>
    </div>
  );
}
