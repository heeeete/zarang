import { createClient } from '@/src/shared/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { LogoutButton } from '@/src/features/auth/ui/LogoutButton';
import { ProfileEditButton } from '@/src/features/profile-management/ui/ProfileEditButton';
import { getOptimizedImageUrl } from '@/src/shared/lib/utils';
import { User as UserIcon, Settings } from 'lucide-react';
import { PostGrid } from '@/src/widgets/explore-feed/ui/PostGrid';
import { Post } from '@/src/entities/post/model/types';
import { fetchPostsData } from '@/src/entities/post/api/post-api';

/**
 * 마이 페이지 컴포넌트입니다 (서버 컴포넌트).
 */
export const MePage = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 프로필 정보와 게시물 목록, 팔로워/팔로잉 수를 병렬로 조회합니다.
  const [profileResponse, typedPosts, followersCount, followingCount] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    fetchPostsData(supabase, {
      from: 0,
      to: 99, // 마이페이지는 일단 최대 100개까지 조회
      authorId: user.id,
    }),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id),
  ]);

  const profile = profileResponse.data;

  return (
    <div className="flex min-h-full flex-col bg-white">
      {/* 상단 헤더: 인스타그램 스타일 (유저네임 + 설정 아이콘) */}
      <header className="sticky top-0 z-50 flex h-12 items-center justify-between border-b bg-white px-4">
        <h2 className="text-base font-bold">{profile?.username}</h2>
        <Settings className="size-5 text-neutral-700" />
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
            <div className="flex flex-col items-center">
              <span className="text-base font-bold text-neutral-900">
                {followersCount.count || 0}
              </span>
              <span className="text-xs text-neutral-500">팔로워</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-base font-bold text-neutral-900">
                {followingCount.count || 0}
              </span>
              <span className="text-xs text-neutral-500">팔로잉</span>
            </div>
          </div>
        </div>

        {/* 하단: 액션 버튼 */}
        <div className="flex gap-2">
          <div className="flex-1">
            <ProfileEditButton />
          </div>
          <LogoutButton />
        </div>
      </div>

      {/* 구분선 */}
      <div className="mx-4 h-[1px] bg-neutral-100" />

      {/* 게시물 메이슨리 피드 */}
      <div className="flex-1 px-2 py-4">
        <PostGrid posts={typedPosts} loading={false} />

        {typedPosts.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <p className="text-sm font-medium text-neutral-400 italic">아직 자랑거리가 없어요.</p>
          </div>
        )}
      </div>
    </div>
  );
};
