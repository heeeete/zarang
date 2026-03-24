import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/shared/lib/supabase/server';
import { createAdminClient } from '@/src/shared/lib/supabase/admin';

interface ImageInput {
  image_url: string;
  storage_path: string;
  width: number;
  height: number;
  sort_order: number;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  try {
    const { id: postId, description, category_id, audio_url, audio_storage_path, images } = await request.json();
    if (!category_id || !images?.length) return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });

    const adminSupabase = createAdminClient();

    const { error: postError } = await adminSupabase.from('posts').insert({
      id: postId, author_id: user.id, description: description || null, category_id,
      audio_url, audio_storage_path, thumbnail_url: images[0].image_url
    });
    if (postError) throw postError;

    const imageRecords = images.map((img: ImageInput) => ({
      post_id: postId, image_url: img.image_url, storage_path: img.storage_path,
      width: img.width, height: img.height, sort_order: img.sort_order,
    }));

    const { error: imagesError } = await adminSupabase.from('post_images').insert(imageRecords);
    if (imagesError) throw imagesError;

    return NextResponse.json({ id: postId });
  } catch (error) {
    console.error('Post creation error:', error);
    return NextResponse.json({ error: '게시글 작성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
