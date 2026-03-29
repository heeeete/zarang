import { Metadata } from 'next';
import { ExplorePage } from '@/src/pages/explore/ui/ExplorePage';

export const metadata: Metadata = {
  title: '취향 탐색',
  description: '요즘 뜨는 아이템은 무엇일까요? 자랑(ZARANG)에서 카테고리별로 다양한 사람들의 취향을 탐색하고 영감을 얻어보세요.',
  openGraph: {
    title: '취향 탐색 | 자랑 (ZARANG)',
    description: '카테고리별로 다양한 사람들의 취향을 탐색해보세요.',
  },
};

export default ExplorePage;
