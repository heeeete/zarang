import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Tailwind CSS 클래스들을 조건부로 병합하고 중복을 제거합니다.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Supabase Storage의 이미지 URL을 최적화된 URL로 변환합니다.
 * 특정 프로젝트(기능이 활성화된 운영 DB 등)에서만 Image Transformation 기능을 사용하고,
 * 그 외의 프로젝트에서는 403 에러 방지를 위해 원본 URL을 반환합니다.
 * 
 * @param url 원본 이미지 URL
 * @param width 대상 너비 (기본값: 840)
 * @param quality 이미지 품질 (1-100)
 */
export const getOptimizedImageUrl = (url: string | null | undefined, width: number = 840, quality: number = 75) => {
  if (!url) return null

  // Image Transformation 기능을 지원하는 프로젝트 URL 목록입니다.
  // 사용자님의 결정에 따라 기존에 기능이 잘 작동하던 프로젝트를 운영용으로 간주합니다.
  const SUPPORTED_RESIZE_URL = 'https://yivgwhosamvgluzmbxaw.supabase.co'
  const currentSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  // 1. Supabase의 public storage URL 형식인지 확인
  // 2. 현재 프로젝트가 리사이징 기능을 지원하는 프로젝트인지 확인
  if (
    url.includes('/storage/v1/object/public/') && 
    currentSupabaseUrl === SUPPORTED_RESIZE_URL
  ) {
    // '/object/' 부분을 '/render/image/'로 교체하여 리사이징 API 사용
    // ?width, ?quality, ?resize 파라미터를 추가하여 서버 측에서 처리
    return `${url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')}?width=${width}&quality=${quality}&resize=contain`
  }

  // 기능을 지원하지 않는 프로젝트이거나 로컬 개발 환경 등에서는 원본 URL을 그대로 반환합니다.
  return url
}
