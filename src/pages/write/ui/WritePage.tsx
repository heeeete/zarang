import { redirect } from 'next/navigation';
import { PostCreateForm } from '@/src/features/post-creation/ui/PostCreateForm';
import { getServerUserId } from '@/src/shared/lib/supabase/server-auth';
import { fetchCategories } from '@/src/entities/category/api/fetch-categories';

/**
 * 게시글 작성 페이지 컴포넌트입니다 (서버 컴포넌트).
 * 인증 확인 후 작성 폼을 렌더링합니다.
 */
export const WritePage = async () => {
  const userId = await getServerUserId();

  if (!userId) {
    redirect('/login');
  }

  // 캐시된 카테고리 목록을 가져옵니다.
  const categories = await fetchCategories();

  return (
    <div className="flex flex-col bg-white">
      <header className="sticky top-0 z-50 flex h-14 items-center justify-center border-b bg-white/90 px-4 backdrop-blur-md">
        <h2 className="text-sm font-semibold text-neutral-900">새 자랑거리 작성</h2>
      </header>

      <PostCreateForm categories={categories} />
    </div>
  );
};
