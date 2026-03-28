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
      <body className="bg-neutral-100 font-sans antialiased">
        <QueryProvider>
          <AuthProvider>
            <div className="relative mx-auto flex min-h-dvh max-w-[420px] flex-col bg-white shadow-xl">
              <Header />
              <main className="flex flex-1 flex-col pb-16">{children}</main>
              <BottomNav />
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
