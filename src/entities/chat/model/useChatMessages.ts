'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/src/shared/lib/supabase/client';
import { Message, ChatUserProfile } from './types';

export const useChatMessages = (roomId: string | null, initialMessages: Message[], initialTargetProfile?: ChatUserProfile | null) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const participantsCache = useRef<Record<string, ChatUserProfile>>({});
  const supabase = createClient();

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
  }, [roomId, supabase]);

  return { messages, setMessages };
};
