// 채팅에서 사용하는 유저 프로필 정보 인터페이스
export interface ChatUserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface ChatRoom {
  id: string;
  created_at: string;
  last_message?: Message;
  participants: ChatParticipant[];
}

export interface ChatParticipant {
  room_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
  user?: ChatUserProfile;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: ChatUserProfile;
}
