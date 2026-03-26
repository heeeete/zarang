'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/src/shared/lib/supabase/client';
import { LikeButton } from '@/src/features/like-post/ui/LikeButton';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/src/app/providers/AuthProvider';

interface PostInteractionBarProps {
  postId: string;
  initialLikeCount: number;
  initialCommentCount: number;
}

/**
 * 게시글 상세 페이지 상호작용 바 (Client Component)
 * 내 좋아요 여부만 클라이언트에서 비동기로 확인하며, 
 * 카운트 데이터는 RSC에서 전달받은 초기값을 표시합니다.
 */
export const PostInteractionBar = ({
  postId,
  initialLikeCount,
  initialCommentCount,
}: PostInteractionBarProps) => {
  const [initialIsLiked, setInitialIsLiked] = useState<boolean | null>(null);
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    const checkLikedStatus = async () => {
      if (!user) {
        setInitialIsLiked(false);
        return;
      }

      // post_likes 테이블에는 id 컬럼이 없으므로 post_id를 선택하여 존재 여부를 확인합니다.
      const { data } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      setInitialIsLiked(!!data);
    };

    checkLikedStatus();
  }, [postId, supabase, user]);

  return (
    <div className="my-2 flex items-center gap-6 border-y py-4">
      {initialIsLiked !== null ? (
        <LikeButton
          postId={postId}
          initialLikeCount={initialLikeCount}
          initialIsLiked={initialIsLiked}
        />
      ) : (
        <div className="flex items-center gap-1.5 text-neutral-300">
          <div className="h-5.5 w-5.5 rounded-full bg-neutral-100" />
          <span className="text-sm font-semibold">{initialLikeCount}</span>
        </div>
      )}
      <div className="flex items-center gap-1.5 text-neutral-600">
        <MessageCircle className="h-5.5 w-5.5" />
        <span className="text-sm font-semibold">{initialCommentCount}</span>
      </div>
    </div>
  );
};
