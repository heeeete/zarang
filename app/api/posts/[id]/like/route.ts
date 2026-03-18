import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/shared/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  try {
    // Check if already liked
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select()
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single()

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError
      
      const { count } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)

      return NextResponse.json({ liked: false, likeCount: count || 0 })
    } else {
      // Like
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        })

      if (insertError) throw insertError

      const { count } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)

      return NextResponse.json({ liked: true, likeCount: count || 0 })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 에러가 발생했습니다.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
