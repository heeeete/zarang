import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/src/shared/types/database';
import { ChatRoom, Message } from '../model/types';

/**
 * 내가 참여 중인 채팅방 목록을 가져옵니다.
 */
export const fetchChatRooms = async (supabase: SupabaseClient<Database>, userId: string): Promise<ChatRoom[]> => {
  // 1. 내가 참여 중인 방 ID 목록을 가져옵니다.
  const { data: myParticipations, error: partError } = await supabase
    .from('chat_participants' as 'profiles')
    .select('room_id')
    .eq('user_id', userId);

  if (partError) throw partError;
  
  const participations = (myParticipations as unknown as { room_id: string }[]) || [];
  const roomIds = participations.map((p) => p.room_id);
  if (roomIds.length === 0) return [];

  // 2. 해당 방들의 정보, 참여자 프로필, 그리고 '최신 메시지 1개'만 가져옵니다.
  const { data: roomsData, error: roomsError } = await supabase
    .from('chat_rooms' as 'profiles')
    .select(`
      id,
      created_at,
      participants:chat_participants (
        user_id,
        last_read_at,
        user:profiles (id, username, avatar_url)
      ),
      messages (
        id,
        content,
        created_at,
        sender_id
      )
    `)
    .in('id', roomIds)
    .order('created_at', { referencedTable: 'messages', ascending: false });

  if (roomsError) throw roomsError;

  const rawRooms = (roomsData as unknown as (ChatRoom & { messages: Message[] })[]) || [];

  return rawRooms.map(room => {
    // 내가 참여한 정보 찾기
    const myParticipant = room.participants.find(p => p.user_id === userId);
    const lastReadAt = myParticipant?.last_read_at || new Date(0).toISOString();

    // 안 읽은 메시지 수 계산 (내가 보낸 게 아니고, 마지막 읽은 시간 이후인 것)
    const unreadMessages = room.messages.filter(
      m => m.sender_id !== userId && m.created_at > lastReadAt
    );

    return {
      ...room,
      last_message: room.messages?.[0], // 정렬 결과의 첫 번째가 최신 메시지
      unread_count: unreadMessages.length
    };
  });
};

/**
 * 특정 채팅방의 메시지 내역을 가져옵니다 (커서 기반 페이지네이션 지원).
 */
export const fetchMessages = async (
  supabase: SupabaseClient<Database>,
  roomId: string,
  options?: { lastCreatedAt?: string; limit?: number }
): Promise<Message[]> => {
  const limit = options?.limit || 50;
  
  const query = supabase
    .from('messages' as 'profiles')
    .select(`
      *,
      sender:profiles (id, username, avatar_url)
    `)
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (options?.lastCreatedAt) {
    query.lt('created_at', options.lastCreatedAt);
  }

  const { data, error } = await (query as unknown as Promise<{ data: Message[] | null; error: unknown }>);
  if (error) throw error;
  
  const messages = data || [];
  return [...messages].reverse();
};

/**
 * 메시지를 전송합니다.
 */
export const sendMessage = async (
  supabase: SupabaseClient<Database>,
  roomId: string,
  senderId: string,
  content: string
) => {
  const { data, error } = await supabase
    .from('messages' as 'profiles')
    .insert({
      room_id: roomId,
      sender_id: senderId,
      content
    } as unknown as Database['public']['Tables']['profiles']['Insert'])
    .select()
    .single();

  if (error) throw error;
  return data as unknown as Message;
};

/**
 * 두 유저 사이의 기존 채팅방이 있는지 확인합니다.
 */
export const findExistingChatRoom = async (
  supabase: SupabaseClient<Database>,
  myId: string,
  targetUserId: string
): Promise<string | null> => {
  const { data: myParticipations } = await supabase
    .from('chat_participants' as 'profiles')
    .select('room_id')
    .eq('user_id', myId);

  const participations = (myParticipations as unknown as { room_id: string }[]) || [];

  if (participations.length > 0) {
    const myRoomIds = participations.map(p => p.room_id);

    const { data: commonRoom } = await supabase
      .from('chat_participants' as 'profiles')
      .select('room_id')
      .in('room_id', myRoomIds)
      .eq('user_id', targetUserId)
      .limit(1)
      .maybeSingle();

    if (commonRoom) return (commonRoom as unknown as { room_id: string }).room_id;
  }
  
  return null;
};

/**
 * 두 유저 사이의 채팅방을 찾거나 새로 생성합니다 (1:1 채팅).
 */
export const getOrCreateChatRoom = async (
  supabase: SupabaseClient<Database>,
  myId: string,
  targetUserId: string
): Promise<string> => {
  const existingRoomId = await findExistingChatRoom(supabase, myId, targetUserId);
  if (existingRoomId) return existingRoomId;

  const { data: newRoom, error: roomError } = await supabase
    .from('chat_rooms' as 'profiles')
    .insert({} as unknown as Database['public']['Tables']['profiles']['Insert'])
    .select()
    .single();

  if (roomError) throw roomError;

  const createdRoom = newRoom as unknown as { id: string };

  await supabase.from('chat_participants' as 'profiles').insert([
    { room_id: createdRoom.id, user_id: myId },
    { room_id: createdRoom.id, user_id: targetUserId }
  ] as unknown as Database['public']['Tables']['profiles']['Insert'][]);

  return createdRoom.id;
};

/**
 * 특정 채팅방의 마지막 읽은 시간을 현재로 업데이트합니다.
 */
export const updateLastReadAt = async (
  supabase: SupabaseClient<Database>,
  roomId: string,
  userId: string
) => {
  await supabase
    .from('chat_participants' as 'profiles')
    .update({ last_read_at: new Date().toISOString() } as unknown as Database['public']['Tables']['profiles']['Insert'])
    .eq('room_id', roomId)
    .eq('user_id', userId);
};
