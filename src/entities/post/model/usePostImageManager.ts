import { useState, useCallback } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { PostFormInput } from './schema';
import { createThumbnail } from '@/src/shared/lib/utils/image-processing';

export interface PostImageItem {
  id: string;
  url: string;
  file?: File;
  type: 'existing' | 'new';
}

/**
 * 게시글의 이미지 업로드, 삭제, 순서 변경을 관리하는 훅입니다.
 */
export const usePostImageManager = (
  initialImages: PostImageItem[] = [],
  setValue: UseFormSetValue<PostFormInput>
) => {
  const [imageItems, setImageItems] = useState<PostImageItem[]>(initialImages);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);

  const syncWithForm = useCallback((items: PostImageItem[]) => {
    // 폼 검증을 위해 RHF의 images 필드와 동기화
    setValue('images', items as unknown as PostFormInput['images'], { shouldValidate: true });
  }, [setValue]);

  const addImages = useCallback(async (files: File[]) => {
    if (imageItems.length + files.length > 10) {
      toast.error('사진은 최대 10장까지 올릴 수 있어요.');
      return;
    }

    const loadToast = toast.loading('이미지를 최적화하고 있어요...');

    try {
      // 대용량 이미지를 위해 병렬로 썸네일 생성
      const newItems: PostImageItem[] = await Promise.all(
        files.map(async (file) => {
          // 미리보기용은 300px 정도로 리사이징된 썸네일 사용
          const thumbnailBoxUrl = await createThumbnail(file, 300);
          return {
            id: uuidv4(),
            url: thumbnailBoxUrl,
            file, // 원본 파일은 업로드용으로 유지
            type: 'new',
          };
        })
      );

      const updated = [...imageItems, ...newItems].slice(0, 10);
      setImageItems(updated);
      syncWithForm(updated);
      toast.dismiss(loadToast);
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      toast.error('이미지를 처리하지 못했어요.');
      toast.dismiss(loadToast);
    }
  }, [imageItems, syncWithForm]);

  const removeImage = useCallback((id: string) => {
    const target = imageItems.find((item) => item.id === id);
    if (!target) return;

    if (target.type === 'existing') {
      setDeletedImageIds((prev) => [...prev, id]);
    }

    const updated = imageItems.filter((item) => item.id !== id);
    setImageItems(updated);
    syncWithForm(updated);
  }, [imageItems, syncWithForm]);

  const reorderImages = useCallback((activeId: string, overId: string) => {
    setImageItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === activeId);
      const newIndex = prev.findIndex((i) => i.id === overId);
      const updated = arrayMove(prev, oldIndex, newIndex);
      syncWithForm(updated);
      return updated;
    });
  }, [syncWithForm]);

  return {
    imageItems,
    deletedImageIds,
    addImages,
    removeImage,
    reorderImages,
  };
};
