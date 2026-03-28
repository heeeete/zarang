import { renderHook, cleanup } from '@testing-library/react';
import { useChatMessages } from './useChatMessages';
import { createClient } from '@/src/shared/lib/supabase/client';
import { useMessageStore } from '@/src/entities/message/model/messageStore';

// Mocking dependencies
jest.mock('@/src/shared/lib/supabase/client');
jest.mock('@/src/entities/message/model/messageStore');
jest.mock('../api/update-last-read-at', () => ({ updateLastReadAt: jest.fn().mockResolvedValue({}) }));

describe('useChatMessages', () => {
  let mockSupabase: any;
  let mockChannel: any;

  beforeEach(() => {
    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    };

    mockSupabase = {
      channel: jest.fn().mockReturnValue(mockChannel),
      removeChannel: jest.fn(),
      from: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    (useMessageStore as unknown as jest.Mock).mockReturnValue(jest.fn());
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('roomId가 바뀔 때만 채널이 재생성되는지 확인', () => {
    const { rerender } = renderHook(
      ({ roomId }) => useChatMessages(roomId, [], null, 'user-1'),
      { initialProps: { roomId: 'room-1' } }
    );

    expect(mockSupabase.channel).toHaveBeenCalledTimes(1);

    // Rerender with same roomId
    rerender({ roomId: 'room-1' });
    expect(mockSupabase.channel).toHaveBeenCalledTimes(1);

    // Rerender with different roomId
    rerender({ roomId: 'room-2' });
    expect(mockSupabase.channel).toHaveBeenCalledTimes(2);
  });

  it('currentUserId가 바뀌어도 채널이 재생성되지 않는지 확인', () => {
    const { rerender } = renderHook(
      ({ currentUserId }) => useChatMessages('room-1', [], null, currentUserId),
      { initialProps: { currentUserId: 'user-1' } }
    );

    expect(mockSupabase.channel).toHaveBeenCalledTimes(1);

    // Rerender with different currentUserId
    rerender({ currentUserId: 'user-2' });
    expect(mockSupabase.channel).toHaveBeenCalledTimes(1); // Should NOT be called again
  });

  it('cleanup 시 removeChannel이 호출되는지 확인', () => {
    const { unmount } = renderHook(() => useChatMessages('room-1', [], null, 'user-1'));
    unmount();
    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });
});
