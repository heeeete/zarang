'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/src/shared/lib/supabase/client';
import { Button } from '@/src/shared/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ToggleFollowButtonProps {
  targetUserId: string;
  currentUserId?: string;
}

/**
 * 팔로우/언팔로우 토글 버튼 컴포넌트입니다.
 */
export const ToggleFollowButton = ({ targetUserId, currentUserId }: ToggleFollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // 자기 자신은 팔로우할 수 없음
  if (currentUserId === targetUserId) return null;

  useEffect(() => {
    if (!currentUserId) return;

    const checkFollowStatus = async () => {
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .single();

      if (!error && data) {
        setIsFollowing(true);
      } else {
        setIsFollowing(false);
      }
    };

    checkFollowStatus();
  }, [currentUserId, targetUserId, supabase]);

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
        // 팔로우
        const { error } = await supabase.from('follows').insert({
          follower_id: currentUserId,
          following_id: targetUserId,
        });

        if (error) throw error;
        setIsFollowing(true);
        toast.success('팔로우했어요! 🎉');
      }
    } catch (err) {
      console.error('팔로우 토글 실패:', err);
      toast.error('팔로우 처리에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 상태를 불러오는 중이거나 로그인하지 않은 경우 버튼을 숨기거나 비활성 상태로 둡니다.
  if (isFollowing === null && currentUserId) {
    return (
      <Button variant="ghost" size="sm" disabled className="h-7 px-3 text-xs font-bold">
        <Loader2 className="size-3 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : 'default'}
      size="sm"
      className={`h-7 px-4 text-xs font-bold transition-all duration-200 ${
        isFollowing ? 'border-neutral-200 text-neutral-500' : 'bg-primary text-white'
      }`}
      onClick={handleToggleFollow}
      disabled={isLoading}
    >
      {isFollowing ? '팔로잉' : '팔로우'}
    </Button>
  );
};
