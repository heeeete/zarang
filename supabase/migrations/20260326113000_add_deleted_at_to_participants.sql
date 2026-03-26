-- 1. 참여자별 채팅방 삭제(숨김) 시점을 기록할 컬럼 추가
ALTER TABLE public.chat_participants 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- 2. 메시지 조회 RLS 정책 강화 (Soft Delete 반영)
-- 기존의 messages_select_policy를 삭제하고 새 정책을 적용합니다.
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "View messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;

CREATE POLICY "messages_select_policy" ON public.messages
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.chat_participants
        WHERE room_id = public.messages.room_id 
        AND user_id = (SELECT auth.uid())
        AND (deleted_at IS NULL OR public.messages.created_at > deleted_at)
    )
);

-- 3. 성능 최적화를 위한 인덱스 추가 (deleted_at 필터링 대비)
CREATE INDEX IF NOT EXISTS idx_chat_participants_deleted_at ON public.chat_participants(deleted_at);
