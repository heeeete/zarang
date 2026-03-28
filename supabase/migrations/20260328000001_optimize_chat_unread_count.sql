-- 특정 유저의 모든 방별 안 읽은 메시지 개수를 한 번에 반환하는 최적화 함수
CREATE OR REPLACE FUNCTION public.get_unread_counts(p_user_id uuid)
RETURNS TABLE (room_id uuid, unread_count bigint) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.room_id,
        COUNT(m.id) as unread_count
    FROM public.chat_participants cp
    JOIN public.messages m ON m.room_id = cp.room_id
    WHERE cp.user_id = p_user_id
      AND m.sender_id != p_user_id
      -- 마지막 읽은 시간(last_read_at)과 방 삭제 시점(deleted_at) 중 최신값 이후의 메시지만 카운트
      AND m.created_at > GREATEST(COALESCE(cp.last_read_at, '1970-01-01'::timestamp with time zone), COALESCE(cp.deleted_at, '1970-01-01'::timestamp with time zone))
    GROUP BY cp.room_id;
END;
$$;
