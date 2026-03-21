import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/shared/lib/supabase/server';
import { createAdminClient } from '@/src/shared/lib/supabase/admin';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
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
 * 게시글 수정 (이미지 및 오디오 포함)
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
    const formData = await request.formData();
    const description = formData.get('description') as string | null;
    const category_id = formData.get('category_id') as string;

    // 이미지 관리 데이터
    const deletedImageIds = JSON.parse(
      (formData.get('deletedImageIds') as string) || '[]',
    ) as string[];
    const remainingImageIds = JSON.parse(
      (formData.get('remainingImageIds') as string) || '[]',
    ) as string[];
    const newImages = formData.getAll('newImages') as File[];

    // 오디오 관리 데이터
    const deleteAudio = formData.get('deleteAudio') === 'true';
    const newAudioFile = formData.get('audio') as File | null;

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
    let newAudioUrl = undefined; // undefined면 업데이트 안함
    let newAudioStoragePath = undefined;

    // 기존 오디오 삭제 혹은 교체 시
    if (deleteAudio || newAudioFile) {
      if (post.audio_storage_path) {
        await adminSupabase.storage.from('post-images').remove([post.audio_storage_path]);
      }

      if (deleteAudio && !newAudioFile) {
        newAudioUrl = null;
        newAudioStoragePath = null;
      }
    }

    // 새 오디오 업로드
    if (newAudioFile) {
      const fileExt = newAudioFile.name.split('.').pop() || 'wav';
      const fileName = `audio_${Date.now()}_${uuidv4()}.${fileExt}`;
      newAudioStoragePath = `post-audios/${user.id}/${id}/${fileName}`;

      const { error: audioUploadError } = await adminSupabase.storage
        .from('post-images')
        .upload(newAudioStoragePath, newAudioFile, {
          contentType: newAudioFile.type,
          upsert: true,
        });

      if (audioUploadError) throw audioUploadError;

      const {
        data: { publicUrl },
      } = adminSupabase.storage.from('post-images').getPublicUrl(newAudioStoragePath);

      newAudioUrl = publicUrl;
    }

    // 3. Image Delete Logic
    if (deletedImageIds.length > 0) {
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

    // 4. Process and Upload New Images
    for (let i = 0; i < newImages.length; i++) {
      const image = newImages[i];

      // GIF 파일 업로드 차단
      if (image.type === 'image/gif' || image.name.toLowerCase().endsWith('.gif')) {
        return NextResponse.json({ error: 'GIF 파일은 업로드할 수 없습니다.' }, { status: 400 });
      }

      const rawBuffer = Buffer.from(await image.arrayBuffer());
      
      /**
       * 중요: sharp().rotate()는 EXIF 방향 정보를 읽어 이미지를 실제로 회전시킵니다.
       * .webp()를 통해 이미지를 WebP 형식으로 변환합니다.
       */
      const processedImage = sharp(rawBuffer).rotate().webp({ quality: 80 });
      const processedBuffer = await processedImage.toBuffer();
      const metadata = await sharp(processedBuffer).metadata();

      const width = metadata.width || null;
      const height = metadata.height || null;

      // 확장자를 webp로 고정합니다.
      const fileName = `${Date.now()}_${uuidv4()}.webp`;
      const storagePath = `post-images/${user.id}/${id}/${fileName}`;

      const { error: storageError } = await adminSupabase.storage
        .from('post-images')
        .upload(storagePath, processedBuffer, {
          contentType: 'image/webp',
          upsert: false,
        });

      if (storageError) throw storageError;

      const {
        data: { publicUrl },
      } = adminSupabase.storage.from('post-images').getPublicUrl(storagePath);

      await adminSupabase.from('post_images').insert({
        post_id: id,
        image_url: publicUrl,
        storage_path: storagePath,
        sort_order: 999,
        width,
        height,
      });
    }

    // 5. Update image sort_order
    for (let i = 0; i < remainingImageIds.length; i++) {
      await adminSupabase
        .from('post_images')
        .update({ sort_order: i })
        .eq('id', remainingImageIds[i]);
    }

    // 6. Update Post Thumbnail and Info
    const { data: allImages } = await adminSupabase
      .from('post_images')
      .select('image_url')
      .eq('post_id', id)
      .order('sort_order', { ascending: true })
      .limit(1);

    const newThumbnailUrl = allImages?.[0]?.image_url || null;

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
      thumbnail_url: newThumbnailUrl,
      updated_at: new Date().toISOString(),
    };

    // 오디오 정보가 변경된 경우에만 포함
    if (newAudioUrl !== undefined) updateData.audio_url = newAudioUrl;
    if (newAudioStoragePath !== undefined) updateData.audio_storage_path = newAudioStoragePath;

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
