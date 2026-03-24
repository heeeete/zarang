import { createClient } from '@/src/shared/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { PostEditForm } from '@/src/features/post-editing/ui/PostEditForm';
import { Category } from '@/src/entities/post/model/schema';
import { SubHeader } from '@/src/shared/ui/SubHeader';

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 게시글 정보와 카테고리 목록을 가져옵니다.
  const [postResponse, categoriesResponse] = await Promise.all([
    supabase
      .from('posts')
      .select('*, images:post_images(*)')
      .eq('id', id)
      .order('sort_order', { foreignTable: 'post_images', ascending: true })
      .single(),
    supabase.from('categories').select('id, slug, label').order('sort_order', { ascending: true }),
  ]);

  const post = postResponse.data;
  const categories = categoriesResponse.data;

  if (postResponse.error || !post) {
    notFound();
  }

  // 작성자 본인인지 확인
  if (post.author_id !== user.id) {
    redirect(`/posts/${id}`);
  }

  return (
    <div className="flex min-h-full flex-col bg-white">
      <SubHeader title="게시글 수정" />

      <PostEditForm post={post} categories={(categories as Category[]) || []} />
    </div>
  );
};
