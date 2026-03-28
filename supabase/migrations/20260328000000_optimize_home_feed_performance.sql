-- 1. 글로벌 생성일자 정렬 인덱스 추가 (홈 피드 최적화)
-- 범용 피드 정렬과 시간 기반 필터링을 가속화합니다.
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc ON public.posts (created_at DESC);

-- 2. get_home_feed 함수 성능 최적화 (범위 제한 및 비로그인 분기 처리)
CREATE OR REPLACE FUNCTION public.get_home_feed(p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 10, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, author_id uuid, description text, thumbnail_url text, audio_url text, category_id uuid, created_at timestamp with time zone, author_username text, likes_count bigint, comments_count bigint, score double precision, width integer, height integer, author_avatar_url text)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  -- 비로그인 유저(p_user_id IS NULL)를 위한 단순 경로
  IF p_user_id IS NULL THEN
    RETURN QUERY
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
        (p.likes_count * 1.0 + p.comments_count * 2.0) +
        (50.0 / (1.0 + EXTRACT(EPOCH FROM (now() - p.created_at)) / 86400.0))
      )::FLOAT8 AS score,
      COALESCE(p.thumbnail_width, 800) AS width,   
      COALESCE(p.thumbnail_height, 800) AS height, 
      pr.avatar_url AS author_avatar_url
    FROM public.posts p
    JOIN public.profiles pr ON p.author_id = pr.id
    WHERE p.created_at > (now() - interval '30 days') -- 후보군을 최근 30일로 제한하여 스캔 성능 비약적 향상
    ORDER BY score DESC, p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
  ELSE
    -- 로그인 유저를 위한 개인화 경로
    RETURN QUERY
    WITH followed_authors AS (
      SELECT f.following_id FROM public.follows f WHERE f.follower_id = p_user_id
    ),
    combined_prefs AS (
      SELECT pref_p.category_id AS cat_id, COUNT(*) * 8.0 AS weight
      FROM public.post_likes pref_pl
      JOIN public.posts pref_p ON pref_p.id = pref_pl.post_id
      WHERE pref_pl.user_id = p_user_id
      GROUP BY pref_p.category_id
      UNION ALL
      SELECT pref_p.category_id AS cat_id, COUNT(*) * 10.0 AS weight
      FROM public.posts pref_p
      JOIN public.comments pref_c ON pref_p.id = pref_c.post_id
      WHERE pref_c.author_id = p_user_id
      GROUP BY pref_p.category_id
    ),
    agg_preferences AS (
      SELECT cp.cat_id AS pref_cat_id, SUM(cp.weight) AS total_weight
      FROM combined_prefs cp
      GROUP BY cp.cat_id
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
    WHERE p.created_at > (now() - interval '30 days') -- 후보군을 최근 30일로 제한
    ORDER BY score DESC, p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
  END IF;
END;
$function$;
