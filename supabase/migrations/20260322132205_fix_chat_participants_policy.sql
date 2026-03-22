-- 기존에 문제있던 정책을 삭제합니다.
DROP POLICY IF EXISTS "Participants can view room participants" ON public.chat_participants;

-- 새로운 정책: 내가 참여한 방의 다른 참여자 정보를 볼 수 있도록 수정 (무한 루프 방지)
-- 1. 내 자신의 기록은 언제나 볼 수 있음
-- 2. 내가 참여한 다른 방의 정보는 room_id를 기반으로만 체크하도록 단순화
CREATE POLICY "Users can view their own participant records" ON public.chat_participants
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view other participants in their rooms" ON public.chat_participants
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.chat_rooms 
        WHERE id = chat_participants.room_id 
        AND EXISTS (
            SELECT 1 FROM public.chat_participants p 
            WHERE p.room_id = chat_rooms.id AND p.user_id = (SELECT auth.uid())
        )
    )
);
