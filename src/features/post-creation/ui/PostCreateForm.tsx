'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ImageIcon, XCircleIcon, Loader2Icon, GripVertical } from 'lucide-react';
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
import { createPostSchema, type CreatePostInput, type Category } from '../model/schema';
import { v4 as uuidv4 } from 'uuid';
import { VoiceRecorderTest } from './VoiceRecorderTest';

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

interface ImageItem {
  id: string;
  file: File;
  preview: string;
}

/**
 * 드래그 가능한 이미지 아이템 컴포넌트입니다.
 */
const SortableImageItem = ({ 
  item, 
  index, 
  onRemove 
}: { 
  item: ImageItem; 
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
        src={item.preview}
        alt={`preview-${index}`}
        fill
        className="object-cover transition-transform duration-500 hover:scale-105"
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

export const PostCreateForm = ({ categories }: { categories: Category[] }) => {
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: '',
      description: '',
      category_id: '' as CreatePostInput['category_id'],
      images: [],
    },
  });

  const selectedCategoryId = watch('category_id');
  const isKeyboardCategory = categories.find(c => c.id === selectedCategoryId)?.slug === 'keyboard';

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (imageItems.length + files.length > 10) {
      toast.error('사진은 최대 10장까지 올릴 수 있어요.');
      return;
    }

    const newItems: ImageItem[] = files.map(file => ({
      id: uuidv4(),
      file,
      preview: URL.createObjectURL(file)
    }));

    const updatedItems = [...imageItems, ...newItems].slice(0, 10);
    setImageItems(updatedItems);
    
    // Sync with React Hook Form
    setValue('images', updatedItems.map(item => item.file), { shouldValidate: true });
  };

  const removeImage = (id: string) => {
    const itemToRemove = imageItems.find(item => item.id === id);
    if (itemToRemove) {
      URL.revokeObjectURL(itemToRemove.preview);
    }
    
    const updatedItems = imageItems.filter((item) => item.id !== id);
    setImageItems(updatedItems);
    setValue('images', updatedItems.map(item => item.file), { shouldValidate: true });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setImageItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const updatedItems = arrayMove(items, oldIndex, newIndex);
        
        // Sync with React Hook Form after move
        setValue('images', updatedItems.map(item => item.file), { shouldValidate: true });
        
        return updatedItems;
      });
    }
  };

  const onSubmit = async (data: CreatePostInput) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title || '');
      formData.append('description', data.description || '');
      formData.append('category_id', data.category_id);
      
      // 음성 녹음 파일 추가
      if (audioBlob) {
        formData.append('audio', audioBlob, 'recording.wav');
      }

      // Use the sorted imageItems for submission
      imageItems.forEach((item) => {
        formData.append('images', item.file);
      });

      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || '게시글을 작성하지 못했어요.');
      }

      const { id } = await response.json();
      toast.success('자랑거리를 성공적으로 등록했어요!');
      router.push(`/posts/${id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '게시글을 작성하지 못했어요. 다시 시도해 주세요.';
      toast.error(errorMessage);
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
                    <SortableImageItem
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
            name="category_id"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리를 선택해주세요">
                    {categories.find((cat) => cat.id === field.value)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category_id && <FieldError>{errors.category_id.message}</FieldError>}
        </Field>

        {/* Audio (ASMR) - 키보드 카테고리일 때만 표시 */}
        {isKeyboardCategory && (
          <Field>
            <FieldLabel>타건음 (ASMR)</FieldLabel>
            <FieldContent>
              <VoiceRecorderTest onRecordingComplete={setAudioBlob} />
            </FieldContent>
          </Field>
        )}

        {/* Title */}
        <Field>
          <FieldLabel>제목 (선택)</FieldLabel>
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

      <Button type="submit" size="lg" disabled={isSubmitting} className="mt-4 w-full h-12 text-base font-bold shadow-lg shadow-primary/20">
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
