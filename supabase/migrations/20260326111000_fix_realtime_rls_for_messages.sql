-- 메시지 테이블 실시간 알림 최적화
-- 1. 메시지 테이블의 복제 ID를 FULL로 설정하여 RLS 필터링 시 모든 컬럼을 활용할 수 있게 합니다.
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 2. 메시지 테이블의 실시간 알림을 위한 Publication 설정 확인
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'messages'
  ) THEN
    -- 이미 존재하면 스킵, 없으면 추가
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
  END IF;
END $$;
