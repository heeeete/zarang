import Link from 'next/link'
import Image from 'next/image'
import { Heart, MessageCircle } from 'lucide-react'
import { Badge } from '@/src/shared/ui/badge'
import { CATEGORIES } from '@/src/features/post-creation/model/schema'

interface PostCardProps {
  post: {
    id: string
    title: string
    thumbnail_url: string | null
    category: string
    author: {
      username: string
    }
    _count?: {
      post_likes: number
      comments: number
    }
  }
}

export const PostCard = ({ post }: PostCardProps) => {
  const categoryLabel = CATEGORIES.find((cat) => cat.value === post.category)?.label || post.category

  return (
    <Link href={`/posts/${post.id}`} className="group flex flex-col gap-2">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border bg-muted">
        {post.thumbnail_url ? (
          <Image
            src={post.thumbnail_url}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 420px) 100vw, 420px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            이미지 없음
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm border-none shadow-sm">
            {categoryLabel}
          </Badge>
        </div>
      </div>
      
      <div className="flex flex-col gap-1 px-1">
        <h3 className="font-semibold leading-tight line-clamp-1">{post.title}</h3>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{post.author.username}</span>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex items-center gap-0.5">
              <Heart className="h-3 w-3" />
              <span className="text-[10px]">{post._count?.post_likes || 0}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <MessageCircle className="h-3 w-3" />
              <span className="text-[10px]">{post._count?.comments || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
