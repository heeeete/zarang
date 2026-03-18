import Link from 'next/link'
import Image from 'next/image'
import { Heart, MessageCircle } from 'lucide-react'
import { Badge } from '@/src/shared/ui/badge'
import { getOptimizedImageUrl } from '@/src/shared/lib/utils'

/**
 * 게시글 카드 컴포넌트의 프롭 타입을 정의합니다.
 */
interface PostCardProps {
  post: {
    id: string
    title: string | null
    thumbnail_url: string | null
    author: {
      username: string
    }
    categories: {
      label: string
    } | null
    _count?: {
      post_likes: number
      comments: number
    }
  }
}

/**
 * 홈 피드와 목록에서 사용되는 게시글 카드 컴포넌트입니다.
 * 16:9 비율의 썸네일과 게시글 정보를 표시합니다.
 */
export const PostCard = ({ post }: PostCardProps) => {
  // 카테고리 라벨 (DB 조인 데이터 사용)
  const categoryLabel = post.categories?.label || '기타'

  // 리사이징된 이미지 URL 생성 (카드용이므로 420px 너비로 충분)
  const optimizedThumbnail = getOptimizedImageUrl(post.thumbnail_url, 420)

  return (
    <Link href={`/posts/${post.id}`} className="group flex flex-col gap-2">
      {/* 썸네일 영역: 16:9 고정 비율 유지 */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border bg-muted shadow-sm">
        {optimizedThumbnail ? (
          <Image
            src={optimizedThumbnail}
            alt={post.title || '자랑거리 이미지'}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 420px) 100vw, 420px"
            priority={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-neutral-50">
            <span className="text-xs">이미지 없음</span>
          </div>
        )}

        {/* 카테고리 배지 */}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm border-none shadow-sm text-[10px] font-medium px-2 py-0.5">
            {categoryLabel}
          </Badge>
        </div>
      </div>

      {/* 게시글 정보 영역 */}
      <div className="flex flex-col gap-1.5 px-1">
        <h3 className="font-semibold text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">{post.author.username}</span>

          {/* 상호작용 지표 (좋아요, 댓글 수) */}
          <div className="flex items-center gap-2.5 text-muted-foreground/80">
            <div className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">{post._count?.post_likes || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">{post._count?.comments || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
