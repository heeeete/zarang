import { createClient } from '@/src/shared/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { ProfilePostGrid } from '@/src/widgets/profile-post-grid/ui/ProfilePostGrid';
import { getOptimizedImageUrl } from '@/src/shared/lib/utils';
import { User as UserIcon, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { fetchPostsData } from '@/src/entities/post/api/fetch-posts-data';
import { ToggleFollowButton } from '@/src/features/profile-management/ui/ToggleFollowButton';
import { ProfileListSheet } from '@/src/features/profile-management/ui/ProfileListSheet';
import { MessageButton } from '@/src/features/chat/ui/MessageButton';
import { getServerUserId } from '@/src/shared/lib/supabase/server-auth';

interface UserPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * 타인 프로필 페이지 컴포넌트입니다 (서버 컴포넌트).
 */
export const UserPage = async ({ params }: UserPageProps) => {
  const { id } = await params;
  const supabase = await createClient();

  // 현재 로그인한 사용자의 ID를 가져옵니다.
  const currentUserId = await getServerUserId();

  if (currentUserId === id) {
    redirect('/me');
  }

  // 프로필 정보와 게시글 목록, 팔로워/팔로잉 수를 병렬로 조회합니다.
  const [profileResponse, typedPosts, followersCount, followingCount] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    fetchPostsData(supabase, {
      from: 0,
      to: 99,
      authorId: id,
    }),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id),
  ]);

  const profile = profileResponse.data;

  if (profileResponse.error || !profile) {
    notFound();
  }

  return (
    <div className="flex min-h-full flex-col bg-white">
      {/* 상단 헤더: 뒤로가기 + 유저네임 */}
      <header className="sticky top-0 z-50 flex h-12 items-center border-b bg-white px-4">
        <Link href="/" className="mr-2 outline-none">
          <ChevronLeft className="size-6 text-neutral-900" />
        </Link>
        <h2 className="text-base font-bold">{profile.username}</h2>
      </header>

      {/* 프로필 정보 섹션 (인스타그램 스타일) */}
      <div className="flex flex-col gap-6 px-4 py-6">
        <div className="flex items-center gap-8">
          {/* 좌측: 아바타 */}
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border bg-muted shadow-sm">
            {profile.avatar_url ? (
              <Image
                src={getOptimizedImageUrl(profile.avatar_url, 160) || ''}
                alt={profile.username || 'profile'}
                fill
                className="object-cover"
                priority
                sizes="78px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-neutral-50 text-neutral-300">
                <UserIcon className="size-10" />
              </div>
            )}
          </div>

          {/* 우측: 통계 정보 */}
          <div className="flex flex-1 items-center justify-around">
            <div className="flex flex-col items-center">
              <span className="text-base font-bold text-neutral-900">{typedPosts.length}</span>
              <span className="text-xs text-neutral-500">자랑거리</span>
            </div>

            {/* 팔로워 리스트 시트 */}
            <ProfileListSheet
              userId={id}
              currentUserId={currentUserId ?? undefined}
              type="followers"
              trigger={
                <div className="flex cursor-pointer flex-col items-center transition-opacity hover:opacity-70">
                  <span className="text-base font-bold text-neutral-900">
                    {followersCount.count || 0}
                  </span>
                  <span className="text-xs text-neutral-500">팔로워</span>
                </div>
              }
            />

            {/* 팔로잉 리스트 시트 */}
            <ProfileListSheet
              userId={id}
              currentUserId={currentUserId ?? undefined}
              type="following"
              trigger={
                <div className="flex cursor-pointer flex-col items-center transition-opacity hover:opacity-70">
                  <span className="text-base font-bold text-neutral-900">
                    {followingCount.count || 0}
                  </span>
                  <span className="text-xs text-neutral-500">팔로잉</span>
                </div>
              }
            />
          </div>
        </div>

        {/* 소개글 영역 (있을 때만 표시) */}
        {profile.bio && (
          <div className="px-1">
            <p className="text-sm leading-relaxed break-all whitespace-pre-wrap text-neutral-800">
              {profile.bio}
            </p>
          </div>
        )}

        {/* 하단: 액션 버튼 (팔로우) */}
        <div className="flex gap-2">
          <ToggleFollowButton targetUserId={id} currentUserId={currentUserId ?? undefined} />
          <MessageButton targetUserId={id} currentUserId={currentUserId ?? undefined} />
        </div>
      </div>

      {/* 구분선 */}
      <div className="mx-4 h-[1px] bg-neutral-100" />

      {/* 게시물 3열 Masonry 피드 */}
      <div className="flex-1 pb-4">
        <ProfilePostGrid posts={typedPosts} />
      </div>
    </div>
  );
};
