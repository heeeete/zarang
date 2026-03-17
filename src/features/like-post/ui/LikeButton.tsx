'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/src/shared/lib/utils'

interface LikeButtonProps {
  postId: string
  initialLikeCount: number
  initialIsLiked: boolean
}

export const LikeButton = ({ postId, initialLikeCount, initialIsLiked }: LikeButtonProps) => {
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLoading, setIsLoading] = useState(false)

  const toggleLike = async () => {
    if (isLoading) return
    setIsLoading(true)
    
    // Optimistic Update
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          alert('로그인이 필요한 기능입니다.')
          // Revert
          setIsLiked(isLiked)
          setLikeCount(likeCount)
        } else {
          throw new Error('오류가 발생했습니다.')
        }
      } else {
        const result = await response.json()
        setLikeCount(result.likeCount)
        setIsLiked(result.liked)
      }
    } catch {
      // 에러 발생 시 원래 상태로 복구
      setIsLiked(isLiked)
      setLikeCount(likeCount)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      onClick={toggleLike}
      className={cn(
        "flex items-center gap-1.5 cursor-pointer transition-colors select-none",
        isLiked ? "text-red-500" : "text-neutral-600 hover:text-neutral-900"
      )}
    >
      <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
      <span className="text-sm font-medium">{likeCount}</span>
    </div>
  )
}
