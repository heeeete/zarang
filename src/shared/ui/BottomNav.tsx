'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Compass, PlusSquare, User, MessageSquare } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';
import { useAuth } from '@/src/app/providers/AuthProvider';

/**
 * 하단 내비게이션 바 컴포넌트입니다.
 */
export const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  // 모든 훅 호출 이후에 렌더링 여부를 결정합니다 (Rules of Hooks 준수).
  const isChatRoom = pathname?.startsWith('/messages/') && pathname !== '/messages';
  if (isChatRoom) return null;

  // 로그인되지 않은 상태에서 보안이 필요한 페이지 클릭 시 가로채기
  const handleProtectedClick = (e: React.MouseEvent, href: string) => {
    if (!user) {
      e.preventDefault();
      // 가려던 페이지 정보를 담아 로그인 페이지로 이동합니다. ✨
      router.push(`/login?redirect=${encodeURIComponent(href)}`);
    }
  };

  const navItems = [
    { href: '/', icon: Home, label: '홈' },
    { href: '/explore', icon: Compass, label: '구경하기' },
    {
      href: '/write',
      icon: PlusSquare,
      label: '자랑하기',
      onClick: (e: React.MouseEvent) => handleProtectedClick(e, '/write'),
    },
    {
      href: '/messages',
      icon: MessageSquare,
      label: '메시지',
      onClick: (e: React.MouseEvent) => handleProtectedClick(e, '/messages'),
    },
    {
      href: '/me',
      icon: User,
      label: '마이',
      onClick: (e: React.MouseEvent) => handleProtectedClick(e, '/me'),
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 mx-auto h-16 w-full max-w-[420px] border-t bg-white px-3"
      style={{ right: 'var(--removed-body-scroll-bar-size, 0px)' }}
    >
      <ul className="flex h-full items-center justify-between">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={item.onClick}
                className={cn('flex flex-col items-center gap-1 p-4 transition-colors')}
              >
                <Icon
                  className={cn('h-6 w-6', isActive ? 'text-primary' : 'text-muted-foreground')}
                />
                <span className="sr-only text-[10px] font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
