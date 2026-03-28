import { v4 as uuidv4 } from 'uuid';
import { createClient as createBrowserClient } from '@/src/shared/lib/supabase/client';
import { processImage } from '@/src/shared/lib/image';
import { uploadFile } from '@/src/shared/lib/supabase/storage';
import { PostFormInput } from '@/src/entities/post/model/schema';

/**
 * [FEATURE] 게시글 작성 (병렬 업로드 및 오디오 타입 안정성 확보)
 */
export const createPost = async (data: PostFormInput, imageFiles: File[], audioFile: Blob | File | null) => {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const postId = uuidv4();

  // 1. 이미지 가공 및 업로드 병렬 처리
  const imageUploadPromises = imageFiles.map(async (file, index) => {
    const { blob, width, height } = await processImage(file);
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

  // 2. 오디오 업로드 처리
  // audioPromise의 타입을 명확히 정의하고, 업로드 시 contentType을 명시적으로 보정합니다.
  let audioPromise: Promise<{ url: string; path: string } | null> = Promise.resolve(null);
  
  if (audioFile) {
    const path = `post-audios/${user.id}/${postId}/${Date.now()}_${uuidv4()}.webm`;
    
    // Blob 타입의 경우 type이 없을 수 있으므로 audio/webm으로 강제 지정하여 브라우저 재생 호환성 확보
    const audioBlob = audioFile instanceof Blob ? audioFile : new Blob([audioFile], { type: 'audio/webm' });
    
    audioPromise = uploadFile(supabase, 'post-images', path, audioBlob).then((url) => ({
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
      audio_url: audioInfo ? audioInfo.url : null,
      audio_storage_path: audioInfo ? audioInfo.path : null,
      images: uploadedImages,
    }),
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || '게시글 작성을 완료하지 못했어요.');
  }
  
  return response.json() as Promise<{ id: string }>;
};
