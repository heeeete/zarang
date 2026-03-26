import { createClient } from '@/src/shared/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { PostEditForm } from '@/src/features/post-editing/ui/PostEditForm';
import { SubHeader } from '@/src/shared/ui/SubHeader';
import { getServerUserId } from '@/src/shared/lib/supabase/server-auth';
import { fetchCategories, Category } from '@/src/entities/category/api/fetch-categories';

interface PostEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * 게시글 수정 페이지 컴포넌트입니다 (서버 컴포넌트).
 * 권한 확인 후 수정 폼을 렌더링합니다.
 */
export const PostEditPage = async ({ params }: PostEditPageProps) => {
  const { id } = await params;
  const supabase = await createClient();

  const userId = await getServerUserId();

  if (!userId) {
    redirect('/login');
  }

  // 게시글 정보와 캐시된 카테고리 목록을 가져옵니다.
  const [postResponse, categories] = await Promise.all([
    supabase
      .from('posts')
      .select('*, images:post_images(*)')
      .eq('id', id)
      .order('sort_order', { foreignTable: 'post_images', ascending: true })
      .single(),
    fetchCategories(),
  ]);

  const post = postResponse.data;

  if (postResponse.error || !post) {
    notFound();
  }

  // 작성자 본인인지 확인
  if (post.author_id !== userId) {
    redirect(`/posts/${id}`);
  }

  return (
    <div className="flex min-h-full flex-col bg-white">
      <SubHeader title="게시글 수정" />

      <PostEditForm post={post} categories={(categories as Category[]) || []} />
    </div>
  );
};
