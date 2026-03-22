'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/src/shared/ui/button';

interface MessageButtonProps {
  targetUserId: string;
  currentUserId?: string;
}

/**
 * 상대방 유저와의 채팅방으로 이동하는 버튼입니다.
 * (메시지를 실제로 보내기 전까지는 DB에 방을 생성하지 않습니다.)
 */
export const MessageButton = ({ targetUserId, currentUserId }: MessageButtonProps) => {
  const router = useRouter();

  const handleMessageClick = () => {
    if (!currentUserId) {
      router.push('/login');
      return;
    }

    // 상대방 ID를 경로에 담아 이동합니다. 
    // 채팅방 페이지에서 실제 방 존재 여부를 확인하고, 첫 메시지 시점에 방을 생성합니다.
    router.push(`/messages/new?target=${targetUserId}`);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex-1 h-7 text-xs font-bold border-neutral-200"
      onClick={handleMessageClick}
    >
      메시지
    </Button>
  );
};
