# Stellara Current Agent Handoff

작성일: 2026-04-23  
프로젝트 경로: `/Users/benjaminsong/Desktop/stellara-v15`  
작업 워크트리: `/Users/benjaminsong/.codex/worktrees/76d4/stellara-v15`  
프로덕션 URL: `https://stellara-v15.vercel.app`  
GitHub: `michinterran/stellara-v15`

## 1. 현재 기준 최신 상태

- GitHub 기준 최신 `main` 반영 완료
- 최신 머지 PR: `#5 feat: refine orbital spread and promotion beacons`
- `main` 머지 커밋: `2a57951`
- 머지 시각: 2026-04-23 23:32 KST

중요:

- 현재 이 로컬 워크트리의 `git rev-parse --short HEAD` 는 `541dd99` 로 보일 수 있다.
- 이 값은 로컬 워크트리가 원격 최신 `main` 을 아직 fetch/checkout 하지 않아서 그런 것이고, GitHub 기준 최신 `main` 은 `2a57951` 이다.
- 즉, 다음 채팅에서 작업을 이어갈 때는 먼저 `main` 최신 동기화 여부를 확인하는 것이 좋다.

## 2. 프로젝트 정체성

Stellara는 음악을 직접 스트리밍하는 서비스가 아니라, 사용자의 외부 음악 서비스 라이브러리와 공개 은하를 우주 인터페이스로 탐험하게 만드는 몰입형 음악 큐레이션 소셜 웹 서비스다.

핵심 철학:

- 알고리즘 추천을 소비하는 대신 우주를 탐험하며 음악을 발견한다.
- 플레이리스트는 행성이다.
- 한 사용자의 취향 전체는 갤럭시다.
- 블랙홀은 추천 버튼이 아니라 큐레이터 사건이다.
- SNS는 피드보다 방문, 착륙, 공명, 탐험이 중요하다.

## 3. 이번 스프린트에서 완료된 핵심 개발

### 3-1. 프로덕션 blank screen / 로컬 무설정 환경 안정화

- Firebase 환경 변수가 없어도 앱이 흰 화면으로 죽지 않도록 fallback 처리
- 무설정 환경에서는 탐험 전용 모드와 안내 UI로 안전 진입
- 불필요한 YouTube 호출과 개발용 콘솔 잡음 일부 정리

주요 파일:

- `src/config/firebase.js`
- `src/services/auth/FirebaseAuthService.js`
- `src/services/SocialGalaxyService.js`
- `src/services/SocialEngagementService.js`
- `src/services/GalaxyService.js`
- `src/pages/SpacePage.jsx`

### 3-2. galaxy context / 복귀 흐름 안정화

- `currentGalaxyId`, `currentGalaxyMeta`, `currentGalaxyContext` 를 정리
- `loadGalaxy()` 분기를 helper/hook 수준으로 분리
- foreign galaxy 방문 후 `내 은하로 복귀`가 실패하던 버그 수정
- 개인 은하가 비어 있을 때는 `Stellara Official` 로 안전 fallback

주요 파일:

- `src/pages/SpacePage.jsx`
- `src/hooks/useGalaxyNavigation.js`
- `src/components/ui/panels/MyGalaxyPanel.jsx`
- `src/components/ui/ImmersiveNav.jsx`
- `src/components/ui/CosmicContentStage.jsx`

### 3-3. minimal curation UX 정리

- 큐레이션 응답 문장을 더 짧고 사건 중심으로 축소
- 블랙홀/행성/은하 응답을 카드보다 짧은 배너성 신호로 정리
- 히어로 입력창 보조 문구도 더 미니멀하게 정리

주요 파일:

- `src/pages/SpacePage.jsx`
- `src/components/ui/CurationSignalCard.jsx`
- `src/components/ui/Hero.jsx`

### 3-4. Featured Signals / 브랜드·캠페인·레이블 은하 lane

- `Featured Signals` 상단 레인을 추가
- `brand`, `campaign`, `label` 타입의 featured galaxy 개념 도입
- 현재 궤도/태그/아티스트/무드 기준으로 개인화 점수 산정
- seed featured galaxies + Firestore `featured_galaxies` 병합 구조 구현
- featured galaxy 도착 브리핑도 일반 공개 은하와 톤을 분리

주요 파일:

- `src/config/stellara.js`
- `src/services/SocialGalaxyService.js`
- `src/components/ui/panels/CosmicGatewayPanel.jsx`
- `src/hooks/useGalaxyNavigation.js`
- `src/components/ui/ImmersiveNav.jsx`
- `src/components/ui/OverlayLayout.jsx`

관련 문서:

- `docs/featured_galaxy_ops.md`
- `docs/firestore_social_setup.md`

### 3-5. 임시 admin MVP

- `나의 은하` 패널 하단에 `Featured Galaxy Admin` MVP 폼 추가
- allowlist 기반으로 admin 편집기 노출
- 로컬에서는 `.env.local` 의 `VITE_STELLARA_ADMIN_EMAILS` / `VITE_STELLARA_ADMIN_UIDS` 로 제어
- Firestore `featured_galaxies` 문서 저장까지 연결

하지만 현재 합의:

- 이 admin 방식은 임시 운영 테스트용이다.
- 정식 admin CMS 는 후반 스프린트에서 별도 경로, 별도 권한 구조, 별도 Firestore rules 설계로 다시 만드는 것이 맞다.
- 즉, 다음 개발 우선순위는 admin 이 아니라 제품 경험 쪽이다.

### 3-6. Stage 1: 존재감 있는 다중 사용자 우주

완료된 내용:

- 내 은하 주변에 공개 은하/featured 은하를 원거리 비콘으로 배치
- 프로모션 은하를 일반 공개 은하보다 더 우선적으로, 더 바깥 항로에 배치
- hover 시 이름/운영 주체/짧은 소개/HUD 통계 노출
- 클릭 시 포털 이동과 연결
- `Featured Signals` 와 3D 비콘 레이어가 함께 작동

### 3-7. Stage 2: 소셜 근접도 1차 구현

현재 구현:

- 단순 인기순이 아니라 현재 orbit signal 기준 점수 반영
- 무드, 태그, 현재 행성/트랙/아티스트, 소개 텍스트를 기반으로 가까운 은하를 우선 정렬
- 아직 노드 연결선은 없음
- “왜 가까운지” 한 줄 이유를 보여주는 수준까지 들어감

### 3-8. 사용자 행성 360도 분산 / 프로모션 비콘 비주얼 고도화

이번 최신 머지 PR `#5` 의 핵심:

- 사용자 행성 배치를 피보나치 구면 분포 기반으로 다시 계산
- 실제 행성 수 기준으로 좌표 계산되도록 수정
- 이전처럼 위쪽 반구에 몰리던 현상 완화
- `posCache` 재사용 문제를 layout version + orbit total 기준으로 무효화
- 프로모션 비콘을 사용자 행성권보다 더 바깥에 배치
- `brand / campaign / label` 별로 색, 질감, 링, 글로우, 오로라 변주 강화
- 일부 프로모션 비콘에 잔잔한 파티클 베일 추가
- hover HUD 에 `행성 수 / 방문 / 좋아요` 통계 추가
- 클릭 시 `Nearby Route Locked / 근처 항로 잠금` 전이 강화

주요 파일:

- `src/utils/planetStyles.js`
- `src/components/ThreeEngine/useThreeEngine.jsx`
- `src/pages/SpacePage.jsx`
- `src/components/ui/CosmicTransitionOverlay.jsx`

## 4. Firestore / Firebase 현재 상태

현재 실제로 쓰는 Firestore 컬렉션:

- `users`
- `public_galaxies`
- `featured_galaxies`
- `planet_stats`
- `planet_likes`
- `planet_saves`
- `galaxy_visits`
- `planet_landings`

현재 확인된 운영 상태:

- Firestore 생성 완료
- rules 적용 완료
- `featured_galaxies` 문서 읽기/저장 테스트 성공
- Firebase Google 로그인 정상
- 로컬 개발을 위해 Firebase Authorized Domains 에 `localhost`, `127.0.0.1` 추가 완료

참고:

- 프로덕션에서 admin 편집기를 열려면 Vercel 환경변수에도 admin allowlist 를 넣어야 한다.
- 하지만 이 구조는 임시 MVP 이므로 장기적으로는 env allowlist 방식 대신 정식 admin 권한 구조로 교체하는 것이 맞다.

## 5. Vercel / 운영 메모

- `main` 머지 시 GitHub -> Vercel 프리뷰/프로덕션 배포 흐름은 작동 중
- 최근 PR 들에서 Vercel preview `Ready` 상태 확인
- 프로덕션 URL: `https://stellara-v15.vercel.app`

로컬 admin 테스트 시 사용했던 값:

```env
VITE_STELLARA_ADMIN_EMAILS=benjamin@meta.camp
```

프로덕션에서도 임시 admin 편집기를 열고 싶다면 Vercel에도 같은 변수를 넣어야 하지만, 현재 우선순위는 admin 완성이 아니다.

## 6. 현재 코드 구조에서 가장 중요한 파일

오케스트레이션:

- `src/pages/SpacePage.jsx`

은하 이동/문맥:

- `src/hooks/useGalaxyNavigation.js`

3D 엔진:

- `src/components/ThreeEngine/useThreeEngine.jsx`
- `src/utils/planetStyles.js`

UI 레이어:

- `src/components/ui/ImmersiveNav.jsx`
- `src/components/ui/CurationSignalCard.jsx`
- `src/components/ui/CosmicTransitionOverlay.jsx`
- `src/components/ui/panels/MyGalaxyPanel.jsx`
- `src/components/ui/panels/CosmicGatewayPanel.jsx`

소셜/은하 데이터:

- `src/services/SocialGalaxyService.js`
- `src/services/SocialEngagementService.js`

설정/seed 데이터:

- `src/config/stellara.js`

## 7. 다음 채팅에서 바로 이어갈 추천 우선순위

사용자와 합의된 개발 순서:

### Stage 1

- 존재감 있는 다중 사용자 우주
- 내 은하 주변에 공개 은하 8~20개를 작게 배치
- 거리/크기/빛 강도로 가까운 은하 / 먼 은하 표현
- hover 시 이름, 주인, 분위기, 통계 노출
- 클릭 시 포털 이동
- 프로모션 은하는 우선 배치

현재 상태:

- 1차 구현 완료
- 더 다듬을 수 있는 건 거리 밸런스, hover 가독성, 화면에서의 레이어 분리 정도

### Stage 2

- 소셜 근접도
- 같은 mood/tag/artist/activity 기반으로 가까운 은하 우선 배치
- 아직 노드 연결선은 최소화

현재 상태:

- 1차 구현 완료
- 다음 단계는 유사도 이유를 더 명확하게 보여주거나 점수 기준을 더 정교화하는 것

### Stage 3

- 우주 호버링 모드
- 음악 재생 중 자동 이동
- 행성/은하를 천천히 스쳐 지나감
- 일정 확률로 `새로운 신호 발견`

현재 상태:

- 아직 본격 구현 전
- 다음 큰 차별화 포인트로 들어갈 후보

### Stage 4

- 진짜 소셜 그래프
- 사용자 노드 간 연결선
- favorite cluster
- micro-scene / taste constellation

현재 상태:

- 아직 시작 전
- 사용자 데이터가 더 쌓인 뒤 들어가는 편이 맞음

## 8. 가장 추천하는 다음 작업

다음 채팅에서 바로 시작하기 좋은 순서:

1. `main` 최신 동기화 확인
2. 프로덕션 또는 로컬에서 Stage 1 시각 밸런스 최종 점검
3. Stage 3 `우주 호버링 모드` 설계 및 1차 구현 시작

이유:

- Stage 1 / 2 는 이미 제품 서사에 맞는 첫 구현이 들어갔다.
- 다음 차별화 포인트는 “음악을 들으며 우주를 여행하는 느낌”이다.
- 즉 지금은 admin 고도화보다 hover mode / screensaver mode 가 ROI 가 더 크다.

## 9. 로컬 작업 시 주의점

- 현재 Codex 작업 워크트리의 git 상태가 불안정했던 이력이 있다.
- 실제 커밋/푸시는 건강한 clone `/tmp/stellara-repair` 에서 진행한 적이 있다.
- 다음 채팅에서 git 이 이상하면:
  - 먼저 `git status`
  - 필요하면 건강한 clone 에서 commit/push
  - 원본/작업 워크트리는 코드 수정용으로만 활용

즉, 코드 상태와 Git 상태를 분리해서 보는 것이 안전하다.

## 10. 한 줄 요약

현재 Stellara는 다음 상태다:

- 프로덕션 복구 완료
- galaxy context / 복귀 흐름 안정화 완료
- Featured Signals / 프로모션 은하 lane 완료
- Stage 1 다중 사용자 우주 1차 구현 완료
- Stage 2 소셜 근접도 1차 구현 완료
- 사용자 행성 360도 분산 및 프로모션 비콘 비주얼 고도화 완료
- 다음 큰 우선순위는 `우주 호버링 모드(Stage 3)` 다
