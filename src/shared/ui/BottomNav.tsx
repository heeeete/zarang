'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusSquare, User } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';

export const BottomNav = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: Home, label: '홈' },
    { href: '/write', icon: PlusSquare, label: '글쓰기' },
    { href: '/me', icon: User, label: '마이' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 h-16 w-full max-w-[420px] -translate-x-1/2 border-t bg-white px-6">
      <ul className="flex h-full items-center justify-between">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
