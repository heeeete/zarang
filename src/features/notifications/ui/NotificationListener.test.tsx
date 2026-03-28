import { render, cleanup } from '@testing-library/react';
import { NotificationListener } from './NotificationListener';
import { createClient } from '@/src/shared/lib/supabase/client';
import { useAuth } from '@/src/app/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useMessageStore } from '@/src/entities/message/model/messageStore';

// Mocking dependencies
jest.mock('@/src/shared/lib/supabase/client');
jest.mock('@/src/app/providers/AuthProvider');
jest.mock('next/navigation');
jest.mock('@/src/entities/message/model/messageStore');
jest.mock('sonner', () => ({ toast: jest.fn() }));

describe('NotificationListener', () => {
  let mockSupabase: any;
  let mockChannel: any;
  let onCallbacks: Record<string, Function> = {};

  beforeEach(() => {
    onCallbacks = {};
    mockChannel = {
      on: jest.fn().mockImplementation(function(this: any) {
        const config = arguments[1];
        const callback = arguments[2];
        const key = `${config.table}:${config.event || 'ALL'}`;
        onCallbacks[key] = callback;
        return this;
      }),
      subscribe: jest.fn().mockImplementation(function(this: any) {
        return this;
      }),
    };

    mockSupabase = {
      channel: jest.fn().mockReturnValue(mockChannel),
      removeChannel: jest.fn(),
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { username: 'testuser' } }),
          }),
        }),
      }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'user-1' } });
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (useMessageStore.getState as jest.Mock).mockReturnValue({
      refreshUnreadStatus: jest.fn(),
      setHasUnread: jest.fn(),
    });

    // Mock window.dispatchEvent
    jest.spyOn(window, 'dispatchEvent');
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('채널이 1개만 생성되는지 확인', () => {
    render(<NotificationListener />);
    expect(mockSupabase.channel).toHaveBeenCalledTimes(1);
    expect(mockSupabase.channel).toHaveBeenCalledWith('user-global-updates-user-1');
  });

  it('Supabase 알림 수신 시 zarang:refresh-notifications가 dispatch되는지 확인', async () => {
    render(<NotificationListener />);
    
    // Simulate notification insert
    const callback = onCallbacks['notifications:INSERT'];
    await callback({ new: { actor_id: 'actor-1', type: 'COMMENT', post_id: 'post-1' } });

    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'zarang:refresh-notifications' })
    );
  });

  it('Supabase 메시지 수신 시 zarang:refresh-messages가 dispatch되는지 확인', async () => {
    render(<NotificationListener />);
    
    // Simulate message insert
    const callback = onCallbacks['messages:INSERT'];
    await callback({ new: { sender_id: 'sender-1', room_id: 'room-1', content: 'hello' } });

    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ 
        type: 'zarang:refresh-messages',
        detail: expect.objectContaining({ room_id: 'room-1' })
      })
    );
  });

  it('userId가 바뀔 때만 채널이 재생성되는지 확인', () => {
    const { rerender } = render(<NotificationListener />);
    expect(mockSupabase.channel).toHaveBeenCalledTimes(1);

    // Rerender with same userId
    rerender(<NotificationListener />);
    expect(mockSupabase.channel).toHaveBeenCalledTimes(1);

    // Rerender with different userId
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'user-2' } });
    rerender(<NotificationListener />);
    expect(mockSupabase.channel).toHaveBeenCalledTimes(2);
  });

  it('cleanup 시 removeChannel이 호출되는지 확인', () => {
    const { unmount } = render(<NotificationListener />);
    unmount();
    expect(mockSupabase.removeChannel).toHaveBeenCalled();
  });
});
