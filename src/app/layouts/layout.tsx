import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import '@/src/app/styles/globals.css';
import { Header } from '@/src/shared/ui/Header';
import { BottomNav } from '@/src/shared/ui/BottomNav';
import { Toaster } from '@/src/shared/ui/sonner';
import { NotificationListener } from '@/src/features/notifications/ui/NotificationListener';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'], // Roboto는 가변 폰트가 아니므로 weight 지정이 필요합니다.
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'ZARANG - 취향 아이템 자랑 커뮤니티',
  description: '키보드, 마우스, 피규어, 데스크 셋업 같은 취향 아이템을 자랑해보세요.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${roboto.variable} bg-neutral-100 font-sans antialiased`}>
        <div className="relative mx-auto flex min-h-screen max-w-[420px] flex-col bg-white pb-16 shadow-xl">
          <Header />
          <main className="flex-1">{children}</main>
          <BottomNav />
        </div>
        <Toaster position="top-center" />
        <NotificationListener />
      </body>
    </html>
  );
}
