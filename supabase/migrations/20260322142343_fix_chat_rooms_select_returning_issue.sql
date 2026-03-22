-- 기존의 깐깐했던 조회 정책을 삭제합니다.
DROP POLICY IF EXISTS "rooms_select_policy" ON public.chat_rooms;

-- 새로운 조회 정책: 인증된 유저라면 누구나 채팅방의 존재(ID, 생성일)를 확인할 수 있게 합니다.
-- 실제 대화 내용과 참여자 정보는 각각의 테이블 정책에서 'is_chat_participant'로 완벽하게 보호됩니다.
CREATE POLICY "rooms_select_policy" ON public.chat_rooms 
FOR SELECT TO authenticated 
USING (true);
