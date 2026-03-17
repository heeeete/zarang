import { createClient } from '@/src/shared/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { LogoutButton } from '@/src/features/auth/ui/LogoutButton'
import { PostCard } from '@/src/entities/post/ui/PostCard'

interface MePost {
  id: string
  title: string
  thumbnail_url: string | null
  category: string
  created_at: string
  author: {
    username: string
  } | null
}

export const MePage = async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch my posts
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      thumbnail_url,
      category,
      created_at,
      author:profiles(username)
    `)
    .eq('author_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const typedPosts = (posts as unknown as MePost[]) || []

  return (
    <div className="flex flex-col min-h-full pb-10">
      {/* Profile Section */}
      <div className="flex flex-col items-center p-8 border-b bg-neutral-50/50 gap-4">
        <div className="relative h-20 w-20 rounded-full bg-muted overflow-hidden border-2 border-white shadow-sm">
          {profile?.avatar_url && (
            <Image
              src={profile.avatar_url}
              alt={profile.username || 'profile'}
              fill
              className="object-cover"
            />
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-xl font-bold">{profile?.username}</h1>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <LogoutButton />
      </div>

      {/* My Posts Section */}
      <div className="p-4 flex flex-col gap-4">
        <h2 className="font-bold">내 자랑 {typedPosts.length}</h2>
        {typedPosts.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">아직 올린 자랑이 없어요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
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
