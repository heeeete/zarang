import { Fragment } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getOptimizedImageUrl } from '@/src/shared/lib/utils';
import { PostComment } from '@/src/entities/post/model/types';
import { ReplyButton } from './ReplyButton';
import { CommentActionMenu } from './CommentActionMenu';

/**
 * 텍스트 내의 @닉네임 부분을 파란색으로 강조합니다. (RSC)
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

interface CommentListProps {
  comments: PostComment[];
  currentUserId?: string;
  isPostOwner: boolean;
}

/**
 * 댓글 목록 (RSC)
 * 서버에서 날짜 포맷팅을 수행하여 하이드레이션 에러를 방지합니다.
 */
export const CommentList = ({
  comments,
  currentUserId,
  isPostOwner,
}: CommentListProps) => {
  // 계층 구조 생성 (RSC에서 실행)
  const rootComments = comments.filter((c) => !c.parent_id);
  const repliesMap = comments.reduce((acc, reply) => {
    if (reply.parent_id) {
      if (!acc[reply.parent_id]) acc[reply.parent_id] = [];
      acc[reply.parent_id].push(reply);
    }
    return acc;
  }, {} as Record<string, PostComment[]>);

  return (
    <div className="flex flex-col gap-8">
      {rootComments.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-xs text-muted-foreground">
            아직 댓글이 없습니다. 첫 소감을 남겨주세요!
          </p>
        </div>
      ) : (
        rootComments.map((comment) => {
          const isCommentOwner = currentUserId === comment.author_id;
          return (
            <Fragment key={comment.id}>
              {/* 최상위 댓글 */}
              <div id={`comment-${comment.id}`} className="flex scroll-mt-20 gap-3.5">
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
                    {(isPostOwner || isCommentOwner) && (
                      <CommentActionMenu 
                        commentId={comment.id}
                        content={comment.content}
                        isOwner={isCommentOwner}
                      />
                    )}
                  </div>
                  <HighlightMention content={comment.content} />
                  <ReplyButton 
                    parentId={comment.id}
                    targetId={comment.id}
                    targetUsername={comment.author?.username || '알 수 없음'}
                  />
                </div>
              </div>

              {/* 대댓글 목록 */}
              {repliesMap[comment.id]?.map((reply) => {
                const isReplyOwner = currentUserId === reply.author_id;
                return (
                  <div
                    key={reply.id}
                    id={`comment-${reply.id}`}
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
                        {(isPostOwner || isReplyOwner) && (
                          <CommentActionMenu 
                            commentId={reply.id}
                            content={reply.content}
                            isOwner={isReplyOwner}
                          />
                        )}
                      </div>
                      <HighlightMention content={reply.content} />
                      <ReplyButton 
                        parentId={comment.id}
                        targetId={reply.id}
                        targetUsername={reply.author?.username || '알 수 없음'}
                      />
                    </div>
                  </div>
                );
              })}
            </Fragment>
          );
        })
      )}
    </div>
  );
};
