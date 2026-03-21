'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/src/shared/lib/supabase/client';
import { Home, Compass, PlusSquare, User } from 'lucide-react';
import { cn } from '@/src/shared/lib/utils';
import { User as SupabaseUser } from '@supabase/supabase-js';

export const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleWriteClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      router.push('/login?next=/write');
    }
  };

  const navItems = [
    { href: '/', icon: Home, label: '홈' },
    { href: '/explore', icon: Compass, label: '구경하기' },
    {
      href: '/write',
      icon: PlusSquare,
      label: '자랑하기',
      onClick: handleWriteClick,
    },
    { href: '/me', icon: User, label: '마이' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 h-16 w-full max-w-[420px] -translate-x-1/2 border-t bg-white px-3">
      <ul className="flex h-full items-center justify-between">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={item.onClick}
                className={cn(
                  'flex flex-col items-center gap-1 p-4 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="sr-only text-[10px] font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
