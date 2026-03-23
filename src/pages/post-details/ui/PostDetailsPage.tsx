import { createClient } from '@/src/shared/lib/supabase/server';
import { notFound } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MessageCircle, User as UserIcon, Mic } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/src/shared/ui/badge';
import { LikeButton } from '@/src/features/like-post/ui/LikeButton';
import { getOptimizedImageUrl } from '@/src/shared/lib/utils';
import { PostActionMenu } from '@/src/features/post-management/ui/PostActionMenu';
import { PostImageGallery } from '@/src/entities/post/ui/PostImageGallery';
import { SubHeader } from '@/src/shared/ui/SubHeader';
import { ToggleFollowButton } from '@/src/features/profile-management/ui/ToggleFollowButton';
import { getPostDetail } from '@/src/entities/post/api/post-api';
import { DetailPost } from '@/src/entities/post/model/types';
import { CommentSection } from '@/src/features/comment-post/ui/CommentSection';

interface PostDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
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

  // 캐싱된 게시글 정보를 가져옵니다.
  const post = (await getPostDetail(supabase, id)) as DetailPost | null;

  // 게시글이 존재하지 않거나 null인 경우 404 페이지로 이동
  if (!post) {
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
    <div className="flex min-h-full flex-col bg-white pb-[49px]">
      {/* 상단 헤더: 뒤로가기 버튼만 표시 */}
      <SubHeader
        rightElement={user?.id === post.author_id ? <PostActionMenu postId={id} /> : null}
      />

      {/* 이미지 갤러리 (라이트박스 포함) */}
      <PostImageGallery images={post.images} postTitle="자랑거리 이미지" />

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
            <p className="text-[16px] leading-relaxed break-words whitespace-pre-wrap text-neutral-900">
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

        {/* 댓글 섹션 (RSC) */}
        <CommentSection postId={id} />
      </div>
    </div>
  );
};
