import { CommentInput } from './CommentInput';
import { CommentList } from './CommentList';
import { CommentProvider } from './CommentProvider';
import { CommentScrollManager } from './CommentScrollManager';
import { createClient } from '@/src/shared/lib/supabase/server';
import { PostComment } from '@/src/entities/post/model/types';

interface CommentSectionProps {
  postId: string;
}

/**
 * 댓글 섹션 (RSC)
 * 서버에서 데이터를 직접 페칭하고 렌더링하여 하이드레이션 에러를 방지하고 성능을 최적화합니다.
 */
export const CommentSection = async ({ postId }: CommentSectionProps) => {
  const supabase = await createClient();
  
  // 병렬 데이터 페칭으로 응답 속도 최적화
  const [{ data: { user } }, { data: post }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('posts')
      .select(`
        author_id,
        comments:comments (
          *,
          author:profiles (id, username, avatar_url)
        )
      `)
      .eq('id', postId)
      .single()
  ]);

  if (!post) return null;

  const comments = (post.comments as PostComment[]) || [];
  const latestComment = [...comments].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];

  return (
    <CommentProvider>
      <div className="flex flex-col gap-5">
        <h3 className="text-base font-bold">댓글 {comments.length}</h3>
        
        {/* 댓글 목록 - 서버에서 날짜 포맷팅 수행 */}
        <CommentList 
          comments={comments}
          currentUserId={user?.id}
          isPostOwner={user?.id === post.author_id}
        />

        {/* 클라이언트 상태 및 스크롤 관리 */}
        <CommentScrollManager 
          commentCount={comments.length} 
          latestCommentId={latestComment?.id} 
        />

        {/* 댓글 입력창 (Client) */}
        <CommentInput postId={postId} />
      </div>
    </CommentProvider>
  );
};
