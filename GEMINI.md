# GEMINI.md

## Project

- Next.js (App Router) + TypeScript
- Supabase (Auth, Postgres, Storage)
- Tailwind CSS v4 + shadcn/ui
- FSD Architecture

---

## Core Rules

- RSC(React Server Component) 우선
- 불필요한 "use client" 금지
- 기존 구조(FSD) 유지
- 요청 범위 밖 리팩토링 금지
- 타입 안정성 유지
- any 사용 금지
- schema 변경은 migrations 기준
- 사용자 요청 없이는 UI/스타일/레이아웃 변경 절대 금지
- Client Component로 변경하지 않고 해결 방법을 먼저 검토
- 모르면 추측하지 말고 기존 코드 기준으로 판단
- 수정 범위 밖 파일 변경 금지
- 코드 우선 제시, 설명은 최소화
- 규칙에 있는 md 파일 외에 추가로 생성해서 작성 금지

---

## Supabase Rules

- 모든 테이블 RLS 활성화
- service_role key는 클라이언트 사용 금지
- 민감 작업은 Route Handler 또는 Server에서 처리
- DB 변경 시 migration 기준으로 제안
- RLS 정책 우회 방식 금지
- supabase db push는 항상 zarang_dev에만 수행
- production(zarang_pro) push는 금지 (사용자가 직접 수행)

## Sync Rules

- Supabase 스키마 변경 시 docs/gemini/supabase.md 반드시 함께 수정
- docs와 실제 DB 구조가 불일치하면 docs를 기준으로 판단하지 않는다
- DB 변경 작업에는 문서 업데이트를 포함한다

---

## Structure (FSD)

- app: entry (src/app re-export)
- pages: 페이지 단위
- widgets: UI 블록
- features: 사용자 액션
- entities: 도메인/데이터
- shared: 공통 UI/유틸/API

---

## UI Rules

- Mobile-first
- max-width: 420px
- 외부: bg-neutral-100
- 내부: white
- shadcn/ui 사용

---

## Validation

- 모든 입력은 zod로 검증

---

## Environment

- Windows PowerShell 환경
- Linux/bash 명령어 사용 금지
- PowerShell 기준 명령어 사용

---

## Env Vars

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

## Context References

- ./docs/gemini/project.md
- ./docs/gemini/supabase.md
- ./docs/gemini/rules.md

작업 전 위 문서를 기준으로 판단한다.

우선순위:

1. rules.md
2. supabase.md
3. project.md
