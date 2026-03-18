import { z } from 'zod'

export const CATEGORIES = [
  { value: 'keyboard', label: '키보드' },
  { value: 'mouse', label: '마우스' },
  { value: 'desk-setup', label: '데스크 셋업' },
  { value: 'figure', label: '피규어' },
  { value: 'etc', label: '기타' },
] as const

export const createPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, '제목은 필수입니다.')
    .max(60, '제목은 최대 60자까지 가능합니다.'),
  description: z
    .string()
    .trim()
    .max(500, '설명은 최대 500자까지 가능합니다.')
    .optional()
    .or(z.literal('')),
  category: z.string().min(1, '카테고리를 선택해주세요.'),
  // For client-side form handling, we might use File objects
  images: z
    .array(z.any()) // We'll validate it's a File array in the component or refined schema
    .min(1, '사진은 최소 1장 필요합니다.')
    .max(10, '사진은 최대 10장까지 업로드할 수 있습니다.'),
})

export type CreatePostInput = z.infer<typeof createPostSchema>
