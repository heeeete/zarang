-- 기존 댓글 삭제 정책 제거 (작성자 본인만 삭제 가능했던 정책)
DROP POLICY IF EXISTS "Authors can delete own comments." ON public.comments;

-- 새로운 정책 추가: 댓글 작성자 본인이거나, 해당 댓글이 달린 게시글의 작성자인 경우 삭제 가능
CREATE POLICY "Authors and Post Authors can delete comments." ON public.comments
FOR DELETE TO public USING (
  ((SELECT auth.uid()) = author_id)
  OR
  ((SELECT auth.uid()) = (SELECT author_id FROM public.posts WHERE id = comments.post_id))
);
