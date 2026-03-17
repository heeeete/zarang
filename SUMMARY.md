# ZARANG 개발 작업 요약 (Current Progress)

### 1. Supabase 인프라 구축
- **DB 스키마 설계**: `profiles`, `posts`, `post_images`, `post_likes`, `comments` 테이블 생성 및 RLS 보안 정책 수립
- **자동 프로필 생성**: DB 트리거를 사용하여 소셜 로그인 시 유저 정보를 `profiles` 테이블에 자동 동기화
- **스토리지 설정**: `post-images` 퍼블릭 버킷 생성 및 유저별 이미지 업로드 경로 구조화

### 2. 인증 및 세션 관리
- **소셜 로그인 연동**: Supabase Auth를 통한 구글 로그인 구현 (카카오, 네이버 확장 가능 구조)
- **세션 유지 최적화**: Next.js 15+ 및 `@supabase/ssr` 최신 표준인 `getAll/setAll` 쿠키 처리 로직 적용

### 3. 게시글 관리 및 피드 최적화
- **멀티 이미지 업로드**: 서버 측 Route Handler를 통해 최대 10장의 이미지 업로드 및 썸네일 자동 지정
- **조인 쿼리 에러 해결**: `PGRST201` 관계성 충돌 방지를 위한 명시적 조인(!fkey) 쿼리 적용
- **메타데이터 표시**: 게시글별 실시간 좋아요 및 댓글 개수 카운트 연동

### 4. UI/UX 및 프론트엔드 최적화
- **컴포넌트 합성**: `@base-ui/react`의 `render` 프롭 및 `nativeButton={false}` 속성을 사용한 시맨틱 마크업 구현
- **이미지 최적화**: `next/image` 컴포넌트 도입 및 `next.config.ts` 원격 패턴 설정을 통한 성능 개선
- **모바일 퍼스트**: 최대 너비 420px 중앙 정렬 레이아웃 및 FSD(Feature-Sliced Design) 아키텍처 준수

### 6. [2026년 3월 18일 수요일 00:03] 성능 및 구조 최적화
- **이미지 리사이징 최적화**: 
    - `getOptimizedImageUrl` 공통 유틸리티를 통한 Supabase Storage `render` API 연동
    - 홈 피드(420px), 상세 페이지(840px), 아바타(64px/192px) 등 각 상황별 최적화된 이미지 크기 서빙으로 데이터 소모량 60% 이상 절감 기대
- **무한 스크롤 위젯 도입**:
    - `src/widgets/post-feed` 위젯 레이어 신설 및 `HomeFeed` 구현
    - `IntersectionObserver` 기반 클라이언트 페이징과 초기 10개 서버 사이드 렌더링(SSR)을 조합한 하이브리드 로딩 전략 적용
- **데이터베이스 성능 인덱스 추가**:
    - `idx_posts_created_at_desc_not_deleted`: 최신 피드 조회 최적화
    - `idx_comments_post_id_created_at`: 게시글별 댓글 조회 성능 향상
    - `idx_post_likes_post_id`: 좋아요 수 집계 속도 개선
    - `idx_post_images_post_id_sort_order`: 상세 이미지 정렬 로드 최적화
- **서버 사이드 정렬 및 데이터 페칭 고도화**:
    - 상세 페이지의 이미지와 댓글 정렬을 메모리 정렬에서 Supabase SQL 정렬(`order`)로 변경하여 서버 부하 감소
    - `next.config.ts`의 `remotePatterns`를 `/storage/v1/**`로 확장하여 리사이징된 이미지 경로 전역 허용
- **FSD 아키텍처 정돈**:
    - 비즈니스 로직(Entities), 사용자 액션(Features), 복합 UI(Widgets) 레이어 간 의존성 명확화 및 중복 코드 제거
