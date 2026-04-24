import React from 'react';
import { CURATED_GALAXIES, getLanguagePack } from '@config/stellara';
import {
  MetricCard,
  MiniButton,
  StatusRow,
  panelDescriptionStyle,
  panelKickerStyle,
  panelTitleStyle,
} from './panelStyles';

export function MyGalaxyPanel({
  user,
  planets,
  currentGalaxyId,
  isYTConnected,
  isGoogleConnected,
  isPremium,
  onConnectYT,
  onLoginGoogle,
  onSaveGalaxyProfile,
  onSaveFeaturedGalaxy,
  onShareGalaxy,
  authAction,
  language = 'ko',
  compact = false,
  onManualSync,
  syncMeta,
  quotaMeta,
  adminAccess,
  onOpenAdminCenter,
  runtimeSettings,
  onOpenPlanetStudio,
}) {
  const pack = getLanguagePack(language);
  const copy = pack.panels.galaxy;
  const isViewingForeignGalaxy = Boolean(
    currentGalaxyId
    && currentGalaxyId !== 'stellara_official'
    && currentGalaxyId !== user?.uid
  );
  const userPlanets = planets.filter((planet) => planet.type === 'user');
  const wanderingPlanets = planets.filter((planet) => planet.type === 'wandering');
  const profile = user?.galaxyProfile ?? null;
  const panelCopy = isViewingForeignGalaxy
    ? {
        kicker: language === 'en' ? 'Visited Galaxy' : '방문 은하',
        title: language === 'en' ? 'Current Galaxy' : '현재 은하',
        description: language === 'en'
          ? 'You are currently reading another listener galaxy. Counts below describe the orbit you entered, not your personal library.'
          : '지금은 다른 탐험자의 은하를 보고 있습니다. 아래 수치는 내 라이브러리가 아니라, 현재 진입한 은하의 궤도를 기준으로 표시됩니다.',
        metrics: language === 'en'
          ? ['Visible planets', 'Listener planets', 'Wandering signals', 'Curated galaxies']
          : ['표시 행성', '청취자 행성', '탐험 신호', '큐레이터 은하'],
      }
    : copy;
  const socialCopy = language === 'en'
      ? {
        kicker: 'Social Orbit',
        title: 'Galaxy Presence',
        description: 'Decide whether your galaxy can be discovered by others. Public galaxies get a share slug and become eligible for future social signals like visits, likes, and resonance.',
        private: 'Private Galaxy',
        public: 'Public Galaxy',
        slug: 'Share slug',
        titleLabel: 'Galaxy title',
        descriptionLabel: 'Galaxy description',
        save: 'Save social profile',
        saving: 'Saving...',
        edit: 'Edit profile',
        saved: 'Saved',
        share: 'Share galaxy link',
        visibilityPrivate: 'Only you can view this galaxy structure right now.',
        visibilityPublic: 'This galaxy is discoverable and can be indexed for sharing.',
        metrics: ['Likes', 'Visits', 'Landings', 'Resonance'],
      }
    : {
        kicker: 'Social Orbit',
        title: '은하 공개 설정',
        description: '내 은하를 다른 탐험자에게 보여줄지 결정합니다. 공개 은하는 공유 슬러그를 가지고, 이후 방문/좋아요/공명 같은 소셜 신호의 대상이 됩니다.',
        private: '비공개 은하',
        public: '공개 은하',
        slug: '공유 슬러그',
        titleLabel: '은하 제목',
        descriptionLabel: '은하 소개',
        save: '소셜 프로필 저장',
        saving: '저장 중...',
        edit: '프로필 수정',
        saved: '저장 완료',
        share: '은하 링크 공유',
        visibilityPrivate: '지금은 나만 이 은하 구조를 볼 수 있습니다.',
        visibilityPublic: '이 은하는 발견 가능 상태이며 공유 인덱스에 포함될 수 있습니다.',
        metrics: ['좋아요', '방문', '착륙', '공명'],
      };
  const [draft, setDraft] = React.useState(profile);
  const [isEditing, setIsEditing] = React.useState(false);
  React.useEffect(() => {
    setDraft(profile);
    setIsEditing(false);
  }, [profile]);

  const normalizedProfile = React.useMemo(() => JSON.stringify({
    visibility: profile?.visibility ?? 'private',
    slug: profile?.slug ?? '',
    title: profile?.title ?? '',
    description: profile?.description ?? '',
  }), [profile]);

  const normalizedDraft = React.useMemo(() => JSON.stringify({
    visibility: draft?.visibility ?? 'private',
    slug: draft?.slug ?? '',
    title: draft?.title ?? '',
    description: draft?.description ?? '',
  }), [draft]);

  const isDirty = normalizedDraft !== normalizedProfile;
  const customPlanetCount = userPlanets.filter((planet) => planet.sourceType === 'manual').length;
  const activePlanetLimit = isPremium
    ? runtimeSettings?.limits?.plusPlanetMax ?? 30
    : runtimeSettings?.limits?.freePlanetMax ?? 3;
  const activeStarLimit = isPremium
    ? runtimeSettings?.limits?.plusStarsPerPlanet ?? 30
    : runtimeSettings?.limits?.freeStarsPerPlanet ?? 10;
  const adminCopy = language === 'en'
    ? {
        kicker: 'Admin Access',
        title: 'Universe Command Center',
        description: 'Open the full super admin console for overview, operations, notices, finance, API usage, and universe settings.',
        hidden: 'This entry appears only for super admins and approved operators.',
        open: 'Open Command Center',
        role: 'Current role',
      }
    : {
        kicker: 'Admin Access',
        title: 'Universe Command Center',
        description: 'Overview, 운영, 공지, 재무, API 사용량, 우주 설정을 모두 관리하는 전체 관리자 콘솔을 엽니다.',
        hidden: '이 진입 버튼은 super admin 및 승인된 운영자에게만 보입니다.',
        open: 'Command Center 열기',
        role: '현재 권한',
      };
  const studioCopy = language === 'en'
    ? {
        kicker: 'Planet Creation',
        title: customPlanetCount === 0 ? 'Create the first planet in My Galaxy' : 'Create a new planet inside My Galaxy',
        description: customPlanetCount === 0
          ? 'Your universe begins here. Create the first planet that will anchor your personal galaxy, then return to the same studio whenever a new orbit is needed.'
          : 'Planet creation now lives in one place. Open the studio here whenever your galaxy needs a new orbit.',
        open: 'Create planet',
        customPlanets: 'Custom planets',
        limits: 'Current limits',
      }
    : {
        kicker: '행성 생성',
        title: customPlanetCount === 0 ? '나의 은하 첫 행성 만들기' : '나의 은하 안에서 새 행성 만들기',
        description: customPlanetCount === 0
          ? '당신의 개인 은하는 여기서 시작합니다. 첫 행성을 만들고, 이후에도 같은 스튜디오에서 새로운 궤도를 계속 확장하세요.'
          : '행성 생성은 이제 이 한 곳에만 있습니다. 새로운 궤도가 필요할 때마다 여기서 바로 만들고 확장하세요.',
        open: '행성 생성하기',
        customPlanets: '커스텀 행성',
        limits: '현재 제한',
      };
  return (
    <div style={{ animation: 'fadeUp .28s ease both' }}>
      <div style={panelKickerStyle}>{panelCopy.kicker}</div>
      <h2 style={panelTitleStyle}>{panelCopy.title}</h2>
      <p style={panelDescriptionStyle}>
        {panelCopy.description} {!isViewingForeignGalaxy ? pack.stellara.serviceNote : ''}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: compact ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: 10, margin: '24px 0' }}>
        <MetricCard label={panelCopy.metrics[0]} value={planets.length} />
        <MetricCard label={panelCopy.metrics[1]} value={userPlanets.length} />
        <MetricCard label={panelCopy.metrics[2]} value={wanderingPlanets.length} />
        <MetricCard label={panelCopy.metrics[3]} value={CURATED_GALAXIES.length} />
      </div>

      {!isViewingForeignGalaxy && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <StatusRow
            tone={isGoogleConnected ? 'green' : 'red'}
            label={copy.googleLabel}
            value={user?.displayName ?? copy.googleEmpty}
            action={!isGoogleConnected && (
              <MiniButton disabled={Boolean(authAction)} onClick={onLoginGoogle}>
                {authAction === 'login' ? pack.nav.connecting : pack.nav.connect}
              </MiniButton>
            )}
          />
          <StatusRow
            tone={isYTConnected ? 'green' : 'red'}
            label={copy.youtubeLabel}
            value={isYTConnected ? copy.youtubeConnected : copy.youtubeEmpty}
            action={!isYTConnected && (
              <MiniButton disabled={Boolean(authAction)} onClick={onConnectYT}>
                {authAction === 'youtube' ? pack.nav.connecting : pack.nav.connect}
              </MiniButton>
            )}
          />
          <StatusRow
            tone={isPremium ? 'gold' : 'dim'}
            label="Discovery Layer"
            value={isPremium ? copy.premiumActive : copy.premiumFree}
          />
        </div>
      )}

      {user && draft && !isViewingForeignGalaxy && (
        <div
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 18,
            background: 'rgba(8,6,24,.66)',
            border: '1px solid rgba(123,112,224,.13)',
          }}
        >
          <div style={{ fontSize: 10, color: 'rgba(155,145,255,.42)', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 8 }}>
            {socialCopy.kicker}
          </div>
          <div style={{ fontSize: 19, color: '#F0EEFF', marginBottom: 8 }}>{socialCopy.title}</div>
          <div style={{ fontSize: 12, color: 'rgba(196,189,255,.48)', lineHeight: 1.7, marginBottom: 14 }}>
            {socialCopy.description}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <VisibilityButton
              active={draft.visibility === 'private'}
              disabled={!isEditing}
              onClick={() => isEditing && setDraft((prev) => ({ ...prev, visibility: 'private' }))}
            >
              {socialCopy.private}
            </VisibilityButton>
            <VisibilityButton
              active={draft.visibility === 'public'}
              disabled={!isEditing}
              onClick={() => isEditing && setDraft((prev) => ({ ...prev, visibility: 'public' }))}
            >
              {socialCopy.public}
            </VisibilityButton>
          </div>

          <div style={{ fontSize: 11, color: 'rgba(196,189,255,.42)', marginBottom: 12 }}>
            {draft.visibility === 'public' ? socialCopy.visibilityPublic : socialCopy.visibilityPrivate}
          </div>

          <FieldLabel>{socialCopy.slug}</FieldLabel>
          <FieldInput
            value={draft.slug}
            disabled={!isEditing}
            onChange={(event) => setDraft((prev) => ({ ...prev, slug: event.target.value }))}
            placeholder="my-cosmic-galaxy"
          />

          <FieldLabel>{socialCopy.titleLabel}</FieldLabel>
          <FieldInput
            value={draft.title}
            disabled={!isEditing}
            onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
            placeholder={user.displayName ? `${user.displayName}'s Galaxy` : 'My Galaxy'}
          />

          <FieldLabel>{socialCopy.descriptionLabel}</FieldLabel>
          <FieldTextarea
            value={draft.description}
            disabled={!isEditing}
            onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
            placeholder={language === 'en' ? 'Describe the mood of your galaxy.' : '이 은하의 분위기를 적어주세요.'}
          />

          <div style={{ display: 'grid', gridTemplateColumns: compact ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: 10, margin: '14px 0' }}>
            <MetricCard label={socialCopy.metrics[0]} value={draft.stats?.likes ?? 0} />
            <MetricCard label={socialCopy.metrics[1]} value={draft.stats?.visits ?? 0} />
            <MetricCard label={socialCopy.metrics[2]} value={draft.stats?.landings ?? 0} />
            <MetricCard label={socialCopy.metrics[3]} value={draft.stats?.resonances ?? 0} />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <MiniButton
              disabled={Boolean(authAction)}
              onClick={async () => {
                if (!isEditing) {
                  setIsEditing(true);
                  return;
                }
                if (!isDirty) {
                  setIsEditing(false);
                  return;
                }
                await onSaveGalaxyProfile?.(draft);
                setIsEditing(false);
              }}
            >
              {authAction === 'social-profile'
                ? socialCopy.saving
                : isEditing
                  ? (isDirty ? socialCopy.save : socialCopy.saved)
                  : socialCopy.edit}
            </MiniButton>
            {draft.visibility === 'public' && (
              <MiniButton disabled={Boolean(authAction)} onClick={() => onShareGalaxy?.(draft)}>
                {socialCopy.share}
              </MiniButton>
            )}
            <MiniButton disabled={!isYTConnected || Boolean(authAction)} onClick={onManualSync}>
              {authAction === 'sync-library'
                ? (language === 'en' ? 'Syncing...' : '동기화 중...')
                : (language === 'en' ? 'Sync library now' : '라이브러리 동기화')}
            </MiniButton>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(196,189,255,.42)', lineHeight: 1.7, marginTop: 10 }}>
            {syncMeta?.label || (language === 'en' ? 'No sync record yet.' : '아직 동기화 기록이 없습니다.')}
            {' '}
            {quotaMeta?.active
              ? (language === 'en'
                ? 'Quota protection mode is active until local midnight.'
                : '쿼터 보호 모드가 자정까지 활성화되어 있습니다.')
              : ''}
          </div>
        </div>
      )}

      {user && !isViewingForeignGalaxy && (
        <div
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 18,
            background: 'linear-gradient(180deg, rgba(22,16,50,.76), rgba(10,6,22,.82))',
            border: '1px solid rgba(123,112,224,.18)',
          }}
        >
          <div style={{ fontSize: 10, color: 'rgba(196,189,255,.52)', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 8 }}>
            {studioCopy.kicker}
          </div>
          <div style={{ fontSize: 19, color: '#F0EEFF', marginBottom: 8 }}>{studioCopy.title}</div>
          <div style={{ fontSize: 12, color: 'rgba(196,189,255,.72)', lineHeight: 1.7, marginBottom: 14 }}>
            {studioCopy.description}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
            <MetricCard
              label={studioCopy.customPlanets}
              value={customPlanetCount}
              detail={language === 'en' ? 'Worlds authored directly in Stellara' : 'Stellara 안에서 직접 만든 세계'}
            />
            <MetricCard
              label={studioCopy.limits}
              value={`${customPlanetCount} / ${activePlanetLimit}`}
              detail={language === 'en' ? `${activeStarLimit} tracks per planet` : `행성당 최대 ${activeStarLimit}곡`}
            />
          </div>
          <MiniButton disabled={Boolean(authAction)} onClick={onOpenPlanetStudio}>
            {studioCopy.open}
          </MiniButton>
        </div>
      )}

      {!isViewingForeignGalaxy && adminAccess?.isApprovedAdmin && (
        <div
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 18,
            background: 'rgba(8,6,24,.66)',
            border: '1px solid rgba(123,112,224,.13)',
          }}
        >
          <div style={{ fontSize: 10, color: 'rgba(240,220,160,.52)', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 8 }}>
            {adminCopy.kicker}
          </div>
          <div style={{ fontSize: 19, color: '#F0EEFF', marginBottom: 8 }}>{adminCopy.title}</div>
          <div style={{ fontSize: 12, color: 'rgba(196,189,255,.48)', lineHeight: 1.7, marginBottom: 14 }}>
            {adminCopy.description}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 11, color: 'rgba(196,189,255,.42)', lineHeight: 1.7 }}>
              {adminCopy.role}: {adminAccess.role}
            </div>
            <MiniButton disabled={Boolean(authAction)} onClick={onOpenAdminCenter}>
              {adminCopy.open}
            </MiniButton>
          </div>
        </div>
      )}
    </div>
  );
}

function VisibilityButton({ active, children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: 42,
        borderRadius: 12,
        border: `1px solid ${active ? 'rgba(155,145,255,.46)' : 'rgba(123,112,224,.14)'}`,
        background: active ? 'rgba(83,74,183,.26)' : 'rgba(6,4,20,.55)',
        color: active ? '#F0EEFF' : 'rgba(196,189,255,.5)',
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'inherit',
        fontSize: 11,
        letterSpacing: '.04em',
        opacity: disabled ? 0.72 : 1,
      }}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children }) {
  return (
    <div style={{ fontSize: 10, color: 'rgba(155,145,255,.42)', letterSpacing: '.14em', textTransform: 'uppercase', margin: '10px 0 6px' }}>
      {children}
    </div>
  );
}

function sharedFieldStyle() {
  return {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid rgba(123,112,224,.16)',
    background: 'rgba(4,2,18,.72)',
    color: '#F0EEFF',
    fontSize: 12,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  };
}

function FieldInput(props) {
  return <input {...props} style={{ ...sharedFieldStyle(), opacity: props.disabled ? 0.72 : 1 }} />;
}

function FieldTextarea(props) {
  return <textarea {...props} rows={3} style={{ ...sharedFieldStyle(), resize: 'vertical', lineHeight: 1.6, opacity: props.disabled ? 0.72 : 1 }} />;
}
