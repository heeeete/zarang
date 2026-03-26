-- 1. posts 테이블에 역정규화 컬럼 추가
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS likes_count bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS thumbnail_width integer,
ADD COLUMN IF NOT EXISTS thumbnail_height integer;

-- 2. 기존 데이터 마이그레이션 (현재 상태 동기화)
UPDATE public.posts p
SET 
  likes_count = (SELECT count(*) FROM public.post_likes WHERE post_id = p.id),
  comments_count = (SELECT count(*) FROM public.comments WHERE post_id = p.id),
  thumbnail_width = (
    SELECT width FROM public.post_images 
    WHERE post_id = p.id 
    ORDER BY sort_order ASC LIMIT 1
  ),
  thumbnail_height = (
    SELECT height FROM public.post_images 
    WHERE post_id = p.id 
    ORDER BY sort_order ASC LIMIT 1
  );

-- 3. 좋아요 카운트 자동 업데이트 함수 및 트리거
CREATE OR REPLACE FUNCTION public.handle_post_like_change()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_like_change ON public.post_likes;
CREATE TRIGGER on_post_like_change
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.handle_post_like_change();

-- 4. 댓글 카운트 자동 업데이트 함수 및 트리거
CREATE OR REPLACE FUNCTION public.handle_post_comment_change()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_comment_change ON public.comments;
CREATE TRIGGER on_post_comment_change
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.handle_post_comment_change();

-- 5. 이미지 크기 정보 자동 동기화 트리거
CREATE OR REPLACE FUNCTION public.handle_post_image_sync()
RETURNS trigger AS $$
BEGIN
  -- 변경된 이미지가 첫 번째 이미지(sort_order 가 가장 작은 것)일 가능성이 있으므로 재계산 후 업데이트
  UPDATE public.posts p
  SET 
    thumbnail_width = pi.width,
    thumbnail_height = pi.height
  FROM (
    SELECT post_id, width, height
    FROM public.post_images
    WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
    ORDER BY sort_order ASC
    LIMIT 1
  ) pi
  WHERE p.id = pi.post_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_image_sync ON public.post_images;
CREATE TRIGGER on_post_image_sync
AFTER INSERT OR UPDATE OR DELETE ON public.post_images
FOR EACH ROW EXECUTE FUNCTION public.handle_post_image_sync();

-- 6. 최적화된 get_home_feed 함수 재정의 ⚡
CREATE OR REPLACE FUNCTION public.get_home_feed(p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 10, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, author_id uuid, description text, thumbnail_url text, audio_url text, category_id uuid, created_at timestamp with time zone, author_username text, likes_count bigint, comments_count bigint, score double precision, width integer, height integer, author_avatar_url text)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH user_pref_likes AS (
    SELECT 
      pref_p.category_id AS pref_cat_id,
      COUNT(*) * 8.0 AS weight
    FROM public.post_likes pref_pl
    JOIN public.posts pref_p ON pref_p.id = pref_pl.post_id
    WHERE pref_pl.user_id = p_user_id
    GROUP BY pref_p.category_id
  ),
  user_pref_comments AS (
    SELECT 
      pref_p.category_id AS pref_cat_id,
      COUNT(*) * 10.0 AS weight
    FROM public.comments pref_c
    JOIN public.posts pref_p ON pref_p.id = pref_c.post_id
    WHERE pref_c.author_id = p_user_id
    GROUP BY pref_p.category_id
  ),
  agg_preferences AS (
    SELECT comb.pref_cat_id, SUM(comb.weight) AS total_weight
    FROM (
      SELECT * FROM user_pref_likes
      UNION ALL
      SELECT * FROM user_pref_comments
    ) comb
    GROUP BY comb.pref_cat_id
  ),
  followed_authors AS (
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
    p.likes_count,      -- 역정규화된 컬럼 사용 (빠름!)
    p.comments_count,   -- 역정규화된 컬럼 사용 (빠름!)
    (
      (CASE WHEN p.author_id = p_user_id AND p.created_at > (now() - interval '1 hour') THEN 200.0 ELSE 0.0 END) +
      (CASE WHEN p.author_id IN (SELECT following_id FROM followed_authors) THEN 100.0 ELSE 0.0 END) +
      COALESCE(ap.total_weight, 0.0) +
      (p.likes_count * 1.0 + p.comments_count * 2.0) +
      (50.0 / (1.0 + EXTRACT(EPOCH FROM (now() - p.created_at)) / 86400.0))
    )::FLOAT8 AS score,
    COALESCE(p.thumbnail_width, 800) AS width,   -- 미리 저장된 정보 사용
    COALESCE(p.thumbnail_height, 800) AS height, -- 미리 저장된 정보 사용
    pr.avatar_url AS author_avatar_url
  FROM public.posts p
  JOIN public.profiles pr ON p.author_id = pr.id
  LEFT JOIN agg_preferences ap ON p.category_id = ap.pref_cat_id
  ORDER BY score DESC, p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;

-- 7. Realtime 최적화: 불필요한 테이블 Realtime 비활성화 (선택 사항)
-- CPU 점유율이 높으므로 변경 감시 범위를 좁힙니다.
-- ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
-- ALTER PUBLICATION supabase_realtime DROP TABLE public.categories;
