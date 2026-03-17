'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/src/shared/ui/button'

interface CommentInputProps {
  postId: string
}

export const CommentInput = ({ postId }: CommentInputProps) => {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          alert('로그인이 필요한 기능입니다.')
        } else {
          throw new Error('댓글 작성 중 오류가 발생했습니다.')
        }
      } else {
        setContent('')
        router.refresh()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 에러가 발생했습니다.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white border-t p-2 px-4 flex gap-2 items-center">
      <input
        placeholder="댓글을 입력하세요..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isSubmitting}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        className="flex-1 bg-muted rounded-full px-4 py-2 text-xs outline-none disabled:opacity-50"
      />
      <Button
        size="sm"
        variant="ghost"
        onClick={handleSubmit}
        disabled={isSubmitting || !content.trim()}
        className="text-primary font-bold hover:bg-transparent"
      >
        게시
      </Button>
    </div>
  )
}
