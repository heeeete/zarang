import { createPublicClient } from '@/src/shared/lib/supabase/server';
import { notFound } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { User as UserIcon, Mic } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getOptimizedImageUrl } from '@/src/shared/lib/utils';
import { PostImageGallery } from '@/src/entities/post/ui/PostImageGallery';
import { fetchPostDetail } from '@/src/entities/post/api/fetch-post-detail';
import { DetailPost } from '@/src/entities/post/model/types';
import { CommentSection } from '@/src/features/comment-post/ui/CommentSection';
import { PostHeaderActions } from './PostHeaderActions';
import { PostInteractionBar } from './PostInteractionBar';

interface PostDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * 게시글 상세 페이지 컴포넌트입니다 (서버 컴포넌트).
 * 이 페이지는 정적 캐싱(Full Route Cache)이 가능하도록 설계되었습니다.
 * createPublicClient()를 사용함으로써 cookies() 의존성을 제거하였습니다.
 */
export const PostDetailsPage = async ({ params }: PostDetailsPageProps) => {
  const { id } = await params;

  const clientStart = Date.now();
  const supabase = createPublicClient();
  const clientEnd = Date.now();
  console.log(`[PERF] PostDetailsPage - Supabase Client 생성: ${clientEnd - clientStart}ms`);

  // 게시글 정보 조회 (RSC)
  const fetchStart = Date.now();
  const post = (await fetchPostDetail(supabase, id)) as DetailPost | null;
  const fetchEnd = Date.now();
  console.log(`[PERF] PostDetailsPage - fetchPostDetail 데이터 페칭: ${fetchEnd - fetchStart}ms`);

  if (!post) {
    notFound();
  }

  return (
    <div className="flex min-h-full flex-col bg-white pb-[env(safe-area-inset-bottom)]">
      {/* 상단 헤더 액션 (팔로우, 관리 메뉴 등 사용자별 상태 처리) */}
      <PostHeaderActions postId={id} authorId={post.author_id} />

      {/* 이미지 갤러리 (정적 데이터) */}
      <PostImageGallery images={post.images} postTitle="자랑거리 이미지" />

      {/* 게시글 본문 섹션 */}
      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-center justify-between">
          <Link
            href={`/users/${post.author_id}`}
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
          
          {/* 팔로우 버튼 등은 PostHeaderActions 내부에 포함됨 */}
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

        {/* 상호작용 바 (좋아요 상태는 클라이언트에서, 카운트는 RSC에서 즉시 표시) */}
        <PostInteractionBar 
          postId={id} 
          initialLikeCount={post.likes?.[0]?.count || 0} 
          initialCommentCount={post.comments?.[0]?.count || 0}
        />

        {/* 댓글 섹션 (Client Component + TanStack Query) */}
        <CommentSection postId={id} postAuthorId={post.author_id} />
      </div>
    </div>
  );
};
