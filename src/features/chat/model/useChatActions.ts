'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/src/shared/lib/supabase/client';
import { sendMessage, fetchOrCreateChatRoom } from '@/src/entities/chat/api/chat-api';
import { toast } from 'sonner';

/**
 * 채팅과 관련된 사용자의 행위(전송, 방 생성 등) 로직을 관리하는 훅 (Feature)
 */
export const useChatActions = (
  roomId: string | null, 
  setRoomId: (id: string) => void,
  targetUserId?: string | null
) => {
  const router = useRouter();
  const supabase = createClient();

  const handleSend = useCallback(async (content: string, userId: string) => {
    let currentRoomId = roomId;

    try {
      // 1:1 채팅방 지연 생성 (첫 메시지 전송 시)
      if (!currentRoomId && targetUserId) {
        currentRoomId = await fetchOrCreateChatRoom(supabase, userId, targetUserId);
        setRoomId(currentRoomId);
        // URL 교체 (new -> roomId)
        router.replace(`/messages/${currentRoomId}`);
      }

      if (currentRoomId) {
        await sendMessage(supabase, currentRoomId, userId, content);
      }
    } catch (err) {
      console.error('메시지 전송 실패:', err);
      toast.error('메시지를 보내지 못했어요.');
    }
  }, [roomId, targetUserId, supabase, setRoomId, router]);

  return { handleSend };
};
