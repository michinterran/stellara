# Stellara Command Center Firebase Setup

작성일: 2026-04-24

이 문서는 `Super Admin Command Center` 를 실제 운영 모드로 켜기 위해 Firebase / Firestore / Vercel 에서 직접 세팅해야 하는 항목을 빠르게 정리합니다.

## 1. 먼저 필요한 환경변수

로컬 `.env.local` 과 Vercel 환경변수에 아래를 넣어야 합니다.

### Firebase 필수

- `VITE_FB_API_KEY`
- `VITE_FB_AUTH_DOMAIN`
- `VITE_FB_PROJECT_ID`
- `VITE_FB_STORAGE_BUCKET`
- `VITE_FB_MESSAGING_SENDER_ID`
- `VITE_FB_APP_ID`
- 선택: `VITE_FB_MEASUREMENT_ID`

### YouTube / 운영 필수

- `VITE_YT_API_KEY`
- `VITE_STELLARA_ADMIN_EMAILS`
- 선택: `VITE_STELLARA_ADMIN_UIDS`
- 선택: `VITE_STELLARA_SUPER_ADMIN_EMAILS`
- 선택: `VITE_STELLARA_SUPER_ADMIN_UIDS`

기본 super admin 이메일은 코드에 이미 내장되어 있습니다.

- `benjamin@meta.camp`
- `michinterran@gmail.com`

그래도 장기 운영 안정성을 위해 `admin_users/{uid}` 문서를 같이 두는 것을 권장합니다.

## 2. Firebase Auth

Firebase Console > Authentication 에서 아래를 확인하세요.

1. `Sign-in method` 에서 `Google` 활성화
2. `Authorized domains` 에 아래 도메인 추가

- `localhost`
- `127.0.0.1`
- `stellara-v15.vercel.app`
- 필요 시 프리뷰 도메인

## 3. Firestore Database

Firebase Console > Firestore Database 에서:

1. Firestore 생성
2. Rules 탭 열기
3. 루트의 [firestore.rules](/Users/benjaminsong/.codex/worktrees/76d4/stellara-v15/firestore.rules) 내용을 붙여넣기
4. `Publish`

이 rules 파일은 Command Center 운영 컬렉션까지 포함합니다.

## 4. Command Center가 실제로 쓰는 컬렉션

운영 컬렉션:

- `admin_users`
- `admin_audit_logs`
- `admin_notices`
- `admin_documents`
- `admin_settings`
- `admin_error_logs`
- `payments`
- `api_usage_daily`

기존 제품 컬렉션:

- `users`
- `public_galaxies`
- `featured_galaxies`

Firestore는 첫 저장 시 컬렉션이 자동 생성되므로, 빈 컬렉션을 미리 만들 필요는 없습니다.

## 5. 꼭 먼저 넣어야 하는 샘플 문서

### 5-1. `admin_users/{your_uid}`

문서 ID는 실제 Firebase Auth UID로 맞추세요.

```json
{
  "uid": "replace-with-real-firebase-uid",
  "email": "benjamin@meta.camp",
  "displayName": "Benjamin",
  "role": "super_admin",
  "status": "active",
  "scopes": [
    "overview",
    "galaxy_ops",
    "admins",
    "notices",
    "content",
    "settings",
    "audit",
    "errors",
    "finance",
    "api_usage"
  ],
  "approvedBy": "bootstrap",
  "approvedAt": "serverTimestamp()",
  "updatedAt": "serverTimestamp()"
}
```

### 5-2. `admin_settings/global`

```json
{
  "maintenanceMode": false,
  "popupEnabled": true,
  "supportEmail": "support@stellara.app",
  "youtubeApiStatus": "unknown",
  "apiNotes": "YouTube status is auto-derived from usage and unresolved errors unless paused manually.",
  "universeEditLock": false,
  "updatedAt": "serverTimestamp()"
}
```

### 5-3. `admin_documents/privacy-policy`

```json
{
  "id": "privacy-policy",
  "kind": "privacy",
  "title": "개인정보처리방침",
  "body": "초기 개인정보처리방침 내용을 여기에 넣습니다.",
  "status": "draft",
  "version": "1.0.0",
  "startsAt": null,
  "endsAt": null,
  "updatedAt": "serverTimestamp()"
}
```

### 5-4. `payments/manual-2026-04-24-001`

```json
{
  "id": "manual-2026-04-24-001",
  "provider": "manual",
  "userId": "sample-user",
  "userEmail": "listener@example.com",
  "amount": 1200,
  "currency": "USD",
  "status": "paid",
  "productType": "brand_orbit",
  "promotionType": "brand",
  "paidAt": "2026-04-24T10:00:00.000Z",
  "updatedAt": "serverTimestamp()"
}
```

### 5-5. `api_usage_daily/youtube-2026-04-24`

```json
{
  "id": "youtube-2026-04-24",
  "label": "youtube",
  "date": "2026-04-24",
  "requests": 120,
  "errors": 0,
  "remainingQuota": 8200,
  "warningThreshold": 1000,
  "updatedAt": "serverTimestamp()"
}
```

### 5-6. `admin_error_logs/frontend-sample-001`

```json
{
  "id": "frontend-sample-001",
  "title": "Sample runtime warning",
  "message": "This is a seed log to verify the Error Center UI.",
  "level": "warning",
  "context": "bootstrap",
  "stack": "",
  "resolved": false,
  "createdAt": "serverTimestamp()",
  "updatedAt": "serverTimestamp()"
}
```

### 5-7. `admin_notices/rolling-signal-sample`

```json
{
  "id": "rolling-signal-sample",
  "placement": "rolling_signal",
  "tone": "campaign",
  "status": "active",
  "title": "공식 항로 열림",
  "body": "새로운 프로모션 신호가 감지되었습니다.",
  "ctaLabel": "워프하기",
  "targetGalaxyId": "replace-with-featured-galaxy-id",
  "targetGalaxySlug": "",
  "startsAt": null,
  "endsAt": null,
  "updatedAt": "serverTimestamp()"
}
```

## 6. YouTube API 상태가 바뀌는 조건

현재 Command Center의 YouTube 상태는 단순 수동 표시가 아니라 운영 데이터를 보고 계산됩니다.

- `missing`
  - `VITE_YT_API_KEY` 가 없음
- `paused`
  - `admin_settings/global.youtubeApiStatus == "paused"`
- `degraded`
  - quota block 발생
  - 최근 `api_usage_daily` 의 `youtube` 기록에서 경고 임계치 이하
  - 최근 YouTube 관련 unresolved error 존재
- `healthy`
  - 최근 `youtube` 사용량 기록이 있고 경고/치명 에러가 없음
- `unknown`
  - API 키는 있지만 아직 판단할 데이터가 거의 없음

즉 `API Usage` 에 `label = youtube` 문서 한두 개만 들어가도 상태 카드가 더 정확해집니다.

## 7. 적용 후 바로 확인할 것

1. 승인된 관리자 계정으로 로그인
2. `My Galaxy > Universe Command Center` 진입
3. `Admins` 탭에서 본인 문서가 보이는지 확인
4. `Settings` 저장이 되는지 확인
5. `Notices` 에서 rolling signal 하나 생성 후 우주 화면에 뜨는지 확인
6. `API Usage` 에 `youtube` 기록 저장 후 Overview 상태가 바뀌는지 확인
7. `Finance`, `Errors`, `Audit` 에 저장 이력이 보이는지 확인

## 8. 가장 흔한 막힘 포인트

- Firebase Auth의 `Authorized domains` 에 배포 도메인이 빠짐
- Firestore Rules에 admin 컬렉션 규칙이 없음
- `admin_users/{uid}` 문서가 없거나 `status: active` 가 아님
- Vercel에 `VITE_FB_*` 또는 `VITE_YT_API_KEY` 가 누락됨
- `targetGalaxyId` 가 실제 존재하는 `featured_galaxies` 문서 ID와 다름
