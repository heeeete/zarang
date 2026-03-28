import { render, cleanup, act } from '@testing-library/react';
import { NotificationBell } from './NotificationBell';
import { createClient } from '@/src/shared/lib/supabase/client';
import { useAuth } from '@/src/app/providers/AuthProvider';
import { fetchNotifications } from '../api/notification-api';
import { SupabaseClient } from '@supabase/supabase-js';

// Mocking dependencies
jest.mock('@/src/shared/lib/supabase/client');
jest.mock('@/src/app/providers/AuthProvider');
jest.mock('../api/notification-api');
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

describe('NotificationBell', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    mockSupabase = {
      channel: jest.fn(),
      from: jest.fn(),
    } as unknown as jest.Mocked<SupabaseClient>;

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'user-1' } });
    (fetchNotifications as jest.Mock).mockResolvedValue([]);

    jest.spyOn(window, 'addEventListener');
    jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('channel() 호출이 없는지 확인 (Supabase 직접 구독 없음)', async () => {
    await act(async () => {
      render(<NotificationBell />);
    });
    expect(mockSupabase.channel).not.toHaveBeenCalled();
  });

  it('zarang:refresh-notifications 수신 시 loadNotifications(fetchNotifications)가 호출되는지 확인', async () => {
    await act(async () => {
      render(<NotificationBell />);
    });

    // Initial fetch
    expect(fetchNotifications).toHaveBeenCalledTimes(1);

    // Simulate custom event
    await act(async () => {
      window.dispatchEvent(new CustomEvent('zarang:refresh-notifications'));
    });

    expect(fetchNotifications).toHaveBeenCalledTimes(2);
  });

  it('cleanup 시 removeEventListener가 호출되는지 확인', async () => {
    let unmount: () => void;
    await act(async () => {
      const result = render(<NotificationBell />);
      unmount = result.unmount;
    });

    expect(window.addEventListener).toHaveBeenCalledWith(
      'zarang:refresh-notifications',
      expect.any(Function),
    );

    unmount!();
    expect(window.removeEventListener).toHaveBeenCalledWith(
      'zarang:refresh-notifications',
      expect.any(Function),
    );
  });
});
