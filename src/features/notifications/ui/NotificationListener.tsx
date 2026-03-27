'use client';

import { useEffect } from 'react';
import { createClient } from '@/src/shared/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/app/providers/AuthProvider';
import { useMessageStore } from '@/src/entities/message/model/messageStore';

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

    // 초기 안 읽은 메시지 상태 확인
    const refreshUnread = useMessageStore.getState().refreshUnreadStatus;
    refreshUnread(userId);

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

    // 1. 전역 알림 및 메시지 통합 구독
    const globalChannel = supabase
      .channel(`user-global-updates-${userId}`)
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
          
          // 다른 컴포넌트(Bell 등)에게 알림 갱신을 알림
          window.dispatchEvent(new CustomEvent('zarang:refresh-notifications'));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=neq.${userId}`, // 서버 사이드 필터 유지
        },
        async (payload) => {
          const newMessage = payload.new;
          
          // 메시지 목록 갱신을 위해 이벤트 항상 발생
          window.dispatchEvent(new CustomEvent('zarang:refresh-messages', { detail: newMessage }));

          const isCurrentlyInThisRoom = window.location.pathname === `/messages/${newMessage.room_id}`;
          
          if (!isCurrentlyInThisRoom) {
            useMessageStore.getState().setHasUnread(true);

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
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_participants',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          useMessageStore.getState().refreshUnreadStatus(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
    };
  }, [userId]); // router 제거하여 불필요한 재구독 방지

  return null;
}
