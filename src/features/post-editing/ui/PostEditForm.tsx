'use client';

import { useState, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2Icon, ImageIcon, XCircleIcon, GripVertical } from 'lucide-react';
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
import { createPostSchema, CATEGORIES, type CreatePostInput } from '../../post-creation/model/schema';
import { v4 as uuidv4 } from 'uuid';

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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface EditableImageItem {
  id: string; // DB ID or UUID
  type: 'existing' | 'new';
  url: string;
  file?: File;
  storage_path?: string; // only for 'existing'
}

/**
 * 드래그 가능한 수정용 이미지 아이템 컴포넌트입니다.
 */
const SortableEditableImageItem = ({ 
  item, 
  index, 
  onRemove 
}: { 
  item: EditableImageItem; 
  index: number; 
  onRemove: (id: string) => void 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-square overflow-hidden rounded-lg border bg-white"
    >
      <Image
        src={item.url}
        alt={`preview-${index}`}
        fill
        className="object-cover"
        unoptimized
      />
      
      {/* Drag Handle */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-1 left-1 z-10 rounded-md bg-black/30 p-1 text-white cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </div>

      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="absolute top-1 right-1 z-10 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
      >
        <XCircleIcon className="size-5" />
      </button>
      
      {index === 0 && (
        <div className="absolute right-0 bottom-0 left-0 z-10 bg-primary/80 py-0.5 text-center text-[10px] text-white font-medium">
          대표 사진
        </div>
      )}
    </div>
  );
};

interface PostEditFormProps {
  post: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    images: Array<{
      id: string;
      image_url: string;
      storage_path: string;
    }>;
  };
}

/**
 * 게시글 수정을 위한 폼 컴포넌트입니다.
 * 이미지 수정(추가/삭제/순서변경) 기능을 포함합니다.
 */
export const PostEditForm = ({ post }: PostEditFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Combine all images into a single sorted list
  const [imageItems, setImageItems] = useState<EditableImageItem[]>(
    post.images.map(img => ({
      id: img.id,
      type: 'existing',
      url: img.image_url,
      storage_path: img.storage_path
    }))
  );
  
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const router = useRouter();

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: post.title,
      description: post.description || '',
      category: post.category as any,
      images: [{}], // Initial hack
    },
  });

  // Update validation whenever imageItems changes
  useEffect(() => {
    setValue('images', new Array(imageItems.length).fill({}), { shouldValidate: true });
  }, [imageItems, setValue]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (imageItems.length + files.length > 10) {
      toast.error('사진은 최대 10장까지 올릴 수 있어요.');
      return;
    }

    const newItems: EditableImageItem[] = files.map(file => ({
      id: uuidv4(),
      type: 'new',
      url: URL.createObjectURL(file),
      file
    }));

    setImageItems(prev => [...prev, ...newItems].slice(0, 10));
  };

  const removeImage = (id: string) => {
    const itemToRemove = imageItems.find(item => item.id === id);
    if (!itemToRemove) return;

    if (itemToRemove.type === 'existing') {
      setDeletedImageIds(prev => [...prev, id]);
    } else {
      URL.revokeObjectURL(itemToRemove.url);
    }

    setImageItems(prev => prev.filter(item => item.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setImageItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const onSubmit = async (data: CreatePostInput) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('category', data.category);
      
      // Filter image lists for backend
      const remainingExistingIds = imageItems
        .filter(item => item.type === 'existing')
        .map(item => item.id);
      
      const newFiles = imageItems
        .filter(item => item.type === 'new')
        .map(item => item.file as File);

      formData.append('deletedImageIds', JSON.stringify(deletedImageIds));
      formData.append('remainingImageIds', JSON.stringify(remainingExistingIds));

      newFiles.forEach((file) => {
        formData.append('newImages', file);
      });

      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || '수정 내용을 저장하지 못했어요.');
      }

      toast.success('수정 내용을 저장했어요.');
      router.push(`/posts/${post.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '수정 내용을 저장하지 못했어요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-4">
      <FieldGroup>
        {/* Image Upload Area */}
        <Field>
          <FieldLabel>사진 ({imageItems.length}/10)</FieldLabel>
          <FieldContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-3 gap-2">
                <SortableContext
                  items={imageItems.map(item => item.id)}
                  strategy={rectSortingStrategy}
                >
                  {imageItems.map((item, index) => (
                    <SortableEditableImageItem
                      key={item.id}
                      item={item}
                      index={index}
                      onRemove={removeImage}
                    />
                  ))}
                </SortableContext>

                {imageItems.length < 10 && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted transition-colors hover:border-primary bg-neutral-50 hover:bg-neutral-100">
                    <ImageIcon className="size-8 text-muted-foreground" />
                    <span className="mt-1 text-[10px] text-muted-foreground font-medium">사진 추가</span>
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
          <p className="mt-2 text-[11px] text-muted-foreground italic">
            * 사진을 드래그해서 순서를 바꿀 수 있어요. 첫 번째 사진이 대표 사진이 돼요.
          </p>
        </Field>

        {/* Category */}
        <Field>
          <FieldLabel>카테고리</FieldLabel>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리를 선택해주세요">
                    {CATEGORIES.find((cat) => cat.value === field.value)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && <FieldError>{errors.category.message}</FieldError>}
        </Field>

        {/* Title */}
        <Field>
          <FieldLabel>제목</FieldLabel>
          <Input {...register('title')} placeholder="제목을 입력하세요 (최대 60자)" />
          {errors.title && <FieldError>{errors.title.message}</FieldError>}
        </Field>

        {/* Description */}
        <Field>
          <FieldLabel>설명 (선택)</FieldLabel>
          <Textarea
            {...register('description')}
            placeholder="취향 아이템에 대해 들려주세요 (최대 500자)"
            className="min-h-[150px] resize-none text-sm"
          />
          {errors.description && <FieldError>{errors.description.message}</FieldError>}
        </Field>
      </FieldGroup>

      <div className="flex gap-3 mt-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1 h-12"
          onClick={() => router.back()}
        >
          취소
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting} className="flex-1 h-12 text-base font-bold shadow-lg shadow-primary/20">
          {isSubmitting ? (
            <>
              <Loader2Icon className="mr-2 h-5 w-5 animate-spin" />
              수정 중...
            </>
          ) : (
            '수정완료'
          )}
        </Button>
      </div>
    </form>
  );
};
