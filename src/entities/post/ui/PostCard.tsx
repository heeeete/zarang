import Link from 'next/link';
import Image from 'next/image';
import { Heart, MessageCircle, Volume2, User as UserIcon } from 'lucide-react';
import { getOptimizedImageUrl } from '@/src/shared/lib/utils';

import { Post } from '../model/types';

interface PostCardProps {
  post: Post;
  priority?: boolean;
}

/**
 * 메이슨리 레이아웃용 게시물 카드입니다.
 */
export const PostCard = ({ post, priority = false }: PostCardProps) => {
  const aspectRatio = post.width && post.height ? post.width / post.height : 1;
  const optimizedImage = getOptimizedImageUrl(post.thumbnail_url, 400);

  return (
    <div className="flex w-full flex-col bg-[#FAFAF9]">
      <Link
        href={`/posts/${post.id}`}
        prefetch={false}
        className="group relative block w-full overflow-hidden bg-neutral-100 transition-all active:scale-[0.98]"
      >
        {optimizedImage ? (
          <div style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }} className="relative w-full">
            <Image
              src={optimizedImage}
              alt="자랑거리 이미지"
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              sizes="200px"
              priority={priority}
            />

            {/* 좌측 상단: 사운드 아이콘 (오디오가 있는 경우만) */}
            {post.audio_url && (
              <div className="absolute top-2 left-2 z-10 rounded-full bg-black/40 p-1.5 text-white shadow-sm backdrop-blur-sm">
                <Volume2 className="size-3" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-neutral-200 text-[10px] font-medium text-neutral-400">
            이미지 준비중
          </div>
        )}
      </Link>

      {/* 하단 정보 영역: 프로필 + 지표 */}
      <div className="flex items-center justify-between px-0.5 py-2">
        {/* 프로필 정보 */}
        <Link
          href={`/users/${post.author_id}`}
          prefetch={false}
          className="flex min-w-0 items-center gap-1.5 transition-opacity hover:opacity-70"
        >
          <div className="relative size-5 shrink-0 overflow-hidden rounded-full border">
            {post.author.avatar_url ? (
              <Image
                src={getOptimizedImageUrl(post.author.avatar_url, 40) || ''}
                alt={post.author.username}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-neutral-300">
                <UserIcon className="size-3" />
              </div>
            )}
          </div>
          <span className="truncate text-[11px] font-bold text-neutral-800">
            {post.author.username}
          </span>
        </Link>

        {/* 상호작용 지표 */}
        <div className="flex shrink-0 items-center gap-2 text-neutral-400">
          <div className="flex items-center gap-0.5">
            <Heart className="size-3" />
            <span className="text-[10px] font-semibold">{post._count?.post_likes || 0}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <MessageCircle className="size-3" />
            <span className="text-[10px] font-semibold">{post._count?.comments || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
