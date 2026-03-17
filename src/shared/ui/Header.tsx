'use client';

import Link from 'next/link';
import { Button } from '@/src/shared/ui/button';
import { PlusSquare, LogIn } from 'lucide-react';

export const Header = () => {
  // TODO: Implement actual login status check
  const isLoggedIn = false;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[420px] items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tighter text-primary">
          ZARANG
        </Link>
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <Button
              variant="ghost"
              size="icon"
              render={<Link href="/write" />}
              nativeButton={false}
            >
              <PlusSquare className="h-5 w-5" />
              <span className="sr-only">글쓰기</span>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" render={<Link href="/login" />} nativeButton={false}>
              <LogIn className="mr-1 h-4 w-4" />
              로그인
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
