import { createClient } from '@/src/shared/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { LogoutButton } from '@/src/features/auth/ui/LogoutButton'
import { ProfileEditButton } from '@/src/features/profile-management/ui/ProfileEditButton'
import { PostCard } from '@/src/entities/post/ui/PostCard'
import { getOptimizedImageUrl } from '@/src/shared/lib/utils'
import { User as UserIcon } from 'lucide-react'

interface RawMePost {
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

/**
 * 마이 페이지 컴포넌트입니다 (서버 컴포넌트).
 * 사용자의 프로필 정보와 본인이 작성한 게시글 목록을 표시합니다.
 */
export const MePage = async () => {
  const supabase = await createClient()
  
  // 현재 로그인한 사용자 정보를 가져옵니다.
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 사용자 프로필 정보를 가져옵니다.
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 사용자가 작성한 게시글 목록을 최신순으로 가져옵니다.
  const { data: posts } = await supabase
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
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  const typedPosts = (posts as unknown as RawMePost[])?.map(post => ({
    ...post,
    author: post.author || { username: '알 수 없음' },
    _count: {
      post_likes: post.post_likes?.[0]?.count ?? 0,
      comments: post.comments?.[0]?.count ?? 0,
    }
  })) || []

  return (
    <div className="flex flex-col min-h-full pb-10 bg-white">
      {/* 프로필 섹션: 아바타 리사이징 최적화 적용 */}
      <div className="flex flex-col items-center p-10 border-b bg-neutral-50/50 gap-5">
        <div className="relative h-24 w-24 rounded-full bg-muted overflow-hidden border-4 border-white shadow-md">
          {profile?.avatar_url ? (
            <Image
              src={getOptimizedImageUrl(profile.avatar_url, 192) || ''}
              alt={profile.username || 'profile'}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
              <UserIcon className="size-12" />
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <h1 className="text-2xl font-extrabold tracking-tight">{profile?.username}</h1>
          <p className="text-sm text-muted-foreground font-medium">{user.email}</p>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <ProfileEditButton />
          <LogoutButton />
        </div>
      </div>

      {/* 내가 작성한 자랑거리 목록 섹션 */}
      <div className="p-5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">내 자랑 <span className="text-primary ml-1">{typedPosts.length}</span></h2>
        </div>
        
        {typedPosts.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center gap-3">
            <div className="bg-muted p-4 rounded-full">
              <Image src="/favicon.ico" alt="icon" width={24} height={24} className="opacity-20 grayscale" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">아직 올린 자랑이 없어요. 당신의 멋진 아이템을 보여주세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {typedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={{
                  ...post,
                  author: post.author || { username: '알 수 없음' },
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
