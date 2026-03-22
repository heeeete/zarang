-- 1. 무한 루프 방지를 위한 보안 함수 생성 (SECURITY DEFINER)
-- 이 함수는 RLS를 우회하여 실행되므로 안전하게 참여 여부를 체크할 수 있습니다.
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

-- 2. 기존 정책들 모두 삭제
DROP POLICY IF EXISTS "Participants can view their rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view their own participant records" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view other participants in their rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Authenticated users can add participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON public.chat_participants;
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can insert messages" ON public.messages;

-- 3. 새로운 최적화된 정책 적용

-- [chat_rooms]
CREATE POLICY "View rooms" ON public.chat_rooms
FOR SELECT TO authenticated
USING (public.is_chat_participant(id));

CREATE POLICY "Create rooms" ON public.chat_rooms
FOR INSERT TO authenticated
WITH CHECK (true);

-- [chat_participants]
CREATE POLICY "View participants" ON public.chat_participants
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()) OR public.is_chat_participant(room_id));

CREATE POLICY "Insert participants" ON public.chat_participants
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Update own participant record" ON public.chat_participants
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()));

-- [messages]
CREATE POLICY "View messages" ON public.messages
FOR SELECT TO authenticated
USING (public.is_chat_participant(room_id));

CREATE POLICY "Insert messages" ON public.messages
FOR INSERT TO authenticated
WITH CHECK (sender_id = (SELECT auth.uid()) AND public.is_chat_participant(room_id));
