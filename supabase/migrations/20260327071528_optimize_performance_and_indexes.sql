-- 1. 복합 인덱스(Composite Index) 최적화
-- 특정 채팅방 내에서 메시지를 시간순으로 불러올 때 Sort 작업을 제거합니다.
CREATE INDEX IF NOT EXISTS idx_messages_room_id_created_at ON public.messages (room_id, created_at DESC);

-- 특정 게시글 내에서 댓글을 최신순으로 불러올 때 Index Scan을 사용하도록 합니다.
CREATE INDEX IF NOT EXISTS idx_comments_post_id_created_at ON public.comments (post_id, created_at DESC);

-- 카테고리별 피드 필터링 및 시간순 정렬 최적화
CREATE INDEX IF NOT EXISTS idx_posts_category_id_created_at ON public.posts (category_id, created_at DESC);

-- 2. 중복 인덱스 제거
-- PK (follower_id, following_id)가 이미 follower_id 에 대한 정렬된 인덱스 역할을 수행합니다.
DROP INDEX IF EXISTS public.idx_follows_follower;

-- 3. RLS 정책 최적화 (EXISTS 문 활용으로 오버헤드 감소)
-- 댓글 삭제 권한 정책: OR 조건의 서브쿼리를 EXISTS로 변경하여 효율적으로 필터링합니다.
DROP POLICY IF EXISTS "Authors and Post Authors can delete comments." ON public.comments;
CREATE POLICY "Authors and Post Authors can delete comments." ON public.comments
FOR DELETE TO public USING (
  (SELECT auth.uid()) = author_id OR 
  EXISTS (
    SELECT 1 FROM public.posts 
    WHERE id = comments.post_id AND author_id = (SELECT auth.uid())
  )
);

-- 4. get_home_feed 함수 성능 최적화
-- 선호도 점수 계산 로직의 스캔 횟수를 줄이기 위해 CTE를 간소화하고 조인을 최적화합니다.
CREATE OR REPLACE FUNCTION public.get_home_feed(p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 10, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, author_id uuid, description text, thumbnail_url text, audio_url text, category_id uuid, created_at timestamp with time zone, author_username text, likes_count bigint, comments_count bigint, score double precision, width integer, height integer, author_avatar_url text)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  WITH combined_prefs AS (
    -- 좋아요와 댓글 선호도를 단일 CTE에서 결합하여 posts 테이블 조인을 효율화
    SELECT pref_p.category_id, COUNT(*) * 8.0 AS weight
    FROM public.post_likes pref_pl
    JOIN public.posts pref_p ON pref_p.id = pref_pl.post_id
    WHERE pref_pl.user_id = p_user_id
    GROUP BY pref_p.category_id
    UNION ALL
    SELECT pref_p.category_id, COUNT(*) * 10.0 AS weight
    FROM public.comments pref_c
    JOIN public.posts pref_p ON pref_p.id = pref_c.post_id
    WHERE pref_c.author_id = p_user_id
    GROUP BY pref_p.category_id
  ),
  agg_preferences AS (
    -- 카테고리별 최종 가중치 합산
    SELECT category_id AS pref_cat_id, SUM(weight) AS total_weight
    FROM combined_prefs
    GROUP BY category_id
  ),
  followed_authors AS (
    -- 팔로우 여부 체크용 (메인 쿼리에서 EXISTS로 사용 시 성능 유리)
    SELECT f.following_id FROM public.follows f WHERE f.follower_id = p_user_id
  )
  SELECT 
    p.id,
    p.author_id,
    p.description,
    p.thumbnail_url,
    p.audio_url,
    p.category_id,
    p.created_at,
    pr.username AS author_username,
    p.likes_count,      
    p.comments_count,   
    (
      (CASE WHEN p.author_id = p_user_id AND p.created_at > (now() - interval '1 hour') THEN 200.0 ELSE 0.0 END) +
      (CASE WHEN EXISTS (SELECT 1 FROM followed_authors fa WHERE fa.following_id = p.author_id) THEN 100.0 ELSE 0.0 END) +
      COALESCE(ap.total_weight, 0.0) +
      (p.likes_count * 1.0 + p.comments_count * 2.0) +
      (50.0 / (1.0 + EXTRACT(EPOCH FROM (now() - p.created_at)) / 86400.0))
    )::FLOAT8 AS score,
    COALESCE(p.thumbnail_width, 800) AS width,   
    COALESCE(p.thumbnail_height, 800) AS height, 
    pr.avatar_url AS author_avatar_url
  FROM public.posts p
  JOIN public.profiles pr ON p.author_id = pr.id
  LEFT JOIN agg_preferences ap ON p.category_id = ap.pref_cat_id
  ORDER BY score DESC, p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;
