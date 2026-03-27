import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/src/shared/lib/supabase/server';
import { createAdminClient } from '@/src/shared/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

interface NewImageInput {
  tempId: string;
  image_url: string;
  storage_path: string;
  width: number;
  height: number;
}

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
  if (error || !data)
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  try {
    const {
      description,
      category_id,
      deletedImageIds,
      newImages,
      imageOrder,
      deleteAudio,
      newAudio,
    } = await request.json();
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('author_id, audio_storage_path')
      .eq('id', id)
      .single();
    if (fetchError || !post)
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
    if (post.author_id !== user.id)
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 });

    const adminSupabase = createAdminClient();

    // Audio Update
    let finalAudioUrl = undefined,
      finalAudioPath = undefined;
    if (deleteAudio || newAudio) {
      if (post.audio_storage_path)
        await adminSupabase.storage.from('post-images').remove([post.audio_storage_path]);
      if (deleteAudio && !newAudio) {
        finalAudioUrl = null;
        finalAudioPath = null;
      }
    }
    if (newAudio) {
      finalAudioUrl = newAudio.audio_url;
      finalAudioPath = newAudio.audio_storage_path;
    }

    // Image Deletion
    if (deletedImageIds?.length) {
      const { data: toDelete } = await adminSupabase
        .from('post_images')
        .select('storage_path')
        .in('id', deletedImageIds);
      if (toDelete?.length)
        await adminSupabase.storage
          .from('post-images')
          .remove(toDelete.map((img) => img.storage_path));
      await adminSupabase.from('post_images').delete().in('id', deletedImageIds);
    }

    // Image Insertion
    const tempIdToRealId: Record<string, string> = {};
    if (newImages?.length) {
      const { data: insertedImages } = await adminSupabase
        .from('post_images')
        .insert(
          newImages.map((img: NewImageInput) => ({
            post_id: id,
            image_url: img.image_url,
            storage_path: img.storage_path,
            width: img.width,
            height: img.height,
            sort_order: 999,
          })),
        )
        .select('id, storage_path');

      if (insertedImages) {
        insertedImages.forEach((img) => {
          const clientImg = newImages.find((ni: NewImageInput) => ni.storage_path === img.storage_path);
          if (clientImg) {
            tempIdToRealId[clientImg.tempId] = img.id;
          }
        });
      }
    }

    // Re-order Images based on client request
    if (imageOrder?.length) {
      for (let i = 0; i < imageOrder.length; i++) {
        const item = imageOrder[i];
        const realId = item.type === 'existing' ? item.id : tempIdToRealId[item.id];
        if (realId) {
          await adminSupabase.from('post_images').update({ sort_order: i }).eq('id', realId);
        }
      }
    } else {
      // Fallback: 기존 방식 (순서 정보가 없는 경우)
      const { data: allImages } = await adminSupabase
        .from('post_images')
        .select('id')
        .eq('post_id', id)
        .order('sort_order', { ascending: true });
      if (allImages) {
        for (let i = 0; i < allImages.length; i++) {
          await adminSupabase
            .from('post_images')
            .update({ sort_order: i })
            .eq('id', allImages[i].id);
        }
      }
    }

    // Update Post Info
    const { data: firstImage } = await adminSupabase
      .from('post_images')
      .select('image_url')
      .eq('post_id', id)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle();

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
      thumbnail_url: firstImage?.image_url || null,
      updated_at: new Date().toISOString(),
    };
    if (finalAudioUrl !== undefined) updateData.audio_url = finalAudioUrl;
    if (finalAudioPath !== undefined) updateData.audio_storage_path = finalAudioPath;

    await adminSupabase.from('posts').update(updateData).eq('id', id);

    // 캐시 무효화 (ISR 페이지 갱신)
    revalidatePath(`/posts/${id}`);
    revalidatePath('/');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Post update error:', error);
    return NextResponse.json({ error: '게시글 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });

  try {
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('author_id, audio_storage_path, images:post_images(storage_path)')
      .eq('id', id)
      .single();
    if (fetchError || !post)
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
    if (post.author_id !== user.id)
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });

    const adminSupabase = createAdminClient();
    const toDelete = [...(post.images?.map((img) => img.storage_path) || [])];
    if (post.audio_storage_path) toDelete.push(post.audio_storage_path);
    if (toDelete.length) await adminSupabase.storage.from('post-images').remove(toDelete);

    await adminSupabase.from('posts').delete().eq('id', id);

    // 캐시 무효화 (ISR 페이지 갱신)
    revalidatePath(`/posts/${id}`);
    revalidatePath('/');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Post delete error:', error);
    return NextResponse.json({ error: '게시글 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
