# ZARANG 개발 기획서 v3

## 1. 문서 목적

이 문서는 `ZARANG` 웹 서비스의 **초기 MVP 개발 명세**다.  
Claude Code가 이 문서를 기준으로 바로 구현에 들어갈 수 있도록, 범위·기술 스택·화면·DB·API·우선순위를 구체적으로 정의한다.

---

## 2. 서비스 개요

### 서비스명

ZARANG

### 한 줄 설명

키보드, 마우스, 피규어, 데스크 셋업 같은 취향 아이템을 사진으로 올리고 자랑하는 이미지 중심 커뮤니티.

### 핵심 가치

- 내 취향을 사진으로 보여줄 수 있다.
- 남의 세팅과 소장품을 구경하는 재미가 있다.
- 이미지 중심이라 소비가 빠르고 직관적이다.

---

## 3. 이번 MVP의 목표

이번 버전은 다음 4가지만 검증하면 된다.

1. 유저가 회원가입/로그인 후 게시글을 올릴 수 있는가
2. 다른 유저의 게시글을 피드에서 소비할 수 있는가
3. 게시글에 좋아요와 댓글로 반응할 수 있는가
4. 모바일 중심 UI로 충분히 자연스러운 사용성을 줄 수 있는가

### MVP 포함 범위

- 로그인 (Google / Kakao / Naver 소셜 로그인)
- 홈 피드
- 자랑 등록
- 게시글 상세
- 좋아요
- 댓글
- 내 프로필(내가 올린 글 목록)

### MVP 제외 범위

- 팔로우
- 알림
- 랭킹
- 검색 고도화
- 해시태그 추천
- 관리자 페이지
- 신고/차단 고도화

---

## 4. 기술 스택

### 프론트엔드

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS v4
- react-hook-form
- zod
- @hookform/resolvers
- shadcn/ui

### 백엔드

- Supabase
  - Auth (Google / Kakao / Naver OAuth)
  - Postgres Database
  - Storage (`post-images` bucket, public read)

### 기타

- 배포: Vercel
- 이미지 저장소: Supabase Storage
- 아키텍처: FSD (Feature-Sliced Design)

---

## 5. 환경 변수

아래 환경 변수가 `.env.local`에 설정되어 있다고 가정하고 구현한다. 값을 하드코딩하지 않는다.

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   # 서버(Route Handler) 전용
```

---

## 6. 아키텍처: FSD (Feature-Sliced Design)

### 원칙

FSD 레이어 구조를 따른다. 단, **MVP 초기에는 모든 레이어를 미리 만들지 않는다.** 기능이 추가되거나 코드가 중복되기 시작할 때 해당 레이어/슬라이스를 그때그때 생성한다.

### 레이어 개요

| 레이어     | 역할                                 | 초기 생성 여부 |
| ---------- | ------------------------------------ | -------------- |
| `app`      | Next.js App Router 진입점, 전역 설정 | ✅             |
| `pages`    | 페이지 조립 (라우트별 UI 조립)       | ✅             |
| `widgets`  | 여러 feature를 조합한 독립 블록      | 필요시         |
| `features` | 사용자 액션 단위 기능                | 필요시         |
| `entities` | 비즈니스 도메인 모델                 | 필요시         |
| `shared`   | 공용 유틸, UI, API 클라이언트        | ✅             |

### 향후 확장 예시

- 좋아요 로직이 여러 곳에서 쓰이기 시작하면 → `features/like-post` 생성
- 게시글 카드가 여러 페이지에서 재사용되면 → `entities/post` 생성
- 피드 + 필터가 복합 블록이 되면 → `widgets/post-feed` 생성

---

## 7. UI / UX 기준

### 레이아웃 기준

- **모바일 기준 UI로 설계한다.**
- 전체 앱 콘텐츠 영역은 **가운데 정렬**한다.
- 최대 너비는 **420px**로 고정한다.
- 데스크톱에서는 좌우 여백만 두고, 콘텐츠는 중앙 420px 영역에만 배치한다.

### 레이아웃 규칙

- 외부 배경: 연한 회색 (`bg-neutral-100`)
- 내부 앱 영역: 흰색 배경
- 상단 헤더: `sticky top-0`
- 하단 네비게이션: `fixed bottom-0` — 콘텐츠 영역에 하단 여백 필수
- 기본 수평 패딩: 16px

### 디자인 원칙

- shadcn/ui를 기본적으로 사용
- 텍스트보다 이미지를 우선한다.
- 피드 소비가 빠르게 느껴져야 한다.
- 카드/간격/버튼 크기는 모바일 터치 기준으로 잡는다.
- 초기에는 화려한 인터랙션보다 안정성과 속도를 우선한다.
- 빈 상태(empty state)와 로딩 스켈레톤을 반드시 구현한다.

---

## 8. 사용자 역할

### 비로그인 사용자

- 홈 피드 조회 가능
- 게시글 상세 조회 가능
- 댓글 목록 조회 가능
- 좋아요 / 댓글 작성 / 게시글 작성 불가 → 시도 시 `/login`으로 redirect

### 로그인 사용자

- 게시글 작성 가능
- 좋아요 가능
- 댓글 작성 가능
- 내 프로필 조회 가능
- 내가 작성한 게시글 수정/삭제 가능

---

## 9. 핵심 화면 정의

### 9.1 홈 피드 `/`

#### 목적

서비스 진입 시 최신 게시글을 빠르게 소비하는 메인 화면.

#### 구성

- 상단 헤더 (sticky)
  - 로고 텍스트: `ZARANG`
  - 우측: 로그인 상태면 글쓰기 버튼 / 비로그인이면 로그인 버튼
- 피드 리스트
  - 카드 항목: 대표 이미지(16:9 고정), 제목, 작성자 닉네임, 카테고리 뱃지, 좋아요 수, 댓글 수
- 하단 네비게이션: 홈 / 글쓰기 / 마이페이지

#### 정렬 기준

- 기본은 최신순 (`created_at DESC`)
- `deleted_at IS NULL` 조건 필수

#### 빈 상태

- "아직 자랑이 없어요. 첫 번째로 자랑해보세요!" + 글쓰기 버튼

---

### 9.2 게시글 상세 `/posts/[id]`

#### 목적

게시글 본문과 이미지를 자세히 보고 반응하는 화면.

#### 구성

- 뒤로가기 버튼
- 이미지 목록 (`sort_order` 순)
- 작성자 닉네임, 카테고리 뱃지
- 제목, 설명(있을 경우)
- 생성일 (상대 시간, 예: "3시간 전")
- 좋아요 버튼 + 좋아요 수
- 댓글 입력창 (로그인 시만 활성화)
- 댓글 목록 (작성자 닉네임, 내용, 시간)
- 작성자 본인일 경우: 수정/삭제 버튼 노출

#### 없는 게시글 접근 시

- `notFound()` 처리

---

### 9.3 자랑 등록 `/write`

#### 목적

유저가 자신의 자랑 게시글을 작성하는 화면.

#### 접근 제어

- 비로그인 접근 시 `/login?redirect=/write`로 redirect

#### 입력 항목

- 사진: 최소 1장 필수, 최대 10장
- 제목: 필수, 최대 60자
- 설명: 선택, 최대 500자
- 카테고리: 필수

#### 카테고리 목록

| value        | 표시 라벨   |
| ------------ | ----------- |
| `keyboard`   | 키보드      |
| `mouse`      | 마우스      |
| `desk-setup` | 데스크 셋업 |
| `figure`     | 피규어      |
| `etc`        | 기타        |

#### Validation 스키마

```ts
export const createPostSchema = z.object({
  title: z.string().trim().min(1, '제목은 필수입니다.').max(60, '제목은 최대 60자까지 가능합니다.'),
  description: z.string().trim().max(500, '설명은 최대 500자까지 가능합니다.').optional().or(z.literal('')),
  category: z.enum(['keyboard', 'mouse', 'desk-setup', 'figure', 'etc'], {
    errorMap: () => ({ message: '카테고리를 선택해주세요.' }),
  }),
  images: z
    .array(z.instanceof(File))
    .min(1, '사진은 최소 1장 필요합니다.')
    .max(10, '사진은 최대 10장까지 업로드할 수 있습니다.'),
})
```

#### UX 요구사항

- 이미지 미리보기 제공
- 이미지 순서 유지 (첫 번째 이미지 = 대표 이미지)
- 업로드 중 submit 버튼 disabled + 로딩 표시
- 업로드 성공 시 `/posts/[id]`로 이동
- 업로드 실패 시 인라인 에러 메시지 표시

---

### 9.4 로그인 `/login`

#### 목적

글 작성, 좋아요, 댓글 기능을 위해 로그인하는 화면.

#### MVP 인증 방식

Supabase Auth OAuth — **Google, Kakao, Naver** 3가지 제공.

#### 플로우

1. 로그인 버튼 클릭 → 각 OAuth 제공자 인증 페이지로 이동
2. 인증 성공 → `redirect` 파라미터가 있으면 해당 경로로, 없으면 `/`로 이동

#### 신규 유저 처리

- 첫 로그인 시 `profiles` 테이블에 row를 자동 생성하는 DB 트리거를 사용한다.
- `username`은 OAuth 프로필의 `full_name` 또는 이메일 로컬파트로 초기화한다.

---

### 9.5 마이페이지 `/me`

#### 목적

내가 작성한 게시글을 모아보는 개인 화면.

#### 접근 제어

- 비로그인 접근 시 `/login?redirect=/me`로 redirect

#### 구성

- 프로필 정보 (닉네임, 이메일)
- 내가 작성한 게시글 리스트
- 로그아웃 버튼

---

## 10. 백엔드 설계

### 10.1 Supabase 사용 범위

- 인증: Supabase Auth (Google / Kakao / Naver OAuth)
- DB: Supabase Postgres
- 이미지 파일 저장: Supabase Storage (`post-images` bucket, public read)

### 10.2 DB 스키마

#### `profiles`

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  avatar_url text,
  created_at timestamptz not null default now()
);
```

#### `posts`

```sql
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text not null check (category in ('keyboard', 'mouse', 'desk-setup', 'figure', 'etc')),
  thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

#### `post_images`

```sql
create table public.post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  image_url text not null,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
```

#### `post_likes`

```sql
create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
```

#### `comments`

```sql
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

---

### 10.3 RLS 정책

모든 테이블에 RLS를 활성화한다.

| 테이블        | 읽기                      | 쓰기                        | 수정/삭제        |
| ------------- | ------------------------- | --------------------------- | ---------------- |
| `profiles`    | 전체 공개                 | -                           | 본인만           |
| `posts`       | `deleted_at IS NULL` 공개 | 로그인 사용자               | 작성자만         |
| `post_images` | 전체 공개                 | 해당 post 작성자            | 해당 post 작성자 |
| `post_likes`  | 전체 공개                 | 로그인 사용자 (본인 레코드) | 본인만           |
| `comments`    | `deleted_at IS NULL` 공개 | 로그인 사용자               | 작성자만         |

---

### 10.4 DB 트리거

신규 유저 첫 로그인 시 `profiles` row를 자동 생성한다.

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

### 10.5 파생 데이터 처리

MVP에서는 집계 최적화를 하지 않는다. 조회 시 계산해서 내려준다.

- 좋아요 수: `post_likes` count
- 댓글 수: `comments` count (`deleted_at IS NULL`)
- 내가 좋아요 눌렀는지: 로그인 사용자에 한해 확인

---

### 10.6 이미지 업로드

- 업로드는 Route Handler에서만 처리한다 (`SUPABASE_SERVICE_ROLE_KEY` 사용)
- Storage 경로: `post-images/{userId}/{postId}/{sort_order}_{uuid}.{ext}`
- 허용 형식: `image/jpeg`, `image/png`, `image/webp`
- 장당 최대 용량: 10MB
- 최대 장수: 10장

---

## 11. API 설계

### 11.1 게시글 생성

`POST /api/posts` — `multipart/form-data`

| field       | type   | 필수          |
| ----------- | ------ | ------------- |
| title       | string | ✅            |
| description | string | -             |
| category    | string | ✅            |
| images      | File[] | ✅ (최소 1장) |

**Response:** `{ "id": "post_uuid" }`

**처리 순서**

1. 세션 검증
2. 이미지 타입/용량 검증
3. Storage에 이미지 업로드
4. `posts` insert
5. `post_images` insert
6. `posts.thumbnail_url` 업데이트 (첫 번째 이미지)
7. `{ id }` 반환

**에러 코드:** 401 미인증 / 400 유효성 실패 / 413 용량 초과 / 415 형식 오류 / 500 업로드 실패

---

### 11.2 좋아요 토글

`POST /api/posts/[id]/like` — 로그인 필요

- 이미 좋아요 있으면 삭제, 없으면 생성

**Response:** `{ "liked": true, "likeCount": 12 }`

---

### 11.3 댓글 작성

`POST /api/posts/[id]/comments` — 로그인 필요

**Request body:** `{ "content": "댓글 내용" }`

**Response:** `{ "id": "comment_uuid" }`

---

### 11.4 게시글 목록 / 상세 조회

서버 컴포넌트에서 Supabase를 직접 조회한다. Route Handler 불필요.

---

## 12. 인증 흐름

1. 비로그인 사용자가 보호된 기능 시도
2. `/login?redirect={현재경로}`로 이동
3. OAuth 로그인 성공 시 `redirect` 경로로 복귀 (없으면 `/`)

보호 경로(`/write`, `/me`)는 `middleware.ts`에서 세션을 확인하고 미인증 시 redirect 처리한다.

Supabase 클라이언트는 서버/클라이언트를 구분하여 `@supabase/ssr` 패키지로 초기화한다.  
(`@supabase/auth-helpers-nextjs`는 deprecated이므로 사용하지 않는다.)

---

## 13. 폼 요구사항

- `mode: 'onSubmit'`
- 서버 에러 메시지: 인라인 표시
- 개별 필드 에러: 필드 아래 표시

| 상황             | 에러 메시지                                    |
| ---------------- | ---------------------------------------------- |
| 사진 없음        | 사진은 최소 1장 필요합니다.                    |
| 제목 없음        | 제목은 필수입니다.                             |
| 카테고리 없음    | 카테고리를 선택해주세요.                       |
| 이미지 형식 오류 | JPG, PNG, WEBP 형식만 업로드할 수 있습니다.    |
| 이미지 용량 초과 | 이미지 1장의 크기는 10MB를 초과할 수 없습니다. |

---

## 14. 성능/품질 기준

- 이미지 없는 게시글 생성 불가
- 제목 없는 게시글 생성 불가
- `deleted_at IS NOT NULL` 게시글은 피드/상세 노출 불가
- 420px 기준에서 레이아웃 깨짐 없어야 함
- 피드 카드 이미지는 16:9 비율 고정 (레이아웃 점프 방지)
- Next.js `<Image>` 컴포넌트 사용 (lazy loading)
- 과한 애니메이션 금지

---

## 15. 비기능 요구사항

### SEO

- 홈과 게시글 상세는 기본 `metadata` 설정
- 게시글 상세는 `generateMetadata`로 동적 메타 타이틀 설정

### 에러 처리

- API 실패 시 인라인 에러 메시지 표시
- Route Handler는 구체적인 상태 코드와 메시지를 JSON으로 반환

### 타입 안전성

- `supabase gen types typescript`로 생성된 DB 타입을 `shared/types/database.ts`에 위치
- 앱에서 사용하는 가공 타입은 별도 파일로 분리

---

## 16. 구현 우선순위

### Phase 1 — 기반 구축

- [ ] Supabase 프로젝트 생성
- [ ] DB 스키마 및 RLS 정책 생성
- [ ] `handle_new_user` 트리거 생성
- [ ] Storage bucket 생성 및 public read 정책 설정
- [ ] Next.js 프로젝트 초기화 (shadcn/ui, Tailwind v4)
- [ ] 환경 변수 설정
- [ ] 기본 레이아웃 (max-w-[420px] wrapper, 하단 네비게이션)
- [ ] Supabase 클라이언트 초기화 (browser / server, `@supabase/ssr`)
- [ ] `middleware.ts` (보호 경로 처리)

### Phase 2 — 핵심 기능

- [ ] 소셜 로그인 (Google / Kakao / Naver)
- [ ] 게시글 생성 Route Handler
- [ ] 이미지 업로드 (Storage 연동)
- [ ] 글쓰기 화면 (`/write`)
- [ ] 홈 피드 (`/`)
- [ ] 게시글 상세 (`/posts/[id]`)

### Phase 3 — 반응 기능

- [ ] 좋아요 토글 Route Handler + UI
- [ ] 댓글 작성 Route Handler + UI
- [ ] 마이페이지 (`/me`) + 로그아웃

### Phase 4 — 품질 보완

- [ ] 빈 상태 처리
- [ ] 로딩 스켈레톤 UI
- [ ] 에러 상태 UI
- [ ] SEO metadata 설정
- [ ] 모바일 레이아웃 QA
- [ ] Vercel 배포

---

## 17. 최종 산출물 기준

- [ ] 비로그인 상태에서 홈 피드 조회 가능
- [ ] Google / Kakao / Naver 소셜 로그인 가능
- [ ] 로그인 후 글 작성 가능 (사진 1장 이상 + 제목 필수 검증 동작)
- [ ] 작성한 글이 홈 피드에 노출
- [ ] 게시글 상세 조회 가능
- [ ] 좋아요 가능
- [ ] 댓글 작성 가능
- [ ] 마이페이지에서 내가 올린 글 확인 가능
- [ ] 비로그인 사용자의 쓰기 시도 시 로그인 페이지로 이동

---

## 18. 추후 확장 아이템

- 저장 기능
- 태그 시스템
- 인기글 랭킹
- 검색
- 카테고리 필터 고도화
- 알림
- 신고/차단
- 관리자 기능
- 앱 전용 클라이언트
