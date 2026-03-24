import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/shared/lib/supabase/server';
import { createAdminClient } from '@/src/shared/lib/supabase/admin';
import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * 게시글 상세 조회
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('posts')
    .select(
      'id, author_id, description, category_id, thumbnail_url, audio_url, created_at, updated_at',
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json(data);
}

/**
 * 게시글 수정 (JSON 기반)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      description, 
      category_id, 
      deletedImageIds, 
      newImages, 
      deleteAudio, 
      newAudio 
    } = body;

    // 1. Ownership 및 기존 정보 확인
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('author_id, audio_storage_path')
      .eq('id', id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (post.author_id !== user.id) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 });
    }

    const adminSupabase = createAdminClient();

    // 2. Audio Update Logic
    let finalAudioUrl = undefined;
    let finalAudioStoragePath = undefined;

    // 기존 오디오 삭제 혹은 교체 시 스토리지 파일 제거
    if (deleteAudio || newAudio) {
      if (post.audio_storage_path) {
        await adminSupabase.storage.from('post-images').remove([post.audio_storage_path]);
      }
      
      if (deleteAudio && !newAudio) {
        finalAudioUrl = null;
        finalAudioStoragePath = null;
      }
    }

    if (newAudio) {
      finalAudioUrl = newAudio.audio_url;
      finalAudioStoragePath = newAudio.audio_storage_path;
    }

    // 3. Image Delete Logic (스토리지 파일 및 DB 레코드 삭제)
    if (deletedImageIds && deletedImageIds.length > 0) {
      const { data: imagesToDelete } = await adminSupabase
        .from('post_images')
        .select('storage_path')
        .in('id', deletedImageIds);

      if (imagesToDelete && imagesToDelete.length > 0) {
        const paths = imagesToDelete.map((img) => img.storage_path);
        await adminSupabase.storage.from('post-images').remove(paths);
      }

      await adminSupabase.from('post_images').delete().in('id', deletedImageIds);
    }

    // 4. Insert New Images (클라이언트에서 이미 업로드된 정보)
    if (newImages && newImages.length > 0) {
      interface NewImageInput {
        image_url: string;
        storage_path: string;
        width: number;
        height: number;
      }

      const imageRecords = newImages.map((img: NewImageInput) => ({
        post_id: id,
        image_url: img.image_url,
        storage_path: img.storage_path,
        width: img.width,
        height: img.height,
        sort_order: 999, // 임시 순서
      }));

      await adminSupabase.from('post_images').insert(imageRecords);
    }

    // 5. Update image sort_order (전체 이미지 순서 재정렬)
    // 모든 이미지를 다시 조회하여 순서를 맞춥니다.
    const { data: allCurrentImages } = await adminSupabase
      .from('post_images')
      .select('id')
      .eq('post_id', id)
      .order('sort_order', { ascending: true });

    if (allCurrentImages) {
      for (let i = 0; i < allCurrentImages.length; i++) {
        await adminSupabase
          .from('post_images')
          .update({ sort_order: i })
          .eq('id', allCurrentImages[i].id);
      }
    }

    // 6. Update Post Thumbnail and Info
    const { data: firstImage } = await adminSupabase
      .from('post_images')
      .select('image_url')
      .eq('post_id', id)
      .order('sort_order', { ascending: true })
      .limit(1)
      .single();

    interface PostUpdateData {
      description: string | null;
      category_id: string;
      thumbnail_url: string | null;
      updated_at: string;
      audio_url?: string | null;
      audio_storage_path?: string | null;
    }

    const updateData: PostUpdateData = {
      description: description || null,
      category_id,
      thumbnail_url: (firstImage as { image_url: string } | null)?.image_url || null,
      updated_at: new Date().toISOString(),
    };

    if (finalAudioUrl !== undefined) updateData.audio_url = finalAudioUrl;
    if (finalAudioStoragePath !== undefined) updateData.audio_storage_path = finalAudioStoragePath;

    await adminSupabase.from('posts').update(updateData).eq('id', id);

    // 캐시 무효화
    revalidateTag(`post-${id}`, 'max');
    revalidatePath(`/posts/${id}`);
    revalidatePath('/');
    revalidatePath('/explore');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Post update error:', error);
    return NextResponse.json({ error: '게시글 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

/**
 * 게시글 완전 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select(`author_id, audio_storage_path, images:post_images(storage_path)`)
      .eq('id', id)
      .single();

    if (fetchError || !post)
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
    if (post.author_id !== user.id)
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });

    const adminSupabase = createAdminClient();
    const filesToDelete: string[] = [];
    if (post.images) post.images.forEach((img) => filesToDelete.push(img.storage_path));
    if (post.audio_storage_path) filesToDelete.push(post.audio_storage_path);

    if (filesToDelete.length > 0) {
      await adminSupabase.storage.from('post-images').remove(filesToDelete);
    }

    await adminSupabase.from('posts').delete().eq('id', id);

    // 캐시 무효화
    revalidateTag(`post-${id}`, 'max');
    revalidatePath(`/posts/${id}`);
    revalidatePath('/');
    revalidatePath('/explore');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Post delete error:', error);
    const errorMessage = error instanceof Error ? error.message : '게시글을 삭제하지 못했어요.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
