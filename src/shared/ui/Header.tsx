'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/src/shared/ui/button';
import { LogIn } from 'lucide-react';
import { NotificationBell } from '@/src/features/notifications/ui/NotificationBell';
import { useAuth } from '@/src/app/providers/AuthProvider';

export const Header = () => {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // 모든 훅 호출 이후에 렌더링 여부를 결정합니다.
  const isChatRoom = pathname?.startsWith('/messages/') && pathname !== '/messages';
  if (isChatRoom) return null;

  // 메인 페이지(/)가 아니면 헤더를 렌더링하지 않습니다.
  if (pathname !== '/') return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[420px] items-center justify-between px-4">
        <Link href="/" prefetch={false} className="text-xl font-bold tracking-wider">
          ZARANG
        </Link>
        <div className="flex items-center gap-2">
          {!loading && !user && (
            <Button variant="ghost" size="sm" render={<Link href="/login" />} nativeButton={false}>
              <LogIn className="mr-1 h-4 w-4" />
              로그인
            </Button>
          )}
          {!loading && user && <NotificationBell />}
        </div>
      </div>
    </header>
  );
};
