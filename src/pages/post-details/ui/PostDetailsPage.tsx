import { createClient } from '@/src/shared/lib/supabase/server';
import { notFound } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MessageCircle, ChevronLeft, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/src/shared/ui/button';
import { Badge } from '@/src/shared/ui/badge';
import { CATEGORIES } from '@/src/features/post-creation/model/schema';
import { LikeButton } from '@/src/features/like-post/ui/LikeButton';
import { CommentInput } from '@/src/features/comment-post/ui/CommentInput';

interface PostDetailsPageProps {
  params: {
    id: string;
  };
}

export const PostDetailsPage = async ({ params }: PostDetailsPageProps) => {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: post, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      author:profiles!posts_author_id_fkey(username, avatar_url),
      images:post_images(*),
      likes:post_likes(count),
      comments:comments(
        *,
        author:profiles!comments_author_id_fkey(username, avatar_url)
      )
    `,
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !post) {
    console.error('Fetch post error:', error);
    notFound();
  }

  // Check if current user liked
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

  // Sort images by sort_order
  const sortedImages = [...(post.images || [])].sort((a, b) => a.sort_order - b.sort_order);

  // Sort comments by created_at (latest first)
  const sortedComments = [...(post.comments || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const categoryLabel =
    CATEGORIES.find((cat) => cat.value === post.category)?.label || post.category;

  return (
    <div className="flex min-h-full flex-col pb-20">
      {/* 서브 헤더 */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-white/80 px-4 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href="/" />}
          className="-ml-2"
          nativeButton={false}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h2 className="max-w-[200px] truncate text-sm font-semibold">{post.title}</h2>
        <Button variant="ghost" size="icon" className="-mr-2">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </header>

      {/* Image Carousel (Simplified for MVP) */}
      <div className="scrollbar-hide flex w-full snap-x snap-mandatory overflow-x-auto">
        {sortedImages.map((image) => (
          <div
            key={image.id}
            className="relative aspect-square min-w-full snap-center border-b bg-neutral-50"
          >
            <Image
              src={image.image_url}
              alt={post.title}
              fill
              className="object-contain"
              sizes="(max-width: 420px) 100vw, 420px"
            />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8 overflow-hidden rounded-full bg-muted">
              {post.author?.avatar_url && (
                <Image
                  src={post.author.avatar_url}
                  alt={post.author.username}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <span className="text-sm font-medium">{post.author?.username}</span>
          </div>
          <Badge variant="secondary">{categoryLabel}</Badge>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-xl leading-tight font-bold">{post.title}</h1>
          {post.description && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-700">
              {post.description}
            </p>
          )}
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ko })}
          </span>
        </div>

        {/* Interaction Bar */}
        <div className="flex items-center gap-6 border-y py-3">
          <LikeButton
            postId={id}
            initialLikeCount={post.likes?.[0]?.count || 0}
            initialIsLiked={initialIsLiked}
          />
          <div className="flex items-center gap-1.5 text-neutral-600">
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{post.comments?.length || 0}</span>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-2 flex flex-col gap-4">
          <h3 className="text-sm font-bold">댓글 {post.comments?.length || 0}</h3>
          <div className="flex flex-col gap-4">
            {sortedComments.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                첫 댓글을 남겨보세요!
              </p>
            ) : (
              sortedComments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
                    {comment.author?.avatar_url && (
                      <Image
                        src={comment.author.avatar_url}
                        alt={comment.author.username}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{comment.author?.username}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { locale: ko })} 전
                      </span>
                    </div>
                    <p className="text-xs leading-normal text-neutral-800">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Comment Input Sticky */}
      <CommentInput postId={id} />
    </div>
  );
};
