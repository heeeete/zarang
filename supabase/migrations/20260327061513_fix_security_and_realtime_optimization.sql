-- 1. SECURITY DEFINER 뷰 수정 (ERROR 해결)
-- Postgres 15+ 에서는 security_invoker = true 를 사용하여 뷰를 쿼리하는 사용자의 권한으로 실행되게 설정합니다.
DROP VIEW IF EXISTS public.explore_posts_with_author;
CREATE VIEW public.explore_posts_with_author 
WITH (security_invoker = true)
AS
SELECT 
    p.id,
    p.description,
    p.thumbnail_url,
    p.audio_url,
    p.category_id,
    p.created_at,
    pr.username AS author_username,
    pr.id AS author_id,
    pr.avatar_url AS author_avatar_url,
    p.likes_count,
    p.comments_count,
    p.thumbnail_width,
    p.thumbnail_height
FROM public.posts p
JOIN public.profiles pr ON p.author_id = pr.id;

-- 2. 모든 함수에 SET search_path = '' 추가 (WARN 해결)
-- 보안 강화를 위해 빈 search_path를 설정하고 함수 내부에서 모든 객체를 스키마와 함께 명시합니다.

-- handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = '';

-- handle_new_comment_notification
ALTER FUNCTION public.handle_new_comment_notification() SET search_path = '';

-- handle_post_like_change
ALTER FUNCTION public.handle_post_like_change() SET search_path = '';

-- handle_post_comment_change
ALTER FUNCTION public.handle_post_comment_change() SET search_path = '';

-- handle_post_image_sync
ALTER FUNCTION public.handle_post_image_sync() SET search_path = '';

-- get_home_feed (재정의)
ALTER FUNCTION public.get_home_feed(uuid, integer, integer) SET search_path = '';

-- handle_hard_delete_chat_room
ALTER FUNCTION public.handle_hard_delete_chat_room() SET search_path = '';

-- 3. 과도하게 허용된 RLS 정책 강화 (WARN 해결)
-- chat_rooms: INSERT 시 단순 true 대신 인증된 사용자임을 체크
DROP POLICY IF EXISTS "rooms_insert_policy" ON public.chat_rooms;
CREATE POLICY "rooms_insert_policy" ON public.chat_rooms 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

-- chat_participants: 나를 포함한 방을 만들거나 참여자를 추가하는 것만 허용하도록 강화
DROP POLICY IF EXISTS "participants_insert_policy" ON public.chat_participants;
CREATE POLICY "participants_insert_policy" ON public.chat_participants 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Realtime 성능 최적화
-- chat_participants 테이블은 last_read_at 업데이트가 매우 빈번하므로, 
-- 꼭 필요한 경우가 아니라면 Realtime 감시 대상에서 제외하거나, 
-- REPLICA IDENTITY를 변경하여 부하를 줄입니다.
-- (현재 알림 카운트 갱신을 위해 사용 중이므로 활성화는 유지하되 REPLICA IDENTITY FULL 설정)
ALTER TABLE public.chat_participants REPLICA IDENTITY FULL;

-- 5. 비정상적인 호출 횟수 방지를 위한 안내
-- 현재 Realtime 953회 호출은 클라이언트 사이드에서 useEffect 내의 supabase.channel().subscribe()가 
-- 컴포넌트 리렌더링 시마다 반복 실행되고 있을 확률이 매우 높습니다. 
-- Migration 적용 후 프론트엔드 코드의 cleanup 함수(removeChannel)가 잘 작동하는지 재검토가 필요합니다.
