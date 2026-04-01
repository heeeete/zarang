# ZARANG (자랑)

이미지 중심의 타건음 기록 및 공유 커뮤니티, **자랑**입니다.

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Supabase (Auth, Postgres, Storage, Realtime, RPC)
- **Libraries**: React Hook Form (RHF), Zustand, dnd-kit, Zod, sharp
- **Testing**: Jest, React Testing Library

## 🚀 핵심 기능 및 기술적 최적화

### 1. 개인화 홈 피드 추천 엔진 (url: `/`)

- **서버 사이드 가중치 연산 (`Supabase RPC`)**: `get_home_feed` 함수를 통해 대량의 게시글 스코어를 서버에서 직접 계산하여 클라이언트 부하 최소화
- **스코어링 로직**:
  - **기본 가중치**: 본인 글(+200.0, 1시간 이내), 팔로잉 유저(+100.0) 부스트 적용
  - **관심사 분석**: 과거 활동(좋아요 +8.0, 댓글 +10.0)을 합산하여 유저별 선호 카테고리 우선 노출
  - **최신성**: 30일 이내 게시글 대상, 시간 경과에 따른 지수 함수 형태의 감쇠 적용

### 2. 고해상도 이미지 처리 및 업로드 전략 (url: `/write`)

- **Vercel Payload 제한 우회**: Vercel 서버리스 함수의 요청 용량 제한(4.5MB)을 극복하기 위해, 서버를 거치지 않고 **클라이언트에서 직접 Supabase Storage로 업로드**
- **클라이언트 사이드 전처리 (`processImage`)**:
  - **EXIF 자동 보정**: `createImageBitmap`의 `imageOrientation` 옵션을 활용해 기기별 사진 회전 문제를 업로드 전 브라우저에서 즉시 해결
  - **화질 및 용량 최적화**: `image/jpeg` 포맷 및 **품질 0.8(80%)** 설정을 적용하여, 원본의 시각적 품질을 유지하면서도 업로드 용량을 획기적으로 줄여 네트워크 비용 절감
- **Canvas API 기반 미리보기 최적화**:
  - **리사이징 미리보기 (`createThumbnail`)**: 고해상도 원본 이미지를 브라우저에 그대로 렌더링할 때 발생하는 UI 프리징 및 메모리 누수를 방지하기 위해, `Canvas`를 활용해 가벼운 썸네일(maxWidth: 300px)로 즉시 변환하여 출력
  - **부드러운 리사이징**: `imageSmoothingQuality: 'high'` 옵션을 적용하여 리사이징 시 발생하는 화질 저하 및 계단 현상을 방지
- **병렬 업로드 프로세스**: `Promise.all`을 활용해 다중 이미지와 오디오 파일을 병렬로 처리하여 전체 등록 시간을 단축하고, `dnd-kit`을 통한 직관적인 정렬 기능 제공

### 3. 실시간 인터랙션 및 오디오 시스템

- **ASMR 녹음 엔진**: `MediaRecorder`와 `AudioContext`를 결합하여 안정적인 녹음 환경 구축 및 `audio/webm` 컨테이너 강제 지정으로 브라우저 간 재생 호환성 확보
- **DB 트리거 알림**: 댓글 및 답글 생성 시 PostgreSQL 트리거를 통해 `notifications` 테이블에 데이터를 자동 생성하여 누락 없는 알림 보장
- **서버 사이드 이미지 변환**: 업로드된 이미지는 서버(`sharp`)에서 WebP(품질 80)로 변환 및 EXIF 방향 보정을 거쳐 저장 효율과 로딩 성능을 동시에 확보

### 4. 테스트 및 품질 보증 (Jest)

- **핵심 비즈니스 로직 검증**: 실시간성이 높은 채팅(`useChatMessages`) 및 알림(`NotificationBell`) 로직에 대해 `Jest` 단위 테스트를 수행하여 복잡한 상태 관리의 무결성 확보
- **UI/UX 회귀 방지**: `React Testing Library`를 활용해 사용자 인터랙션에 따른 컴포넌트 변화를 검증하고 기능 추가 시 안정성 유지
- **Mocking 전략**: 외부 종속성(Supabase 등)을 모킹하여 독립적이고 재현 가능한 테스트 환경 구축

### 5. 아키텍처 및 품질 관리

- **FSD (Feature-Sliced Design)**: 레이어 기반의 엄격한 관심사 분리를 통해 코드 재사용성을 높이고 비즈니스 로직의 응집도 강화
- **타입 안정성**: `any` 타입을 배제한 인터페이스 설계와 Supabase 타입 자동 생성(`src/shared/types/database.ts`)을 통해 런타임 안정성 확보
- **폼 관리 (React Hook Form)**: 비제어 컴포넌트 기반의 `RHF`를 활용하여 폼 제출 시 불필요한 리렌더링을 최소화하고 유효성 검사 로직 통합

## 📂 Architecture (FSD)

- `app`: Next.js Routing 및 전역 설정
- `pages`: 비즈니스 로직과 UI가 결합된 페이지 단위
- `widgets`: 독립적으로 동작하는 대형 UI 블록 (HomeFeed, ProfileGrid 등)
- `features`: 사용자 액션 중심 기능 (PostCreation, Like, Comment 등)
- `entities`: 도메인 데이터 모델 및 전용 API 레이어
- `shared`: 공통 컴포넌트, 유틸리티, Supabase 클라이언트
