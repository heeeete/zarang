import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/src/shared/types/database';

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
