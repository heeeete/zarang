-- notifications 조회 성능 최적화: (user_id, created_at DESC) 복합 인덱스 생성
-- 기존 idx_notifications_user_id는 이 복합 인덱스로 대체 가능하므로 삭제합니다.

DROP INDEX IF EXISTS public.idx_notifications_user_id;
CREATE INDEX idx_notifications_user_id_created_at ON public.notifications (user_id, created_at DESC);
