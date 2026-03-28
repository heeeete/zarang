import { render, cleanup, act } from '@testing-library/react';
import { MessageListClient } from './MessageListClient';
import { createClient } from '@/src/shared/lib/supabase/client';
import { ChatRoom } from '@/src/entities/chat/model/types';

// Mocking dependencies
jest.mock('@/src/shared/lib/supabase/client');
jest.mock('@/src/entities/chat/api/delete-chat-room');
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

describe('MessageListClient', () => {
  let mockSupabase: any;
  const mockRooms: ChatRoom[] = [
    {
      id: 'room-1',
      created_at: new Date().toISOString(),
      participants: [
        { user_id: 'user-1', user: { username: 'me', avatar_url: null } },
        { user_id: 'user-2', user: { username: 'other', avatar_url: null } }
      ],
      unread_count: 0,
    } as any
  ];

  beforeEach(() => {
    mockSupabase = {
      channel: jest.fn(),
      from: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    jest.spyOn(window, 'addEventListener');
    jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('channel() 호출이 없는지 확인 (Supabase 직접 구독 없음)', () => {
    render(<MessageListClient userId="user-1" initialRooms={mockRooms} />);
    expect(mockSupabase.channel).not.toHaveBeenCalled();
  });

  it('zarang:refresh-messages 수신 시 해당 room의 unread_count가 증가하는지 확인', async () => {
    const { getByText, queryByText } = render(<MessageListClient userId="user-1" initialRooms={mockRooms} />);
    
    // Simulate receiving message 1
    await act(async () => {
      window.dispatchEvent(new CustomEvent('zarang:refresh-messages', {
        detail: { room_id: 'room-1', sender_id: 'user-2', content: 'first message', created_at: new Date().toISOString() }
      }));
    });

    // unread_count is 1, should show the message content
    expect(getByText('first message')).toBeInTheDocument();

    // Simulate receiving message 2
    await act(async () => {
      window.dispatchEvent(new CustomEvent('zarang:refresh-messages', {
        detail: { room_id: 'room-1', sender_id: 'user-2', content: 'second message', created_at: new Date().toISOString() }
      }));
    });

    // unread_count is 2, should show "새 메시지 2개"
    expect(getByText(/새 메시지 2개/)).toBeInTheDocument();
  });

  it('sender_id가 본인일 때는 무시되는지 확인', async () => {
    const { queryByText } = render(<MessageListClient userId="user-1" initialRooms={mockRooms} />);
    
    // Simulate receiving a message for room-1 from ME
    await act(async () => {
      const event = new CustomEvent('zarang:refresh-messages', {
        detail: { room_id: 'room-1', sender_id: 'user-1', content: 'my message', created_at: new Date().toISOString() }
      });
      window.dispatchEvent(event);
    });

    expect(queryByText('my message')).not.toBeInTheDocument();
  });
});
