import { useState } from 'react';
import { useDebounce } from '@/src/shared/lib/hooks/useDebounce';

/**
 * Explore 페이지의 필터 상태(카테고리, 검색어)를 관리하는 훅입니다.
 */
export const useExploreFilter = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const debouncedKeyword = useDebounce(searchKeyword, 500);

  return {
    selectedCategoryId,
    setSelectedCategoryId,
    searchKeyword,
    setSearchKeyword,
    debouncedKeyword,
  };
};
