import { createClient } from '@/src/shared/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { PostGrid } from '@/src/widgets/explore-feed/ui/PostGrid';
import { getOptimizedImageUrl } from '@/src/shared/lib/utils';
import { User as UserIcon, ChevronLeft } from 'lucide-react';
import { Button } from '@/src/shared/ui/button';
import Link from 'next/link';
import { fetchPostsData } from '@/src/entities/post/api/post-api';

interface UserPageProps {
  params: Promise<{
    id: string
  }>
}


/**
 * 일반 사용자 프로필 페이지 컴포넌트입니다 (서버 컴포넌트).
 * 특정 사용자의 정보와 작성한 게시글 목록을 표시합니다.
 */
export const UserPage = async ({ params }: UserPageProps) => {
  const { id } = await params;
  const supabase = await createClient();

  // 현재 로그인한 사용자 정보를 가져옵니다 (본인 확인용).
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // 만약 조회하려는 ID가 본인이라면 마이페이지로 리다이랙트하거나 같은 UI를 보여줍니다.
  if (currentUser?.id === id) {
    redirect('/me');
  }

  // 대상 사용자 프로필 정보와 게시글 목록을 병렬로 가져옵니다.
  const [profileResponse, typedPosts] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    fetchPostsData(supabase, {
      from: 0,
      to: 99,
      authorId: id,
    }),
  ]);

  const profile = profileResponse.data;

  if (profileResponse.error || !profile) {
    notFound();
  }

  return (
    <div className="flex min-h-full flex-col bg-white pb-10">
      {/* 상단 헤더: 뒤로가기 */}
      <header className="sticky top-0 z-50 flex h-14 items-center border-b bg-white/90 px-4 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href="/" />}
          className="-ml-2 hover:bg-transparent"
          nativeButton={false}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <span className="ml-2 text-sm font-semibold">{profile.username}님의 자랑</span>
      </header>

      {/* 프로필 섹션 */}
      <div className="flex flex-col items-center gap-5 border-b bg-neutral-50/50 p-10">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-muted shadow-md">
          {profile.avatar_url ? (
            <Image
              src={getOptimizedImageUrl(profile.avatar_url, 192) || ''}
              alt={profile.username}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
              <UserIcon className="size-12" />
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <h1 className="text-2xl font-extrabold tracking-tight">{profile.username}</h1>
          {/* 본인이 아니므로 이메일은 노출하지 않습니다. */}
        </div>
      </div>

      {/* 작성한 자랑거리 목록 섹션 */}
      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            자랑거리 <span className="ml-1 text-primary">{typedPosts.length}</span>
          </h2>
        </div>

        {typedPosts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <p className="text-sm font-medium text-muted-foreground">아직 올린 자랑이 없어요.</p>
          </div>
        ) : (
          <div className="px-2">
            <PostGrid posts={typedPosts} loading={false} />
          </div>
        )}
      </div>
    </div>
  );
};
