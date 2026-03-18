'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/src/shared/lib/supabase/client';
import { Button } from '@/src/shared/ui/button';
import { PlusSquare, LogIn, User } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';

export const Header = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[420px] items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tighter text-primary">
          ZARANG
        </Link>
        <div className="flex items-center gap-2">
          {!loading && (
            user ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  render={<Link href="/write" />}
                  nativeButton={false}
                >
                  <PlusSquare className="h-5 w-5" />
                  <span className="sr-only">자랑하기</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  render={<Link href="/me" />}
                  nativeButton={false}
                >
                  <User className="h-5 w-5" />
                  <span className="sr-only">마이페이지</span>
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" render={<Link href="/login" />} nativeButton={false}>
                <LogIn className="mr-1 h-4 w-4" />
                로그인
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
};
