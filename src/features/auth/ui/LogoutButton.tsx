'use client'

import { createClient } from '@/src/shared/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/src/shared/ui/button'
import { LogOut } from 'lucide-react'

interface LogoutButtonProps {
  variant?: 'default' | 'text';
}

export const LogoutButton = ({ variant = 'default' }: LogoutButtonProps) => {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/');
  };

  if (variant === 'text') {
    return (
      <button
        onClick={handleLogout}
        className="w-full px-2 py-4 text-left text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors rounded-lg"
      >
        로그아웃
      </button>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
      <LogOut className="mr-2 h-4 w-4" />
      로그아웃
    </Button>
  );
};
