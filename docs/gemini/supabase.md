# Supabase Context

## Tables & Schema

- **categories** : id, slug, label, sort_order, created_at
- **profiles**: id (uuid, references auth.users), username, full_name, avatar_url, updated_at
- **posts**: id, author_id, description, thumbnail_url, created_at, updated_at, category_id, audio_url, audio_storage_path, likes_count, comments_count, thumbnail_width, thumbnail_height
  - Index: `idx_posts_created_at_desc` (created_at DESC) - 홈 피드 최적화용
  - Index: `idx_posts_author_id_created_at` (author_id, created_at DESC) - 프로필 페이지 최적화용
- **post_images**: id, post_id, image_url, storage_path, sort_order, created_at, width, height
- **post_likes**: post_id, user_id (composite PK), created_at
- **notifications**: id, user_id, actor_id, type, post_id, comment_id, is_read, created_at
- **messages**: id, room_id, sender_id, content, created_at
- **chat_rooms**: id, created_at
- **chat_participants**: room_id, user_id, joined_at, last_read_at, deleted_at
- **comments**: id, post_id, author_id, content, created_at, updated_at, parent_id
- **follows**: follower_id, following_id, created_at

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
