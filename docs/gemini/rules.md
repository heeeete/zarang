# Coding Rules

## TypeScript

- **Any 금지**: 절대적으로 구체적인 타입 정의 필수 (interface, type).
- **Generated Types**: src/shared/types/database.ts 활용.

## Next.js & React

- **RSC 우선**: 데이터 페칭 및 로직 처리는 Server Component에서 처리.
- **Client Boundary**: use client는 인터랙션(이벤트 핸들러, 브라우저 API, 상태 관리)이 필요한 최소 단위에만 사용.
- **Server Actions**: src/features/**/api 또는 src/entities/**/api에서 정의.
- Client Component로 변경하지 않고 해결 방법을 먼저 검토
- Server Component 유지가 가능하면 "use client"를 추가하지 않는다

## Guidelines

- **UI/Layout**: 사용자 명시적 요청 없이 기존 스타일(shadcn, Tailwind v4) 및 레이아웃 수정 금지.
- **Refactoring**: 요청 범위를 벗어난 불필요한 코드 정리/리팩토링 금지.
- **Environment**: Windows PowerShell 기반 명령어 사용 (ls 대신 dir, rm -rf 대신 Remove-Item -Recurse -Force 등).
- **Validation**: 모든 사용자 입력 및 API 요청은 zod 스키마 검증 필수.
- **Migration**: DB 스키마 변경 시 반드시 supabase/migrations 내 SQL 파일 생성 선행.
- 모르면 추측하지 말고 기존 코드와 현재 파일 구조 기준으로 판단
- 수정 범위 밖 파일은 변경하지 않는다
- 코드 우선으로 제시하고 설명은 최소화한다
