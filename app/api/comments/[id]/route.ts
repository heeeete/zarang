import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/shared/lib/supabase/server';
import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * 댓글 수정 (PATCH)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: commentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '댓글 내용을 입력해주세요.' }, { status: 400 });
    }

    // 작성자 본인인지 확인
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('author_id, post_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (comment.author_id !== user.id) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from('comments')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', commentId);

    if (updateError) throw updateError;

    // 캐시 무효화
    revalidateTag(`post-${comment.post_id}`, 'max');
    revalidatePath(`/posts/${comment.post_id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '댓글 수정 중 오류가 발생했습니다.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * 댓글 삭제 (DELETE)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: commentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    // 1. 댓글 정보 조회 (권한 확인용)
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('author_id, post_id, posts(author_id)')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 2. 권한 확인: 댓글 작성자 본인이거나, 게시글 작성자인 경우 삭제 가능
    const isCommentAuthor = comment.author_id === user.id;
    // @ts-expect-error - Supabase joining structure
    const isPostAuthor = comment.posts?.author_id === user.id;

    if (!isCommentAuthor && !isPostAuthor) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
    }

    // 3. 삭제 처리
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) throw deleteError;

    // 4. 캐시 무효화
    revalidateTag(`post-${comment.post_id}`, 'max');
    revalidatePath(`/posts/${comment.post_id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '댓글 삭제 중 오류가 발생했습니다.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
