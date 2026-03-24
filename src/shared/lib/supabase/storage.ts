import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export interface StorageUploadResult {
  publicUrl: string;
  storagePath: string;
}

/**
 * Supabase Storage에 파일을 업로드하고 공용 URL을 반환합니다.
 */
export const uploadToStorage = async (
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  file: Blob | File,
  options: { contentType?: string } = {}
): Promise<StorageUploadResult> => {
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: options.contentType || file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`파일 업로드 중 오류가 발생했습니다: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);

  return { publicUrl, storagePath: path };
};

/**
 * 게시글용 이미지를 생성된 경로 규칙에 맞춰 업로드합니다.
 */
export const uploadPostImage = async (
  supabase: SupabaseClient,
  userId: string,
  postId: string,
  index: number,
  file: Blob | File,
  extension = 'webp'
): Promise<StorageUploadResult> => {
  const fileName = `${index}_${uuidv4()}.${extension}`;
  const path = `post-images/${userId}/${postId}/${fileName}`;
  
  return uploadToStorage(supabase, 'post-images', path, file, {
    contentType: file.type || `image/${extension}`,
  });
};
