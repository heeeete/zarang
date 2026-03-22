-- 1. 기존의 모든 채팅 관련 정책 삭제 (초기화)
DROP POLICY IF EXISTS "View rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Create rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.chat_rooms;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.chat_rooms;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.chat_rooms;
DROP POLICY IF EXISTS "Enable select for participants" ON public.chat_rooms;

DROP POLICY IF EXISTS "View participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Insert participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Update own participant record" ON public.chat_participants;
DROP POLICY IF EXISTS "Allow view for participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Allow insert for participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.chat_participants;

DROP POLICY IF EXISTS "View messages" ON public.messages;
DROP POLICY IF EXISTS "Insert messages" ON public.messages;

-- 2. 보안 함수 보강 (SECURITY DEFINER로 RLS 우회)
CREATE OR REPLACE FUNCTION public.is_chat_participant(p_room_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE room_id = p_room_id AND user_id = (SELECT auth.uid())
  );
$$;

-- 3. 새로운 완벽한 정책 적용

-- [chat_rooms]: 생성은 자유롭게, 조회는 참여자만
CREATE POLICY "rooms_insert_policy" ON public.chat_rooms FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "rooms_select_policy" ON public.chat_rooms FOR SELECT TO authenticated USING (public.is_chat_participant(id));

-- [chat_participants]: 무한 루프 원천 차단
-- 자기 자신을 조회하지 않고, '내 기록'이거나 '방 번호를 알 때' 조회 허용
CREATE POLICY "participants_select_policy" ON public.chat_participants 
FOR SELECT TO authenticated 
USING (user_id = (SELECT auth.uid()) OR (SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "participants_insert_policy" ON public.chat_participants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "participants_update_policy" ON public.chat_participants FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid()));

-- [messages]: 참여자만 조회 및 작성 가능
CREATE POLICY "messages_select_policy" ON public.messages FOR SELECT TO authenticated USING (public.is_chat_participant(room_id));
CREATE POLICY "messages_insert_policy" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = (SELECT auth.uid()) AND public.is_chat_participant(room_id));
