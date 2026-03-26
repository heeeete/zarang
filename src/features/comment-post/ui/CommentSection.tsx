'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { CommentInput } from './CommentInput';
import { CommentList } from './CommentList';
import { CommentProvider, useCommentContext } from './CommentProvider';
import { CommentScrollManager } from './CommentScrollManager';
import { useAuth } from '@/src/app/providers/AuthProvider';
import { createClient } from '@/src/shared/lib/supabase/client';
import { PostComment } from '@/src/entities/post/model/types';
import { Loader2 } from 'lucide-react';

interface CommentSectionProps {
  postId: string;
  postAuthorId?: string;
}

/**
 * 댓글 섹션의 실제 내용을 렌더링하는 내부 컴포넌트
 */
const CommentContent = ({ postId, postAuthorId }: CommentSectionProps) => {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const { user } = useAuth();
  const { refreshTrigger } = useCommentContext();
  const supabase = useMemo(() => createClient(), []);

  const fetchComments = useCallback(async () => {
    try {
      setIsError(false);
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:profiles (id, username, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data as PostComment[]);
    } catch (err) {
      console.error('댓글 페칭 실패:', err);
      setIsError(err !== null);
    } finally {
      setIsLoading(false);
    }
  }, [postId, supabase]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments, refreshTrigger]);

  if (isLoading && comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-300" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-red-500">댓글을 불러오지 못했어요.</p>
      </div>
    );
  }

  const latestComment = [...comments].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];

  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-base font-bold">댓글 {comments.length}</h3>
      
      <CommentList 
        comments={comments}
        currentUserId={user?.id}
        isPostOwner={user?.id === postAuthorId}
      />

      <CommentScrollManager 
        commentCount={comments.length} 
        latestCommentId={latestComment?.id} 
      />

      <CommentInput postId={postId} />
    </div>
  );
};

/**
 * 댓글 섹션 (Client Component)
 * 데이터의 정확성을 위해 매 진입 시 Supabase에서 직접 최신 데이터를 가져옵니다.
 */
export const CommentSection = (props: CommentSectionProps) => {
  return (
    <CommentProvider>
      <CommentContent {...props} />
    </CommentProvider>
  );
};
