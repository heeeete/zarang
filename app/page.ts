import { Metadata } from 'next';
import HomePage from '@/src/pages/home/ui/HomePage';

export const metadata: Metadata = {
  title: 'ZARANG - 당신을 위한 취향 아이템 추천',
  description: '나의 취향을 분석하여 딱 맞는 아이템을 추천해 드립니다. 지금 ZARANG에서 당신만을 위한 맞춤형 자랑 피드를 확인해 보세요.',
  openGraph: {
    title: 'ZARANG - 당신을 위한 취향 아이템 추천',
    description: '나의 취향을 분석하여 딱 맞는 아이템을 추천해 드립니다.',
  },
};

export default HomePage;
