import { createClient } from '@/src/shared/lib/supabase/server'
import { PostCard } from '@/src/entities/post/ui/PostCard'
import { Button } from '@/src/shared/ui/button'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'

// 홈페이지용 게시글 인터페이스 정의
interface HomePost {
  id: string
  title: string
  thumbnail_url: string | null
  category: string
  created_at: string
  author: {
    username: string
  } | null
  _count: {
    post_likes: number
    comments: number
  }
}

// Supabase로부터 반환되는 원시 데이터의 타입 정의
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

export default async function HomePage() {
  const supabase = await createClient()

  // 게시물 목록을 작성자 정보, 좋아요 수, 댓글 수와 함께 가져옵니다.
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
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Fetch posts error:', error)
  }

  // Supabase의 데이터 타입을 RawPost[]로 안전하게 단언합니다.
  const rawPosts = (data as unknown as RawPost[]) || []

  // 원시 데이터를 HomePost 형식으로 매핑합니다.
  const typedPosts: HomePost[] = rawPosts.map((post) => ({
    id: post.id,
    title: post.title,
    thumbnail_url: post.thumbnail_url,
    category: post.category,
    created_at: post.created_at,
    author: post.author,
    _count: {
      post_likes: post.post_likes?.[0]?.count ?? 0,
      comments: post.comments?.[0]?.count ?? 0,
    },
  }))

  return (
    <div className="flex flex-col min-h-full">
      {/* 헤더는 루트 레이아웃에서 처리됨 */}
      
      <main className="flex-1 px-4 py-6">
        {typedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground mb-4">아직 자랑이 없어요. 첫 번째로 자랑해보세요!</p>
            <Button variant="default" size="lg" render={<Link href="/write" />} nativeButton={false}>
              <PlusCircle className="mr-2 h-4 w-4" />
              자랑하기
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {typedPosts.map((post) => (
              <PostCard key={post.id} post={{
                ...post,
                author: post.author || { username: '알 수 없음' }
              }} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
