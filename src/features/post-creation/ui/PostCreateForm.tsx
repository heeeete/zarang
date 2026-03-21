'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ImageIcon, Loader2Icon, ChevronDown } from 'lucide-react';
import { Button } from '@/src/shared/ui/button';
import { Textarea } from '@/src/shared/ui/textarea';
import { toast } from 'sonner';
import { CategoryDrawer } from '@/src/entities/post/ui/CategoryDrawer';
import { Field, FieldLabel, FieldError, FieldGroup, FieldContent } from '@/src/shared/ui/field';

// Entity Layer Imports
import {
  postFormSchema,
  type PostFormInput,
  type Category,
} from '@/src/entities/post/model/schema';
import { usePostImageManager } from '@/src/entities/post/model/usePostImageManager';
import { SortableImageItem } from '@/src/entities/post/ui/SortableImageItem';
import { VoiceRecorder } from '@/src/entities/post/ui/VoiceRecorder';
import { createPost } from '@/src/entities/post/api/post-api';

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

interface PostCreateFormProps {
  categories: Category[];
}

export const PostCreateForm = ({ categories }: PostCreateFormProps) => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PostFormInput>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      description: '',
      category_id: '' as PostFormInput['category_id'],
      images: [],
    },
  });

  const { imageItems, addImages, removeImage, reorderImages } = usePostImageManager([], setValue);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedCategoryId = watch('category_id');
  const isKeyboardCategory =
    categories.find((c) => c.id === selectedCategoryId)?.slug === 'keyboard';

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
      const imageFiles = imageItems.map((item) => item.file as File);
      const { id } = await createPost(data, imageFiles, audioBlob);

      toast.success('자랑거리를 성공적으로 등록했어요!');
      router.replace(`/posts/${id}`);
      
      // 페이지 이동이 완료될 때까지 onSubmit이 종료되지 않도록 하여 isSubmitting을 true로 유지합니다.
      await new Promise(() => {});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '게시글을 작성하지 못했어요.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-4">
      <FieldGroup>
        {/* Image Upload Area */}
        <Field>
          <FieldLabel className="sr-only">사진 ({imageItems.length}/10)</FieldLabel>
          <FieldContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-3 gap-2">
                <SortableContext
                  items={imageItems.map((item) => item.id)}
                  strategy={rectSortingStrategy}
                >
                  {imageItems.map((item, index) => (
                    <SortableImageItem
                      key={item.id}
                      item={item}
                      index={index}
                      onRemove={removeImage}
                    />
                  ))}
                </SortableContext>

                {imageItems.length < 10 && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-neutral-50 transition-colors hover:border-primary hover:bg-neutral-100">
                    <ImageIcon className="size-8 text-muted-foreground" />
                    <span className="mt-1 text-[10px] font-medium text-muted-foreground">
                      사진 추가 ({imageItems.length}/10)
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </DndContext>
          </FieldContent>
          {errors.images && <FieldError>{errors.images.message}</FieldError>}
        </Field>

        {/* Category */}
        <Field>
          <FieldLabel className="sr-only">카테고리</FieldLabel>
          <Controller
            name="category_id"
            control={control}
            render={({ field }) => (
              <CategoryDrawer
                categories={categories}
                selected={field.value}
                onSelect={(id) => field.onChange(id)}
                open={isCategoryOpen}
                onOpenChange={setIsCategoryOpen}
                showAllOption={false}
              >
                <Button
                  variant="outline"
                  className="h-12 w-full justify-between px-4 text-base font-medium text-neutral-700"
                  type="button"
                >
                  {field.value ? (
                    categories.find((cat) => cat.id === field.value)?.label
                  ) : (
                    <span className="text-muted-foreground">카테고리를 선택해주세요</span>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </CategoryDrawer>
            )}
          />
          {errors.category_id && <FieldError>{errors.category_id.message}</FieldError>}
        </Field>

        {/* Audio (ASMR) */}
        {isKeyboardCategory && (
          <Field>
            <FieldLabel className="sr-only">타건음 (ASMR)</FieldLabel>
            <FieldContent>
              <VoiceRecorder onRecordingComplete={setAudioBlob} />
            </FieldContent>
          </Field>
        )}

        {/* Description */}
        <Field>
          <FieldLabel className="sr-only">자랑거리 설명</FieldLabel>
          <Textarea
            {...register('description')}
            placeholder="취향 아이템에 대해 들려주세요"
            className="min-h-[180px] resize-none text-base"
          />
          {errors.description && <FieldError>{errors.description.message}</FieldError>}
        </Field>
      </FieldGroup>

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="mt-4 h-12 w-full text-base font-bold shadow-lg shadow-primary/20"
      >
        {isSubmitting ? (
          <>
            <Loader2Icon className="mr-2 h-5 w-5 animate-spin" />
            업로드 중...
          </>
        ) : (
          '자랑하기'
        )}
      </Button>
    </form>
  );
};
