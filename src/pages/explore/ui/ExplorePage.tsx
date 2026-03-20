import { createClient } from '@/src/shared/lib/supabase/server';
import { ExploreFeed } from '@/src/widgets/explore-feed/ui/ExploreFeed';
import { Category } from '@/src/entities/post/model/schema';
import { fetchPostsData } from '@/src/entities/post/api/post-api';

/**
 * 구경하기 페이지 컴포넌트입니다 (서버 컴포넌트).
 * 초기 카테고리 목록과 게시글 데이터를 페칭하여 피드 위젯에 전달합니다.
 */
export const ExplorePage = async () => {
  const supabase = await createClient();

  // 1. 카테고리와 초기 게시글 데이터를 병렬로 가져옵니다.
  const [categoriesResponse, initialPosts] = await Promise.all([
    supabase.from('categories').select('id, slug, label').order('sort_order', { ascending: true }),
    fetchPostsData(supabase, { from: 0, to: 11 }), // 초기 12개
  ]);

  const categories = (categoriesResponse.data as Category[]) || [];

  return (
    <div className="flex min-h-full flex-col bg-white">
      <main className="flex-1">
        <ExploreFeed categories={categories} initialPosts={initialPosts} />
      </main>
    </div>
  );
};
