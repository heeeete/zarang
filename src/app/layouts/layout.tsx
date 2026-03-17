import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import '@/src/app/styles/globals.css'
import { Header } from '@/src/shared/ui/Header';
import { BottomNav } from '@/src/shared/ui/BottomNav';

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "ZARANG - 취향 아이템 자랑 커뮤니티",
	description: "키보드, 마우스, 피규어, 데스크 셋업 같은 취향 아이템을 자랑해보세요.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ko">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutral-100`}>
				<div className="mx-auto min-h-screen max-w-[420px] bg-white shadow-xl flex flex-col relative pb-16">
					<Header />
					<main className="flex-1">
						{children}
					</main>
					<BottomNav />
				</div>
			</body>
		</html>
	);
}
