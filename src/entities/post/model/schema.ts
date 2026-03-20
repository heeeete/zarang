import { z } from 'zod';

/**
 * 게시글 작성을 위한 Zod 스키마입니다.
 */
export const postFormSchema = z.object({
  description: z.string().max(500, '설명은 500자 이내로 입력해주세요.').optional(),
  category_id: z.string({
    invalid_type_error: '카테고리를 선택해주세요.',
    required_error: '카테고리를 선택해주세요.',
  }).min(1, '카테고리를 선택해주세요.'),
  images: z.array(z.unknown()).min(1, '사진을 한 장 이상 등록해주세요.'),
});

export type PostFormInput = z.infer<typeof postFormSchema>;

export interface Category {
  id: string;
  slug: string;
  label: string;
}
