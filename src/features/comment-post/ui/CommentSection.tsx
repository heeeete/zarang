'use client';

import { Fragment } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getOptimizedImageUrl } from '@/src/shared/lib/utils';
import { DetailPost } from '@/src/entities/post/model/types';
import { CommentInput } from './CommentInput';
import { useCommentSection } from '../model/useCommentSection';
import { CommentActionMenu } from './CommentActionMenu';

interface CommentSectionProps {
  post: DetailPost;
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

export const CommentSection = ({ post }: CommentSectionProps) => {
  const {
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
  } = useCommentSection(post);

  const isPostOwner = currentUser?.id === post.author_id;

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
          rootComments.map((comment) => {
            const isCommentOwner = currentUser?.id === comment.author_id;
            const canManage = isPostOwner || isCommentOwner;

            return (
              <Fragment key={comment.id}>
                {/* 최상위 댓글 */}
                <div ref={setCommentRef(comment.id)} className="flex scroll-mt-20 gap-3.5">
                  <Link
                    href={`/users/${comment.author_id}`}
                    prefetch={false}
                    className="relative h-8.5 w-8.5 shrink-0 overflow-hidden rounded-full border bg-muted transition-opacity hover:opacity-80"
                  >
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
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/users/${comment.author_id}`}
                          prefetch={false}
                          className="text-xs font-bold text-neutral-900 hover:underline"
                        >
                          {comment.author?.username}
                        </Link>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { locale: ko })} 전
                        </span>
                      </div>
                      {canManage && (
                        <CommentActionMenu
                          isOwner={isCommentOwner}
                          onEdit={() => startEditComment(comment.id, comment.content)}
                          onDelete={() => deleteComment(comment.id)}
                        />
                      )}
                    </div>
                    <HighlightMention content={comment.content} />
                    <button
                      onClick={() =>
                        handleReplyClick(
                          comment.id,
                          comment.author?.username || '알 수 없음',
                          comment.id,
                        )
                      }
                      className="mt-0.5 w-fit text-[11px] font-bold text-neutral-500 hover:text-neutral-900"
                    >
                      답글 달기
                    </button>
                  </div>
                </div>

                {/* 대댓글 목록 (1-depth) */}
                {repliesMap[comment.id]?.map((reply) => {
                  const isReplyOwner = currentUser?.id === reply.author_id;
                  const canManageReply = isPostOwner || isReplyOwner;

                  return (
                    <div
                      key={reply.id}
                      ref={setCommentRef(reply.id)}
                      className="ml-10 flex scroll-mt-20 gap-3.5"
                    >
                      <Link
                        href={`/users/${reply.author_id}`}
                        prefetch={false}
                        className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border bg-muted transition-opacity hover:opacity-80"
                      >
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
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/users/${reply.author_id}`}
                              prefetch={false}
                              className="text-xs font-bold text-neutral-900 hover:underline"
                            >
                              {reply.author?.username}
                            </Link>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(reply.created_at), { locale: ko })} 전
                            </span>
                          </div>
                          {canManageReply && (
                            <CommentActionMenu
                              isOwner={isReplyOwner}
                              onEdit={() => startEditComment(reply.id, reply.content)}
                              onDelete={() => deleteComment(reply.id)}
                            />
                          )}
                        </div>
                        <HighlightMention content={reply.content} />
                        <button
                          onClick={() =>
                            handleReplyClick(
                              comment.id,
                              reply.author?.username || '알 수 없음',
                              reply.id,
                            )
                          }
                          className="mt-0.5 w-fit text-[11px] font-bold text-neutral-500 hover:text-neutral-900"
                        >
                          답글 달기
                        </button>
                      </div>
                    </div>
                  );
                })}
              </Fragment>
            );
          })
        )}
      </div>

      {/* 댓글 입력창: 화면 하단에 고정 */}
      <CommentInput
        postId={post.id}
        replyingTo={replyingTo}
        editingComment={editingComment}
        onCancelReply={cancelReply}
        onCancelEdit={cancelEdit}
      />
    </div>
  );
};
