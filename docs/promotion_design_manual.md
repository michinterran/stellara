# Promotion Design Manual

작성일: 2026-04-24

## 목적

프로모션 천체는 일반 사용자 은하보다 높은 퀄리티를 가져야 합니다.

원칙:

- 더 밝기만 한 오브제가 아니라, 더 설계된 천체처럼 보여야 한다
- Stellara 세계관을 해치지 않고 공식 항로처럼 보여야 한다
- 브랜드/캠페인/레이블 성격이 즉시 읽혀야 한다

## 디자인 입력 구조

`featured_galaxies/{id}.design`

```json
{
  "theme": "luxury",
  "surface": "glass",
  "ringStyle": "double",
  "aura": "veil",
  "particles": "medium",
  "motion": "drift",
  "scaleTier": "hero",
  "story": "심야 드라이브용 프리미엄 브랜드 항로",
  "palette": {
    "primary": "#E38CB8",
    "secondary": "#F4D4AE",
    "accent": "#F6CCE4",
    "glow": "#EBC8F0"
  }
}
```

## 필드 설명

- `theme`
  - 전체 분위기 preset
- `surface`
  - 재질 인상
- `ringStyle`
  - 외곽 실루엣 제어
- `aura`
  - 주변 빛막/오로라 감정
- `particles`
  - 입자 강도
- `motion`
  - 애니메이션 성격
- `scaleTier`
  - 천체 크기 등급
- `story`
  - 운영자 메모용 디자인 의도
- `palette`
  - 실제 색상 계열

## 추천 preset

### 1. Brand

- 추천 theme: `luxury`
- 추천 surface: `glass`
- 추천 ringStyle: `double`
- 추천 aura: `veil`
- 추천 particles: `medium`
- 추천 motion: `drift`

느낌:

- 프리미엄
- 감도 높음
- 질감이 정교함
- 돈을 들여 연출된 오브제 느낌

### 2. Campaign

- 추천 theme: `broadcast`
- 추천 surface: `plasma`
- 추천 ringStyle: `tilted`
- 추천 aura: `pulse`
- 추천 particles: `high`
- 추천 motion: `broadcast`

느낌:

- 지금 열려 있는 이벤트
- 강한 전파
- 짧고 집중된 주목도

### 3. Label

- 추천 theme: `editorial`
- 추천 surface: `ceramic`
- 추천 ringStyle: `single`
- 추천 aura: `soft`
- 추천 particles: `low`
- 추천 motion: `calm`

느낌:

- 정제됨
- 취향 큐레이션
- 장기 운영형

## scaleTier 가이드

- `standard`
  - 작은 프로모션 노출
  - 과도한 존재감 금지
- `hero`
  - 기본 추천
  - 메인 featured lane 용
- `monument`
  - 아주 큰 캠페인 전용
  - 남발 금지

## 색상 가이드

- `primary`
  - 본체 인상
- `secondary`
  - 링/halo 계열
- `accent`
  - 입자/보조 포인트
- `glow`
  - 전체 발광 톤

원칙:

- 채도 높은 색은 2개 이상 강하게 쓰지 않는다
- glow 색은 primary 보다 한 톤 부드럽게 잡는다
- accent 는 CTA가 아니라 “우주 신호”처럼 써야 한다

## 금지 패턴

- 네온 컬러 4개 이상 혼합
- 입자 `high` + motion `broadcast` + scaleTier `monument` 조합 남발
- 브랜드 색을 그대로 100% 복사해서 우주 톤을 해치는 경우
- 지나치게 광고 배너처럼 보이는 텍스트/색 조합

## 운영 추천 절차

1. promotion type 선택
2. preset theme 선택
3. palette 입력
4. story 작성
5. preview 확인
6. `draft` 저장
7. 리뷰 후 `active`

## 다음 권장 확장

1. live preview panel
2. preset gallery
3. 디자인 A/B 실험
4. hover CTR / portal enter rate 기반 디자인 성과 비교
