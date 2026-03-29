import { Metadata } from 'next';
import HomePage from '@/src/pages/home/ui/HomePage';

export const metadata: Metadata = {
  title: '자랑 (ZARANG) - 당신을 위한 취향 아이템 추천',
  description: '나의 취향을 분석하여 딱 맞는 아이템을 추천해 드립니다. 지금 자랑(ZARANG)에서 당신만을 위한 맞춤형 취향 피드를 확인해 보세요.',
  openGraph: {
    title: '자랑 (ZARANG) - 당신을 위한 취향 아이템 추천',
    description: '나의 취향을 분석하여 딱 맞는 아이템을 추천해 드립니다.',
  },
};

export default HomePage;
