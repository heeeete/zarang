import Link from 'next/link';
import Image from 'next/image';
import { Volume2 } from 'lucide-react';
import { getOptimizedImageUrl } from '@/src/shared/lib/utils';
import { Post } from '../model/types';

interface ProfilePostCardProps {
  post: Post;
}

/**
 * 프로필 페이지 전용 Masonry 카드입니다.
 * 이미지 비율을 유지하며, 작성자 정보와 지표 없이 이미지만 보여줍니다.
 */
export const ProfilePostCard = ({ post }: ProfilePostCardProps) => {
  const aspectRatio = post.width && post.height ? post.width / post.height : 1;
  const optimizedImage = getOptimizedImageUrl(post.thumbnail_url, 400);

  return (
    <div className="w-full">
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
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 420px) 33vw, 140px"
            />

            {/* 우측 상단: 사운드 아이콘 (오디오가 있는 경우만) */}
            {post.audio_url && (
              <div className="absolute top-1.5 right-1.5 z-10 rounded-full bg-black/30 p-1 text-white backdrop-blur-sm">
                <Volume2 className="size-2.5" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-neutral-200 text-[10px] font-medium text-neutral-400">
            이미지 없음
          </div>
        )}
      </Link>
    </div>
  );
};
