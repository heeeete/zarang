'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';
import { Button } from '@/src/shared/ui/button';

/**
 * 프로필 수정 페이지로 이동하는 버튼 컴포넌트입니다.
 */
export const ProfileEditButton = () => {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-9 px-4 text-xs font-semibold rounded-full"
      render={<Link href="/me/edit" />}
      nativeButton={false}
    >
      <Settings className="h-3.5 w-3.5 mr-1.5" />
      프로필 수정
    </Button>
  );
};
