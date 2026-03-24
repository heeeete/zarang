-- post_images 테이블 RLS 정책 최적화
-- 1. 기존 중복된 정책 삭제
DROP POLICY IF EXISTS "Post authors can manage images." ON public.post_images;
DROP POLICY IF EXISTS "Post images are viewable by everyone." ON public.post_images;

-- 2. 정책 통합 및 분리 (성능 향상)
-- 조회가 가장 빈번하므로 가장 단순한 정책으로 설정
CREATE POLICY "post_images_select_policy" ON public.post_images
FOR SELECT TO public USING (true);

-- 수정, 삭제는 작성자 본인만 가능 (복잡한 서브쿼리는 이 때만 실행)
CREATE POLICY "post_images_all_policy" ON public.post_images
FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.posts 
        WHERE posts.id = post_images.post_id 
        AND posts.author_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.posts 
        WHERE posts.id = post_images.post_id 
        AND posts.author_id = auth.uid()
    )
);


-- post_likes 테이블 RLS 정책 최적화
-- 1. 기존 중복된 정책 삭제
DROP POLICY IF EXISTS "Likes are viewable by everyone." ON public.post_likes;
DROP POLICY IF EXISTS "Users can toggle own likes." ON public.post_likes;

-- 2. 정책 통합 및 분리
-- 조회가 가장 빈번하므로 가장 단순한 정책으로 설정
CREATE POLICY "post_likes_select_policy" ON public.post_likes
FOR SELECT TO public USING (true);

-- 추가, 삭제는 본인만 가능 (auth.uid() 검사는 이 때만 실행)
CREATE POLICY "post_likes_all_policy" ON public.post_likes
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
