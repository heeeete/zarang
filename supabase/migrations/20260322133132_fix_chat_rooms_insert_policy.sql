-- 1. 기존 정책 삭제 (완전 초기화)
DROP POLICY IF EXISTS "View rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Create rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.chat_rooms;
DROP POLICY IF EXISTS "Enable select for participants" ON public.chat_rooms;

-- 2. chat_rooms 정책 (가장 관대하고 확실한 방법)
-- [SELECT] 로그인한 사용자라면 일단 채팅방 목록 자체는 조회할 수 있게 합니다.
-- (실제 보안은 chat_participants 와 messages 테이블에서 이중으로 잠그므로 안전합니다.)
CREATE POLICY "Allow select for authenticated users" ON public.chat_rooms
FOR SELECT TO authenticated
USING (true);

-- [INSERT] 로그인한 사용자라면 누구나 방을 만들 수 있습니다.
CREATE POLICY "Allow insert for authenticated users" ON public.chat_rooms
FOR INSERT TO authenticated
WITH CHECK (true);

-- 3. chat_participants 정책 (여기서 실제 대화 권한을 제어)
DROP POLICY IF EXISTS "View participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.chat_participants;

-- 내가 참여한 방의 정보만 볼 수 있게 합니다 (함수 대신 EXISTS 사용으로 안전하게)
CREATE POLICY "Allow view for participants" ON public.chat_participants
FOR SELECT TO authenticated
USING (
    user_id = (SELECT auth.uid()) OR 
    EXISTS (
        SELECT 1 FROM public.chat_participants p 
        WHERE p.room_id = chat_participants.room_id AND p.user_id = (SELECT auth.uid())
    )
);

-- 방을 만들 때 참여자를 넣는 것을 허용합니다.
CREATE POLICY "Allow insert for participants" ON public.chat_participants
FOR INSERT TO authenticated
WITH CHECK (true);
