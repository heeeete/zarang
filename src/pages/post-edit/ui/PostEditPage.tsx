import { createClient } from '@/src/shared/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/src/shared/ui/button';
import { PostEditForm } from '@/src/features/post-editing/ui/PostEditForm';

interface PostEditPageProps {
  params: {
    id: string;
  };
}

/**
 * 게시글 수정 페이지 컴포넌트입니다 (서버 컴포넌트).
 * 권한 확인 후 수정 폼을 렌더링합니다.
 */
export const PostEditPage = async ({ params }: PostEditPageProps) => {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: post, error } = await supabase
    .from('posts')
    .select('*, images:post_images(*)')
    .eq('id', id)
    .is('deleted_at', null)
    .order('sort_order', { foreignTable: 'post_images', ascending: true })
    .single();

  if (error || !post) {
    notFound();
  }

  // 작성자 본인인지 확인
  if (post.author_id !== user.id) {
    redirect(`/posts/${id}`);
  }

  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-white/90 px-4 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href={`/posts/${id}`} />}
          className="-ml-2 hover:bg-transparent"
          nativeButton={false}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h2 className="text-sm font-semibold">게시글 수정</h2>
        <div className="w-10" /> {/* Balance the header */}
      </header>

      <main className="flex-1 overflow-y-auto">
        <PostEditForm post={post} />
      </main>
    </div>
  );
};
