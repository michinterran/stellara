# Stellara 🌌
> 우주 공간 컨셉 몰입형 음악 큐레이션 서비스

---

## 빠른 시작 (Antigravity / 로컬)

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.example .env
# .env 파일을 열어서 각 키 값 입력

# 3. 개발 서버 시작
npm run dev
# → http://localhost:3000
```

---

## 환경변수 발급 가이드

### Firebase
1. [Firebase Console](https://console.firebase.google.com) → 새 프로젝트 생성
2. **Authentication** → 로그인 제공업체 → Google 활성화
3. **Firestore Database** → 데이터베이스 만들기 → 프로덕션 모드
4. **프로젝트 설정** → 일반 → 내 앱 → 웹앱 추가 → SDK 구성 복사
5. `.env`에 각 값 붙여넣기

**Firestore 보안 규칙** (`firestore.rules`):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /betaRequests/{doc} {
      allow create: if true;
      allow read: if request.auth != null;
    }
  }
}
```

### Anthropic (Claude API)
1. [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key
2. `VITE_ANTHROPIC_API_KEY`에 입력
3. ⚠️ **프로덕션에서는** 키를 클라이언트에 노출하지 말고 `/api/curate` Edge Function으로 이동

### Apple MusicKit JS
1. [Apple Developer](https://developer.apple.com) → Certificates → Keys → 새 키 생성
2. **MusicKit** 체크 → 다운로드 (`.p8` 파일)
3. Developer Token(JWT) 생성:
   - Team ID: Apple Developer 계정 → 멤버십에서 확인
   - Key ID: 방금 생성한 키의 ID
   - Private Key: `.p8` 파일 내용
4. JWT 생성 예시 (Node.js):
```js
const jwt = require('jsonwebtoken')
const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d',
  issuer: 'YOUR_TEAM_ID',
  header: { alg: 'ES256', kid: 'YOUR_KEY_ID' }
})
```
5. `VITE_APPLE_MUSIC_DEVELOPER_TOKEN`에 입력

### YouTube Data API v3
1. [Google Cloud Console](https://console.cloud.google.com)
2. 새 프로젝트 또는 기존 프로젝트 선택
3. **API 및 서비스** → **라이브러리** → "YouTube Data API v3" 검색 → 사용
4. **사용자 인증 정보** → **API 키** 만들기
5. API 키 제한 설정: HTTP 리퍼러 → `localhost:3000`, `your-domain.vercel.app`
6. `VITE_YOUTUBE_API_KEY`에 입력

---

## GitHub 연결

```bash
# 최초 1회
git init
git remote add origin https://github.com/your-username/stellara.git
git add .
git commit -m "feat: initial Stellara setup"
git push -u origin main
```

---

## Vercel 배포

```bash
# Vercel CLI (처음 한 번)
npm i -g vercel
vercel login

# 배포
vercel

# 환경변수는 Vercel 대시보드 → Settings → Environment Variables 에서 추가
# 또는 CLI:
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_ANTHROPIC_API_KEY
# ... 나머지 변수들도 동일하게

# 프로덕션 배포
vercel --prod
```

### Vercel + GitHub 자동 배포
1. Vercel 대시보드 → New Project → GitHub repo 연결
2. 이후 `git push origin main` 하면 자동으로 배포됩니다

---

## 프로젝트 구조

```
stellara/
├── src/
│   ├── components/
│   │   ├── SpaceScene.js      # Three.js 씬 (순수 JS)
│   │   ├── PlayerBar.jsx      # 하단 플레이어
│   │   ├── PlanetPanel.jsx    # 행성 클릭 후 트랙 패널
│   │   └── BetaModal.jsx      # 베타 신청 모달
│   ├── hooks/
│   │   ├── useAuth.js         # Firebase Auth
│   │   └── useCuration.js     # Claude + 플랫폼 통합
│   ├── lib/
│   │   ├── firebase.js        # Firebase 초기화
│   │   ├── claudeCuration.js  # Claude API 감성 분석
│   │   ├── appleMusic.js      # Apple MusicKit JS
│   │   ├── youtubeMusic.js    # YouTube Data API v3
│   │   ├── userStore.js       # Firestore CRUD
│   │   └── store.js           # Zustand 상태관리
│   ├── pages/
│   │   ├── SpacePage.jsx      # 메인 3D 우주 씬
│   │   ├── PlatformPage.jsx   # 플랫폼 연결 선택
│   │   └── BetaPage.jsx       # 베타 완료 페이지
│   └── App.jsx
├── public/
├── .env.example               # 환경변수 템플릿
├── .gitignore
├── vercel.json
├── vite.config.js
└── package.json
```

---

## 다음 단계 로드맵

- [ ] Apple MusicKit JS Developer Token 발급 및 연동 테스트
- [ ] YouTube API 할당량 모니터링 설정
- [ ] Claude API → Vercel Edge Function으로 이동 (보안)
- [ ] Three.js 씬에 GLSL 셰이더 행성 표면 통합
- [ ] Firestore 베타 신청자 관리 어드민 페이지
- [ ] Spotify 연동 (추후)
