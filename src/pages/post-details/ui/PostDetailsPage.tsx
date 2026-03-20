import { createClient } from '@/src/shared/lib/supabase/server';
import { notFound } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MessageCircle, User as UserIcon, Mic } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/src/shared/ui/badge';
import { LikeButton } from '@/src/features/like-post/ui/LikeButton';
import { CommentInput } from '@/src/features/comment-post/ui/CommentInput';
import { getOptimizedImageUrl } from '@/src/shared/lib/utils';
import { PostActionMenu } from '@/src/features/post-management/ui/PostActionMenu';
import { PostImageGallery } from '@/src/entities/post/ui/PostImageGallery';
import { SubHeader } from '@/src/shared/ui/SubHeader';

import { ToggleFollowButton } from '@/src/features/profile-management/ui/ToggleFollowButton';

interface PostDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface DetailImage {
  id: string;
  image_url: string;
  width?: number | null;
  height?: number | null;
}

interface DetailComment {
  id: string;
  content: string;
  created_at: string;
  author: {
    username: string;
    avatar_url: string | null;
  } | null;
}

/**
 * 게시글 상세 페이지 컴포넌트입니다 (서버 컴포넌트).
 * 게시글 본문, 이미지 캐러셀, 좋아요/댓글 섹션을 포함합니다.
 */
export const PostDetailsPage = async ({ params }: PostDetailsPageProps) => {
  const { id } = await params;
  const supabase = await createClient();

  // 로그인한 사용자의 정보를 가져옵니다 (좋아요 상태 확인용)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 게시글 정보, 작성자 정보, 이미지 목록, 좋아요 수, 댓글 목록을 한 번에 가져옵니다.
  const { data: post, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      author:profiles!posts_author_id_fkey(username, avatar_url),
      categories(label),
      audio_url,
      images:post_images(id, image_url, width, height),
      likes:post_likes(count),
      comments:comments(
        *,
        author:profiles!comments_author_id_fkey(username, avatar_url)
      )
    `,
    )
    .eq('id', id)
    .order('sort_order', { foreignTable: 'post_images', ascending: true })
    .order('created_at', { foreignTable: 'comments', ascending: false })
    .single();

  if (error || !post) {
    console.error('게시글 상세 정보 조회 실패:', error);
    notFound();
  }

  // 로그인된 경우 현재 사용자의 좋아요 여부를 확인합니다.
  let initialIsLiked = false;
  if (user) {
    const { data: likeData } = await supabase
      .from('post_likes')
      .select()
      .eq('post_id', id)
      .eq('user_id', user.id)
      .single();
    initialIsLiked = !!likeData;
  }

  return (
    <div className="flex min-h-full flex-col bg-white pb-20">
      {/* 상단 헤더: 뒤로가기 버튼만 표시 */}
      <SubHeader
        rightElement={user?.id === post.author_id ? <PostActionMenu postId={id} /> : null}
      />

      {/* 이미지 갤러리 (라이트박스 포함) */}
      <PostImageGallery images={post.images as DetailImage[]} postTitle="자랑거리 이미지" />

      {/* 게시글 본문 섹션 */}
      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-center justify-between">
          <Link
            href={post.author_id === user?.id ? '/me' : `/users/${post.author_id}`}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <div className="relative h-9 w-9 overflow-hidden rounded-full border bg-muted">
              {post.author?.avatar_url ? (
                <Image
                  src={getOptimizedImageUrl(post.author.avatar_url, 64) || ''}
                  alt={post.author.username}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
                  <UserIcon className="size-5" />
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold">{post.author?.username}</span>
              <span className="text-[11px] text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ko })}
              </span>
            </div>
          </Link>
          {user?.id !== post.author_id ? (
            <ToggleFollowButton targetUserId={post.author_id} currentUserId={user?.id} />
          ) : (
            <Badge variant="secondary" className="px-2.5 py-0.5 font-medium italic opacity-50">
              내 게시물
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {/* ASMR 오디오 플레이어 */}
          {post.audio_url && (
            <div className="mt-1 rounded-xl border border-neutral-100 bg-neutral-50 p-3 shadow-sm">
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                <Mic className="size-3" /> ASMR SOUND
              </p>
              <audio src={post.audio_url} controls className="h-8 w-full" />
            </div>
          )}

          {post.description && (
            <p className="text-[16px] leading-relaxed whitespace-pre-wrap text-neutral-900">
              {post.description}
            </p>
          )}
        </div>

        {/* 상호작용 바 (좋아요, 댓글 수 표시 및 동작) */}
        <div className="my-2 flex items-center gap-6 border-y py-4">
          <LikeButton
            postId={id}
            initialLikeCount={post.likes?.[0]?.count || 0}
            initialIsLiked={initialIsLiked}
          />
          <div className="flex items-center gap-1.5 text-neutral-600">
            <MessageCircle className="h-5.5 w-5.5" />
            <span className="text-sm font-semibold">{post.comments?.length || 0}</span>
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="flex flex-col gap-5">
          <h3 className="text-base font-bold">댓글 {post.comments?.length || 0}</h3>
          <div className="flex flex-col gap-6">
            {post.comments?.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-xs text-muted-foreground">
                  아직 댓글이 없습니다. 첫 소감을 남겨주세요!
                </p>
              </div>
            ) : (
              post.comments?.map((comment: DetailComment) => (
                <div key={comment.id} className="flex gap-3.5">
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
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900">
                        {comment.author?.username}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { locale: ko })} 전
                      </span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-neutral-800">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 댓글 입력창: 화면 하단에 고정 */}
      <CommentInput postId={id} />
    </div>
  );
};
