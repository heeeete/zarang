import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Storage에 파일을 업로드하고 공용 URL을 반환합니다.
 */
export const uploadFile = async (
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  file: Blob | File
) => {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw new Error(`업로드 실패: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
};
