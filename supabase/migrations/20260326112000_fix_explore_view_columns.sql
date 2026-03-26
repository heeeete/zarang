-- explore_posts_with_author 뷰에 역정규화된 컬럼 추가 및 성능 개선
CREATE OR REPLACE VIEW public.explore_posts_with_author AS
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
    p.likes_count,      -- 추가
    p.comments_count,   -- 추가
    p.thumbnail_width,  -- 추가
    p.thumbnail_height  -- 추가
FROM public.posts p
JOIN public.profiles pr ON p.author_id = pr.id;
