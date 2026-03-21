'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Camera, Loader2, User } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/src/shared/ui/button';
import { Input } from '@/src/shared/ui/input';
import { Textarea } from '@/src/shared/ui/textarea';
import { Field, FieldLabel, FieldError, FieldGroup } from '@/src/shared/ui/field';
import { toast } from 'sonner';
import { getOptimizedImageUrl } from '@/src/shared/lib/utils';

const profileSchema = z.object({
  username: z
    .string()
    .min(2, '닉네임은 최소 2글자 이상이어야 해요.')
    .max(20, '닉네임은 최대 20글자까지 가능해요.')
    .regex(/^[a-zA-Z0-9가-힣_]+$/, '닉네임은 한글, 영문, 숫자, 언더바(_)만 사용할 수 있어요.'),
  bio: z.string().max(100, '소개글은 최대 100자까지 가능해요.').nullable(),
});

type ProfileInput = z.infer<typeof profileSchema>;

interface ProfileEditFormProps {
  profile: {
    id: string;
    username: string;
    avatar_url: string | null;
    bio?: string | null;
  };
}

/**
 * 프로필 수정을 위한 폼 컴포넌트입니다.
 * 닉네임과 프로필 이미지를 변경할 수 있어요.
 */
export const ProfileEditForm = ({ profile }: ProfileEditFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile.username,
      bio: profile.bio || '',
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('이미지 크기는 2MB를 넘을 수 없어요.');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProfileInput) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('username', data.username);
      if (data.bio !== null) {
        formData.append('bio', data.bio || '');
      }
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || '프로필을 수정하지 못했어요.');
      }

      toast.success('프로필을 수정했어요!');
      router.push('/me');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '문제가 생겼어요. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8 p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="group relative h-28 w-28 overflow-hidden rounded-full border-2 border-neutral-100 bg-muted shadow-inner">
            {avatarPreview ? (
              <Image
                src={
                  avatarPreview.startsWith('blob:')
                    ? avatarPreview
                    : getOptimizedImageUrl(avatarPreview, 200) || ''
                }
                alt="avatar preview"
                fill
                className="object-cover"
                unoptimized={avatarPreview.startsWith('blob:')}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
                <User className="size-10" />
              </div>
            )}
            <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="size-6 text-white" />
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>
          <label className="absolute right-0 bottom-0 cursor-pointer rounded-full bg-primary p-1.5 text-white shadow-md transition-transform hover:scale-110">
            <Camera className="size-4" />
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        </div>
        <p className="text-[11px] font-medium text-muted-foreground">
          사진을 눌러 프로필을 변경할 수 있어요
        </p>
      </div>

      <FieldGroup className="gap-6">
        <Field>
          <FieldLabel className="sr-only">닉네임</FieldLabel>
          <Input
            {...register('username')}
            placeholder="사용하실 닉네임을 입력해 주세요"
            className="h-12 font-medium"
          />
          {errors.username ? (
            <FieldError>{errors.username.message}</FieldError>
          ) : (
            <p className="mt-1 px-1 text-[11px] text-muted-foreground italic">
              * 2~20자 사이의 한글, 영문, 숫자만 가능해요.
            </p>
          )}
        </Field>

        <Field>
          <FieldLabel className="sr-only">소개글</FieldLabel>
          <Textarea
            {...register('bio')}
            placeholder="회원님을 한 줄로 소개해 주세요 (선택)"
            className="min-h-[100px] resize-none text-sm leading-relaxed"
          />
          {errors.bio && <FieldError>{errors.bio.message}</FieldError>}
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-3 pt-4">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="h-12 text-sm font-bold shadow-lg shadow-primary/20"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              수정 중...
            </>
          ) : (
            '변경사항 저장하기'
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="h-12 text-xs font-medium text-muted-foreground"
        >
          취소
        </Button>
      </div>
    </form>
  );
};
