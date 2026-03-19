import { PostFormInput } from '../model/schema';

/**
 * 게시글을 생성합니다.
 */
export const createPost = async (
  data: PostFormInput,
  imageFiles: File[],
  audioFile: Blob | File | null,
) => {
  const formData = new FormData();
  formData.append('title', data.title || '');
  formData.append('description', data.description || '');
  formData.append('category_id', data.category_id);
  
  if (audioFile) {
    // 실제 파일 이름과 타입을 유지하여 모바일/PC 호환성 해결
    const fileName = (audioFile as File).name || 'recording.webm';
    formData.append('audio', audioFile, fileName);
  }

  imageFiles.forEach((file) => {
    formData.append('images', file);
  });

  const response = await fetch('/api/posts', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || '게시글을 작성하지 못했어요.');
  }

  return response.json() as Promise<{ id: string }>;
};

/**
 * 게시글을 수정합니다.
 */
export const updatePost = async (
  postId: string,
  data: PostFormInput,
  imageOptions: {
    deletedImageIds: string[];
    remainingImageIds: string[];
    newImageFiles: File[];
  },
  audioOptions: {
    deleteExistingAudio: boolean;
    newAudioFile: Blob | File | null;
  }
) => {
  const formData = new FormData();
  formData.append('title', data.title || '');
  formData.append('description', data.description || '');
  formData.append('category_id', data.category_id);

  // 이미지 관리
  formData.append('deletedImageIds', JSON.stringify(imageOptions.deletedImageIds));
  formData.append('remainingImageIds', JSON.stringify(imageOptions.remainingImageIds));
  imageOptions.newImageFiles.forEach((file) => formData.append('newImages', file));

  // 오디오 관리
  formData.append('deleteAudio', audioOptions.deleteExistingAudio.toString());
  if (audioOptions.newAudioFile) {
    const fileName = (audioOptions.newAudioFile as File).name || 'recording.webm';
    formData.append('audio', audioOptions.newAudioFile, fileName);
  }

  const response = await fetch(`/api/posts/${postId}`, {
    method: 'PATCH',
    body: formData,
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || '수정 내용을 저장하지 못했어요.');
  }

  return response.json();
};
