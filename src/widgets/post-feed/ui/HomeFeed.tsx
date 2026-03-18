'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/src/shared/lib/supabase/client'
import { PostCard } from '@/src/entities/post/ui/PostCard'
import { Loader2 } from 'lucide-react'

// 게시글 데이터 타입 정의
interface HomePost {
  id: string
  title: string
  thumbnail_url: string | null
  category: string
  created_at: string
  author: {
    username: string
  }
  _count: {
    post_likes: number
    comments: number
  }
}

// Supabase 원시 데이터 타입 정의
interface RawPost {
  id: string
  title: string
  thumbnail_url: string | null
  category: string
  created_at: string
  author: {
    username: string
  } | null
  post_likes: { count: number }[]
  comments: { count: number }[]
}

interface HomeFeedProps {
  initialPosts: HomePost[]
}

const PAGE_SIZE = 10

/**
 * 홈 피드 무한 스크롤 위젯입니다.
 * 초기 데이터를 서버에서 받고, 이후 데이터는 클라이언트에서 페이징 처리합니다.
 */
export const HomeFeed = ({ initialPosts }: HomeFeedProps) => {
  const [posts, setPosts] = useState<HomePost[]>(initialPosts)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialPosts.length === PAGE_SIZE)
  const [page, setPage] = useState(1)
  
  // 무한 스크롤 관찰 대상 요소
  const observerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  /**
   * 추가 데이터를 가져오는 함수입니다.
   */
  const fetchMorePosts = useCallback(async () => {
    if (loading || !hasMore) return
    
    setLoading(true)
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          thumbnail_url,
          category,
          created_at,
          author:profiles!posts_author_id_fkey(username),
          post_likes(count),
          comments(count)
        `)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      const rawPosts = (data as unknown as RawPost[]) || []
      
      if (rawPosts.length < PAGE_SIZE) {
        setHasMore(false)
      }

      const newPosts: HomePost[] = rawPosts.map((post) => ({
        id: post.id,
        title: post.title,
        thumbnail_url: post.thumbnail_url,
        category: post.category,
        created_at: post.created_at,
        author: post.author || { username: '알 수 없음' },
        _count: {
          post_likes: post.post_likes?.[0]?.count ?? 0,
          comments: post.comments?.[0]?.count ?? 0,
        },
      }))

      setPosts((prev) => [...prev, ...newPosts])
      setPage((prev) => prev + 1)
    } catch (err) {
      console.error('무한 스크롤 데이터 로드 실패:', err)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, page, supabase])

  /**
   * Intersection Observer 설정
   */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchMorePosts()
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerRef.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [fetchMorePosts, hasMore, loading])

  return (
    <div className="flex flex-col gap-8">
      {/* 게시글 리스트 */}
      <div className="grid grid-cols-1 gap-8">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* 하단 무한 스크롤 감지 및 로딩 표시 */}
      <div ref={observerRef} className="py-10 flex justify-center">
        {loading && (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">새로운 자랑거리를 불러오는 중...</p>
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-xs text-muted-foreground italic">모든 자랑거리를 확인했습니다! ✨</p>
        )}
      </div>
    </div>
  )
}
