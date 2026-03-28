import { v4 as uuidv4 } from 'uuid';
import { createClient as createBrowserClient } from '@/src/shared/lib/supabase/client';
import { processImage } from '@/src/shared/lib/image';
import { uploadFile } from '@/src/shared/lib/supabase/storage';
import { PostFormInput } from '@/src/entities/post/model/schema';

/**
 * [FEATURE] 게시글 작성 (병렬 업로드 및 API 호출 최적화)
 */
export const createPost = async (data: PostFormInput, imageFiles: File[], audioFile: Blob | File | null) => {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const postId = uuidv4();

  // 1. 이미지 가공 및 업로드 병렬 처리 ⚡
  const imageUploadPromises = imageFiles.map(async (file, index) => {
    // 이미지 회전 교정 및 최적화 가공
    const { blob, width, height } = await processImage(file);
    
    // 스토리지 업로드 (.jpg로 통일)
    const path = `post-images/${user.id}/${postId}/${index}_${uuidv4()}.jpg`;
    const publicUrl = await uploadFile(supabase, 'post-images', path, blob);
    
    return {
      image_url: publicUrl,
      storage_path: path,
      width,
      height,
      sort_order: index,
    };
  });

  // 2. 오디오 업로드 처리 (있을 경우)
  let audioPromise: Promise<{ url: string; path: string } | null> = Promise.resolve(null);
  if (audioFile) {
    const path = `post-audios/${user.id}/${postId}/${Date.now()}_${uuidv4()}.webm`;
    audioPromise = uploadFile(supabase, 'post-images', path, audioFile).then((url) => ({
      url,
      path,
    }));
  }

  // 3. 모든 파일 업로드 완료 대기
  const [uploadedImages, audioInfo] = await Promise.all([
    Promise.all(imageUploadPromises),
    audioPromise
  ]);

  // 4. 게시글 생성 API 호출
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
