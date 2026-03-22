-- 1. Realtime Publication 설정
-- supabase_realtime Publication이 존재하는지 확인하고, 없다면 생성합니다.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN 
        CREATE PUBLICATION supabase_realtime; 
    END IF; 
END $$;

-- notifications 테이블을 실시간 감시 대상으로 추가합니다.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;

-- 2. 알림 생성 함수 (full_schema.sql L195-219에서 추출한 원본 소스)
CREATE OR REPLACE FUNCTION "public"."handle_new_comment_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  target_user_id uuid;
  notification_type text;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    -- 답글인 경우 원댓글 작성자 찾기
    SELECT author_id INTO target_user_id FROM public.comments WHERE id = NEW.parent_id;
    notification_type := 'REPLY';
  ELSE
    -- 일반 댓글인 경우 게시글 작성자 찾기
    SELECT author_id INTO target_user_id FROM public.posts WHERE id = NEW.post_id;
    notification_type := 'COMMENT';
  END IF;

  -- 자기 자신에게는 알림을 생성하지 않음
  IF target_user_id IS NOT NULL AND target_user_id != NEW.author_id THEN
    INSERT INTO public.notifications (user_id, actor_id, type, post_id, comment_id)
    VALUES (target_user_id, NEW.author_id, notification_type, NEW.post_id, NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."handle_new_comment_notification"() OWNER TO "postgres";

-- 3. 트리거 생성 (full_schema.sql L540에서 추출한 원본 소스)
DROP TRIGGER IF EXISTS "on_comment_created" ON "public"."comments";

CREATE OR REPLACE TRIGGER "on_comment_created" AFTER INSERT ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_comment_notification"();
