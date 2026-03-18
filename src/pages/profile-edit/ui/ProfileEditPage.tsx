import { createClient } from '@/src/shared/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/src/shared/ui/button';
import { ProfileEditForm } from '@/src/features/profile-management/ui/ProfileEditForm';

/**
 * 프로필 수정 페이지 컴포넌트입니다 (서버 컴포넌트).
 */
export const ProfileEditPage = async () => {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    notFound();
  }

  return (
    <div className="flex min-h-full flex-col bg-white">
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-white/90 px-4 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href="/me" />}
          className="-ml-2 hover:bg-transparent"
          nativeButton={false}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h2 className="text-sm font-semibold">프로필 수정</h2>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-y-auto">
        <ProfileEditForm profile={profile} />
      </main>
    </div>
  );
};
