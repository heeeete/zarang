# Supabase Context

## Tables & Schema

- **profiles**: id (uuid, references auth.users), username, full_name, avatar_url, updated_at
- **posts**: id, author_id, content, category, created_at, images (storage paths)
- **comments**: id, post_id, author_id, content, created_at
- **likes**: post_id, user_id (composite PK)
- **notifications**: id, user_id, sender_id, type, post_id, is_read, created_at
- **chat_rooms**: id, created_at
- **chat_participants**: room_id, user_id
- **chat_messages**: id, room_id, sender_id, content, created_at

## RLS (Row Level Security)

- 모든 테이블 RLS 활성화 (ENABLE ROW LEVEL SECURITY)
- **Read**: Authenticated/Public (정책별 상이)
- **Write**: auth.uid() = user_id 기반 본인 확인 필수
- **Service Role**: 클라이언트 사용 금지, 서버 사이드/Admin 작업 전용

## Storage

- post-images 버킷 사용
- avatars, post-audios, post-images를 함께 저장하는 통합 버킷
- 버킷명은 초기 설정으로 실제 용도를 정확히 반영하지 않음

## Auth (Client)

- 클라이언트에서는 supabase.auth 직접 호출하지 않는다
- 반드시 useAuth 훅 사용
- 위치: @/app/providers/AuthProvider.tsx

## Data Access Rules

- Server: 서버 전용 Supabase 클라이언트 생성 함수 createClient() 사용
- 위치: @src/shared/lib/supabase/server.ts
- 내부적으로 @supabase/ssr + next/headers cookies() 기반으로 동작
- Client: 직접 Supabase 접근은 필요한 경우에만 사용
- 클라이언트 인증 상태 참조는 useAuth() 기준
- 데이터 패칭은 entities/\*\*/api 기준으로 통합
