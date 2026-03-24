# 🚀 ZARANG 성능 개선 및 최적화 제안

이 문서는 서비스 규모가 커짐에 따라 발생할 수 있는 잠재적인 성능 병목 구간과 그에 대한 해결 방안을 정리합니다.

---

## 1. 피드 조회 최적화 (Denormalization)

현재 `get_home_feed` 함수는 매 요청마다 좋아요(`post_likes`)와 댓글(`comments`) 테이블을 전체 카운트하고 있습니다. 데이터가 수만 건 이상 쌓이면 성능 저하가 우려되므로 **역정규화(Denormalization)** 방식을 제안합니다.

### 💡 문제점
- `COUNT(DISTINCT ...)` 작업은 테이블 크기에 비례하여 실행 시간이 늘어납니다 (O(n)).
- 홈 피드처럼 자주 호출되는 API에서 매번 집계 함수를 실행하는 것은 데이터베이스 부하의 주된 원인이 됩니다.

### ✅ 해결 방안: 카운트 컬럼 및 트리거 도입
`posts` 테이블에 `likes_count`, `comments_count` 컬럼을 추가하고 트리거를 통해 자동으로 관리합니다. (세부 SQL 로직은 기존 제안 참고)

---

## 2. 채팅 시스템 최적화 (Server-side Aggregation)

현재 `fetchChatRooms` 함수는 안 읽은 메시지 수를 계산하기 위해 각 채팅방의 모든 메시지를 클라이언트로 가져와서 필터링하고 있습니다. 메시지 데이터가 방대해지면 네트워크 부하와 클라이언트 메모리 사용량이 늘어날 수 있습니다.

### 💡 문제점
- 안 읽은 메시지 하나를 확인하기 위해 방에 쌓인 수천 개의 과거 메시지 데이터를 모두 다운로드해야 합니다.
- 클라이언트에서 루프를 돌며 `unread_count`를 계산하는 방식은 데이터 양에 비례해 성능이 저하됩니다.

### ✅ 해결 방안: Postgres Function (RPC) 도입
DB 레벨에서 안 읽은 개수만 카운트하여 결과값만 반환하는 함수를 사용합니다.

```sql
-- 특정 유저의 방별 안 읽은 메시지 개수를 반환하는 함수
CREATE OR REPLACE FUNCTION public.get_unread_counts(p_user_id uuid)
RETURNS TABLE (room_id uuid, unread_count bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.room_id,
        COUNT(m.id) as unread_count
    FROM public.chat_participants cp
    JOIN public.messages m ON m.room_id = cp.room_id
    WHERE cp.user_id = p_user_id
      AND m.sender_id != p_user_id
      AND m.created_at > cp.last_read_at
    GROUP BY cp.room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### ✅ 해결 방안: 최신 메시지 조회 쿼리 최적화
`fetchChatRooms` 시 메시지 전체가 아닌 **최신 메시지 1개**만 가져오도록 쿼리를 제한합니다.

```typescript
// 개선된 fetchChatRooms 예시 (개념적)
const { data } = await supabase
  .from('chat_rooms')
  .select(`
    id,
    participants (...),
    messages:messages (content, created_at) 
  `)
  .order('created_at', { foreignTable: 'messages', ascending: false })
  .limit(1, { foreignTable: 'messages' });
```

### 📈 기대 효과
- **네트워크 비용 절감:** 불필요한 메시지 본문을 전송하지 않아 페이로드 크기가 90% 이상 줄어듭니다.
- **응답 속도 향상:** 클라이언트 연산 부하가 사라져 저사양 기기에서도 목록 로딩이 빨라집니다.

---
*해당 작업들은 서비스 지표(메시지 수, 유저 수)가 일정 수준 이상 도달하여 성능 저하가 체감되는 시점에 적용하는 것을 권장합니다.*
