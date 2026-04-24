# Admin Command Center Manual

작성일: 2026-04-24

## 목적

`Command Center` 는 Stellara 전체 운영을 한 화면에서 관리하는 super admin / approved admin 전용 콘솔입니다.

진입 위치:

- 앱 내 `나의 은하` 패널
- 승인된 관리자에게만 `Universe Command Center` 버튼 노출

## 권한 구조

- `super_admin`
  - 전체 메뉴 접근
  - 관리자 승인 가능
  - 설정/공지/콘텐츠/프로모션/재무/에러 전 섹션 편집 가능

기본 super admin 이메일:

- `benjamin@meta.camp`
- `michinterran@gmail.com`
- `admin`
  - 일반 운영 관리자
- `editor`
  - 콘텐츠, 공지, 프로모션 중심 편집
- `finance_manager`
  - 매출/결제 중심 운영
- `support_manager`
  - 공지, 에러, 대응 중심 운영
- `viewer`
  - 읽기 전용 또는 승인 대기

권한 데이터 저장 위치:

- `admin_users/{uid}`

## 섹션 구성

### 1. Overview

- Total Users
- Public Galaxies
- Featured Galaxies
- Approved Admins
- Action Required
  - 승인 대기 관리자
  - 종료 임박 프로모션
  - 중복 활성 팝업
  - 고심각도 에러
  - API quota 경고
- Revenue Analytics
  - today
  - week
  - month
  - year
  - all
- Firebase / YouTube API 상태
- 유저 증가 추이
- API 사용량 추이

### 2. Galaxy Ops

- promoted / featured galaxy 생성 및 수정
- 노출 상태 관리
  - `draft`
  - `active`
  - `paused`
  - `ended`
- 예약 운영
  - `startsAt`
  - `endsAt`
- featured order 조정
- promotion design 편집

### 3. Admins

- 관리자 승인
- 역할 부여
- 상태 변경
  - `pending`
  - `active`
  - `suspended`

### 4. Notices

- center rolling signal / popup 관리
- 톤
  - `info`
  - `warning`
  - `campaign`
  - `emergency`
- 예약 운영
  - `startsAt`
  - `endsAt`
- `popup`
  - 최대 동시 노출 1개
  - 클릭 시 프로모션 은하/행성 워프 가능
- `rolling_signal`
  - 여러 개를 순차적으로 롤링
  - 우주 화면 중앙 근처 HUD에서 자연스럽게 노출
  - 클릭 시 프로모션 은하/행성 워프 가능

### 5. Content

- 개인정보처리방침
- 이용약관
- FAQ
- About
- 버전 관리
- 예약 발행 필드
  - `startsAt`
  - `endsAt`

### 6. Settings

- maintenance mode
- popup enabled
- universe edit lock
- support email
- API 운영 메모

### 7. Error Center

- 운영 에러 로그
- 긴급 대응 참고용 상태판

### 8. Finance

- 결제 내역
- 매출 총합
- 기간별 Revenue Analytics
- provider 예시
  - `stripe`
  - `lemonsqueezy`
  - `toss`
  - `kakao`
  - `manual`

### 9. API Usage

- API 요청량
- quota pressure 상태
- 최근 사용량 기록
- 대상 API
  - YouTube
  - Firebase read/write
  - future AI API

## 운영 컬렉션

- `admin_users`
- `admin_audit_logs`
- `admin_notices`
- `admin_documents`
- `admin_settings`
- `admin_error_logs`
- `payments`
- `api_usage_daily`
- 기존 운영 컬렉션
  - `users`
  - `public_galaxies`
  - `featured_galaxies`

## 감사 로그

모든 주요 저장 액션은 `admin_audit_logs` 로 남깁니다.

로그 필드 예시:

- actor uid
- actor email
- action
- section
- target id
- payload
- createdAt

## 운영 원칙

- 공지/팝업/프로모션은 반드시 `draft -> active -> paused/ended` 흐름 유지
- 프로모션 디자인은 임의 색 남발보다 preset 기반 운영
- emergency notice 는 popup 을 최소 강도로만 사용
- 기본 운영 공지는 `rolling_signal` 우선
- 관리자 승인은 최소 권한 원칙으로 시작
- role + scope 기준으로 필요한 섹션만 노출

## 프로모션 상품 구조

- `Brand Orbit`
  - 장기 프리미엄 프로모션
  - 권장 30일
- `Campaign Burst`
  - 7일~21일 강노출
  - rolling signal + popup + beacon 조합
- `Label Residency`
  - 14일~45일 상주형 노출
  - 반복 집행에 적합

## 다음 권장 확장

1. 섹션별 세부 scope 제한
2. 예약 발행 `startsAt`, `endsAt`
3. 에러 자동 수집 파이프라인
4. 결제 공급자 연동 심화
5. 운영 대시보드용 저장된 snapshot 캐시
