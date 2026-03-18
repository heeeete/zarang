import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/shared/lib/supabase/server'
import { createAdminClient } from '@/src/shared/lib/supabase/admin'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

/**
 * 게시글 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
  }

  return NextResponse.json(data)
}

/**
 * 게시글 수정 (이미지 포함)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    
    // Parse image management data
    const deletedImageIds = JSON.parse(formData.get('deletedImageIds') as string || '[]') as string[]
    const remainingImageIds = JSON.parse(formData.get('remainingImageIds') as string || '[]') as string[]
    const newImages = formData.getAll('newImages') as File[]

    // 1. Ownership Check
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', id)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (post.author_id !== user.id) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
    }

    const adminSupabase = createAdminClient()

    // 2. Delete images from Storage and DB
    if (deletedImageIds.length > 0) {
      // Get storage paths first
      const { data: imagesToDelete } = await adminSupabase
        .from('post_images')
        .select('storage_path')
        .in('id', deletedImageIds)

      if (imagesToDelete && imagesToDelete.length > 0) {
        const paths = imagesToDelete.map(img => img.storage_path)
        await adminSupabase.storage.from('post-images').remove(paths)
      }

      const { error: deleteError } = await adminSupabase
        .from('post_images')
        .delete()
        .in('id', deletedImageIds)

      if (deleteError) throw deleteError
    }

    // 3. Upload New Images
    for (let i = 0; i < newImages.length; i++) {
      const image = newImages[i]
      const buffer = Buffer.from(await image.arrayBuffer())
      
      // sharp로 이미지 메타데이터 추출
      const metadata = await sharp(buffer).metadata()
      const width = metadata.width || null
      const height = metadata.height || null

      const fileExt = image.name.split('.').pop()
      const fileName = `${Date.now()}_${uuidv4()}.${fileExt}`
      const storagePath = `post-images/${user.id}/${id}/${fileName}`

      const { error: storageError } = await adminSupabase.storage
        .from('post-images')
        .upload(storagePath, buffer, {
          contentType: image.type,
          upsert: false,
        })

      if (storageError) throw storageError

      const { data: { publicUrl } } = adminSupabase.storage
        .from('post-images')
        .getPublicUrl(storagePath)

      const { error: imageInsertError } = await adminSupabase
        .from('post_images')
        .insert({
          post_id: id,
          image_url: publicUrl,
          storage_path: storagePath,
          sort_order: 999,
          width,
          height,
        })

      if (imageInsertError) throw imageInsertError
    }

    // 4. Update image sort_order
    for (let i = 0; i < remainingImageIds.length; i++) {
      await adminSupabase
        .from('post_images')
        .update({ sort_order: i })
        .eq('id', remainingImageIds[i])
    }

    // 5. Update Post Thumbnail
    const { data: allImages } = await adminSupabase
      .from('post_images')
      .select('image_url')
      .eq('post_id', id)
      .order('sort_order', { ascending: true })
      .limit(1)

    const newThumbnailUrl = allImages?.[0]?.image_url || null

    // 6. Final Post Update
    const { error: updateError } = await adminSupabase
      .from('posts')
      .update({
        title,
        description,
        category,
        thumbnail_url: newThumbnailUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Post update error:', error)
    return NextResponse.json({ error: '게시글 수정 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

/**
 * 게시글 완전 삭제 (Hard Delete)
 * 연관된 이미지 파일(Storage), 댓글, 좋아요, 이미지 정보가 모두 삭제됩니다.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  try {
    // 1. Ownership 및 이미지 경로 확인
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select(`
        author_id,
        images:post_images(storage_path)
      `)
      .eq('id', id)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (post.author_id !== user.id) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    }

    const adminSupabase = createAdminClient()

    // 2. Storage에서 이미지 파일들 삭제
    if (post.images && post.images.length > 0) {
      const storagePaths = post.images.map(img => img.storage_path)
      const { error: storageDeleteError } = await adminSupabase.storage
        .from('post-images')
        .remove(storagePaths)
      
      if (storageDeleteError) {
        console.error('Storage delete error:', storageDeleteError)
        // 파일 삭제 실패는 로그만 남기고 DB 삭제는 계속 진행합니다.
      }
    }

    // 3. DB에서 게시글 삭제
    // CASCADE 설정 덕분에 연관된 댓글, 좋아요, 이미지 레코드도 자동 삭제됩니다.
    const { error: deleteError } = await adminSupabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Post delete error:', error)
    const errorMessage = error instanceof Error ? error.message : '게시글을 삭제하지 못했어요.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
