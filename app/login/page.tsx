import { Metadata } from 'next';
import { LoginPage } from '@/src/pages/login/ui/LoginPage';
import { redirect } from 'next/navigation';
import { getServerUserId } from '@/src/shared/lib/supabase/server-auth';

export const metadata: Metadata = {
  title: 'ZARANG 시작하기',
  description: '지금 바로 로그인하고 당신의 소중한 취향을 자랑해 보세요. 다양한 사람들과 취향을 공유하는 즐거움이 기다리고 있습니다.',
  openGraph: {
    title: 'ZARANG 시작하기',
    description: '지금 바로 로그인하고 취향을 자랑해보세요!',
  },
};

export default async function Page() {
  const userId = await getServerUserId();

  // 이미 로그인된 상태라면 홈으로 리다이렉트 (로그인 페이지 재접근 방지)
  if (userId) {
    redirect('/');
  }

  return <LoginPage />;
}
