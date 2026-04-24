# Stellara Claude Handoff

작성일: 2026-04-24  
프로젝트 경로: `/Users/benjaminsong/.codex/worktrees/76d4/stellara-v15`  
프로덕션 URL: `https://stellara-v15.vercel.app`  
최신 프로덕션 배포 인스펙트: `https://vercel.com/michinterrans-projects/stellara-v15/68GmtENWdraAYFqGUEsTRLbC6bPj`

## 1. 한 줄 요약

Stellara는 음악을 직접 스트리밍하는 앱이 아니라, 사용자의 외부 음악 라이브러리와 다른 사람의 공개 은하를 우주 인터페이스로 탐험하게 만드는 몰입형 음악 큐레이션 소셜 서비스다.  
현재는 다음이 완료된 상태다:

- 프로덕션 blank screen 복구 완료
- galaxy context / foreign galaxy 방문 후 복귀 흐름 안정화 완료
- Stage 1 다중 사용자 우주 1차 구현 완료
- Stage 2 소셜 근접도 1차 구현 완료
- Stage 3 우주 호버링 모드 1차 구현 완료
- featured galaxy / promotion beacon / 디자인 토큰 구조 완료
- Super Admin Command Center 1차 운영 콘솔 완료
- Firebase / Firestore 기반 admin 운영 연결 완료
- rolling signal / popup / payments / content / error / api usage 기본 운영 데이터 구조 연결 완료
- notices 다국어 출력 구조 시작 완료

## 2. 서비스 철학

Stellara의 핵심은 “추천을 소비하는 것”이 아니라 “우주를 탐험하며 발견하는 것”이다.

핵심 비유:

- 플레이리스트는 행성이다
- 한 사용자의 취향 전체는 은하다
- 공개 은하는 다른 사람의 취향 세계다
- 블랙홀은 추천 버튼이 아니라 큐레이터 사건이다
- SNS는 피드가 아니라 방문, 착륙, 공명, 항로 이동이 중요하다

제품 톤 원칙:

- 음악 앱보다 우주 탐험 인터페이스에 가깝다
- 광고처럼 보이는 프로모션은 지양한다
- 프로모션도 `signal`, `route`, `beacon`, `orbit` 같은 서사 안에서 보여야 한다
- UI 텍스트는 짧고 사건 중심으로 유지한다
- 최근 요청 기준으로 모든 메시지 작업은 한글/영문 버전을 함께 고려해야 한다

## 3. 현재까지의 주요 개발 축

### 3-1. 안정화

- Firebase 환경변수가 없어도 앱이 흰 화면으로 죽지 않도록 fallback 처리
- 무설정 환경에서는 탐험 전용 모드로 안전 진입
- YouTube 호출 및 일부 콘솔 잡음 정리

주요 파일:

- `src/config/firebase.js`
- `src/pages/SpacePage.jsx`
- `src/services/auth/FirebaseAuthService.js`

### 3-2. galaxy context / 복귀 안정화

- `currentGalaxyId`, `currentGalaxyContext`, `travelStatusCopy` 체계 정리
- foreign galaxy 방문 후 내 은하 복귀 버그 수정
- 개인 은하가 비어 있으면 `Stellara Official` 로 fallback

주요 파일:

- `src/hooks/useGalaxyNavigation.js`
- `src/pages/SpacePage.jsx`

### 3-3. Stage 1: 다중 사용자 우주

- 내 은하 주변에 공개 은하 / featured galaxy 를 비콘으로 배치
- 프로모션 은하는 일반 공개 은하보다 더 바깥 항로에 우선 배치
- hover 시 이름, 운영 주체, 짧은 소개, 통계 노출
- 클릭 시 포털 이동

현재 상태:

- 1차 구현 완료
- 거리 밸런스, 레이어 분리, 가독성은 추가 다듬을 여지 있음

주요 파일:

- `src/pages/SpacePage.jsx`
- `src/components/ThreeEngine/useThreeEngine.jsx`
- `src/components/ui/panels/CosmicGatewayPanel.jsx`

### 3-4. Stage 2: 소셜 근접도

- 현재 orbit signal 기준으로 가까운 은하 정렬
- mood / tag / artist / current track / description 등을 기반으로 점수화
- “왜 가까운지” 한 줄 이유를 UI에 노출

현재 상태:

- 1차 구현 완료
- 노드 연결선은 아직 없음
- 근접 이유 문장은 더 정교화 가능

### 3-5. Stage 3: 우주 호버링 모드

- 음악 재생 중 가까운 행성과 은하를 자동으로 스쳐 지나가도록 구현
- 호버링 중 간헐적인 discovery signal 발생
- 최근 요청으로 좌하단 `자유 유영중` 카드 제거

현재 상태:

- MVP 구현 완료
- 더 시네마틱한 motion / long-form screensaver 확장 가능

### 3-6. Promotion / Featured Galaxy 시스템

- `brand`, `campaign`, `label` 타입 지원
- promotion beacon 디자인 토큰 구조 도입
- theme / surface / ringStyle / aura / particles / motion / scaleTier / palette 기반 디자인
- admin에서 promotion 디자인을 조절할 수 있고 실시간 preview 제공

관련 문서:

- `docs/featured_galaxy_ops.md`
- `docs/promotion_design_manual.md`

주요 파일:

- `src/services/SocialGalaxyService.js`
- `src/components/ThreeEngine/useThreeEngine.jsx`
- `src/components/ui/CommandCenterModal.jsx`

## 4. Super Admin Command Center 현재 상태

`Universe Command Center` 는 승인된 관리자만 접근 가능한 전체 운영 콘솔이다.

### 현재 구현된 섹션

- `Overview`
- `Galaxy Ops`
- `Admins`
- `Notices`
- `Content`
- `Settings`
- `Audit`
- `Errors`
- `Finance`
- `API Usage`

### 현재 구현된 기능

- role / scope 기반 접근 제어
- `super_admin`, `admin`, `editor`, `finance_manager`, `support_manager`, `viewer`
- `featured_galaxies` 생성/수정
- `admin_notices` 생성/수정/삭제
- `admin_documents` 생성/수정
- `admin_settings/global` 편집
- `payments` 입력
- `api_usage_daily` 입력
- `admin_error_logs` 입력
- `admin_audit_logs` 자동 기록
- `rolling_signal` / `popup` 운영
- notices 발행된 ID 관리 및 재사용
- 간단한 AI Command Desk 응답

### 최근 UX/운영 개선

- 관리자 좌측 정보 카드 주황색 톤 적용
- 로그인 썸네일이 있으면 관리자 정보 카드에 함께 표시
- 섹션 설명 문구를 운영자 기준으로 더 쉽게 변경
- 저장 버튼 문구를 “새 문서 저장 / 기존 문서 수정” 흐름으로 일부 정리
- notice 삭제는 즉시 삭제가 아니라 `정말 삭제하시겠습니까?` confirm 후 삭제
- `Error Center` 는 pending / resolved / deleted 상태 관리 방향으로 확장 시작
- `API Usage` 는 라벨이 늘어나면 자동으로 카드 구성이 늘어나도록 개선 시작

### 아직 미완성인 부분

- 일부 버튼의 상태 문구는 전 섹션에서 완전히 통일되지 않았을 수 있다
- `Error Center` 는 카드 클릭 → 상세 원인 확인 → 상태 변경 흐름은 들어갔지만, 삭제/상세 팝업 UX는 더 보강 가능
- `API Usage` 는 자동 확장 구조는 들어갔지만 진짜 외부 모니터링 파이프라인은 별도
- `AI Command Desk` 는 아직 heuristic 기반 응답이지 외부 LLM 연동은 아님

주요 파일:

- `src/components/ui/CommandCenterModal.jsx`
- `src/services/AdminService.js`
- `src/pages/SpacePage.jsx`

관련 문서:

- `docs/admin_command_center_manual.md`
- `docs/firestore_command_center_setup.md`

## 5. 다국어 정책과 현재 적용 상태

최신 합의:

- 앞으로 모든 작업은 한글 / 영어 버전을 함께 고려해야 한다
- 중앙 공지 / 프로모션 / 이벤트 메시지는 현재 화면 언어에 맞게 출력되어야 한다

현재 반영 상태:

- `admin_notices` 는 이제 기본적으로 아래 필드를 지원하도록 코드가 확장됨
  - `title`
  - `body`
  - `ctaLabel`
  - `titleEn`
  - `bodyEn`
  - `ctaLabelEn`
- 우주 화면 rolling signal / popup 은 `language` 값에 따라 적절한 필드를 선택해서 출력함
- 영문 값이 없으면 기존 한글 필드를 fallback 으로 사용함

주의:

- Firestore의 기존 `admin_notices` 문서들은 대부분 한글 필드만 있을 수 있다
- 영문 화면에서 진짜 영문 메시지를 보려면 `titleEn/bodyEn/ctaLabelEn` 을 넣어줘야 한다

## 6. 메인 우주 화면 최신 합의 상태

최근까지 사용자가 요청한 방향:

- 메인 화면에서는 정보 과밀도를 줄인다
- 상단 우측/좌측의 프로필 정보는 굳이 메인 우주 화면에 노출하지 않아도 된다
- 내 정보는 사이드 네비게이션 안으로 넣는 편이 낫다
- 좌하단 `자유 유영중` 카드 제거
- 현재 위치 / 현재 은하 카드는 우측 하단에 두는 편이 더 낫다
- 중앙 rolling signal 은 카드 팝업처럼 튀지 않고, 입력창과 자연스럽게 어우러져야 한다

현재 상태:

- 상단 메인 프로필 버튼 제거
- 사용자 정보는 사이드 네비게이션 안쪽에 존재
- 현재 은하 정보 카드는 우측 하단
- rolling signal 은 입력창 위쪽에 컴팩트한 주황색 바 형태
- 좌하단 hover mode 카드는 제거

주요 파일:

- `src/components/ui/TopBar.jsx`
- `src/components/ui/ImmersiveNav.jsx`
- `src/components/ui/Hero.jsx`
- `src/pages/SpacePage.jsx`

## 7. Firebase / Firestore 현재 실제 운영 상태

### 인증

- Firebase Google Auth 작동 중
- 관리자 계정 확인됨
  - `benjamin@meta.camp`
  - `michinterran@gmail.com`

### 실제 사용 중인 제품 컬렉션

- `users`
- `public_galaxies`
- `featured_galaxies`
- `planet_stats`
- `planet_likes`
- `planet_saves`
- `planet_landings`
- `galaxy_visits`

### Command Center 운영 컬렉션

- `admin_users`
- `admin_settings`
- `admin_notices`
- `admin_documents`
- `admin_error_logs`
- `admin_audit_logs`
- `payments`
- `api_usage_daily`

### 현재 확인된 세팅

- Firestore 생성 완료
- Firestore rules 반영 완료
- `admin_users` 문서 생성 완료
- `admin_settings/global` 문서 생성 완료
- `api_usage_daily` 샘플 문서 생성 완료
- `admin_notices` 샘플 문서 생성 완료
- `payments` 샘플 문서 생성 완료
- `admin_documents` 샘플 문서 생성 완료
- `admin_error_logs` 샘플 문서 생성 완료
- `featured_galaxies` 의 실제 테스트 문서 ID 확인 완료: `brandtestsignal`
- notice 의 `targetGalaxyId` 는 `brandtestsignal` 로 맞춰짐

관련 문서:

- `firestore.rules`
- `docs/firestore_command_center_setup.md`
- `docs/firestore_command_center_seed_examples.json`

## 8. YouTube API status에 대한 현재 로직

사용자 질문이 있었던 포인트:

- `Settings` 의 `YouTube API Status` 가 단순 드롭다운 설명이어서는 안 된다
- 실제 사용량 / 에러 / 쿼터 상태를 보고 모니터링된 상태가 나와야 한다

현재 코드 상태:

- `AdminService.deriveYouTubeStatus()` 가 존재
- 아래를 기준으로 `missing / paused / degraded / healthy / unknown` 를 계산한다
  - `YT_API_KEY` 존재 여부
  - `api_usage_daily` 의 `youtube` 라벨 데이터
  - `admin_error_logs` 의 미해결 YouTube 관련 에러
  - quota block 정보

현재 UX 방향:

- `Settings` 에서는 “직접 상태를 고르는 드롭다운”보다는
- “자동 모니터링 결과를 읽는 카드 + 설명” 쪽이 맞다

## 9. Command Center 섹션별 의미 정리

사용자가 특히 헷갈려했던 부분:

### Galaxy Ops

운영자가 이해해야 하는 주요 필드:

- `ID`
  - 내부 문서 식별자
- `Slug`
  - 공개 주소와 라우팅 텍스트
- `Owner Label`
  - 사용자가 보게 되는 운영 주체 이름
- `Spotlight Text`
  - 카드/신호에 짧게 드러나는 문장
- `Audience Signals`
  - 이 프로모션과 연결되는 mood / genre / artist / scene 신호

### Notices

주요 필드:

- `placement`
  - `rolling_signal` 또는 `popup`
- `targetGalaxyId`
  - 클릭 시 워프할 실제 은하 문서 ID
- `targetGalaxySlug`
  - slug 기반 fallback

### Content

- `slug`
  - 문서 공개 주소에 쓰이는 텍스트

### Audit

목적:

- 누가
- 언제
- 왜
- 무엇을 저장/수정/삭제했는지

운영자가 “이 변경이 왜 생겼는지”를 추적하는 기록 메뉴

### Error Center

목적:

- 서비스 전체 에러를 카드형으로 정리
- 카드 클릭 시 원인 확인
- 상태를 `pending`, `resolved`, `deleted` 로 관리
- 개발 / 운영 / 서비스 대응 관점에서 한 곳에 모이게 함

### API Usage

목적:

- 현재 서비스가 연결한 API 목록을 보여줌
- 각 API의 요청량 / 에러 수 / 남은 쿼터 / 상태를 관리
- 향후 API 라벨이 늘어나면 자동으로 페이지 구성이 확장되는 것이 목표

## 10. 최신 중요 파일 맵

오케스트레이션:

- `src/pages/SpacePage.jsx`

은하 이동:

- `src/hooks/useGalaxyNavigation.js`

3D 엔진:

- `src/components/ThreeEngine/useThreeEngine.jsx`
- `src/utils/planetStyles.js`

메인 우주 UI:

- `src/components/ui/Hero.jsx`
- `src/components/ui/TopBar.jsx`
- `src/components/ui/ImmersiveNav.jsx`
- `src/components/ui/OverlayLayout.jsx`
- `src/components/ui/CurationSignalCard.jsx`

운영 콘솔:

- `src/components/ui/CommandCenterModal.jsx`
- `src/components/ui/panels/panelStyles.jsx`

서비스 / 운영 데이터:

- `src/services/AdminService.js`
- `src/services/SocialGalaxyService.js`
- `src/services/SocialEngagementService.js`

설정 / 카피:

- `src/config/stellara.js`

## 11. Claude가 다음에 바로 이어가기 좋은 우선순위

### 1. 다국어 완성도 높이기

- `Notices` 외에도 Command Center helper text 를 한글/영문 모두 자연스럽게 다듬기
- `Galaxy Ops`, `Content`, `Settings`, `Errors`, `API Usage` 의 설명 문구 정리
- seed notice / document 데이터에도 영문 값 채우기

### 2. Error Center 고도화

- 카드 클릭 → 상세 보기 → 상태 변경 → 삭제 confirm 흐름 완성
- unresolved high severity 중심 정렬
- 원인 / context / stack 가독성 개선

### 3. API Usage 고도화

- API별 health summary card 강화
- Firebase / YouTube / AI API / Stripe 등 provider별 상태 분리
- 진짜 자동 수집 파이프라인 설계

### 4. 메인 화면 정보 절제 마무리

- 메인 우주 화면에 남아 있는 보조 정보 더 줄일지 검토
- 현재 우측 하단 위치 카드 크기와 밝기 미세 조정
- rolling signal bar 의 텍스트 밀도와 motion 다듬기

### 5. Command Center 용어 통일

- 지금 남아 있는 기술적 용어를 더 사용자 친화적으로 바꾸기
- 저장/수정/삭제/초기화 상태 문구를 전 섹션에서 일관되게 정리

## 12. 현재 주의점

- 이 저장소는 history 상 `stellara-v15` 이지만 package version 은 `stellara-v17@17.0.0` 으로 보일 수 있다
- Firestore 문서 구조는 이미 실제 데이터와 연결되어 있으므로, 필드명 변경은 migration 영향을 먼저 확인해야 한다
- 다국어 notice 필드는 코드에서 지원되기 시작했지만, 기존 Firestore 문서엔 아직 영문 값이 없을 수 있다
- Error / API Usage 는 UI는 많이 갖춰졌지만, 운영 자동화 파이프라인은 아직 MVP 수준이다

## 13. Claude에게 전달하고 싶은 핵심 감각

- Stellara는 “음악 서비스 UI”처럼 만들면 안 된다
- 우주 탐험, 큐레이터 사건, 신호, 항로, 방문이라는 감각을 유지해야 한다
- 동시에 운영 콘솔은 관리자에게 쉬운 언어여야 한다
- 최근 사용자 피드백의 핵심은:
  - 정보가 너무 많으면 싫다
  - 카드가 과하면 싫다
  - 의미가 모호한 용어를 싫어한다
  - 저장/삭제 흐름은 명확해야 한다
  - 공지/신호는 한글/영문 모두 정확히 보여야 한다

즉 다음 작업에서도 항상 이 균형을 지켜야 한다:

- 메인 우주 화면: 더 시적이고 더 절제된 인터페이스
- Command Center: 더 명확하고 더 실무적인 운영 인터페이스
