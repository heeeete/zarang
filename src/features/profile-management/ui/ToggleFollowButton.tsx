'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/src/shared/lib/supabase/client';
import { Button } from '@/src/shared/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ToggleFollowButtonProps {
  targetUserId: string;
  currentUserId?: string;
  initialIsFollowing?: boolean | null;
  initialIsFollowedBy?: boolean | null;
}

/**
 * 팔로우/언팔로우 토글 버튼 컴포넌트입니다.
 */
export const ToggleFollowButton = ({ 
  targetUserId, 
  currentUserId, 
  initialIsFollowing = null,
  initialIsFollowedBy = null
}: ToggleFollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState<boolean | null>(initialIsFollowing);
  const [isFollowedBy, setIsFollowedBy] = useState<boolean | null>(initialIsFollowedBy); // 상대방이 나를 팔로우하는지 여부
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // 초기값이 이미 제공되었다면 DB 조회를 생략합니다. (N+1 최적화)
    if (initialIsFollowing !== null && initialIsFollowedBy !== null) return;
    if (!currentUserId || currentUserId === targetUserId) return;

    const checkFollowStatus = async () => {
      // 1. 내가 상대방을 팔로우하는지 확인
      const { data: followingData } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle();

      // 2. 상대방이 나를 팔로우하는지 확인
      const { data: followedByData } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', targetUserId)
        .eq('following_id', currentUserId)
        .maybeSingle();

      setIsFollowing(!!followingData);
      setIsFollowedBy(!!followedByData);
    };

    checkFollowStatus();
  }, [currentUserId, targetUserId, supabase, initialIsFollowing, initialIsFollowedBy]);

  // 자기 자신은 팔로우할 수 없음 (훅 이후에 렌더링 조건부 처리)
  if (currentUserId === targetUserId) return null;

  const handleToggleFollow = async () => {
    if (!currentUserId) {
      toast.error('로그인이 필요해요. 로그인 후에 팔로우해 보세요!');
      return;
    }

    setIsLoading(true);

    try {
      if (isFollowing) {
        // 언팔로우
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId);

        if (error) throw error;
        setIsFollowing(false);
        toast.success('언팔로우했어요.');
      } else {
        // 팔로우 또는 맞팔로우
        const { error } = await supabase.from('follows').insert({
          follower_id: currentUserId,
          following_id: targetUserId,
        });

        if (error) throw error;
        setIsFollowing(true);
        toast.success(isFollowedBy ? '맞팔로우를 시작했어요! 🎉' : '팔로우했어요! 🎉');
      }
    } catch (err) {
      console.error('팔로우 토글 실패:', err);
      toast.error('처리에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 상태를 불러오는 중이거나 로그인하지 않은 경우
  if (isFollowing === null && currentUserId) {
    return (
      <Button variant="ghost" size="sm" disabled className="h-7 px-3 text-xs font-bold">
        <Loader2 className="size-3 animate-spin" />
      </Button>
    );
  }

  // 멘트 결정 로직
  // 1. 내가 팔로잉 중이면 무조건 "언팔로우"
  // 2. 내가 팔로잉이 아닌데 상대가 나를 팔로우 중이면 "맞팔로우"
  // 3. 둘 다 아니면 "팔로우"
  let buttonText = '팔로우';
  if (isFollowing) {
    buttonText = '언팔로우';
  } else if (isFollowedBy) {
    buttonText = '맞팔로우';
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : 'default'}
      size="sm"
      className={`h-7 px-4 text-xs font-bold transition-all duration-200 ${
        isFollowing ? 'border-neutral-200 text-neutral-500 hover:bg-neutral-50' : 'bg-primary text-white'
      }`}
      onClick={handleToggleFollow}
      disabled={isLoading}
    >
      {buttonText}
    </Button>
  );
};
