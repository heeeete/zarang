import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/shared/lib/supabase/server';
import { createAdminClient } from '@/src/shared/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    // 이제 FormData 대신 JSON을 받습니다.
    const body = await request.json();
    const { 
      id: postId, 
      description, 
      category_id, 
      audio_url, 
      audio_storage_path, 
      images 
    } = body;

    if (!category_id || !images || images.length === 0) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // 1. Create Post
    const { error: postError } = await adminSupabase
      .from('posts')
      .insert({
        id: postId,
        author_id: user.id,
        description: description || null,
        category_id,
        audio_url,
        audio_storage_path,
        thumbnail_url: images[0].image_url, // 첫 번째 이미지를 썸네일로 설정
      });

    if (postError) throw postError;

    // 2. Insert Post Images
    // 클라이언트에서 이미 업로드하고 보낸 정보를 DB에 등록합니다.
    const imageRecords = images.map((img: any) => ({
      post_id: postId,
      image_url: img.image_url,
      storage_path: img.storage_path,
      width: img.width,
      height: img.height,
      sort_order: img.sort_order,
    }));

    const { error: imagesError } = await adminSupabase
      .from('post_images')
      .insert(imageRecords);

    if (imagesError) throw imagesError;

    return NextResponse.json({ id: postId });
  } catch (error) {
    console.error('Post creation error:', error);
    const errorMessage = error instanceof Error ? error.message : '게시글 작성 중 오류가 발생했습니다.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
