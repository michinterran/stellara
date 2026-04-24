import React from 'react';
import { createDefaultPlanetDraft, getPlanetLimitSummary, validatePlanetDraft } from '@services/PlanetService';
import {
  OptionTileGroup,
  PLANET_PARTICLE_OPTIONS,
  PLANET_SIZE_OPTIONS,
  PLANET_SURFACE_OPTIONS,
  PLANET_PALETTE_OPTIONS,
  PlanetOrbitPreview,
} from './PlanetAppearanceStudio';

const VISIBILITY_OPTIONS = ['public', 'private', 'link'];
function getCopy(language = 'ko') {
  return language === 'en'
    ? {
        kicker: 'Planet Studio',
      title: 'Give birth to a new planet',
        description: 'Build a planet in one calm flow. Define the identity first, shape the visual language next, then add the routes that will let others land there.',
        close: 'Close',
        create: 'Birth planet',
        creating: 'Launching orbit...',
        update: 'Update planet',
        limits: 'Orbit limits',
        identity: 'Planet identity',
        stars: 'Tracks in this orbit',
        access: 'Who can land here',
        preview: 'Preview orbit',
        confirm: 'Confirm birth',
        steps: {
          one: 'Step 1 · Declare a new planet',
          two: 'Step 2 · Define identity and design',
          three: 'Step 3 · Add YouTube routes',
          four: 'Step 4 · Choose the landing route',
          five: 'Step 5 · Review the orbit before birth',
        },
        helperIdentity: 'Use short, clear words that still feel like a place you would want to land on.',
        helperStars: 'Paste YouTube or YouTube Music links. Stellara stores the route, not the thumbnail.',
        helperAccess: 'Visibility should feel like a route choice, not a technical setting.',
        helperConfirm: 'Look over the route, visibility, and design one last time before you let the planet enter your galaxy.',
        introTitle: 'Are you ready to give birth to a new planet?',
        introDescription: 'A Stellara planet is not a list. It is a place shaped by identity, design, routes, and landing rules. Use this studio to build it in a single pass.',
        introNote: 'You can return here anytime to keep expanding your galaxy one orbit at a time.',
        limitTitle: 'Your current orbit is full',
        limitDescription: 'Free Tribe can hold up to the current planet limit. Upgrade to Plus Tribe to keep creating planets or unlock private and link-only routes.',
        name: 'Planet name',
        descriptionLabel: 'Short description',
        tags: 'Signals',
        palette: 'Color field',
        planetType: 'Surface type',
        ring: 'Planet ring',
        particle: 'Particle trail',
        addTrack: 'Add another track',
        removeTrack: 'Remove',
        confirmTrack: 'Confirm',
        editTrack: 'Edit',
        trackUrl: 'YouTube URL',
        size: 'Planet size',
        public: 'Public',
        private: 'Private',
        link: 'Link only',
        publicDetail: 'Other listeners can discover and land on this planet.',
        privateDetail: 'Only you can read this orbit.',
        linkDetail: 'Only people with the route can arrive here.',
        freeGate: 'Private and link-only routes open in Plus Tribe.',
        charHint: (count, max) => `${count} / ${max}`,
        planetLimit: (count, max) => `${count} of ${max} planets in orbit`,
        starLimit: (count, max) => `${count} of ${max} tracks on this planet`,
        emptyPreview: 'Your new world will appear here as soon as you name it.',
        nameHint: 'Up to 20 characters. Keep it short enough to read at orbit distance.',
        descriptionHint: 'Up to 100 characters. Write one sentence that captures the mood of the planet.',
        tagsHint: 'Up to 5 signals. Separate each tag with a comma.',
        routeHint: 'Only YouTube or YouTube Music routes can be stored on a planet.',
        updateHint: 'You are editing an existing planet. Saving will update this orbit in place.',
        summaryName: 'Planet name',
        summaryVisibility: 'Landing route',
        summaryTracks: 'Tracks',
        summarySignals: 'Signals',
        summaryDesign: 'Design',
        confirmReady: 'This orbit is ready to be born into your galaxy.',
        confirmNeedsWork: 'Complete the required fields below before this planet can enter orbit.',
        summaryVisibilityValues: {
          public: 'Public',
          private: 'Private',
          link: 'Link only',
        },
        ringOn: 'Ring on',
        ringOff: 'Ring off',
      }
    : {
        kicker: 'Planet Studio',
        title: '새로운 행성을 탄생시키기',
        description: '행성 생성은 한 번에 읽히고, 한 번에 완성되어야 합니다. 먼저 정체성을 정하고, 다음으로 디자인을 고르고, 마지막으로 항로와 공개 범위를 정리하세요.',
        close: '닫기',
        create: '행성 탄생',
        creating: '궤도 발사 중...',
        update: '행성 수정',
        limits: '궤도 제한',
        identity: '행성 정체성',
        stars: '이 행성에 담을 곡',
        access: '누가 착륙할 수 있나요',
        preview: '미리보는 궤도',
        confirm: '행성 탄생 확인',
        steps: {
          one: '1단계 · 새로운 행성 선언',
          two: '2단계 · 정체성과 디자인 설정',
          three: '3단계 · YouTube 항로 추가',
          four: '4단계 · 착륙 가능한 범위 선택',
          five: '5단계 · 궤도를 마지막으로 확인',
        },
        helperIdentity: '짧고 쉬운 말로 쓰되, 실제로 가보고 싶은 장소처럼 느껴지게 적어주세요.',
        helperStars: 'YouTube 또는 YouTube Music 링크를 넣어주세요. Stellara는 썸네일이 아니라 항로를 저장합니다.',
        helperAccess: '공개 범위도 기술 설정이 아니라 항로 선택처럼 느껴지도록 구성합니다.',
        helperConfirm: '행성이 실제로 당신의 은하에 들어가기 전에, 항로와 공개 범위, 디자인을 마지막으로 확인합니다.',
        introTitle: '새로운 행성을 탄생시킬 준비가 되었나요?',
        introDescription: 'Stellara의 행성은 단순한 목록이 아니라, 정체성, 디자인, 항로, 착륙 규칙으로 만들어지는 장소입니다. 이 스튜디오 안에서 그 흐름을 한 번에 완성하세요.',
        introNote: '한 번 시작하면 언제든 다시 돌아와 당신의 은하를 한 궤도씩 확장할 수 있습니다.',
        limitTitle: '현재 궤도가 가득 찼습니다',
        limitDescription: 'Free Tribe는 현재 행성 제한 수까지 만들 수 있습니다. Plus Tribe로 확장하면 더 많은 행성을 만들고, 비공개/링크 전용 항로도 열 수 있습니다.',
        name: '행성 이름',
        descriptionLabel: '짧은 소개',
        tags: '신호 태그',
        palette: '색상 결',
        planetType: '표면 타입',
        ring: '행성 링',
        particle: '파티클 꼬리',
        addTrack: '곡 하나 더 추가',
        removeTrack: '제거',
        confirmTrack: '확정',
        editTrack: '수정',
        trackUrl: 'YouTube URL',
        size: '행성 크기',
        public: '공개',
        private: '비공개',
        link: '링크 전용',
        publicDetail: '다른 탐험자도 이 행성을 발견하고 착륙할 수 있습니다.',
        privateDetail: '지금은 나만 이 궤도를 읽을 수 있습니다.',
        linkDetail: '이 항로를 아는 사람만 도착할 수 있습니다.',
        freeGate: '비공개와 링크 전용 항로는 Plus Tribe에서 열립니다.',
        charHint: (count, max) => `${count} / ${max}`,
        planetLimit: (count, max) => `현재 ${count} / ${max}개 행성`,
        starLimit: (count, max) => `현재 ${count} / ${max}곡`,
        emptyPreview: '행성 이름을 붙이는 순간, 이곳에 새로운 세계가 떠오릅니다.',
        nameHint: '최대 20자. 우주 화면에서도 바로 읽히는 짧은 이름이 좋습니다.',
        descriptionHint: '최대 100자. 이 행성의 분위기를 한 문장으로 적어주세요.',
        tagsHint: '최대 5개까지. 쉼표로 구분해 신호 태그를 넣어주세요.',
        routeHint: '행성에는 YouTube 또는 YouTube Music 항로만 담을 수 있습니다.',
        updateHint: '기존 행성을 수정 중입니다. 저장하면 현재 궤도가 그대로 업데이트됩니다.',
        summaryName: '행성 이름',
        summaryVisibility: '착륙 범위',
        summaryTracks: '담긴 곡 수',
        summarySignals: '신호 태그',
        summaryDesign: '행성 결',
        confirmReady: '이제 이 궤도를 당신의 은하 안에 탄생시킬 준비가 되었습니다.',
        confirmNeedsWork: '필수 입력을 마친 뒤에야 이 행성이 실제 궤도에 진입할 수 있습니다.',
        summaryVisibilityValues: {
          public: '공개',
          private: '비공개',
          link: '링크 전용',
        },
        ringOn: '링 켜짐',
        ringOff: '링 꺼짐',
      };
}

function panelStyle() {
  return {
    background: 'linear-gradient(180deg, rgba(12,8,26,.94), rgba(6,4,16,.94))',
    border: '1px solid rgba(123,112,224,.14)',
    borderRadius: 22,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.03)',
  };
}

function toCsv(tags = []) {
  return tags.map((tag) => String(tag || '').replace(/^#/, '')).join(', ');
}

function splitCsv(value = '') {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export function PlanetStudioModal({
  open,
  language = 'ko',
  isPremium = false,
  runtimeSettings,
  existingPlanets = [],
  saving = false,
  initialDraft = null,
  onClose,
  onSave,
}) {
  const copy = getCopy(language);
  const [draft, setDraft] = React.useState(() => createDefaultPlanetDraft(language));
  const [errors, setErrors] = React.useState({});
  const limitSummary = React.useMemo(
    () => getPlanetLimitSummary({ isPremium, settings: runtimeSettings }),
    [isPremium, runtimeSettings]
  );

  React.useEffect(() => {
    if (!open) return;
    const nextDraft = initialDraft ? { ...createDefaultPlanetDraft(language), ...initialDraft, language } : createDefaultPlanetDraft(language);
    nextDraft.stars = (nextDraft.stars || [{ url: '' }]).map((star) => ({
      ...star,
      confirmed: Boolean(star?.url),
    }));
    setDraft(nextDraft);
    setErrors({});
  }, [initialDraft, language, open]);

  if (!open) return null;

  const validation = validatePlanetDraft(draft, {
    isPremium,
    settings: runtimeSettings,
    existingPlanets,
    language,
  });

  const submit = () => {
    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    onSave?.(validation.sanitized);
  };

  const visibilityDescription = {
    public: copy.publicDetail,
    private: copy.privateDetail,
    link: copy.linkDetail,
  };
  const visibilityLabel = copy.summaryVisibilityValues?.[draft.visibility] || draft.visibility;
  const isEditing = Boolean(initialDraft?.planetId || initialDraft?.id || draft?.planetId || draft?.id);
  const limitReached = !isEditing && existingPlanets.length >= limitSummary.planetMax;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 470, background: 'rgba(2,1,10,.82)', backdropFilter: 'blur(24px)' }}>
      <div
        style={{
          position: 'relative',
          margin: '30px auto',
          width: 'min(1240px, calc(100vw - 32px))',
          height: 'calc(100vh - 60px)',
          borderRadius: 28,
          overflow: 'hidden',
          border: '1px solid rgba(123,112,224,.14)',
          background: 'linear-gradient(180deg, rgba(8,6,20,.98), rgba(4,3,12,.98))',
          boxShadow: '0 40px 140px rgba(0,0,0,.52)',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            ...closeButtonStyle(),
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 4,
          }}
        >
          <span style={{ fontSize: 13, color: 'rgba(224,219,255,.78)' }}>✕</span>
          {copy.close}
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1.08fr .92fr', height: '100%' }}>
          <section style={{ padding: '26px 24px 28px', overflowY: 'auto', background: 'linear-gradient(180deg, rgba(10,6,18,.92), rgba(6,4,14,.96))' }}>
            <div style={{ paddingRight: 92 }}>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(214,206,255,.76)', letterSpacing: '.22em', textTransform: 'uppercase' }}>{copy.kicker}</div>
                <div style={{ fontSize: 30, fontWeight: 300, color: '#FBF8FF', letterSpacing: '-.03em', marginTop: 8 }}>{copy.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(236,231,255,.82)', lineHeight: 1.8, marginTop: 10, maxWidth: 680 }}>{copy.description}</div>
              </div>
            </div>

            <div style={{ ...panelStyle(), padding: 18, marginTop: 20 }}>
              <div style={{ fontSize: 11, color: 'rgba(214,206,255,.76)', letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 12 }}>{copy.steps.one}</div>
              <SectionTitle title={copy.introTitle} description={copy.introDescription} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 12 }}>
                <StatBox label={copy.planetLimit(existingPlanets.length, limitSummary.planetMax)} detail={isPremium ? 'Plus Tribe' : 'Free Tribe'} />
                <StatBox label={copy.starLimit(validation.sanitized.stars.length, limitSummary.starsPerPlanet)} detail={language === 'en' ? 'Per planet' : '행성당'} />
              </div>
              <FieldHint tone="default" style={{ marginTop: 12 }}>{copy.introNote}</FieldHint>
              {isEditing && (
                <FieldHint tone="default" style={{ marginTop: 12 }}>
                  {copy.updateHint}
                </FieldHint>
              )}
              {limitReached && (
                <div style={{ ...panelStyle(), padding: 16, marginTop: 14, border: '1px solid rgba(255,112,112,.22)', background: 'rgba(40,8,16,.42)' }}>
                  <div style={{ fontSize: 16, color: '#FFF5EA', marginBottom: 8 }}>{copy.limitTitle}</div>
                  <FieldHint tone="error" style={{ marginTop: 0 }}>{copy.limitDescription}</FieldHint>
                </div>
              )}
            </div>

            <div style={{ ...panelStyle(), padding: 18, marginTop: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(214,206,255,.76)', letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 12 }}>{copy.steps.two}</div>
              <SectionTitle title={copy.identity} description={copy.helperIdentity} />
              <FieldLabel>{copy.name}</FieldLabel>
              <FieldInput value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} placeholder={language === 'en' ? 'Midnight Rain Archive' : '새벽 드라이브'} />
              <FieldHint tone="default">{copy.charHint(draft.name.length, 20)}</FieldHint>
              <FieldHint tone="default">{copy.nameHint}</FieldHint>
              {errors.name && <FieldHint tone="error">{errors.name}</FieldHint>}

              <FieldLabel>{copy.descriptionLabel}</FieldLabel>
              <FieldTextarea value={draft.description} onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))} placeholder={language === 'en' ? 'A slow orbit for gentle return.' : '느리게 돌아오고 싶은 밤의 궤도'} />
              <FieldHint tone="default">{copy.charHint(draft.description.length, 100)}</FieldHint>
              <FieldHint tone="default">{copy.descriptionHint}</FieldHint>
              {errors.description && <FieldHint tone="error">{errors.description}</FieldHint>}

              <FieldLabel>{copy.tags}</FieldLabel>
              <FieldInput value={toCsv(draft.tags)} onChange={(event) => setDraft((prev) => ({ ...prev, tags: splitCsv(event.target.value) }))} placeholder={language === 'en' ? 'dawn, rain, lofi' : '새벽, 드라이브, lofi'} />
              <FieldHint tone="default">{copy.tagsHint}</FieldHint>
            </div>

            <div style={{ ...panelStyle(), padding: 18, marginTop: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(214,206,255,.76)', letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 12 }}>
                {language === 'en' ? 'Step 2-2 · Design the orbit' : '2단계-2 · 행성의 결 디자인'}
              </div>
              <SectionTitle
                title={language === 'en' ? 'Design language' : '디자인 언어'}
                description={language === 'en' ? 'Description and design are separate. First define the mood, then choose how the planet should glow, breathe, and leave its route.' : '설명과 디자인은 다른 단계입니다. 먼저 분위기를 정한 뒤, 행성이 어떤 빛과 표면, 항적을 가질지 선택하세요.'}
              />
              <FieldLabel>{copy.palette}</FieldLabel>
              <OptionTileGroup
                options={PLANET_PALETTE_OPTIONS}
                value={draft.design.colorPalette}
                onChange={(value) => setDraft((prev) => ({ ...prev, design: { ...prev.design, colorPalette: value } }))}
                language={language}
              />

              <FieldLabel>{copy.planetType}</FieldLabel>
              <OptionTileGroup
                options={PLANET_SURFACE_OPTIONS}
                value={draft.design.planetType}
                onChange={(value) => setDraft((prev) => ({ ...prev, design: { ...prev.design, planetType: value } }))}
                language={language}
              />

              <FieldLabel>{copy.particle}</FieldLabel>
              <OptionTileGroup
                options={PLANET_PARTICLE_OPTIONS}
                value={draft.design.particleStyle}
                onChange={(value) => setDraft((prev) => ({ ...prev, design: { ...prev.design, particleStyle: value } }))}
                language={language}
                columns={4}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginTop: 14 }}>
                <div>
                  <FieldLabel>{copy.ring}</FieldLabel>
                  <TogglePillRow
                    value={draft.design.hasRing ? 'on' : 'off'}
                    options={[
                      { value: 'on', label: language === 'en' ? 'On' : '켜짐' },
                      { value: 'off', label: language === 'en' ? 'Off' : '꺼짐' },
                    ]}
                    onChange={(value) => setDraft((prev) => ({ ...prev, design: { ...prev.design, hasRing: value === 'on' } }))}
                  />
                </div>
                <div>
                  <FieldLabel>{copy.size}</FieldLabel>
                  <OptionTileGroup
                    options={PLANET_SIZE_OPTIONS}
                    value={draft.design.sizeTier || 'medium'}
                    onChange={(value) => setDraft((prev) => ({ ...prev, design: { ...prev.design, sizeTier: value } }))}
                    language={language}
                    columns={3}
                  />
                </div>
              </div>
            </div>

            <div style={{ ...panelStyle(), padding: 18, marginTop: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(214,206,255,.76)', letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 12 }}>{copy.steps.three}</div>
              <SectionTitle title={copy.stars} description={copy.helperStars} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {draft.stars.map((star, index) => (
                  <div key={`${index}-${star.url}`} style={{ ...panelStyle(), padding: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 10, alignItems: 'center' }}>
                      <FieldInput
                        value={star.url}
                        disabled={Boolean(star.confirmed)}
                        onChange={(event) => setDraft((prev) => ({
                          ...prev,
                          stars: prev.stars.map((item, starIndex) => starIndex === index ? { ...item, url: event.target.value, confirmed: false } : item),
                        }))}
                        placeholder={`${copy.trackUrl} ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => setDraft((prev) => ({
                          ...prev,
                          stars: prev.stars.map((item, starIndex) => starIndex === index
                            ? { ...item, confirmed: item.confirmed ? false : Boolean(String(item.url || '').trim()) }
                            : item),
                        }))}
                        style={ghostButtonStyle(false, Boolean(star.confirmed))}
                      >
                        {star.confirmed ? copy.editTrack : copy.confirmTrack}
                      </button>
                    </div>
                    {draft.stars.length > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                        <button
                          type="button"
                          onClick={() => setDraft((prev) => ({
                            ...prev,
                            stars: prev.stars.filter((_, starIndex) => starIndex !== index),
                          }))}
                          style={ghostButtonStyle(false, false, true)}
                        >
                          {copy.removeTrack}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 12, alignItems: 'center' }}>
              <button
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, stars: [...prev.stars, { url: '', confirmed: false }] }))}
                  disabled={draft.stars.length >= limitSummary.starsPerPlanet}
                  style={ghostButtonStyle(draft.stars.length >= limitSummary.starsPerPlanet)}
                >
                  {copy.addTrack}
                </button>
                <FieldHint tone={errors.stars ? 'error' : 'default'}>
                  {errors.stars || copy.starLimit(validation.sanitized.stars.length, limitSummary.starsPerPlanet)}
                </FieldHint>
              </div>
              <FieldHint tone="default">{copy.routeHint}</FieldHint>
            </div>

            <div style={{ ...panelStyle(), padding: 18, marginTop: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(214,206,255,.76)', letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 12 }}>{copy.steps.four}</div>
              <SectionTitle title={copy.access} description={copy.helperAccess} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                {VISIBILITY_OPTIONS.map((visibility) => {
                  const disabled = !isPremium && visibility !== 'public';
                  return (
                    <button
                      key={visibility}
                      type="button"
                      disabled={disabled}
                      onClick={() => setDraft((prev) => ({ ...prev, visibility }))}
                      style={{
                        ...panelStyle(),
                        padding: 14,
                        textAlign: 'left',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.48 : 1,
                        border: draft.visibility === visibility ? '1px solid rgba(155,145,255,.34)' : '1px solid rgba(123,112,224,.16)',
                        background: draft.visibility === visibility ? 'rgba(32,24,74,.86)' : 'rgba(8,6,24,.72)',
                      }}
                    >
                      <div style={{ color: '#FBF8FF', fontSize: 13 }}>
                        {visibility === 'public' ? copy.public : visibility === 'private' ? copy.private : copy.link}
                      </div>
                      <div style={{ color: 'rgba(220,214,255,.72)', fontSize: 11, lineHeight: 1.6, marginTop: 8 }}>
                        {visibilityDescription[visibility]}
                      </div>
                    </button>
                  );
                })}
              </div>
              {!isPremium && (
                <FieldHint tone="default" style={{ marginTop: 12 }}>
                  {copy.freeGate}
                </FieldHint>
              )}
              {errors.visibility && <FieldHint tone="error">{errors.visibility}</FieldHint>}
            </div>

            {errors.limit && (
              <div style={{ ...panelStyle(), padding: 16, marginTop: 16, border: '1px solid rgba(255,112,112,.32)', background: 'rgba(40,8,16,.72)' }}>
                <FieldHint tone="error">{errors.limit}</FieldHint>
              </div>
            )}
          </section>

          <aside style={{ padding: '26px 24px 28px', borderLeft: '1px solid rgba(123,112,224,.12)', overflowY: 'auto', background: 'linear-gradient(180deg, rgba(12,8,26,.96), rgba(6,4,16,.98))' }}>
            <div style={{ fontSize: 11, color: 'rgba(214,206,255,.76)', letterSpacing: '.16em', textTransform: 'uppercase' }}>{copy.preview}</div>
            <div style={{ ...panelStyle(), padding: 18, marginTop: 14 }}>
              <PlanetOrbitPreview
                language={language}
                title={draft.name || (language === 'en' ? 'Unnamed orbit' : '아직 이름 없는 궤도')}
                subtitle={draft.design.planetType || 'rocky'}
                description={draft.description || copy.emptyPreview}
                accentLabel={language === 'en' ? 'Live orbit preview' : '실제 궤도 프리뷰'}
                design={draft.design}
              />
            </div>
            <div style={{ ...panelStyle(), padding: 18, marginTop: 16 }}>
              <div style={{ fontSize: 11, color: 'rgba(214,206,255,.76)', letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 12 }}>
                {copy.steps.five}
              </div>
              <SectionTitle title={copy.confirm} description={copy.helperConfirm} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                <StatBox
                  label={copy.summaryName}
                  detail={draft.name || (language === 'en' ? 'Unnamed orbit' : '아직 이름 없는 궤도')}
                />
                <StatBox
                  label={copy.summaryVisibility}
                  detail={visibilityLabel}
                />
                <StatBox
                  label={copy.summaryTracks}
                  detail={String(validation.sanitized.stars.length)}
                />
                <StatBox
                  label={copy.summarySignals}
                  detail={draft.tags?.length ? draft.tags.join(' · ') : (language === 'en' ? 'No signals yet' : '아직 신호 없음')}
                />
              </div>
              <FieldHint tone={validation.ok ? 'default' : 'error'} style={{ marginTop: 12 }}>
                {validation.ok ? copy.confirmReady : copy.confirmNeedsWork}
              </FieldHint>
              <FieldHint tone="default">
                {copy.summaryDesign}: {draft.design.colorPalette} / {draft.design.planetType} / {draft.design.hasRing ? copy.ringOn : copy.ringOff} / {draft.design.particleStyle} / {(draft.design.sizeTier || 'medium')}
              </FieldHint>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={submit} disabled={saving || !validation.ok || limitReached} style={primaryButtonStyle(saving || !validation.ok || limitReached)}>
                {saving ? copy.creating : isEditing ? copy.update : copy.create}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, description }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 15, color: '#FBF8FF', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'rgba(220,214,255,.74)', lineHeight: 1.7 }}>{description}</div>
    </div>
  );
}

function StatBox({ label, detail }) {
  return (
    <div style={{ ...panelStyle(), padding: 14 }}>
      <div style={{ fontSize: 13, color: '#FBF8FF' }}>{label}</div>
      <div style={{ fontSize: 11, color: 'rgba(220,214,255,.66)', marginTop: 8 }}>{detail}</div>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <div style={{ fontSize: 12, color: '#F0EEFF', marginTop: 14, marginBottom: 8 }}>
      {children}
    </div>
  );
}

function FieldInput(props) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        padding: '12px 14px',
        borderRadius: 14,
        border: '1px solid rgba(123,112,224,.16)',
        background: 'rgba(5,4,18,.9)',
        color: '#FBF8FF',
        fontSize: 13,
        fontFamily: 'inherit',
        boxSizing: 'border-box',
      }}
    />
  );
}

function FieldTextarea(props) {
  return (
    <textarea
      rows={4}
      {...props}
      style={{
        width: '100%',
        padding: '12px 14px',
        borderRadius: 14,
        border: '1px solid rgba(123,112,224,.16)',
        background: 'rgba(5,4,18,.9)',
        color: '#FBF8FF',
        fontSize: 13,
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        resize: 'vertical',
      }}
    />
  );
}

function TogglePillRow({ value, options, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 999,
            border: value === option.value ? '1px solid rgba(155,145,255,.34)' : '1px solid rgba(123,112,224,.16)',
            background: value === option.value ? 'rgba(32,24,74,.86)' : 'rgba(5,4,18,.9)',
            color: '#FBF8FF',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function FieldHint({ children, tone = 'default', style = {} }) {
  const color = tone === 'error' ? '#FF9E9E' : 'rgba(220,214,255,.64)';
  return (
    <div style={{ fontSize: 11, color, lineHeight: 1.6, marginTop: 8, ...style }}>
      {children}
    </div>
  );
}

function primaryButtonStyle(disabled = false) {
  return {
    flex: 1,
    padding: '12px 16px',
    borderRadius: 999,
    border: '1px solid rgba(123,112,224,.22)',
    background: disabled ? 'rgba(28,24,52,.38)' : 'linear-gradient(180deg, rgba(83,74,183,.42), rgba(24,18,62,.96))',
    color: '#FBF8FF',
    fontSize: 12,
    fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1,
  };
}

function closeButtonStyle() {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 999,
    border: '1px solid rgba(123,112,224,.2)',
    background: 'rgba(10,8,28,.94)',
    color: '#FBF8FF',
    fontSize: 12,
    fontFamily: 'inherit',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}

function ghostButtonStyle(disabled = false, active = false, textOnly = false) {
  return {
    padding: textOnly ? '7px 10px' : '11px 14px',
    borderRadius: 999,
    border: textOnly
      ? '1px solid rgba(123,112,224,.1)'
      : active
        ? '1px solid rgba(155,145,255,.34)'
        : '1px solid rgba(123,112,224,.16)',
    background: disabled
      ? 'rgba(20,16,40,.42)'
      : textOnly
        ? 'rgba(8,6,24,.46)'
        : active
          ? 'rgba(30,22,70,.92)'
          : 'rgba(8,6,24,.82)',
    color: disabled ? 'rgba(220,214,255,.4)' : active ? '#F0EEFF' : '#FBF8FF',
    fontSize: 12,
    fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}
