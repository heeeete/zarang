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
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const images = formData.getAll('images') as File[]

    if (!title || !category || images.length === 0) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    // 1. Create Post
    const adminSupabase = createAdminClient()
    const { data: post, error: postError } = await adminSupabase
      .from('posts')
      .insert({
        author_id: user.id,
        title,
        description,
        category,
      })
      .select()
      .single()

    if (postError) throw postError

    // 2. Upload Images to Storage and Insert into post_images
    const uploadedImages = []
    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      const buffer = Buffer.from(await image.arrayBuffer())
      
      // sharp로 이미지 메타데이터(넓이, 높이) 추출
      const metadata = await sharp(buffer).metadata()
      const width = metadata.width || null
      const height = metadata.height || null

      const fileExt = image.name.split('.').pop()
      const fileName = `${i}_${uuidv4()}.${fileExt}`
      const storagePath = `post-images/${user.id}/${post.id}/${fileName}`

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
          post_id: post.id,
          image_url: publicUrl,
          storage_path: storagePath,
          sort_order: i,
          width,
          height,
        })
        .select()
        .single()

      if (imageInsertError) throw imageInsertError
      uploadedImages.push(publicUrl)
    }

    // 3. Update Post with Thumbnail (first image)
    const { error: updateError } = await adminSupabase
      .from('posts')
      .update({ thumbnail_url: uploadedImages[0] })
      .eq('id', post.id)

    if (updateError) throw updateError

    return NextResponse.json({ id: post.id })
  } catch (error) {
    console.error('Post creation error:', error)
    const errorMessage = error instanceof Error ? error.message : '게시글 작성 중 오류가 발생했습니다.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
