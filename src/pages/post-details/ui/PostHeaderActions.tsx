'use client';
import { PostActionMenu } from '@/src/features/post-management/ui/PostActionMenu';
import { ToggleFollowButton } from '@/src/features/profile-management/ui/ToggleFollowButton';
import { Badge } from '@/src/shared/ui/badge';
import { SubHeader } from '@/src/shared/ui/SubHeader';
import { useAuth } from '@/src/app/providers/AuthProvider';

interface PostHeaderActionsProps {
  postId: string;
  authorId: string;
}

/**
 * 게시글 상세 페이지 상단 액션 바 (Client Component)
 * 팔로우 버튼 및 게시글 관리 메뉴를 포함하며, 사용자별 권한을 처리합니다.
 */
export const PostHeaderActions = ({ postId, authorId }: PostHeaderActionsProps) => {
  const { user } = useAuth();
  const currentUserId = user?.id || null;
  const isAuthor = currentUserId === authorId;

  return (
    <SubHeader
      rightElement={
        <div className="flex items-center gap-2">
          {currentUserId && (
            <>
              {isAuthor ? (
                <>
                  <Badge
                    variant="secondary"
                    className="px-2.5 py-0.5 font-medium italic opacity-50"
                  >
                    내 게시물
                  </Badge>
                  <PostActionMenu postId={postId} />
                </>
              ) : (
                <ToggleFollowButton targetUserId={authorId} currentUserId={currentUserId} />
              )}
            </>
          )}
        </div>
      }
    />
  );
};
