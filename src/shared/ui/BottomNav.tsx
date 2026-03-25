'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Compass, PlusSquare, User, MessageSquare } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';
import { useAuth } from '@/src/app/providers/AuthProvider';
import { useMessageStore } from '@/src/entities/message/model/messageStore';

/**
 * 하단 내비게이션 바 컴포넌트입니다.
 */
export const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const hasUnread = useMessageStore((state) => state.hasUnread);

  // 메인 네비게이션 페이지 목록
  const mainNavPages = ['/', '/explore', '/write', '/messages', '/me'];

  // 현재 경로가 메인 네비게이션 페이지 중 하나인지 확인
  const isMainPage = mainNavPages.includes(pathname || '/') || pathname?.startsWith('/users/');

  // 메인 페이지가 아니거나 채팅방인 경우 렌더링하지 않음
  if (!isMainPage || (pathname?.startsWith('/messages/') && pathname !== '/messages')) {
    return null;
  }

  // 로그인되지 않은 상태에서 보안이 필요한 페이지 클릭 시 가로채기
  const handleProtectedClick = (e: React.MouseEvent, href: string) => {
    if (!user) {
      e.preventDefault();
      // 가려던 페이지 정보를 담아 로그인 페이지로 이동합니다. ✨
      router.push(`/login?redirect=${encodeURIComponent(href)}`);
    }
  };

  const navItems = [
    { 
      href: '/', 
      icon: Home, 
      label: '홈',
    },
    { 
      href: '/explore', 
      icon: Compass, 
      label: '구경하기',
    },
    {
      href: '/write',
      icon: PlusSquare,
      label: '자랑하기',
      onClick: (e: React.MouseEvent) => {
        handleProtectedClick(e, '/write');
      },
    },
    {
      href: '/messages',
      icon: MessageSquare,
      label: '메시지',
      onClick: (e: React.MouseEvent) => {
        handleProtectedClick(e, '/messages');
      },
    },
    {
      href: '/me',
      icon: User,
      label: '마이',
      onClick: (e: React.MouseEvent) => {
        handleProtectedClick(e, '/me');
      },
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[420px] border-t bg-white px-3 pb-[env(safe-area-inset-bottom)]"
      style={{ right: 'var(--removed-body-scroll-bar-size, 0px)' }}
    >
      <ul className="flex h-16 items-center justify-between">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={item.onClick}
                className={cn('relative flex flex-col items-center gap-1 p-4 transition-colors')}
              >
                <Icon
                  className={cn('h-6 w-6', isActive ? 'text-primary' : 'text-muted-foreground')}
                />
                {item.href === '/messages' && hasUnread && (
                  <span className="absolute right-3 bottom-3 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white" />
                )}
                <span className="sr-only text-[10px] font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
