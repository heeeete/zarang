import { useState, useCallback } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { PostFormInput } from './schema';

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

  const addImages = useCallback((files: File[]) => {
    if (imageItems.length + files.length > 10) {
      toast.error('사진은 최대 10장까지 올릴 수 있어요.');
      return;
    }

    const newItems: PostImageItem[] = files.map((file) => ({
      id: uuidv4(),
      url: URL.createObjectURL(file),
      file,
      type: 'new',
    }));

    const updated = [...imageItems, ...newItems].slice(0, 10);
    setImageItems(updated);
    syncWithForm(updated);
  }, [imageItems, syncWithForm]);

  const removeImage = useCallback((id: string) => {
    const target = imageItems.find((item) => item.id === id);
    if (!target) return;

    if (target.type === 'existing') {
      setDeletedImageIds((prev) => [...prev, id]);
    } else {
      URL.revokeObjectURL(target.url);
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
