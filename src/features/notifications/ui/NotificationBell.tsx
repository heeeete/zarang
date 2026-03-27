'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { createClient } from '@/src/shared/lib/supabase/client';
import { Button } from '@/src/shared/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/src/shared/ui/sheet';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  NotificationWithDetails,
} from '../api/notification-api';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AppSheetHeader from '@/src/shared/ui/AppSheetHeader';
import { useAuth } from '@/src/app/providers/AuthProvider';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>([]);
  const { user } = useAuth();
  const userId = user?.id;
  const router = useRouter();
  const supabase = createClient();

  const loadNotifications = useCallback(
    async (uid: string) => {
      try {
        const data = await fetchNotifications(supabase, uid);
        setNotifications(data);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    },
    [supabase],
  );

  useEffect(() => {
    if (userId) {
      // 린트 에러 방지를 위해 비동기적으로 호출하거나
      // 마운트 직후 한 번 실행되도록 보장합니다.
      const initLoad = async () => {
        await loadNotifications(userId);
      };
      initLoad();
    }
  }, [userId, loadNotifications]);

  useEffect(() => {
    if (!userId) return;

    const handleRefresh = (_event: Event) => {
      loadNotifications(userId);
    };

    // NotificationListener에서 보내는 이벤트를 수신
    window.addEventListener('zarang:refresh-notifications', handleRefresh as EventListener);

    return () => {
      window.removeEventListener('zarang:refresh-notifications', handleRefresh as EventListener);
    };
  }, [userId, loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = async (notification: NotificationWithDetails) => {
    if (!notification.is_read) {
      try {
        await markAsRead(supabase, notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)),
        );
      } catch (error) {
        console.error('Failed to mark as read', error);
      }
    }
    setOpen(false);
    router.push(`/posts/${notification.post_id}`);
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    try {
      await markAllAsRead(supabase, userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  if (!userId) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            id="notification-bell"
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 hover:bg-white/20"
          />
        }
      >
        <Bell className="size-6" strokeWidth={1.4} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white" />
        )}
      </SheetTrigger>
      <SheetContent
        showCloseButton={false}
        className="flex h-full w-full flex-col gap-0 bg-white p-0 sm:max-w-md"
      >
        <AppSheetHeader
          title="알림"
          rightContent={
            unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs text-muted-foreground"
              >
                모두 읽음
              </Button>
            )
          }
        />

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
              <p className="text-sm">알림이 없습니다.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex cursor-pointer items-start gap-3 border-b p-4 transition-colors hover:bg-muted/50 ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                    {notification.actor?.avatar_url ? (
                      <Image
                        src={notification.actor.avatar_url}
                        alt="avatar"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-neutral-200" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">
                        {notification.actor?.username || '누군가'}
                      </span>
                      님이{' '}
                      {notification.type === 'REPLY'
                        ? '회원님의 댓글에 답글을 남겼어요.'
                        : '회원님의 게시글에 댓글을 남겼어요.'}
                    </p>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at || new Date()), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                  </div>

                  {notification.post?.thumbnail_url && (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border">
                      <Image
                        src={notification.post.thumbnail_url}
                        alt="post thumbnail"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
