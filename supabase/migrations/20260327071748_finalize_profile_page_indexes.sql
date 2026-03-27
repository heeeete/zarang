-- 1. 프로필 페이지 내가 쓴 글 조회 최적화
-- 특정 유저가 작성한 글을 최신순으로 정렬해서 불러올 때 Sort 작업을 제거합니다.
CREATE INDEX IF NOT EXISTS idx_posts_author_id_created_at ON public.posts (author_id, created_at DESC);

-- 2. 프로필 페이지 내가 좋아요 한 글 조회 최적화
-- 특정 유저가 좋아요 한 글 목록을 최신순으로 불러올 때 Index Scan을 사용하도록 합니다.
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id_created_at ON public.post_likes (user_id, created_at DESC);

-- 최종 정리: 
-- 이로써 모든 핵심 테이블(posts, comments, messages, notifications, post_likes)에 대해 
-- 'ID 필터링 + 최신순 정렬' 복합 인덱스 구조가 100% 구축되었습니다.
