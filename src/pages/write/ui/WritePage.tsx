import { createClient } from '@/src/shared/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PostCreateForm } from '@/src/features/post-creation/ui/PostCreateForm';
import { Category } from '@/src/features/post-creation/model/schema';

/**
 * 게시글 작성 페이지 컴포넌트입니다 (서버 컴포넌트).
 * 인증 확인 후 작성 폼을 렌더링합니다.
 */
export const WritePage = async () => {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 데이터베이스에서 카테고리 목록을 가져옵니다.
  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug, label')
    .order('sort_order', { ascending: true });

  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="sticky top-0 z-50 flex h-14 items-center justify-center border-b bg-white/90 px-4 backdrop-blur-md">
        <h2 className="text-sm font-semibold text-neutral-900">새 자랑거리 작성</h2>
      </header>

      <main className="flex-1 overflow-y-auto pb-10">
        <PostCreateForm categories={(categories as Category[]) || []} />
      </main>
    </div>
  );
};
