import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import '@/src/app/styles/globals.css';
import { Header } from '@/src/shared/ui/Header';
import { BottomNav } from '@/src/shared/ui/BottomNav';
import { Toaster } from '@/src/shared/ui/sonner';
import { NotificationListener } from '@/src/features/notifications/ui/NotificationListener';
import { AuthProvider } from '@/src/app/providers/AuthProvider';
import { QueryProvider } from '@/src/app/providers/QueryProvider';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://zarang.vercel.app'),
  title: {
    default: 'ZARANG - 취향 아이템 자랑 커뮤니티',
    template: '%s | ZARANG',
  },
  description:
    '당신의 소중한 아이템과 취향을 공유해 보세요. ZARANG에서 나만의 특별한 취향 자랑을 즐기고 새로운 아이템을 발견해 보세요.',
  keywords: ['자랑', '취향공유', '아이템자랑', '데스크셋업', 'ZARANG', 'ASMR'],
  authors: [{ name: 'mkoui' }],
  creator: 'mkoui',
  publisher: 'ZARANG',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'ZARANG - 취향 아이템 자랑 커뮤니티',
    description: '당신의 소중한 아이템과 취향을 공유해 보세요.',
    url: 'https://zarang.vercel.app',
    siteName: 'ZARANG',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ZARANG - 취향 아이템 자랑 커뮤니티',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZARANG - 취향 아이템 자랑 커뮤니티',
    description: '당신의 소중한 아이템과 취향을 공유해 보세요.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={roboto.variable}>
      <body className="bg-neutral-100 font-sans antialiased selection:bg-primary/10">
        <QueryProvider>
          <AuthProvider>
            <div className="flex justify-center">
              {/* [PC 전용] 좌측 사이드 멘트 */}
              <div className="fixed top-1/2 right-[calc(50%+240px)] hidden -translate-y-1/2 select-none lg:block">
                <div className="flex flex-col gap-1.5 text-right">
                  <span className="text-xs font-bold tracking-widest text-primary uppercase">
                    Zarang Space
                  </span>
                  <h2 className="text-4xl leading-tight font-black tracking-tighter">
                    당신의 <span className="text-orange-300">취향</span>을
                    <br />
                    공유해주세요
                  </h2>
                </div>
              </div>

              {/* 메인 모바일 레이아웃 컨테이너 */}
              <div className="relative flex min-h-dvh w-full max-w-[420px] flex-col bg-white shadow-2xl shadow-neutral-200">
                <Header />
                <main className="flex flex-1 flex-col pb-16">{children}</main>
                <BottomNav />
              </div>

              {/* [PC 전용] 우측 사이드 멘트 */}
              <div className="fixed bottom-24 left-[calc(50%+240px)] hidden select-none lg:block">
                <div className="flex flex-col gap-3">
                  <div className="rounded-2xl border border-white bg-white/50 p-5 shadow-sm backdrop-blur-md">
                    <p className="text-sm font-bold text-neutral-600">앱 개발도 곧 할게요! 📱</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-neutral-400">
                      더욱 쾌적하고 빠른 환경을 위해
                      <br />
                      열심히 준비하고 있어요.
                      <br />
                      조금만 더 기다려주세요.
                    </p>
                  </div>
                  <p className="px-2 text-[10px] font-medium tracking-tight text-neutral-300">
                    © 2026 ZARANG. All rights reserved.
                  </p>
                </div>
              </div>
            </div>

            <Toaster position="top-center" />
            <NotificationListener />
          </AuthProvider>
        </QueryProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
