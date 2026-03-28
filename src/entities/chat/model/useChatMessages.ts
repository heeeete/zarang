'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/src/shared/lib/supabase/client';
import { Message, ChatUserProfile } from './types';
import { updateLastReadAt } from '../api/update-last-read-at';
import { useMessageStore } from '@/src/entities/message/model/messageStore';
import { fetchMessages } from '../api/fetch-messages';

export const useChatMessages = (roomId: string | null, initialMessages: Message[], initialTargetProfile?: ChatUserProfile | null, currentUserId?: string) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialMessages.length >= 30);
  
  const participantsCache = useRef<Record<string, ChatUserProfile>>({});
  const supabase = createClient();
  const refreshUnreadStatus = useMessageStore((state) => state.refreshUnreadStatus);

  // 의존성 안정화를 위한 Ref 관리
  const userIdRef = useRef(currentUserId);
  const refreshRef = useRef(refreshUnreadStatus);

  useEffect(() => {
    userIdRef.current = currentUserId;
    refreshRef.current = refreshUnreadStatus;
  }, [currentUserId, refreshUnreadStatus]);

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

  // 이전 메시지 더 불러오기
  const loadPreviousMessages = useCallback(async () => {
    if (!roomId || isLoadingMore || !hasMore || messages.length === 0) return;

    setIsLoadingMore(true);
    try {
      const firstMessage = messages[0];
      const previousMessages = await fetchMessages(supabase, roomId, {
        lastCreatedAt: firstMessage.created_at,
        limit: 30
      });

      if (previousMessages.length < 30) {
        setHasMore(false);
      }

      if (previousMessages.length > 0) {
        setMessages((prev) => [...previousMessages, ...prev]);
      }
    } catch (error) {
      console.error('이전 메시지 로딩 실패:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [roomId, isLoadingMore, hasMore, messages, supabase]);

  // 진입 시 읽음 처리
  useEffect(() => {
    if (roomId && currentUserId) {
      updateLastReadAt(supabase, roomId, currentUserId).then(() => {
        refreshUnreadStatus(currentUserId);
      });
    }
  }, [roomId, currentUserId, supabase, refreshUnreadStatus]);

  // 실시간 구독 (roomId가 바뀔 때만 재연결)
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`chat-room-${roomId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `room_id=eq.${roomId}` 
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          const currentId = userIdRef.current;
          
          // 새 메시지가 오면 읽음 처리 업데이트 (내가 보낸 게 아닐 때만)
          if (currentId && newMessage.sender_id !== currentId) {
            await updateLastReadAt(supabase, roomId, currentId);
            refreshRef.current(currentId);
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
  }, [roomId]); // [roomId]만 남겨서 완벽하게 고정

  return { messages, setMessages, loadPreviousMessages, isLoadingMore, hasMore };
};
