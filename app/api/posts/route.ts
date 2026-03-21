import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/shared/lib/supabase/server'
import { createAdminClient } from '@/src/shared/lib/supabase/admin'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const description = formData.get('description') as string | null
    const category_id = formData.get('category_id') as string
    const images = formData.getAll('images') as File[]
    const audioFile = formData.get('audio') as File | null

    if (!category_id || images.length === 0) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    const postId = uuidv4()

    // 1. Audio Upload
    let audioUrl = null
    let audioStoragePath = null
    if (audioFile) {
      const fileExt = audioFile.name.split('.').pop() || 'wav'
      const fileName = `audio_${Date.now()}_${uuidv4()}.${fileExt}`
      audioStoragePath = `post-audios/${user.id}/${postId}/${fileName}`
      const { error: audioError } = await adminSupabase.storage
        .from('post-images')
        .upload(audioStoragePath, audioFile, { contentType: audioFile.type, upsert: false })
      if (audioError) throw audioError
      const { data: { publicUrl } } = adminSupabase.storage.from('post-images').getPublicUrl(audioStoragePath)
      audioUrl = publicUrl
    }

    // 2. Create Post
    const { error: postError } = await adminSupabase
      .from('posts')
      .insert({
        id: postId,
        author_id: user.id,
        description: description || null,
        category_id,
        audio_url: audioUrl,
        audio_storage_path: audioStoragePath,
      })
      .select()
      .single()

    if (postError) throw postError

    // 3. Process and Upload Images
    const uploadedImages = []
    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      
      // GIF 파일 업로드 차단
      if (image.type === 'image/gif' || image.name.toLowerCase().endsWith('.gif')) {
        return NextResponse.json({ error: 'GIF 파일은 업로드할 수 없습니다.' }, { status: 400 })
      }

      const rawBuffer = Buffer.from(await image.arrayBuffer())
      
      /**
       * 중요: sharp().rotate()는 EXIF 방향 정보를 읽어 이미지를 실제로 회전시킵니다.
       * .webp()를 통해 이미지를 WebP 형식으로 변환합니다.
       */
      const processedImage = sharp(rawBuffer).rotate().webp({ quality: 80 })
      const processedBuffer = await processedImage.toBuffer()
      const metadata = await sharp(processedBuffer).metadata()

      const width = metadata.width || null
      const height = metadata.height || null

      // 확장자를 webp로 고정합니다.
      const fileName = `${i}_${uuidv4()}.webp`
      const storagePath = `post-images/${user.id}/${postId}/${fileName}`

      // 가공된(회전 및 WebP 변환된) 버퍼를 업로드합니다.
      const { error: storageError } = await adminSupabase.storage
        .from('post-images')
        .upload(storagePath, processedBuffer, {
          contentType: 'image/webp',
          upsert: false,
        })

      if (storageError) throw storageError

      const { data: { publicUrl } } = adminSupabase.storage
        .from('post-images')
        .getPublicUrl(storagePath)

      const { error: imageInsertError } = await adminSupabase
        .from('post_images')
        .insert({
          post_id: postId,
          image_url: publicUrl,
          storage_path: storagePath,
          sort_order: i,
          width,
          height,
        })

      if (imageInsertError) throw imageInsertError
      uploadedImages.push(publicUrl)
    }

    // 4. Update Thumbnail
    await adminSupabase
      .from('posts')
      .update({ thumbnail_url: uploadedImages[0] })
      .eq('id', postId)

    return NextResponse.json({ id: postId })
  } catch (error) {
    console.error('Post creation error:', error)
    const errorMessage = error instanceof Error ? error.message : '게시글 작성 중 오류가 발생했습니다.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
