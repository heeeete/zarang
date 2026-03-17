'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ImageIcon, XCircleIcon, Loader2Icon } from 'lucide-react';
import { Button } from '@/src/shared/ui/button';
import { Input } from '@/src/shared/ui/input';
import { Textarea } from '@/src/shared/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/shared/ui/select';
import { Field, FieldLabel, FieldError, FieldGroup, FieldContent } from '@/src/shared/ui/field';
import { createPostSchema, CATEGORIES, type CreatePostInput } from '../model/schema';

export const PostCreateForm = () => {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: '',
      description: '',
      images: [],
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 10) {
      alert('사진은 최대 10장까지 업로드할 수 있습니다.');
      return;
    }

    const newImages = [...images, ...files].slice(0, 10);
    setImages(newImages);
    setValue('images', newImages, { shouldValidate: true });

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews].slice(0, 10));
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviews(newPreviews);
    setValue('images', newImages, { shouldValidate: true });
    URL.revokeObjectURL(previews[index]);
  };

  const onSubmit = async (data: CreatePostInput) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('category', data.category);
      images.forEach((image) => {
        formData.append('images', image);
      });

      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || '게시글 작성에 실패했습니다.');
      }

      const { id } = await response.json();
      router.push(`/posts/${id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '게시글 작성에 실패했습니다.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-4">
      <FieldGroup>
        {/* Image Upload Area */}
        <Field>
          <FieldLabel>사진 ({images.length}/10)</FieldLabel>
          <FieldContent>
            <div className="grid grid-cols-3 gap-2">
              {previews.map((preview, index) => (
                <div
                  key={index}
                  className="relative aspect-square overflow-hidden rounded-lg border"
                >
                  <Image
                    src={preview}
                    alt={`preview-${index}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 z-10 rounded-full bg-black/50 text-white"
                  >
                    <XCircleIcon className="size-5" />
                  </button>
                  {index === 0 && (
                    <div className="absolute right-0 bottom-0 left-0 z-10 bg-primary/80 py-0.5 text-center text-[10px] text-white">
                      대표 사진
                    </div>
                  )}
                </div>
              ))}
              {images.length < 10 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted transition-colors hover:border-primary">
                  <ImageIcon className="size-8 text-muted-foreground" />
                  <span className="mt-1 text-[10px] text-muted-foreground">사진 추가</span>
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
          </FieldContent>
          {errors.images && <FieldError>{errors.images.message}</FieldError>}
        </Field>

        {/* Category */}
        <Field>
          <FieldLabel>카테고리</FieldLabel>
          <Select
            onValueChange={(value) =>
              setValue('category', value as CreatePostInput['category'], { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="카테고리를 선택해주세요" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            className="min-h-[150px] resize-none"
          />
          {errors.description && <FieldError>{errors.description.message}</FieldError>}
        </Field>
      </FieldGroup>

      <Button type="submit" size="lg" disabled={isSubmitting} className="mt-4 w-full">
        {isSubmitting ? (
          <>
            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            업로드 중...
          </>
        ) : (
          '자랑하기'
        )}
      </Button>
    </form>
  );
};
