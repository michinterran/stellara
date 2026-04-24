# Stellara 리브랜딩 및 고도화 작업 인수인계

작성일: 2026-04-23  
프로젝트: `stellara-v15`  
저장소: `michinterran/stellara-v15`  
배포: Vercel `stellara-v15`

## 1. 프로젝트 정체성

Stellara는 우주 공간 컨셉의 몰입형 음악 큐레이션 소셜 웹 서비스다.

- 서비스 철학: `The Joy of Serendipity`
- 핵심 경험: 사용자가 알고리즘 추천을 수동적으로 받는 대신, 3D 우주를 직접 탐험하며 음악 행성에 착륙한다.
- 세계관:
  - 우주 = 전체 음악 서비스 공간
  - 행성 = 하나의 플레이리스트
  - 갤럭시 = 한 사용자의 음악 세계
  - 블랙홀 = 향후 AI 큐레이터
  - 탐험 = 다른 유저 갤럭시 방문
- 사업 방향:
  - 직접 음악 스트리밍을 하지 않는다.
  - YouTube Music, Apple Music 등 외부 음악 서비스를 연결하는 인터페이스/SNS 레이어를 제공한다.
  - 운영 유지비는 최소화하고, 음악 발견 경험과 큐레이션 UX에 집중한다.

## 2. 현재 기술 스택

- React 18
- Vite
- Three.js
- Firebase Auth
- YouTube Data API / YouTube provider adapter
- Vercel 배포

주요 실행 명령:

```bash
npm run dev
npm run build
vercel --prod
```

## 3. 현재까지 완료된 주요 작업

### Vercel 설정 안정화

`vercel.json`에서 존재하지 않는 Secret 참조를 제거했다. 이전에는 다음 오류가 발생했다.

```text
Environment Variable "VITE_FB_API_KEY" references Secret "stellara-firebase-api-key", which does not exist.
```

현재 `vercel.json`은 빌드/출력/SPA rewrite만 담당해야 한다.

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

환경 변수는 Vercel Dashboard의 Environment Variables에서 관리한다.

### 배포 상태

GitHub push는 정상 동작한다. 다만 Vercel Git 자동 배포가 한동안 최신 커밋을 새 Production Deployment로 만들지 못하는 문제가 있었다.

현재는 Vercel CLI 배포가 성공한 상태다.

```bash
vercel login
vercel link
vercel --prod
```

성공 배포 URL:

```text
https://stellara-v15.vercel.app
```

주의: Git 자동 배포가 완전히 회복되었는지는 아직 별도 확인이 필요하다. 배포가 급하면 `vercel --prod`를 사용한다.

### 서비스 정체성 반영 리팩터링

중앙 설정 파일 `src/config/stellara.js`를 추가해 서비스 문구, 큐레이션 쿼리, 행성/갤럭시 데이터, 카피를 관리하도록 정리했다.

주요 변경 파일:

- `src/config/stellara.js`
- `src/pages/SpacePage.jsx`
- `src/components/ui/Hero.jsx`
- `src/components/ui/TopBar.jsx`
- `src/components/ui/ImmersiveNav.jsx`
- `src/components/ui/SubPanel.jsx`
- `src/components/ui/GalaxyPortal.jsx`
- `src/components/ThreeEngine/useThreeEngine.jsx`
- `src/utils/youtube.js`

### YouTube 토스트 반복 오류 완화

`YouTube Music 플레이리스트를 불러오지 못했습니다` 토스트가 무한 반복되는 문제가 있었다.

원인:

- 플레이리스트 hydrate 실패
- 상태 변경
- effect 재실행
- 동일 실패 토스트 반복

조치:

- toast dedupe 로직 추가
- playlist hydration in-flight/ref guard 추가
- 동일 토큰에 대한 반복 실패 호출 방지
- logout/connect 시 관련 ref 초기화

관련 파일:

- `src/pages/SpacePage.jsx`

### 폰트 롤백

사용자가 이전 폰트가 더 낫다고 피드백했다. 전역 폰트는 유지되어 있었지만 여러 컴포넌트의 inline `fontFamily: 'system-ui'`가 전역 폰트를 덮고 있었다.

조치:

- 주요 UI 컴포넌트의 inline font를 `fontFamily: 'inherit'`로 변경했다.

관련 파일:

- `src/components/ui/Hero.jsx`
- `src/components/ui/SubPanel.jsx`
- `src/components/ui/EscHint.jsx`
- `src/pages/SpacePage.jsx`
- `src/components/ui/Toasts.jsx`
- `src/components/ui/PlayerControls.jsx`
- `src/components/ui/PlanetHUD.jsx`
- `src/components/ui/ImmersiveNav.jsx`
- `src/components/ui/GalaxyPortal.jsx`

## 4. 현재 구조에서 중요한 파일

### 앱 진입

- `src/main.jsx`
  - React root
  - Auth provider
  - SpacePage 렌더링

### 메인 페이지

- `src/pages/SpacePage.jsx`
  - 현재 가장 중요한 오케스트레이션 파일
  - 로그인 상태
  - 갤럭시/플레이리스트 데이터
  - YouTube 연결
  - 토스트
  - ThreeEngine 이벤트 브릿지
  - UI 패널 상태

### UI 레이아웃

- `src/components/ui/OverlayLayout.jsx`
  - 상단/우측/하단 UI 배치의 중심
- `src/components/ui/ImmersiveNav.jsx`
  - 현재 우측 내비게이션 역할
- `src/components/ui/SubPanel.jsx`
  - 우측 패널성 콘텐츠
- `src/components/ui/Hero.jsx`
  - 중앙 히어로/슬로건 영역
- `src/components/ui/TopBar.jsx`
  - 상단 브랜딩
- `src/components/ui/PlayerControls.jsx`
  - 하단 플레이어
- `src/components/ui/Toasts.jsx`
  - 토스트 표시

### 3D 엔진

- `src/components/ThreeEngine/useThreeEngine.jsx`
- `src/components/ThreeEngine/CanvasLayer.jsx`

### 설정/데이터

- `src/config/stellara.js`
- `src/config/firebase.js`
- `src/utils/youtube.js`
- `src/utils/providers/YouTubeProvider.js`

## 5. 알려진 주의점과 리스크

- Vercel Git 자동 배포가 한동안 최신 커밋을 잡지 못했다. Git 연결은 다시 연결된 상태지만, 안정 여부는 추가 확인이 필요하다.
- Vercel Deploy Hook은 최신 Git 커밋을 빌드하는 용도가 아니라 기존 배포 흐름을 다시 트리거하는 형태로 보일 수 있다. 최신 코드를 확실히 배포하려면 `vercel --prod`가 안전했다.
- `vercel.json`에 환경 변수를 직접 넣거나 존재하지 않는 Secret을 참조하면 배포가 실패한다.
- Firebase/YouTube 키는 Vercel Environment Variables에 있어야 한다.
- `VITE_YT_API_KEY`가 없으면 비로그인 YouTube 검색/큐레이션 호출은 실패할 수 있다.
- 로그인 후 YouTube 플레이리스트 연동은 OAuth token/scope/API 정책에 영향을 받을 수 있다.
- `npm run build`는 통과해야 한다. 이전에 `npm run lint`는 ESLint 설정 부재로 바로 사용할 수 없는 상태였다.

## 6. 새 작업지시서 요약

목표: Stellara 웹 서비스를 우주적 테마의 UI/UX로 고도화하고 리브랜딩한다.

필수 기능:

- 우측 고정 네비게이션 시스템 구축
- 메뉴 클릭 시 메인 콘텐츠 영역만 동적 교체
- 시간대별 페르소나 슬로건 랜덤 출력
- 모든 UI/Text 콘텐츠 Fade-in/Fade-out
- 설정 페이지를 `우주 조율` 컨셉으로 구현
- 기존 로그인과 YouTube 데이터 연동 유지

우측 사이드바 메뉴:

- 나의 은하
- 성단 기록
- 우주 관문
- 우주 조율
- 로그아웃

완료 조건:

- 페이지 전체 리프레시 없이 컴포넌트만 교체
- 전환 애니메이션은 약 0.3초
- 슬라이더 값, 연결 상태 등 상태 유지
- 기존 로그인/YouTube 기능 정상 유지

## 7. 다음 작업 권장 설계

사용자 요청 프로토콜상 바로 코딩하지 말고 먼저 분석/보고/승인을 받아야 한다.

권장 순서:

1. `SpacePage.jsx`, `OverlayLayout.jsx`, `ImmersiveNav.jsx`, `SubPanel.jsx`, `Hero.jsx`, `stellara.js` 구조를 먼저 읽는다.
2. 현재 `SpacePage.jsx`에 집중된 상태를 어떤 것은 유지하고 어떤 것은 분리할지 보고한다.
3. 우측 메뉴 상태는 `activeMenu` 같은 단일 상태로 시작한다.
4. 메뉴별 콘텐츠 컴포넌트를 새로 분리한다.
5. 슬라이더/연결 상태는 메뉴 컴포넌트 안에 가두지 말고 `SpacePage` 또는 별도 hook/context에 둔다.
6. 애니메이션은 새 의존성 없이 CSS transition으로 먼저 구현하는 것을 권장한다.
7. Framer Motion은 꼭 필요할 때만 추가한다. 현재 프로젝트 규모에서는 CSS transition이 더 단순하고 안전하다.
8. 시간대별 슬로건은 `src/config/stellara.js`에 데이터로 두고, hook에서 현재 시간대와 랜덤 선택을 처리한다.
9. 로그아웃 메뉴는 콘텐츠 렌더링이 아니라 기존 logout handler를 호출하는 action menu로 처리한다.
10. 작업 후 `npm run build`로 검증한다.

## 8. 제안 파일 구조

새로 만들 가능성이 높은 파일:

```text
src/components/ui/CosmicContentStage.jsx
src/components/ui/panels/MyGalaxyPanel.jsx
src/components/ui/panels/ClusterRecordsPanel.jsx
src/components/ui/panels/CosmicGatewayPanel.jsx
src/components/ui/panels/CosmicTuningPanel.jsx
src/hooks/useTimePersona.js
```

수정 가능성이 높은 파일:

```text
src/pages/SpacePage.jsx
src/components/ui/OverlayLayout.jsx
src/components/ui/ImmersiveNav.jsx
src/components/ui/Hero.jsx
src/components/ui/SubPanel.jsx
src/config/stellara.js
```

가능하면 `SpacePage.jsx`를 더 거대하게 만들지 말고, 렌더링 전환과 메뉴 콘텐츠를 작은 컴포넌트로 분리한다.

## 9. 구현 디테일 제안

### 메뉴 전환

- `activeMenu` 상태를 둔다.
- `ImmersiveNav`는 메뉴 클릭 이벤트만 올린다.
- `CosmicContentStage`가 `activeMenu`에 따라 콘텐츠 컴포넌트를 선택한다.
- 이전 콘텐츠 fade-out 후 새 콘텐츠 fade-in을 CSS class로 처리한다.

### 상태 유지

- 슬라이더 값은 `CosmicTuningPanel` 내부 state로만 두면 unmount 시 초기화될 수 있다.
- `SpacePage` 또는 `useCosmicSettings` hook에 상태를 둔다.
- 메뉴 컴포넌트는 props로 값을 받고 setter를 호출한다.

### 시간대별 슬로건

시간대 예시:

- 새벽: 04:00-10:59
- 낮: 11:00-16:59
- 저녁: 17:00-20:59
- 밤: 21:00-03:59

슬로건 문구는 `stellara.js`에 배열로 둔다.

### 우주 조율

슬라이더 최솟값은 반드시 `1`로 한다.

예시 항목:

- 행성 밀도
- 궤도 속도
- 별빛 강도
- 세렌디피티 감도
- 탐험 거리

### 다국어 기초 구조

초기에는 완전한 i18n 라이브러리보다 설정 객체 기반을 권장한다.

```js
const UI_COPY = {
  ko: {},
  en: {}
};
```

## 10. 검증 명령

작업 후 최소 검증:

```bash
npm run build
git status
```

배포가 필요하면:

```bash
git add .
git commit -m "feat: enhance Stellara cosmic navigation experience"
git push
vercel --prod
```

Git 자동 배포가 다시 정상화되었는지 확인하려면 GitHub push 후 Vercel Deployments에서 새 커밋이 자동으로 잡히는지 본다.

## 11. 다음 작업자에게 남기는 메시지

이 프로젝트는 아직 초기 제품의 감성과 구조가 함께 움직이는 단계다. 기능만 추가하면 서비스 정체성이 흐려질 수 있으므로, UI 문구와 인터랙션은 항상 `우주 탐험으로 음악을 발견한다`는 철학에 맞춰야 한다.

사용자는 초보자이므로 작업 전에는 반드시 다음 형식으로 먼저 보고하는 것이 좋다.

```text
1. 현재 구조에서 확인한 문제
2. 수정할 파일 목록
3. 각 파일에서 바꿀 내용
4. 기존 로그인/YouTube 기능을 보호하는 방법
5. 예상 리스크
```

그 다음 사용자 확인을 받고 코딩을 시작한다.

