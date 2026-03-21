'use client';

import { ReactElement, useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/src/shared/ui/sheet';
import { getFollowers, getFollowing, ProfileListItem } from '../api/profile-api';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2Icon, UserIcon } from 'lucide-react';
import { ToggleFollowButton } from './ToggleFollowButton';
import { getOptimizedImageUrl } from '@/src/shared/lib/utils';

interface ProfileListSheetProps {
  userId: string;
  currentUserId?: string;
  type: 'followers' | 'following';
  trigger: React.ReactNode;
}

export const ProfileListSheet = ({
  userId,
  currentUserId,
  type,
  trigger,
}: ProfileListSheetProps) => {
  const [profiles, setProfiles] = useState<ProfileListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const data =
            type === 'followers'
              ? await getFollowers(userId, currentUserId)
              : await getFollowing(userId, currentUserId);
          setProfiles(data);
        } catch (error) {
          console.error('Failed to fetch profile list:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, userId, type, currentUserId]);

  const title = type === 'followers' ? '팔로워' : '팔로잉';

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger render={trigger as ReactElement} nativeButton={false} />
      <SheetContent side="right" className="p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="text-left text-lg font-bold">{title}</SheetTitle>
        </SheetHeader>
        <div className="flex h-full flex-col overflow-y-auto pb-20">
          {isLoading ? (
            <div className="flex items-center justify-center p-8 text-neutral-500">
              <Loader2Icon className="animate-spin" />
            </div>
          ) : profiles.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-neutral-500">
              목록이 없습니다.
            </div>
          ) : (
            <div className="flex flex-col">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-neutral-50"
                >
                  <Link
                    href={`/users/${profile.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex flex-1 items-center gap-3"
                  >
                    <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100">
                      {profile.avatar_url ? (
                        <Image
                          src={getOptimizedImageUrl(profile.avatar_url, 80) || ''}
                          alt={profile.username}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <UserIcon className="size-5 text-neutral-400" />
                      )}
                    </div>
                    <span className="truncate font-medium text-neutral-900">
                      {profile.username}
                    </span>
                  </Link>

                  {/* 팔로우 버튼 추가 (자기 자신이 아닐 때만) */}
                  {currentUserId !== profile.id && (
                    <div className="ml-2 shrink-0">
                      <ToggleFollowButton
                        targetUserId={profile.id}
                        currentUserId={currentUserId}
                        initialIsFollowing={profile.is_following}
                        initialIsFollowedBy={profile.is_followed_by}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
