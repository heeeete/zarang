-- 1. 외래 키(Foreign Key) 인덱스 추가 (schema-foreign-key-indexes)
-- JOIN 성능 및 ON DELETE CASCADE 속도 향상을 위해 인덱스가 누락된 FK 컬럼들에 인덱스를 생성합니다.

-- posts 테이블
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts (author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON public.posts (category_id);

-- comments 테이블
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments (post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments (author_id);

-- notifications 테이블
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON public.notifications (actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_post_id ON public.notifications (post_id);
CREATE INDEX IF NOT EXISTS idx_notifications_comment_id ON public.notifications (comment_id);

-- post_likes 테이블 (user_id 기준 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes (user_id);


-- 2. RLS 정책 성능 최적화 (security-rls-performance)
-- auth.uid() 및 auth.role() 호출을 (SELECT auth.uid()) 형식으로 래핑하여 캐싱 효과를 적용합니다.

-- comments 정책 최적화
DROP POLICY IF EXISTS "Authenticated users can create comments." ON public.comments;
CREATE POLICY "Authenticated users can create comments." ON public.comments
FOR INSERT TO public WITH CHECK (((SELECT auth.role()) = 'authenticated'::text));

DROP POLICY IF EXISTS "Authors can delete own comments." ON public.comments;
CREATE POLICY "Authors can delete own comments." ON public.comments
FOR DELETE TO public USING (((SELECT auth.uid()) = author_id));

DROP POLICY IF EXISTS "Authors can update own comments." ON public.comments;
CREATE POLICY "Authors can update own comments." ON public.comments
FOR UPDATE TO public USING (((SELECT auth.uid()) = author_id));

-- follows 정책 최적화
DROP POLICY IF EXISTS "Users can follow others." ON public.follows; -- 이름 오타 수정 대응
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow others" ON public.follows
FOR INSERT TO public WITH CHECK (((SELECT auth.uid()) = follower_id));

DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
CREATE POLICY "Users can unfollow" ON public.follows
FOR DELETE TO public USING (((SELECT auth.uid()) = follower_id));

-- notifications 정책 최적화
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE TO public USING (((SELECT auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT TO public USING (((SELECT auth.uid()) = user_id));

-- post_images 정책 최적화 (서브쿼리 EXISTS 포함 최적화)
DROP POLICY IF EXISTS "Post authors can manage images." ON public.post_images;
CREATE POLICY "Post authors can manage images." ON public.post_images
FOR ALL TO public USING (
    EXISTS (
        SELECT 1 FROM public.posts 
        WHERE posts.id = post_images.post_id 
        AND posts.author_id = (SELECT auth.uid())
    )
);

-- post_likes 정책 최적화
DROP POLICY IF EXISTS "Users can toggle own likes." ON public.post_likes;
CREATE POLICY "Users can toggle own likes." ON public.post_likes
FOR ALL TO public USING (((SELECT auth.uid()) = user_id));

-- posts 정책 최적화
DROP POLICY IF EXISTS "Authenticated users can create posts." ON public.posts;
CREATE POLICY "Authenticated users can create posts." ON public.posts
FOR INSERT TO public WITH CHECK (((SELECT auth.role()) = 'authenticated'::text));

DROP POLICY IF EXISTS "Authors can delete own posts." ON public.posts;
CREATE POLICY "Authors can delete own posts." ON public.posts
FOR DELETE TO public USING (((SELECT auth.uid()) = author_id));

DROP POLICY IF EXISTS "Authors can update own posts." ON public.posts;
CREATE POLICY "Authors can update own posts." ON public.posts
FOR UPDATE TO public USING (((SELECT auth.uid()) = author_id));

-- profiles 정책 최적화
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles
FOR UPDATE TO public USING (((SELECT auth.uid()) = id));

-- storage.objects 정책 최적화 (버킷 접근 권한)
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT TO public WITH CHECK (
    (bucket_id = 'post-images'::text) AND 
    ((SELECT auth.role()) = 'authenticated'::text)
);
