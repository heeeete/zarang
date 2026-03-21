'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/src/shared/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function NotificationListener() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    // 브라우저 알림 권한 요청
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const supabase = createClient();

    const channel = supabase
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

          if (document.visibilityState === 'visible') {
            toast(message, {
              action: {
                label: '보기',
                onClick: () => {
                  router.push(`/posts/${newNotification.post_id}`);
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
                router.push(`/posts/${newNotification.post_id}`);
              };
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return null;
}
