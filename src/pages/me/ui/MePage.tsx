import { createClient } from '@/src/shared/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getServerUserId } from '@/src/shared/lib/supabase/server-auth';
import Image from 'next/image';
import { ProfileEditButton } from '@/src/features/profile-management/ui/ProfileEditButton';
import { getOptimizedImageUrl } from '@/src/shared/lib/utils';
import { User as UserIcon } from 'lucide-react';
import { ProfilePostGrid } from '@/src/widgets/profile-post-grid/ui/ProfilePostGrid';
import { fetchMyPostsSummary } from '@/src/entities/post/api/fetch-my-posts-summary';
import { ProfileListSheet } from '@/src/features/profile-management/ui/ProfileListSheet';
import { MeMenuSheet } from '@/src/features/profile-management/ui/(MeMenu)/MeMenuSheet';

/**
 * 마이 페이지 컴포넌트입니다 (서버 컴포넌트).
 */
export const MePage = async () => {
  const userId = await getServerUserId();

  if (!userId) {
    redirect('/login');
  }

  const supabase = await createClient();

  // 프로필 정보와 게시물 목록, 팔로워/팔로잉 수를 병렬로 조회합니다.
  const [profileResponse, typedPosts, followersCount, followingCount] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    fetchMyPostsSummary(supabase, userId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);

  const profile = profileResponse.data;

  return (
    <div className="flex min-h-full flex-col bg-white">
      {/* 상단 헤더: 인스타그램 스타일 (유저네임 + 메뉴 아이콘) */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-white px-4">
        <h2 className="text-base font-bold">{profile?.username}</h2>
        <MeMenuSheet />
      </header>

      {/* 프로필 정보 섹션 (인스타그램 스타일) */}
      <div className="flex flex-col gap-6 px-4 py-6">
        <div className="flex items-center gap-8">
          {/* 좌측: 아바타 */}
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border bg-muted shadow-sm">
            {profile?.avatar_url ? (
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
              userId={userId}
              currentUserId={userId}
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
              userId={userId}
              currentUserId={userId}
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
        {profile?.bio && (
          <div className="px-1">
            <p className="text-sm leading-relaxed break-all whitespace-pre-wrap text-neutral-800">
              {profile.bio}
            </p>
          </div>
        )}

        {/* 하단: 액션 버튼 */}
        <div className="flex gap-2">
          <div className="flex-1">
            <ProfileEditButton />
          </div>
        </div>
      </div>

      {/* 구분선 */}
      <div className="mx-4 h-[1px] bg-neutral-100" />

      {/* 게시물 3열 그리드 피드 */}
      <div className="flex-1 pb-4">
        <ProfilePostGrid posts={typedPosts} />
      </div>
    </div>
  );
};
