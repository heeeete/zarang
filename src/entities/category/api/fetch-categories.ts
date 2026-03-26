import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/src/shared/lib/supabase/server';

export interface Category {
  id: string;
  slug: string;
  label: string;
}

/**
 * [ENTITY] 카테고리 목록 조회 (서버 영구 캐싱 적용) ⚡
 * fetchCategories: 외부 DB에서 데이터를 가져옵니다.
 */
export const fetchCategories = unstable_cache(
  async () => {
    console.log('--- [DB MISS] 카테고리 목록을 데이터베이스에서 새로 가져오는 중... ---');
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('categories')
      .select('id, slug, label')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('카테고리 조회 실패:', error);
      throw error;
    }
    
    return (data as Category[]) || [];
  },
  ['categories-list'],
  {
    tags: ['categories'],
    revalidate: 3600 * 24,
  }
);
