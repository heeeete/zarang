import { createClient as createBrowserClient } from '@/src/shared/lib/supabase/client';
import { processImage } from '@/src/shared/lib/image';
import { uploadFile } from '@/src/shared/lib/supabase/storage';
import { PostFormInput } from '@/src/entities/post/model/schema';

/**
 * [FEATURE] 게시글 수정 (클라이언트 가공 후 직접 업로드 및 API 호출)
 */
export const updatePost = async (
  postId: string,
  data: PostFormInput,
  imageOptions: { deletedImageIds: string[]; remainingImageIds: string[]; newImageFiles: File[]; },
  audioOptions: { deleteExistingAudio: boolean; newAudioFile: Blob | File | null; }
) => {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const uploadedNewImages = [];
  for (const file of imageOptions.newImageFiles) {
    // 이미지 회전 교정 및 최적화 가공
    const { blob, width, height } = await processImage(file);
    
    // 스토리지 업로드 (.jpg로 통일)
    const path = `post-images/${user.id}/${postId}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const publicUrl = await uploadFile(supabase, 'post-images', path, blob);
    
    uploadedNewImages.push({ image_url: publicUrl, storage_path: path, width, height });
  }

  let newAudioInfo = null;
  if (audioOptions.newAudioFile) {
    const path = `post-audios/${user.id}/${postId}/${Date.now()}_${Math.random().toString(36).substring(7)}.webm`;
    const publicUrl = await uploadFile(supabase, 'post-images', path, audioOptions.newAudioFile);
    newAudioInfo = { url: publicUrl, path };
  }

  const response = await fetch(`/api/posts/${postId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: data.description,
      category_id: data.category_id,
      deletedImageIds: imageOptions.deletedImageIds,
      newImages: uploadedNewImages,
      deleteAudio: audioOptions.deleteExistingAudio,
      newAudio: newAudioInfo ? { audio_url: newAudioInfo.url, audio_storage_path: newAudioInfo.path } : null,
    }),
  });

  if (!response.ok) throw new Error((await response.json()).error || '수정 내용을 저장하지 못했어요.');
  return response.json();
};
