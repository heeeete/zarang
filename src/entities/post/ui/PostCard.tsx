import Link from 'next/link';
import Image from 'next/image';
import { Heart, MessageCircle, Volume2 } from 'lucide-react';
import { getOptimizedImageUrl } from '@/src/shared/lib/utils';

import { Post } from '../model/types';

interface PostCardProps {
  post: Post;
}

/**
 * 메이슨리 레이아웃용 게시물 카드입니다.
 */
export const PostCard = ({ post }: PostCardProps) => {
  const aspectRatio = post.width && post.height ? post.width / post.height : 1;
  const optimizedImage = getOptimizedImageUrl(post.thumbnail_url, 400);

  return (
    <div className="flex w-full flex-col gap-2 pb-4">
      <Link
        href={`/posts/${post.id}`}
        className="relative block w-full overflow-hidden rounded-xl bg-neutral-100 transition-all active:scale-[0.98]"
      >
        {optimizedImage ? (
          <div style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }} className="relative w-full">
            <Image
              src={optimizedImage}
              alt="자랑거리 이미지"
              fill
              className="object-cover transition-transform duration-500 hover:scale-105"
              sizes="(max-width: 420px) 50vw, 200px"
              priority
            />

            {/* 좌측 상단: 사운드 아이콘 (오디오가 있는 경우만) */}
            {post.audio_url && (
              <div className="absolute top-2 left-2 z-10 rounded-full bg-black/40 p-1.5 text-white shadow-sm backdrop-blur-sm">
                <Volume2 className="size-3.5" />
              </div>
            )}

            {/* 우측 하단 상호작용 지표 */}
            <div className="absolute right-2 bottom-2 flex items-center gap-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              <div className="flex items-center gap-0.5 text-white">
                <Heart className="size-3.5 fill-white/20" />
                <span className="text-[11px] font-bold">{post._count?.post_likes || 0}</span>
              </div>
              <div className="flex items-center gap-0.5 text-white">
                <MessageCircle className="size-3.5 fill-white/20" />
                <span className="text-[11px] font-bold">{post._count?.comments || 0}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-neutral-200 text-[10px] font-medium text-neutral-400">
            이미지 준비중
          </div>
        )}
      </Link>
    </div>
  );
};
