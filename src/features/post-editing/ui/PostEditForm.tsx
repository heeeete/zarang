'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ChevronDown, Check, ImageIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/src/shared/ui/button';
import { Textarea } from '@/src/shared/ui/textarea';
import { Field, FieldError } from '@/src/shared/ui/field';

import {
  postFormSchema,
  type PostFormInput,
  type Category,
} from '@/src/entities/post/model/schema';
import {
  usePostImageManager,
  type PostImageItem,
} from '@/src/entities/post/model/usePostImageManager';
import { SortableImageItem } from '@/src/entities/post/ui/SortableImageItem';
import { VoiceRecorder } from '@/src/entities/post/ui/VoiceRecorder';
import { CategoryDrawer } from '@/src/entities/post/ui/CategoryDrawer';
import { updatePost } from '../api/post-editing-api';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

interface PostEditFormProps {
  post: {
    id: string;
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

interface StepItemProps {
  label: string;
  active?: boolean;
  done?: boolean;
  required?: boolean;
}

interface SectionProps {
  title: string;
  required?: boolean;
  children: React.ReactNode;
}

const StepItem = ({ label, active, done, required }: StepItemProps) => {
  return (
    <div
      className={[
        'flex min-w-0 items-center gap-2 rounded-full border px-3 py-2 text-xs',
        done
          ? 'border-primary/20 bg-primary/5 text-foreground'
          : active
            ? 'border-foreground/15 bg-muted/50 text-foreground'
            : 'border-border bg-background text-muted-foreground',
      ].join(' ')}
    >
      <div
        className={[
          'flex size-5 shrink-0 items-center justify-center rounded-full',
          done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
        ].join(' ')}
      >
        {done ? <Check className="size-3" /> : <div className="size-1.5 rounded-full bg-current" />}
      </div>

      <span className="truncate font-medium">{label}</span>
      {required ? <span className="shrink-0 text-[10px] text-red-500">*</span> : null}
    </div>
  );
};

const Section = ({ title, required, children }: SectionProps) => {
  return (
    <section className="rounded-2xl border bg-background p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {required ? <span className="text-xs text-red-500">*</span> : null}
      </div>
      {children}
    </section>
  );
};

export const PostEditForm = ({ post, categories }: PostEditFormProps) => {
  const router = useRouter();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [deleteExistingAudio, setDeleteExistingAudio] = useState(false);
  const [newAudioBlob, setNewAudioBlob] = useState<Blob | null>(null);

  const initialImages: PostImageItem[] = post.images.map((img) => ({
    id: img.id,
    url: img.image_url,
    type: 'existing',
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
      description: post.description || '',
      category_id: post.category_id as PostFormInput['category_id'],
      images: new Array(initialImages.length).fill({}),
    },
  });

  const { imageItems, deletedImageIds, addImages, removeImage, reorderImages } =
    usePostImageManager(initialImages, setValue);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedCategoryId = watch('category_id');
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const isKeyboardCategory = selectedCategory?.slug === 'keyboard';

  const descriptionValue = watch('description');

  const imageDone = imageItems.length > 0;
  const categoryDone = Boolean(selectedCategoryId);
  const descriptionDone = Boolean(descriptionValue?.trim());

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
        .filter((item) => item.type === 'existing')
        .map((item) => item.id);

      const newImageFiles = imageItems
        .filter((item) => item.type === 'new')
        .map((item) => ({
          file: item.file as File,
          tempId: item.id,
        }));

      const imageOrder = imageItems.map((item) => ({
        id: item.id,
        type: item.type as 'existing' | 'new',
      }));

      await updatePost(
        post.id,
        data,
        {
          deletedImageIds,
          remainingImageIds: remainingExistingIds,
          newImageFiles,
          imageOrder,
        },
        {
          deleteExistingAudio,
          newAudioFile: newAudioBlob,
        },
      );

      router.back();

      setTimeout(() => {
        toast.success('수정 내용을 저장했어요.');
        router.refresh();
      }, 0);

      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '수정 내용을 저장하지 못했어요.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto flex w-full max-w-[420px] flex-col gap-4 px-4 py-4"
    >
      <div className="rounded-2xl border bg-background p-4">
        <div className="grid grid-cols-3 gap-2">
          <StepItem label="이미지" required active={!imageDone} done={imageDone} />
          <StepItem
            label="카테고리"
            required
            active={imageDone && !categoryDone}
            done={categoryDone}
          />
          <StepItem label="설명" active={imageDone && categoryDone} done={descriptionDone} />
        </div>
      </div>

      <Field>
        <Section title="이미지" required>
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
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 transition-colors hover:bg-muted/50">
                  <ImageIcon className="size-5 text-muted-foreground" />
                  <span className="mt-2 text-[11px] font-medium text-muted-foreground">
                    {imageItems.length}/10
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

          {errors.images ? <FieldError className="mt-2">{errors.images.message}</FieldError> : null}
        </Section>
      </Field>

      <Field>
        <Section title="카테고리" required>
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
                  type="button"
                  variant="outline"
                  className="h-12 w-full justify-between rounded-xl px-4 text-sm font-medium"
                >
                  <span className="truncate">
                    {field.value ? selectedCategory?.label : '카테고리 선택'}
                  </span>
                  <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </CategoryDrawer>
            )}
          />

          {errors.category_id ? (
            <FieldError className="mt-2">{errors.category_id.message}</FieldError>
          ) : null}
        </Section>
      </Field>

      {isKeyboardCategory ? (
        <Section title="타건음">
          <VoiceRecorder onRecordingComplete={setNewAudioBlob} />

          {post.audio_url && !newAudioBlob ? (
            <button
              type="button"
              onClick={() => setDeleteExistingAudio((prev) => !prev)}
              className="mt-3 text-xs text-muted-foreground underline underline-offset-4"
            >
              {deleteExistingAudio ? '기존 타건음 유지' : '기존 타건음 삭제'}
            </button>
          ) : null}
        </Section>
      ) : null}

      <Field>
        <Section title="설명">
          <Textarea
            {...register('description')}
            placeholder="설명을 입력해주세요"
            className="min-h-[140px] resize-none rounded-xl"
          />

          {errors.description ? (
            <FieldError className="mt-2">{errors.description.message}</FieldError>
          ) : null}
        </Section>
      </Field>

      <div className="sticky bottom-0 bg-background/95 pt-2 pb-1 backdrop-blur">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-12 flex-1 rounded-xl text-sm font-semibold"
            onClick={() => router.back()}
          >
            취소
          </Button>

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="h-12 flex-1 rounded-xl text-sm font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                저장 중
              </>
            ) : (
              '수정완료'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};
