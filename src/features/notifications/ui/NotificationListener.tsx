'use client';

import { useEffect } from 'react';
import { createClient } from '@/src/shared/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/app/providers/AuthProvider';

export function NotificationListener() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    // 브라우저 알림 권한 요청
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const supabase = createClient();

    // 1. 기존 알림 구독 (댓글 등)
    const notificationChannel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const newNotification = payload.new;
          
          // 액터 정보 가져오기
          const { data: actor } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', newNotification.actor_id)
            .single();

          const username = actor?.username || '누군가';
          const message = newNotification.type === 'REPLY' 
            ? `${username}님이 회원님의 댓글에 답글을 남겼어요.` 
            : `${username}님이 회원님의 게시글에 댓글을 남겼어요.`;

          showNotification(message, `/posts/${newNotification.post_id}`);
        }
      )
      .subscribe();

    // 2. 새로운 메시지 실시간 구독
    const messageChannel = supabase
      .channel(`chat-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMessage = payload.new;
          
          // 내게 온 메시지인지 확인 (참여자인지 확인)
          const { data: participant } = await supabase
            .from('chat_participants' as 'profiles')
            .select('user_id')
            .eq('room_id', newMessage.room_id)
            .eq('user_id', userId)
            .maybeSingle();

          // 내가 보낸 메시지가 아니고, 내가 참여 중인 방의 메시지일 때만 알림
          if (participant && newMessage.sender_id !== userId) {
            // 스마트 알림 로직: 현재 내가 이 채팅방을 보고 있지 않을 때만 알림을 띄웁니다.
            const isCurrentlyInThisRoom = window.location.pathname === `/messages/${newMessage.room_id}`;
            
            if (!isCurrentlyInThisRoom) {
              const { data: sender } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', newMessage.sender_id)
                .single();

              showNotification(
                `${sender?.username || '누군가'}님의 메시지: ${newMessage.content}`,
                `/messages/${newMessage.room_id}`
              );
            }
          }
        }
      )
      .subscribe();

    const showNotification = (message: string, url: string) => {
      if (document.visibilityState === 'visible') {
        toast(message, {
          action: {
            label: '보기',
            onClick: () => {
              router.push(url);
            }
          }
        });
      } else {
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification('ZARANG 알림', {
            body: message,
            icon: '/favicon.ico'
          });
          notification.onclick = () => {
            window.focus();
            router.push(url);
          };
        }
      }
    };

    return () => {
      supabase.removeChannel(notificationChannel);
      supabase.removeChannel(messageChannel);
    };
  }, [userId, router]);

  return null;
}
