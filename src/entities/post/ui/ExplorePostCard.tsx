import Link from 'next/link';
import Image from 'next/image';
import { Heart, MessageCircle } from 'lucide-react';
import { getOptimizedImageUrl } from '@/src/shared/lib/utils';

interface ExplorePostCardProps {
  post: {
    id: string;
    title: string | null;
    thumbnail_url: string | null;
    width?: number | null;
    height?: number | null;
    author: {
      username: string;
    };
    _count?: {
      post_likes: number;
      comments: number;
    };
  };
}

/**
 * 구경하기 페이지의 Masonry 레이아웃용 카드입니다.
 * 너비를 100%로 강제하여 2컬럼 환경에서 꽉 차게 보이도록 설정했어요.
 */
export const ExplorePostCard = ({ post }: ExplorePostCardProps) => {
  // 가로 세로 비율 계산 (원본 비율 유지)
  const aspectRatio = post.width && post.height ? post.width / post.height : 1;

  // 2컬럼이므로 썸네일은 400px 정도면 충분히 선명해요.
  const optimizedImage = getOptimizedImageUrl(post.thumbnail_url, 400);

  return (
    <div className="flex w-full flex-col gap-1.5 pb-5">
      <Link
        href={`/posts/${post.id}`}
        className="relative block w-full overflow-hidden rounded-md bg-neutral-100 transition-all active:scale-[0.97]"
      >
        {optimizedImage ? (
          <div style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }} className="relative w-full">
            <Image
              src={optimizedImage}
              alt={post.title || '자랑거리'}
              fill
              className="object-cover transition-transform duration-500 hover:scale-105"
              sizes="(max-width: 420px) 50vw, 200px"
              priority
            />
            {/* 우측 하단 상호작용 지표 (좋아요, 댓글) */}
            <div className="absolute right-2 bottom-2 flex items-center gap-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              <div className="flex items-center gap-0.5 text-white">
                <Heart className="size-4 fill-white/20" />
                <span className="text-[12px] font-bold">{post._count?.post_likes || 0}</span>
              </div>
              <div className="flex items-center gap-0.5 text-white">
                <MessageCircle className="size-4 fill-white/20" />
                <span className="text-[12px] font-bold">{post._count?.comments || 0}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-neutral-200 text-[10px] font-medium text-neutral-400">
            이미지 준비중
          </div>
        )}
      </Link>

      {/* 제목: 이미지 바로 아래에 밀착 */}
      {post.title && (
        <div className="px-0.5">
          <p className="line-clamp-2 text-[14px] leading-tight font-bold text-neutral-600">
            {post.title}
          </p>
        </div>
      )}
    </div>
  );
};
