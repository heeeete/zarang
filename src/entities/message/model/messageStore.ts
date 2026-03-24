import { create } from 'zustand';
import { createClient } from '@/src/shared/lib/supabase/client';
import { fetchChatRooms } from '@/src/entities/chat/api/chat-api';

interface MessageState {
  hasUnread: boolean;
  setHasUnread: (value: boolean) => void;
  refreshUnreadStatus: (userId: string) => Promise<void>;
}

export const useMessageStore = create<MessageState>((set) => ({
  hasUnread: false,
  setHasUnread: (value) => set({ hasUnread: value }),
  refreshUnreadStatus: async (userId: string) => {
    try {
      const supabase = createClient();
      const rooms = await fetchChatRooms(supabase, userId);
      const hasUnread = rooms.some(room => (room.unread_count ?? 0) > 0);
      set({ hasUnread });
    } catch (error) {
      console.error('Failed to refresh unread status:', error);
    }
  },
}));
