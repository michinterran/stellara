# Stellara 프로젝트 작업 인계 보고서 (Developer Handoff Report)

본 보고서는 **Stellara v15** 프로젝트에서 발생했던 YouTube Music 재생 문제의 해결 내용과 향후 고도화 방향을 정리한 문서입니다. 다른 AI 에이전트(Claude 등)가 컨텍스트를 즉시 파악하고 이어서 작업할 수 있도록 기술적인 내용을 중심으로 작성되었습니다.

---

## 1. 주요 수정 사항 (Resolved Issues)

### 1-1. YouTube Music 재생 불가 문제 해결
*   **원인**: `SpacePage.jsx` 내의 `BASE_PLANETS` 데이터에 `ytId`가 `null`로 하드코딩되어 있어, 실제 소리가 출력되지 않고 진행 바만 움직이는 시뮬레이션 모드로 작동하고 있었습니다.
*   **해결**: 각 행성의 분위기에 맞는 실제 YouTube 비디오 ID를 할당하여 즉시 재생이 가능하도록 수정했습니다.

### 1-2. IFrame API 초기화 및 레이스 컨디션 해결
*   **원인**: YouTube IFrame API가 로드되는 시점과 React 컴포넌트의 마운트 시점 불일치로 인해 `ytRef.current`가 `null`이거나 플레이어 메서드(`loadVideoById`)를 호출할 수 없는 상태에서 명령이 전달되는 문제가 있었습니다.
*   **해결**:
    - `isPlayerReady` 상태를 도입하여 플레이어의 `onReady` 이벤트를 추적합니다.
    - `doPlay` 함수 내에서 플레이어가 준비되지 않았을 경우, 인터벌을 통해 최대 2초간 재시도 후 실패 시 시뮬레이션 모드로 전환하는 방어 로직을 추가했습니다.
    - `window.YT`가 이미 존재하는 경우와 `onYouTubeIframeAPIReady` 콜백을 모두 처리하여 HMR(Hot Module Replacement) 환경에서도 안정적으로 작동합니다.

### 1-3. 브라우저 자동 재생 정책 및 차단 대응
*   **원인**: `1x1` 크기의 보이지 않는 플레이어는 일부 브라우저에서 스팸이나 부적절한 자동 재생으로 간주되어 차단될 가능성이 높았습니다.
*   **해결**: 플레이어 크기를 `200x200`으로 키우고, 화면 밖(`bottom: -500px`)으로 완전히 격리 배치하여 기능은 유지하되 시각적인 방해는 없도록 조치했습니다.

---

## 2. 환경 설정 및 보안 (Environment & Security)

*   **API Key 관리**: 검색 및 AI 큐레이션 기능을 활성화하기 위해 `.env` 파일을 생성하고 `VITE_YT_API_KEY`를 설정했습니다.
*   **보안**: 리포지토리 루트에 `.gitignore` 파일을 생성하여 `.env`, `node_modules`, `.DS_Store` 등이 Git에 포함되지 않도록 설정했습니다.

---

## 3. 코드 구조 개선 제안 (Future Recommendations)

현재 `SpacePage.jsx`는 약 600라인의 거대 컴포넌트로, 생산성 향상을 위해 다음과 같은 리팩토링을 권장합니다:

1.  **컴포넌트 분리**: `Hero`, `PlanetPanel`, `PlayerBar`, `SubPanel` 등을 별도 파일로 분리하여 가독성을 높여야 합니다.
2.  **유튜브 로직 커스텀 훅화**: 플레이어 제어 및 API 로드 로직을 `useYouTubePlayer`와 같은 커스텀 훅으로 분리하면 `SpacePage`의 복잡도를 획기적으로 줄일 수 있습니다.
3.  **인라인 스타일 정리**: 현재 모든 스타일이 JS 객체로 인라인 정의되어 있습니다. CSS Modules 또는 Styled-components 등으로 전별하여 로직과 디자인을 분리하는 것이 좋습니다.

---

## 4. 현재 상태 (Current Status)
*   **재생 기능**: 정상 (실제 소리 출력 확인됨)
*   **검색/큐레이션**: 정상 (VITE_YT_API_KEY 적용됨)
*   **Git 상태**: 최신 변경 사항이 `main` 브랜치에 Push 완료되었으며, 민감 정보 보호 설정됨.

위 내용을 바탕으로 인계받은 개발자가 다음 단계의 고도화(UI 폴리싱, 성능 최적화 등)를 진행할 수 있습니다.
