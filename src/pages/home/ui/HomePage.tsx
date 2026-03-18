import { createClient } from '@/src/shared/lib/supabase/server';
import { HomeFeed, type HomePost, type RawPost } from '@/src/widgets/post-feed/ui/HomeFeed';
import { Button } from '@/src/shared/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

const PAGE_SIZE = 10;

/**
 * 홈페이지 컴포넌트입니다 (서버 컴포넌트).
 * 초기 데이터 10개를 서버에서 페칭하여 클라이언트 위젯에 전달합니다.
 */
export default async function HomePage() {
  const supabase = await createClient();

  // 초기 10개의 게시물 목록을 작성자 정보, 좋아요 수, 댓글 수와 함께 가져옵니다.
  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      id,
      title,
      thumbnail_url,
      created_at,
      author:profiles!posts_author_id_fkey(username),
      categories(label),
      post_likes(count),
      comments(count)
    `,
    )
    .order('created_at', { ascending: false })
    .range(0, PAGE_SIZE - 1);

  if (error) {
    console.error('초기 게시글 페칭 에러:', error);
  }

  const rawPosts = (data as unknown as RawPost[]) || [];

  // 원시 데이터를 HomePost 형식으로 매핑합니다.
  const initialPosts: HomePost[] = rawPosts.map((post) => ({
    id: post.id,
    title: post.title,
    thumbnail_url: post.thumbnail_url,
    categories: post.categories,
    created_at: post.created_at,
    author: post.author || { username: '알 수 없음' },
    _count: {
      post_likes: post.post_likes?.[0]?.count ?? 0,
      comments: post.comments?.[0]?.count ?? 0,
    },
  }));

  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1 px-4 py-6">
        {initialPosts.length === 0 ? (
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
        ) : (
          <HomeFeed initialPosts={initialPosts} />
        )}
      </main>
    </div>
  );
}
