'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/src/shared/lib/supabase/client';
import { Message, ChatUserProfile } from './types';
import { updateLastReadAt } from '../api/chat-api';
import { useMessageStore } from '@/src/entities/message/model/messageStore';

export const useChatMessages = (roomId: string | null, initialMessages: Message[], initialTargetProfile?: ChatUserProfile | null, currentUserId?: string) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const participantsCache = useRef<Record<string, ChatUserProfile>>({});
  const supabase = createClient();
  const refreshUnreadStatus = useMessageStore((state) => state.refreshUnreadStatus);

  // 초기 참가자 및 프로필 캐싱
  useEffect(() => {
    if (initialTargetProfile) {
      participantsCache.current[initialTargetProfile.id] = initialTargetProfile;
    }
    initialMessages.forEach((msg) => {
      if (msg.sender) {
        participantsCache.current[msg.sender.id] = msg.sender;
      }
    });
  }, [initialMessages, initialTargetProfile]);

  // 진입 시 읽음 처리
  useEffect(() => {
    if (roomId && currentUserId) {
      updateLastReadAt(supabase, roomId, currentUserId).then(() => {
        refreshUnreadStatus(currentUserId);
      });
    }
  }, [roomId, currentUserId, supabase, refreshUnreadStatus]);

  // 실시간 구독
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`chat-room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // 새 메시지가 오면 읽음 처리 업데이트 (내가 보낸 게 아닐 때만)
          if (currentUserId && newMessage.sender_id !== currentUserId) {
            await updateLastReadAt(supabase, roomId, currentUserId);
            refreshUnreadStatus(currentUserId);
          }

          let sender = participantsCache.current[newMessage.sender_id];
          
          if (!sender) {
            const { data } = await supabase
              .from('profiles')
              .select('id, username, avatar_url')
              .eq('id', newMessage.sender_id)
              .single();
            
            if (data) {
              sender = data as unknown as ChatUserProfile;
              participantsCache.current[sender.id] = sender;
            }
          }
          
          setMessages((prev) => [...prev, { ...newMessage, sender: sender || undefined }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase, currentUserId]);

  return { messages, setMessages };
};
