import { useState, useMemo, useEffect, useRef } from 'react';
import { DetailPost } from '@/src/entities/post/model/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/app/providers/AuthProvider';

/**
 * 댓글 섹션의 비즈니스 로직을 관리하는 훅입니다.
 */
export const useCommentSection = (post: DetailPost) => {
  const router = useRouter();
  const { user } = useAuth();
  const currentUser = user ? { id: user.id } : null;
  
  // 현재 답글을 달고 있는 부모 댓글의 정보
  const [replyingTo, setReplyingTo] = useState<{
    parentId: string;
    username: string;
  } | null>(null);

  // 현재 수정 중인 댓글의 정보
  const [editingComment, setEditingComment] = useState<{
    id: string;
    content: string;
  } | null>(null);

  // 개별 댓글 요소들에 대한 참조를 저장할 Map
  const commentRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevCommentCount = useRef(post.comments.length);

  // 댓글 개수가 늘어나면 최신 댓글을 화면 중앙으로 스크롤
  useEffect(() => {
    if (post.comments.length > prevCommentCount.current) {
      // 가장 최근에 생성된 댓글 찾기
      const latestComment = [...post.comments].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];

      if (latestComment) {
        const timer = setTimeout(() => {
          const el = commentRefs.current.get(latestComment.id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
        prevCommentCount.current = post.comments.length;
        return () => clearTimeout(timer);
      }
    }
    prevCommentCount.current = post.comments.length;
  }, [post.comments]);

  // 댓글을 부모와 자식으로 분리
  const { rootComments, repliesMap } = useMemo(() => {
    const roots = post.comments.filter((c) => !c.parent_id);
    const replies = post.comments.filter((c) => c.parent_id);

    const map: Record<string, typeof replies> = {};
    replies.forEach((r) => {
      const pid = r.parent_id!;
      if (!map[pid]) map[pid] = [];
      map[pid].push(r);
    });

    // 대댓글은 시간 순서대로 (오래된 순)
    Object.keys(map).forEach((pid) => {
      map[pid].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });

    return { rootComments: roots, repliesMap: map };
  }, [post.comments]);

  const handleReplyClick = (parentId: string, username: string, targetId: string) => {
    setEditingComment(null);
    setReplyingTo({ parentId, username });

    // 타겟 댓글을 화면 중앙으로 스크롤
    const el = commentRefs.current.get(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const cancelReply = () => setReplyingTo(null);

  const startEditComment = (commentId: string, content: string) => {
    setReplyingTo(null);
    setEditingComment({ id: commentId, content });
  };

  const cancelEdit = () => setEditingComment(null);

  const deleteComment = async (commentId: string) => {
    if (!confirm('댓글을 정말 삭제할까요?')) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('댓글을 삭제하지 못했어요.');

      toast.success('댓글을 삭제했습니다.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '에러가 발생했습니다.');
    }
  };

  // Ref를 Map에 등록하는 헬퍼 함수
  const setCommentRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) {
      commentRefs.current.set(id, el);
    } else {
      commentRefs.current.delete(id);
    }
  };

  return {
    currentUser,
    replyingTo,
    editingComment,
    rootComments,
    repliesMap,
    handleReplyClick,
    cancelReply,
    startEditComment,
    cancelEdit,
    deleteComment,
    setCommentRef,
  };
};
