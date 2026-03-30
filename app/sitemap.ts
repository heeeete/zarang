import { MetadataRoute } from 'next';
import { createPublicClient } from '@/src/shared/lib/supabase/server';

/**
 * 검색 엔진을 위한 사이트맵을 자동으로 생성합니다.
 * 모든 게시글이 구글/네이버에 노출되도록 동적으로 URL을 구성합니다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://zarang.vercel.app';
  const supabase = createPublicClient();

  // 1. 모든 게시글 정보 조회 (이미지 포함)
  const { data: posts } = await supabase
    .from('posts')
    .select('id, updated_at, thumbnail_url')
    .order('created_at', { ascending: false });

  const postUrls = (posts || []).map((post) => ({
    url: `${baseUrl}/posts/${post.id}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
    images: post.thumbnail_url ? [post.thumbnail_url] : [],
  }));

  // 2. 정적 루트 페이지
  const routes = ['', '/explore'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1.0,
  }));

  return [...routes, ...postUrls];
}
