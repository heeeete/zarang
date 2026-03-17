import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Tailwind CSS 클래스들을 조건부로 병합하고 중복을 제거합니다.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Supabase Storage의 이미지 URL을 리사이징된 URL로 변환합니다.
 * @param url 원본 이미지 URL
 * @param width 대상 너비 (기본값: 840 - 상세 페이지용)
 * @param quality 이미지 품질 (1-100)
 */
export const getOptimizedImageUrl = (url: string | null | undefined, width: number = 840, quality: number = 75) => {
  if (!url) return null
  
  // Supabase의 public storage URL 형식인지 확인
  if (url.includes('/storage/v1/object/public/')) {
    // '/object/' 부분을 '/render/image/'로 교체하여 리사이징 API 사용
    // ?width, ?quality, ?resize 파라미터를 추가하여 서버 측에서 처리
    return `${url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')}?width=${width}&quality=${quality}&resize=contain`
  }
  
  return url
}
