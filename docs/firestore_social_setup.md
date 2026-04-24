# Stellara Firestore Social Setup

이 문서는 공개 갤럭시 / 공유 / 소셜 지표 MVP를 위해 Firestore에서 준비해야 할 항목을 정리합니다.

## 1. 현재 코드가 사용하는 컬렉션

- `users/{uid}`
  - 기본 유저 정보
  - `galaxyProfile` 저장
- `galaxies/{uid}`
  - 사용자 플레이리스트 기반 행성 데이터
- `public_galaxies/{uid}`
  - 공개 상태인 갤럭시의 공유/탐색용 인덱스
- `featured_galaxies/{featuredGalaxyId}`
  - 브랜드 / 캠페인 / 레이블용 공식 프로모션 은하
  - 우주 관문 상단 `Featured Signals` 영역에 노출
- `planet_stats/{ownerId__planetId}`
  - 행성 좋아요/저장 집계
- `planet_likes/{viewerId__ownerId__planetId}`
  - 사용자가 남긴 행성 좋아요
- `planet_saves/{viewerId__ownerId__planetId}`
  - 사용자가 저장한 행성
- `galaxy_visits/{viewerId__galaxyId}`
  - 공개 은하 방문 기록
- `planet_landings/{viewerId__ownerId__planetId}`
  - 다른 사람 은하에서 특정 행성에 착륙한 기록

## 2. users 문서 예시

```json
{
  "uid": "user_uid",
  "displayName": "Benjamin",
  "email": "user@example.com",
  "photoURL": "https://...",
  "lastLogin": "serverTimestamp()",
  "galaxyProfile": {
    "visibility": "private",
    "slug": "benjamin-galaxy",
    "title": "Benjamin's Galaxy",
    "description": "",
    "featuredPlanetIds": [],
    "tags": [],
    "stats": {
      "likes": 0,
      "visits": 0,
      "landings": 0,
      "resonances": 0,
      "shares": 0
    }
  }
}
```

## 3. public_galaxies 문서 예시

```json
{
  "ownerId": "user_uid",
  "slug": "benjamin-galaxy",
  "title": "Benjamin's Galaxy",
  "description": "Night drift and quiet jazz orbits.",
  "displayName": "Benjamin",
  "photoURL": "https://...",
  "tags": ["night", "jazz"],
  "visibility": "public",
  "stats": {
    "likes": 0,
    "visits": 0,
    "landings": 0,
    "resonances": 0,
    "shares": 0
  },
  "metrics": {
    "publicPlanetCount": 3,
    "featuredPlanetCount": 3
  },
  "featuredPlanets": [
    {
      "planetId": "user_playlist_xxx",
      "name": "Late Night Orbit",
      "artist": "Benjamin",
      "mood": "My Taste",
      "genre": "Library Orbit",
      "trackCount": 5
    }
  ],
  "updatedAt": "serverTimestamp()"
}
```

## 4. Firestore Rules 초안

기존 공개 은하/소셜 기능만 볼 때는 아래 초안으로도 충분했지만, 이제는 `Command Center` 운영 컬렉션까지 포함하는 rules가 필요합니다.

실제 적용은 루트의 [firestore.rules](/Users/benjaminsong/.codex/worktrees/76d4/stellara-v15/firestore.rules) 파일을 기준으로 진행하는 것을 권장합니다.

Firebase Console > Firestore Database > Rules 에서 아래 초안을 기준으로 시작하세요.

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /galaxies/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /public_galaxies/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /featured_galaxies/{featuredGalaxyId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /planet_stats/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /planet_likes/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /planet_saves/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /galaxy_visits/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /planet_landings/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

주의:
- 지금 구조는 MVP 기준이라 `galaxies/{uid}` 를 공개 읽기로 두고 있습니다.
- 나중에 행성 단위 공개/비공개까지 들어가면 `private_galaxies`, `public_planets`, `planet_events` 로 세분화하는 것이 좋습니다.
- `Command Center` 를 실제 운영하려면 `admin_users`, `admin_notices`, `admin_documents`, `admin_settings`, `admin_error_logs`, `admin_audit_logs`, `payments`, `api_usage_daily` 컬렉션 규칙이 추가되어야 합니다.

## 5. 오늘 직접 해야 하는 것

1. Firebase Console > Firestore Database 열기
2. Firestore Database가 없으면 생성
3. Rules 탭에서 위 규칙 적용
4. Publish
5. 앱에서 로그인 후 `My Galaxy` 탭에서
   - 공개/비공개 선택
   - 공유 슬러그 입력
   - 은하 제목 / 설명 저장
6. Firestore에 아래가 생성되는지 확인
   - `users/{uid}.galaxyProfile`
   - 공개 선택 시 `public_galaxies/{uid}`

추가 운영 항목:

7. `featured_galaxies` 컬렉션 생성
8. 브랜드 / 캠페인 / 레이블 은하 문서 입력
9. 앱의 `우주 관문 > Featured Signals` 상단에 노출되는지 확인

## 6. 스프린트 B부터 추가되는 컬렉션

이제 아래 컬렉션이 코드에서 실제로 사용됩니다.

- `featured_galaxies/{featuredGalaxyId}`
- `planet_likes/{planetId_userId}`
- `planet_saves/{planetId_userId}`
- `galaxy_visits/{visitId}`
- `planet_landings/{landingId}`

이 이벤트 로그는 이후 인기/공명/재방문 지표를 계산하는 기반이 됩니다.

## 7. 확인 포인트

- 공개 상태로 저장하면 `public_galaxies/{uid}` 문서가 생겨야 함
- 비공개 상태로 저장하면 `public_galaxies/{uid}` 문서가 제거되어야 함
- `featured_galaxies` 가 비어 있어도 seed featured galaxies가 fallback으로 보여야 함
- `featured_galaxies` 에 같은 `id` 문서를 넣으면 seed보다 Firestore 데이터가 우선되어야 함
- YouTube 플레이리스트가 새로 불러와지면 공개 갤럭시 인덱스의 `featuredPlanets` 도 자동 갱신되어야 함
- 사용자 행성 상세(HUD)에서 좋아요/저장 버튼을 누르면 `planet_stats`, `planet_likes`, `planet_saves` 가 생겨야 함
- 다른 공개 은하로 이동하면 `galaxy_visits` 가 쌓여야 함
- 다른 공개 은하의 행성에 착륙하면 `planet_landings` 가 쌓여야 함

## 8. Command Center 세팅 문서

운영 콘솔까지 함께 켜려면 아래 문서를 바로 따라가면 됩니다.

- [firestore_command_center_setup.md](/Users/benjaminsong/.codex/worktrees/76d4/stellara-v15/docs/firestore_command_center_setup.md)
- [firestore_command_center_seed_examples.json](/Users/benjaminsong/.codex/worktrees/76d4/stellara-v15/docs/firestore_command_center_seed_examples.json)
