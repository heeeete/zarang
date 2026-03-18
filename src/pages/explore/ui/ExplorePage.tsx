import { createClient } from '@/src/shared/lib/supabase/server';
import { ExploreFeed } from '@/src/widgets/explore-feed/ui/ExploreFeed';
import { Category } from '@/src/features/post-creation/model/schema';

/**
 * 구경하기 페이지 컴포넌트입니다 (서버 컴포넌트).
 * 초기 카테고리 목록과 게시글 데이터를 페칭하여 피드 위젯에 전달합니다.
 */
export const ExplorePage = async () => {
  const supabase = await createClient();

  // 1. 카테고리와 초기 게시글 데이터를 병렬로 가져옵니다.
  const [categoriesResponse, postsResponse] = await Promise.all([
    supabase.from('categories').select('id, slug, label').order('sort_order', { ascending: true }),
    supabase
      .from('posts')
      .select(
        `
        id,
        title,
        thumbnail_url,
        images:post_images(width, height),
        author:profiles!posts_author_id_fkey(username),
        post_likes(count),
        comments(count)
      `,
      )
      .order('created_at', { ascending: false })
      .order('sort_order', { foreignTable: 'post_images', ascending: true })
      .range(0, 11), // 초기 12개
  ]);

  const categories = (categoriesResponse.data as Category[]) || [];
  const rawPosts = postsResponse.data || [];

  interface RawPostData {
    id: string;
    title: string | null;
    thumbnail_url: string | null;
    images: { width: number | null; height: number | null }[];
    author: { username: string } | null;
    post_likes: { count: number }[];
    comments: { count: number }[];
  }

  // 데이터 가공: 첫 번째 이미지의 크기와 카운트 정보 사용
  const initialPosts = (rawPosts as unknown as RawPostData[]).map((post) => ({
    ...post,
    width: post.images?.[0]?.width || 800,
    height: post.images?.[0]?.height || 800,
    author: post.author || { username: '알 수 없음' },
    _count: {
      post_likes: post.post_likes?.[0]?.count ?? 0,
      comments: post.comments?.[0]?.count ?? 0,
    },
  }));

  return (
    <div className="flex min-h-full flex-col bg-white">
      <main className="flex-1">
        <ExploreFeed categories={categories} initialPosts={initialPosts} />
      </main>
    </div>
  );
};
