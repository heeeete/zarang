# 🚀 Supabase DB 성능 개선 제안: 피드 조회 최적화 (Denormalization)

현재 `get_home_feed` 함수는 매 요청마다 좋아요(`post_likes`)와 댓글(`comments`) 테이블을 전체 카운트하고 있습니다. 데이터가 수만 건 이상 쌓이면 성능 저하가 우려되므로, 다음과 같은 **역정규화(Denormalization)** 방식을 제안합니다.

## 1. 문제점
- `COUNT(DISTINCT ...)` 작업은 테이블 크기에 비례하여 실행 시간이 늘어납니다 (O(n)).
- 홈 피드처럼 자주 호출되는 API에서 매번 집계 함수를 실행하는 것은 데이터베이스 부하의 주된 원인이 됩니다.

## 2. 해결 방안 (반정규화 트리거 방식)
`posts` 테이블에 직접 카운트 컬럼을 추가하고, 좋아요/댓글이 발생할 때마다 자동으로 가감하는 트리거를 구축합니다.

### A. 테이블 스키마 수정
```sql
ALTER TABLE public.posts 
ADD COLUMN likes_count bigint DEFAULT 0,
ADD COLUMN comments_count bigint DEFAULT 0;
```

### B. 카운트 자동 관리 트리거 함수
```sql
-- 좋아요 카운트 관리 함수
CREATE OR REPLACE FUNCTION public.handle_post_likes_count()
RETURNS trigger AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 댓글 카운트 관리 함수
CREATE OR REPLACE FUNCTION public.handle_post_comments_count()
RETURNS trigger AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

## 3. 기대 효과
- **조회 성능 향상:** `get_home_feed`에서 무거운 CTE 집계가 사라지고 단순 컬럼 조회로 변경되므로 응답 속도가 10배 이상 빨라집니다.
- **부하 분산:** 데이터 읽기(Read) 부하를 쓰기(Write) 시점으로 분산시켜 시스템 전체의 안정성을 높입니다.

---
*해당 작업은 서비스 규모가 커지는 시점에 적용하는 것을 권장합니다.*
