'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/src/shared/lib/supabase/client';
import { Button } from '@/src/shared/ui/button';
import { LogIn } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { NotificationBell } from '@/src/features/notifications/ui/NotificationBell';

export const Header = () => {
  const pathname = usePathname();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // 메인 페이지(/)가 아니면 헤더를 렌더링하지 않습니다.
  if (pathname !== '/') return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[420px] items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tighter">
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
