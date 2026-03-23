import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import '@/src/app/styles/globals.css';
import { Header } from '@/src/shared/ui/Header';
import { BottomNav } from '@/src/shared/ui/BottomNav';
import { Toaster } from '@/src/shared/ui/sonner';
import { NotificationListener } from '@/src/features/notifications/ui/NotificationListener';
import { AuthProvider } from '@/src/app/providers/AuthProvider';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
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
    <html lang="ko" className={roboto.variable}>
      <body className="bg-neutral-100 font-sans antialiased">
        <AuthProvider>
          <div className="relative mx-auto flex min-h-dvh max-w-[420px] flex-col bg-white shadow-xl">
            <Header />
            <main className="flex flex-1 flex-col pb-16">{children}</main>
            <BottomNav />
          </div>
          <Toaster position="top-center" />
          <NotificationListener />
        </AuthProvider>
      </body>
    </html>
  );
}
