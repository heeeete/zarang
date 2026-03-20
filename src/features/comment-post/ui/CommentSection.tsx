'use client';

import { useState, useMemo, Fragment, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import { getOptimizedImageUrl } from '@/src/shared/lib/utils';
import { DetailPost } from '@/src/entities/post/model/types';
import { CommentInput } from './CommentInput';

interface CommentSectionProps {
  post: DetailPost;
  currentUserId?: string;
}

/**
 * 텍스트 내의 @닉네임 부분을 파란색으로 강조합니다.
 */
const HighlightMention = ({ content }: { content: string }) => {
  const parts = content.split(/(@\S+)/g);
  return (
    <div className="text-[13px] leading-relaxed break-words text-neutral-800">
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <span key={i} className="mr-1 font-bold text-blue-600">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </div>
  );
};

export const CommentSection = ({ post, currentUserId }: CommentSectionProps) => {
  // 현재 답글을 달고 있는 부모 댓글의 정보
  const [replyingTo, setReplyingTo] = useState<{
    parentId: string;
    username: string;
  } | null>(null);

  // 개별 댓글 요소들에 대한 참조를 저장할 Map
  const commentRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevCommentCount = useRef(post.comments.length);

  // 댓글 개수가 늘어나면 최신 댓글을 화면 중앙으로 스크롤
  useEffect(() => {
    if (post.comments.length > prevCommentCount.current) {
      // 가장 최근에 생성된 댓글 찾기
      const latestComment = [...post.comments].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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
    setReplyingTo({ parentId, username });
    
    // 타겟 댓글을 화면 중앙으로 스크롤
    const el = commentRefs.current.get(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-base font-bold">댓글 {post.comments?.length || 0}</h3>
      <div className="flex flex-col gap-8">
        {rootComments.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-xs text-muted-foreground">
              아직 댓글이 없습니다. 첫 소감을 남겨주세요!
            </p>
          </div>
        ) : (
          rootComments.map((comment) => (
            <Fragment key={comment.id}>
              {/* 최상위 댓글 */}
              <div ref={setCommentRef(comment.id)} className="flex gap-3.5 scroll-mt-20">
                <div className="relative h-8.5 w-8.5 shrink-0 overflow-hidden rounded-full border bg-muted">
                  {comment.author?.avatar_url ? (
                    <Image
                      src={getOptimizedImageUrl(comment.author.avatar_url, 64) || ''}
                      alt={comment.author.username || 'commenter'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
                      <UserIcon className="size-4" />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900">
                      {comment.author?.username}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { locale: ko })} 전
                    </span>
                  </div>
                  <HighlightMention content={comment.content} />
                  <button
                    onClick={() =>
                      handleReplyClick(comment.id, comment.author?.username || '알 수 없음', comment.id)
                    }
                    className="mt-0.5 w-fit text-[11px] font-bold text-neutral-500 hover:text-neutral-900"
                  >
                    답글 달기
                  </button>
                </div>
              </div>

              {/* 대댓글 목록 (1-depth) */}
              {repliesMap[comment.id]?.map((reply) => (
                <div key={reply.id} ref={setCommentRef(reply.id)} className="ml-10 flex gap-3.5 scroll-mt-20">
                  <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border bg-muted">
                    {reply.author?.avatar_url ? (
                      <Image
                        src={getOptimizedImageUrl(reply.author.avatar_url, 64) || ''}
                        alt={reply.author.username || 'commenter'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
                        <UserIcon className="size-3.5" />
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900">
                        {reply.author?.username}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(reply.created_at), { locale: ko })} 전
                      </span>
                    </div>
                    <HighlightMention content={reply.content} />
                    <button
                      onClick={() =>
                        handleReplyClick(comment.id, reply.author?.username || '알 수 없음', reply.id)
                      }
                      className="mt-0.5 w-fit text-[11px] font-bold text-neutral-500 hover:text-neutral-900"
                    >
                      답글 달기
                    </button>
                  </div>
                </div>
              ))}
            </Fragment>
          ))
        )}
      </div>

      {/* 댓글 입력창: 화면 하단에 고정 */}
      <CommentInput
        postId={post.id}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
};
