import { z } from 'zod'

export interface Category {
  id: string
  slug: string
  label: string
}

export const createPostSchema = z.object({
  title: z
    .string()
    .max(60, '제목은 최대 60글자까지 가능해요.')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .max(500, '설명은 최대 500글자까지 가능해요.')
    .optional()
    .or(z.literal('')),
  category_id: z.string().uuid('카테고리를 선택해주세요.'),
  images: z
    .array(z.any())
    .min(1, '사진은 최소 1장 필요해요.')
    .max(10, '사진은 최대 10장까지 업로드할 수 있어요.'),
})

export type CreatePostInput = z.infer<typeof createPostSchema>
