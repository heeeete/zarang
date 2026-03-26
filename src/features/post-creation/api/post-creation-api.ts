import { v4 as uuidv4 } from 'uuid';
import { createClient as createBrowserClient } from '@/src/shared/lib/supabase/client';
import { processImage } from '@/src/shared/lib/image';
import { uploadFile } from '@/src/shared/lib/supabase/storage';
import { PostFormInput } from '@/src/entities/post/model/schema';

/**
 * [FEATURE] 게시글 작성 (클라이언트 가공 후 직접 업로드 및 API 호출)
 */
export const createPost = async (data: PostFormInput, imageFiles: File[], audioFile: Blob | File | null) => {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const postId = uuidv4();
  const uploadedImages = [];

  for (let i = 0; i < imageFiles.length; i++) {
    // 이미지 회전 교정 및 최적화 가공
    const { blob, width, height } = await processImage(imageFiles[i]);
    
    // 스토리지 업로드 (.jpg로 통일)
    const path = `post-images/${user.id}/${postId}/${i}_${uuidv4()}.jpg`;
    const publicUrl = await uploadFile(supabase, 'post-images', path, blob);
    
    uploadedImages.push({ image_url: publicUrl, storage_path: path, width, height, sort_order: i });
  }

  let audioInfo = null;
  if (audioFile) {
    const path = `post-audios/${user.id}/${postId}/${Date.now()}_${uuidv4()}.webm`;
    const publicUrl = await uploadFile(supabase, 'post-images', path, audioFile);
    audioInfo = { url: publicUrl, path };
  }

  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: postId,
      description: data.description,
      category_id: data.category_id,
      audio_url: audioInfo?.url,
      audio_storage_path: audioInfo?.path,
      images: uploadedImages,
    }),
  });

  if (!response.ok) throw new Error((await response.json()).error || '게시글 작성을 완료하지 못했어요.');
  return response.json() as Promise<{ id: string }>;
};
