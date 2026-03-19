'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Loader2Icon, ImageIcon, Mic } from 'lucide-react';
import { Button } from '@/src/shared/ui/button';
import { Input } from '@/src/shared/ui/input';
import { Textarea } from '@/src/shared/ui/textarea';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/shared/ui/select';
import { Field, FieldLabel, FieldError, FieldGroup, FieldContent } from '@/src/shared/ui/field';

// Entity Layer Imports
import { postFormSchema, type PostFormInput, type Category } from '@/src/entities/post/model/schema';
import { usePostImageManager, PostImageItem } from '@/src/entities/post/model/usePostImageManager';
import { SortableImageItem } from '@/src/entities/post/ui/SortableImageItem';
import { VoiceRecorder } from '@/src/entities/post/ui/VoiceRecorder';
import { updatePost } from '@/src/entities/post/api/post-api';

// DnD Kit Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

interface PostEditFormProps {
  post: {
    id: string;
    title: string | null;
    description: string | null;
    category_id: string;
    audio_url?: string | null;
    images: Array<{
      id: string;
      image_url: string;
      storage_path: string;
    }>;
  };
  categories: Category[];
}

export const PostEditForm = ({ post, categories }: PostEditFormProps) => {
  const router = useRouter();

  // 초기 이미지 데이터 변환
  const initialImages: PostImageItem[] = post.images.map(img => ({
    id: img.id,
    url: img.image_url,
    type: 'existing'
  }));

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PostFormInput>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: post.title || '',
      description: post.description || '',
      category_id: post.category_id as PostFormInput['category_id'],
      images: new Array(initialImages.length).fill({}),
    },
  });

  const {
    imageItems,
    deletedImageIds,
    addImages,
    removeImage,
    reorderImages,
  } = usePostImageManager(initialImages, setValue);

  const [deleteExistingAudio, setDeleteExistingAudio] = useState(false);
  const [newAudioBlob, setNewAudioBlob] = useState<Blob | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedCategoryId = watch('category_id');
  const isKeyboardCategory = categories.find(c => c.id === selectedCategoryId)?.slug === 'keyboard';

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addImages(files);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderImages(active.id as string, over.id as string);
    }
  };

  const onSubmit = async (data: PostFormInput) => {
    try {
      const remainingExistingIds = imageItems
        .filter(item => item.type === 'existing')
        .map(item => item.id);
      
      const newImageFiles = imageItems
        .filter(item => item.type === 'new')
        .map(item => item.file as File);

      await updatePost(
        post.id,
        data,
        { deletedImageIds, remainingImageIds: remainingExistingIds, newImageFiles },
        { deleteExistingAudio, newAudioFile: newAudioBlob }
      );

      toast.success('수정 내용을 저장했어요.');
      router.push(`/posts/${post.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '수정 내용을 저장하지 못했어요.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-4">
      <FieldGroup>
        {/* Image Upload Area */}
        <Field>
          <FieldLabel>사진 ({imageItems.length}/10)</FieldLabel>
          <FieldContent>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-3 gap-2">
                <SortableContext items={imageItems.map(item => item.id)} strategy={rectSortingStrategy}>
                  {imageItems.map((item, index) => (
                    <SortableImageItem key={item.id} item={item} index={index} onRemove={removeImage} />
                  ))}
                </SortableContext>
                {imageItems.length < 10 && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted transition-colors hover:border-primary bg-neutral-50">
                    <ImageIcon className="size-8 text-muted-foreground" />
                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
            </DndContext>
          </FieldContent>
          {errors.images && <FieldError>{errors.images.message}</FieldError>}
        </Field>

        {/* Category */}
        <Field>
          <FieldLabel>카테고리</FieldLabel>
          <Controller
            name="category_id"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="카테고리를 선택해주세요">
                    {categories.find((cat) => cat.id === field.value)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category_id && <FieldError>{errors.category_id.message}</FieldError>}
        </Field>

        {/* Audio (ASMR) */}
        {isKeyboardCategory && (
          <Field>
            <FieldLabel>타건음 (ASMR)</FieldLabel>
            <FieldContent>
              <div className="flex flex-col gap-3">
                {post.audio_url && !deleteExistingAudio && !newAudioBlob && (
                  <div className="bg-neutral-50 rounded-xl p-3 border flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase">
                      <Mic className="size-3" /> Existing ASMR
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setDeleteExistingAudio(true)}
                      className="text-[10px] text-red-500 font-medium hover:underline"
                    >
                      삭제하기
                    </button>
                  </div>
                )}
                
                {(deleteExistingAudio || !post.audio_url || newAudioBlob) && (
                  <VoiceRecorder onRecordingComplete={setNewAudioBlob} />
                )}
                
                {deleteExistingAudio && !newAudioBlob && (
                  <p className="text-[10px] text-amber-600 font-medium px-1">
                    * 기존 녹음이 삭제될 예정이에요. 새로 녹음할 수도 있어요.
                  </p>
                )}
              </div>
            </FieldContent>
          </Field>
        )}

        {/* Title */}
        <Field>
          <FieldLabel>제목 (선택)</FieldLabel>
          <Input {...register('title')} placeholder="제목을 입력하세요" />
          {errors.title && <FieldError>{errors.title.message}</FieldError>}
        </Field>

        {/* Description */}
        <Field>
          <FieldLabel>설명 (선택)</FieldLabel>
          <Textarea {...register('description')} placeholder="아이템에 대해 들려주세요" className="min-h-[150px] resize-none text-sm" />
          {errors.description && <FieldError>{errors.description.message}</FieldError>}
        </Field>
      </FieldGroup>

      <div className="flex gap-3 mt-4">
        <Button type="button" variant="outline" size="lg" className="flex-1 h-12" onClick={() => router.back()}>취소</Button>
        <Button type="submit" size="lg" disabled={isSubmitting} className="flex-1 h-12 text-base font-bold shadow-lg shadow-primary/20">
          {isSubmitting ? <><Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> 저장 중...</> : '수정완료'}
        </Button>
      </div>
    </form>
  );
};
