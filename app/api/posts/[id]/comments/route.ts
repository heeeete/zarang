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
    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '댓글 내용을 입력해주세요.' }, { status: 400 })
    }

    const { data: comment, error: insertError } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        content,
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ id: comment.id })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 에러가 발생했습니다.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
