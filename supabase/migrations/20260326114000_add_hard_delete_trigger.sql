-- 모든 참여자가 채팅방을 삭제했을 때 물리적으로 데이터를 삭제하는 트리거
CREATE OR REPLACE FUNCTION public.handle_hard_delete_chat_room()
RETURNS trigger AS $$
DECLARE
  all_deleted boolean;
BEGIN
  -- 1. 해당 방의 모든 참여자가 deleted_at을 가지고 있는지 확인
  SELECT NOT EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE room_id = NEW.room_id AND deleted_at IS NULL
  ) INTO all_deleted;

  -- 2. 모든 참여자가 삭제했다면 방 자체를 삭제 (연쇄 삭제 트리거)
  IF all_deleted THEN
    DELETE FROM public.chat_rooms WHERE id = NEW.room_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 등록
DROP TRIGGER IF EXISTS on_chat_participant_deleted ON public.chat_participants;
CREATE TRIGGER on_chat_participant_deleted
AFTER UPDATE OF deleted_at ON public.chat_participants
FOR EACH ROW
WHEN (NEW.deleted_at IS NOT NULL)
EXECUTE FUNCTION public.handle_hard_delete_chat_room();
