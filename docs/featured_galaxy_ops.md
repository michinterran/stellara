# Featured Galaxy Ops

작성일: 2026-04-23  
대상: Stage 1 B2B / 공식 프로모션 은하 운영

## 목적

Stellara의 `Featured Signals` 영역은 일반 공개 은하와 별도로, 브랜드/캠페인/레이블 은하를 사용자 현재 궤도에 맞춰 우선 노출하는 슬롯입니다.

이 문서는 다음 단계를 위한 운영 기준 초안입니다.

- Firestore 컬렉션 설계
- 필수 필드 정의
- 우선순위/개인화 방식
- 향후 admin UI 연결 기준

## 현재 구현 상태

현재는 코드 seed 기반으로 동작합니다.

- 위치: [stellara.js](/Users/benjaminsong/.codex/worktrees/76d4/stellara-v15/src/config/stellara.js)
- 노출 위치: `CosmicGatewayPanel` 상단 `Featured Signals`
- 개인화 기준:
  - 현재 로드된 행성 이름
  - 행성 mood / genre / artist
  - 일부 트랙 title / artist
  - 사용자 `galaxyProfile.tags`
  - 사용자 `galaxyProfile.title`, `description`

## 권장 Firestore 컬렉션

컬렉션 이름:

- `featured_galaxies`

문서 ID 예시:

- `brand_afterglow_radio`
- `campaign_comeback_signal`
- `label_midnight_pressing`

## 필수 필드

```json
{
  "title": "Afterglow Radio",
  "slug": "afterglow-radio",
  "description": "브랜드와 아티스트가 함께 만든 야간 드라이브형 공식 은하",
  "ownerLabel": "Stellara Brand Studio",
  "ownerId": "stellara_brand_afterglow",
  "visibility": "public",
  "promotionType": "brand",
  "promotedBy": "Afterglow x Stellara",
  "spotlightText": "심야 이동감과 몽환 신호에 맞춘 브랜드 은하",
  "isFeatured": true,
  "featuredOrder": 1,
  "tags": ["night", "drive", "dreamy"],
  "audienceSignals": ["심야", "드라이브", "몽환", "ambient"],
  "status": "active",
  "startAt": null,
  "endAt": null,
  "stats": {
    "likes": 0,
    "visits": 0,
    "landings": 0,
    "resonances": 0,
    "shares": 0
  },
  "planets": []
}
```

## 필드 설명

- `promotionType`
  - 허용값: `brand`, `campaign`, `label`
- `promotedBy`
  - 사용자에게 보여줄 운영 주체
- `spotlightText`
  - 카드 본문에서 설명 대신 먼저 보여줄 짧은 문장
- `featuredOrder`
  - 수동 우선순위
- `audienceSignals`
  - 개인화 매칭에 쓰는 핵심 키워드
- `status`
  - 권장값: `draft`, `active`, `paused`, `ended`
- `startAt`, `endAt`
  - 캠페인성 은하 자동 노출 제어용

## 개인화 우선순위 제안

현재 구현은 간단한 문자열 매칭입니다. 다음 단계에서는 아래 순서로 점진적으로 고도화하는 것이 안전합니다.

1. 현재 행성 / mood / genre 기반 매칭
2. 사용자 갤럭시 태그 기반 매칭
3. 최근 방문 은하 / 착륙 기록 기반 가중치
4. 저장 / 좋아요 / 공명 데이터 기반 가중치

권장 원칙:

- `featuredOrder`는 완전 수동 강제 노출용
- `audienceSignals`는 취향 정렬용
- 인기 지표(`visits`, `likes`)는 보조 점수로만 사용

## Admin UI 1차 요구사항

최소 기능만 먼저 붙이는 것이 좋습니다.

1. featured galaxy 생성
2. 상태 변경 (`draft`, `active`, `paused`, `ended`)
3. 노출 순서 변경 (`featuredOrder`)
4. 태그 / audienceSignals 편집
5. 행성 목록 편집

초기에는 다음 두 화면만 있어도 충분합니다.

- 리스트 화면
- 편집 폼 화면

현재 앱에는 최소 편집기가 이미 연결되어 있습니다.

- 위치: `My Galaxy` 패널 하단
- 노출 조건:
  - `VITE_STELLARA_ADMIN_EMAILS`
  - `VITE_STELLARA_ADMIN_UIDS`

예시:

```env
VITE_STELLARA_ADMIN_EMAILS=me@example.com,team@example.com
VITE_STELLARA_ADMIN_UIDS=my-firebase-uid
```

## 운영 가이드

- 메인 상단 노출은 항상 2~3개 이내 유지
- 광고처럼 보이지 않도록 `공식 우주 이벤트` 톤 유지
- 브랜드 은하도 반드시 실제 탐험 가치가 있어야 함
- 캠페인 종료 후에는 `paused` 또는 `ended` 처리
- 레이블 은하는 장기 운영, 캠페인은 기간 운영으로 분리 권장

## 다음 개발 순서

1. `featured_galaxies` Firestore 읽기 추가
2. seed fallback + Firestore 병합
3. admin 생성/수정 화면 추가
4. 성과 지표 대시보드 연결
5. 기간 예약 노출(`startAt`, `endAt`) 자동화
