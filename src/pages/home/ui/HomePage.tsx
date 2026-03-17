import { createClient } from '@/src/shared/lib/supabase/server'
import { PostCard } from '@/src/entities/post/ui/PostCard'
import { Button } from '@/src/shared/ui/button'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'

interface HomePost {
  id: string
  title: string
  thumbnail_url: string | null
  category: string
  created_at: string
  author: {
    username: string
  } | null
}

export default async function HomePage() {
  const supabase = await createClient()

  // 게시글 목록을 작성자 정보와 함께 가져옵니다.
  // profiles와의 관계가 여러 개이므로 !posts_author_id_fkey를 명시합니다.
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      thumbnail_url,
      category,
      created_at,
      author:profiles!posts_author_id_fkey(username)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Fetch posts error:', error)
  }

  const typedPosts = (posts as unknown as HomePost[]) || []

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
