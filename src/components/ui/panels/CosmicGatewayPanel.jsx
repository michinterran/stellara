import React from 'react';
import { CURATED_GALAXIES, getLanguagePack, getLocalizedGalaxy } from '@config/stellara';
import {
  MiniButton,
  panelDescriptionStyle,
  panelKickerStyle,
  panelTitleStyle,
} from './panelStyles';

const PORTAL_TABS = ['recommended', 'popular', 'favorites', 'curated', 'partner'];

function getPortalCopy(language = 'ko') {
  if (language === 'en') {
    return {
      myGalaxy: 'My Galaxy',
      myGalaxyDescription: 'Return to your personal orbit from anywhere in the portal.',
      returnHome: 'Return',
      featuredSection: 'Featured Signals',
      featuredDescription: 'Brand, campaign, and label galaxies are ranked for your current orbit first.',
      curatedForYou: 'Curated for your orbit',
      tabs: {
        recommended: 'Recommended',
        popular: 'Popular',
        favorites: 'Favorites',
        curated: 'Curated',
        partner: 'B2B Signals',
      },
      listenerSection: 'Listener galaxies',
      curatorSection: 'Curator galaxies',
      partnerSection: 'Featured strategy',
      seedBadge: 'Test orbit',
      publicBadge: 'Public galaxy',
      featuredBadge: 'Featured',
      matchLabel: 'orbit match',
      promotionTypes: {
        brand: 'Brand galaxy',
        campaign: 'Campaign galaxy',
        label: 'Label galaxy',
      },
      current: 'Current',
      enter: 'Enter',
      planets: 'planets',
      meta: 'visits',
      likes: 'likes',
      emptyFavorites: 'No bookmarked galaxies yet. Resonance and visits can grow into this lane later.',
      partnerHint: 'Featured galaxies now act as the B2B lane. Next we can add admin controls, reporting, and campaign scheduling.',
    };
  }

  return {
    myGalaxy: '내 은하',
    myGalaxyDescription: '포털 어디에서든 한 번에 홈 궤도로 돌아올 수 있습니다.',
    returnHome: '복귀',
    featuredSection: 'Featured Signals',
    featuredDescription: '브랜드, 캠페인, 레이블 은하를 현재 궤도 취향에 맞춰 상단에서 먼저 보여줍니다.',
    curatedForYou: '지금 궤도에 맞춘 추천',
    tabs: {
      recommended: '추천 은하',
      popular: '인기 은하',
      favorites: '즐겨찾기',
      curated: '큐레이터',
      partner: 'B2B 전략',
    },
    listenerSection: '탐험 가능한 은하',
    curatorSection: '큐레이터 은하',
    partnerSection: 'Featured 운영 전략',
    seedBadge: '테스트 궤도',
    publicBadge: '공개 은하',
    featuredBadge: 'Featured',
    matchLabel: '궤도 일치도',
    promotionTypes: {
      brand: '브랜드 은하',
      campaign: '캠페인 은하',
      label: '레이블 은하',
    },
    current: '현재 은하',
    enter: '진입',
    planets: '행성',
    meta: '방문',
    likes: '좋아요',
    emptyFavorites: '아직 즐겨찾기한 은하가 없습니다. 나중에 공명/저장을 이 카테고리로 연결할 수 있습니다.',
    partnerHint: 'Featured 은하가 이제 B2B 항로 역할을 합니다. 다음 단계에서 admin 생성, 일정 제어, 리포트까지 확장할 수 있습니다.',
  };
}

function getPopularityScore(galaxy) {
  return (galaxy.stats?.likes ?? 0) * 3 + (galaxy.stats?.visits ?? 0);
}

function tokenize(value = '') {
  return String(value)
    .toLowerCase()
    .split(/[^a-z0-9가-힣]+/)
    .filter((token) => token.length > 1);
}

function collectOrbitSignals({ planets = [], user } = {}) {
  const tokens = new Set();
  const pushValue = (value) => tokenize(value).forEach((token) => tokens.add(token));

  planets.slice(0, 18).forEach((planet) => {
    pushValue(planet.name);
    pushValue(planet.artist);
    pushValue(planet.mood);
    pushValue(planet.genre);
    (planet.tracks ?? []).slice(0, 3).forEach((track) => {
      pushValue(track.title);
      pushValue(track.artist);
    });
  });

  (user?.galaxyProfile?.tags ?? []).forEach(pushValue);
  pushValue(user?.galaxyProfile?.title);
  pushValue(user?.galaxyProfile?.description);

  return [...tokens];
}

function getPersonalizedGalaxyScore(galaxy, orbitSignals = []) {
  const searchable = [
    galaxy.title,
    galaxy.name,
    galaxy.description,
    galaxy.ownerLabel,
    galaxy.promotedBy,
    galaxy.spotlightText,
    ...(galaxy.tags ?? []),
    ...(galaxy.audienceSignals ?? []),
    ...(galaxy.featuredPlanets ?? []).flatMap((planet) => [planet.name, planet.artist, planet.mood, planet.genre]),
    ...(galaxy.planets ?? []).slice(0, 4).flatMap((planet) => [planet.name, planet.artist, planet.mood, planet.genre]),
  ].join(' ').toLowerCase();

  const signalScore = orbitSignals.reduce((score, signal) => {
    if (!signal) return score;
    if (searchable.includes(signal)) return score + 4;
    return score;
  }, 0);

  return signalScore + getPopularityScore(galaxy) + (galaxy.featuredOrder ? Math.max(0, 12 - galaxy.featuredOrder) : 0);
}

function getDistanceLabel(galaxy, language = 'ko') {
  const band = galaxy?.stageBand || 'far';
  const copy = language === 'en'
    ? {
        near: 'Close orbit',
        mid: 'Mid route',
        far: 'Outer route',
        promotion: 'Promoted outer route',
      }
    : {
        near: '가까운 궤도',
        mid: '중간 항로',
        far: '원거리 항로',
        promotion: '프로모션 외곽 항로',
      };

  return copy[band] ?? copy.far;
}

export function CosmicGatewayPanel({
  currentGalaxyId,
  onHopGalaxy,
  discoverableGalaxies = [],
  compact = false,
  language = 'ko',
  user,
  planets = [],
}) {
  const pack = getLanguagePack(language);
  const copy = pack.panels.portal;
  const ux = getPortalCopy(language);
  const [activeTab, setActiveTab] = React.useState('recommended');

  const orbitSignals = React.useMemo(
    () => collectOrbitSignals({ planets, user }),
    [planets, user]
  );

  const featuredGalaxies = React.useMemo(
    () => discoverableGalaxies
      .filter((galaxy) => galaxy.isFeatured || galaxy.promotionType)
      .sort((a, b) => getPersonalizedGalaxyScore(b, orbitSignals) - getPersonalizedGalaxyScore(a, orbitSignals)),
    [discoverableGalaxies, orbitSignals]
  );

  const recommendedGalaxies = React.useMemo(
    () => discoverableGalaxies
      .filter((galaxy) => !galaxy.isFeatured && !galaxy.promotionType)
      .sort((a, b) => getPersonalizedGalaxyScore(b, orbitSignals) - getPersonalizedGalaxyScore(a, orbitSignals)),
    [discoverableGalaxies, orbitSignals]
  );

  const popularGalaxies = React.useMemo(
    () => discoverableGalaxies
      .filter((galaxy) => !galaxy.isFeatured && !galaxy.promotionType)
      .sort((a, b) => getPopularityScore(b) - getPopularityScore(a)),
    [discoverableGalaxies]
  );

  const favoriteGalaxies = React.useMemo(
    () => discoverableGalaxies.filter((galaxy) => galaxy.favorite === true),
    [discoverableGalaxies]
  );

  const myGalaxyTarget = user?.uid || 'stellara_official';
  const myGalaxyTitle = user?.galaxyProfile?.title || (user?.displayName ? `${user.displayName}'s Galaxy` : 'Stellara Official');

  const getGalaxyBadge = (galaxy) => {
    if (galaxy.promotionType) return ux.promotionTypes[galaxy.promotionType] || ux.featuredBadge;
    return galaxy.isSeed ? ux.seedBadge : ux.publicBadge;
  };

  const renderGalaxyGrid = (galaxies) => (
    <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
      {galaxies.map((galaxy) => {
        const isCurrent = galaxy.id === currentGalaxyId;
        const publicPlanetCount = galaxy.metrics?.publicPlanetCount ?? galaxy.planets?.length ?? 0;
        const personalScore = getPersonalizedGalaxyScore(galaxy, orbitSignals);
        return (
          <div
            key={galaxy.id}
            style={{
              padding: 16,
              borderRadius: 18,
              background: isCurrent
                ? 'linear-gradient(145deg, rgba(83,74,183,.28), rgba(8,6,24,.68))'
                : 'rgba(8,6,24,.56)',
              border: `1px solid ${isCurrent ? 'rgba(155,145,255,.4)' : 'rgba(123,112,224,.11)'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 14, color: '#F0EEFF' }}>{galaxy.title || galaxy.displayName || galaxy.name}</div>
              <span style={{
                fontSize: 9,
                padding: '4px 8px',
                borderRadius: 999,
                border: '1px solid rgba(123,112,224,.14)',
                color: 'rgba(196,189,255,.5)',
                background: galaxy.promotionType ? 'rgba(240,192,96,.12)' : (galaxy.isSeed ? 'rgba(83,74,183,.18)' : 'rgba(8,6,24,.64)'),
                whiteSpace: 'nowrap',
              }}>
                {getGalaxyBadge(galaxy)}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(196,189,255,.48)', lineHeight: 1.6, minHeight: 48 }}>
              {galaxy.spotlightText || galaxy.description}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(196,189,255,.34)', marginTop: 10 }}>
              {(galaxy.ownerLabel || galaxy.displayName || 'Listener')} · {publicPlanetCount} {ux.planets}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              <span
                style={{
                  fontSize: 9,
                  padding: '4px 8px',
                  borderRadius: 999,
                  border: '1px solid rgba(123,112,224,.12)',
                  color: 'rgba(216,210,255,.72)',
                  background: 'rgba(83,74,183,.14)',
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                }}
              >
                {getDistanceLabel(galaxy, language)}
              </span>
              {Number.isFinite(galaxy.stageRank) && (
                <span style={{ fontSize: 10, color: 'rgba(196,189,255,.38)' }}>
                  {language === 'en' ? `Route #${galaxy.stageRank}` : `항로 #${galaxy.stageRank}`}
                </span>
              )}
            </div>
            {galaxy.promotionType && (
              <div style={{ fontSize: 10, color: 'rgba(240,220,160,.72)', marginTop: 8 }}>
                {galaxy.promotedBy || ux.curatedForYou}
                {personalScore > getPopularityScore(galaxy) ? ` · ${ux.matchLabel} +${personalScore - getPopularityScore(galaxy)}` : ''}
              </div>
            )}
            {!galaxy.promotionType && personalScore > 0 && (
              <div style={{ fontSize: 10, color: 'rgba(160,224,255,.68)', marginTop: 8 }}>
                {ux.matchLabel} +{personalScore}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 14 }}>
              <span style={{ fontSize: 10, color: 'rgba(196,189,255,.34)' }}>
                {galaxy.stats?.visits ?? 0} {ux.meta} · {galaxy.stats?.likes ?? 0} {ux.likes}
              </span>
              <MiniButton disabled={isCurrent} onClick={() => onHopGalaxy(galaxy.id)}>
                {isCurrent ? ux.current : ux.enter}
              </MiniButton>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ animation: 'fadeUp .28s ease both' }}>
      <div style={panelKickerStyle}>{copy.kicker}</div>
      <h2 style={panelTitleStyle}>{copy.title}</h2>
      <p style={panelDescriptionStyle}>{copy.description}</p>

      <div
        style={{
          marginTop: 18,
          padding: 16,
          borderRadius: 18,
          background: 'linear-gradient(145deg, rgba(83,74,183,.26), rgba(8,6,24,.7))',
          border: '1px solid rgba(155,145,255,.24)',
        }}
      >
        <div style={{ fontSize: 10, color: 'rgba(155,145,255,.42)', letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 6 }}>
          {ux.myGalaxy}
        </div>
        <div style={{ fontSize: 16, color: '#F0EEFF', marginBottom: 6 }}>{myGalaxyTitle}</div>
        <div style={{ fontSize: 11, color: 'rgba(196,189,255,.48)', lineHeight: 1.6, marginBottom: 12 }}>
          {ux.myGalaxyDescription}
        </div>
        <MiniButton onClick={() => onHopGalaxy(myGalaxyTarget)}>
          {ux.returnHome}
        </MiniButton>
      </div>

      {featuredGalaxies.length > 0 && (
        <>
          <div style={{ fontSize: 10, color: 'rgba(240,220,160,.58)', letterSpacing: '.18em', textTransform: 'uppercase', margin: '20px 0 8px' }}>
            {ux.featuredSection}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(196,189,255,.48)', lineHeight: 1.7, marginBottom: 12 }}>
            {ux.featuredDescription}
          </div>
          {renderGalaxyGrid(featuredGalaxies.slice(0, compact ? 2 : 3))}
        </>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
        {PORTAL_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 12px',
              borderRadius: 999,
              border: `1px solid ${activeTab === tab ? 'rgba(155,145,255,.36)' : 'rgba(123,112,224,.12)'}`,
              background: activeTab === tab ? 'rgba(83,74,183,.24)' : 'rgba(8,6,24,.52)',
              color: activeTab === tab ? '#F0EEFF' : 'rgba(196,189,255,.48)',
              fontFamily: 'inherit',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            {ux.tabs[tab]}
          </button>
        ))}
      </div>

      {activeTab === 'recommended' && (
        <>
          <div style={{ fontSize: 10, color: 'rgba(155,145,255,.42)', letterSpacing: '.18em', textTransform: 'uppercase', margin: '20px 0 12px' }}>
            {ux.listenerSection}
          </div>
          {renderGalaxyGrid(recommendedGalaxies)}
        </>
      )}

      {activeTab === 'popular' && (
        <>
          <div style={{ fontSize: 10, color: 'rgba(155,145,255,.42)', letterSpacing: '.18em', textTransform: 'uppercase', margin: '20px 0 12px' }}>
            {ux.tabs.popular}
          </div>
          {renderGalaxyGrid(popularGalaxies)}
        </>
      )}

      {activeTab === 'favorites' && (
        <>
          <div style={{ fontSize: 10, color: 'rgba(155,145,255,.42)', letterSpacing: '.18em', textTransform: 'uppercase', margin: '20px 0 12px' }}>
            {ux.tabs.favorites}
          </div>
          {favoriteGalaxies.length ? (
            renderGalaxyGrid(favoriteGalaxies)
          ) : (
            <div style={{ fontSize: 11, color: 'rgba(196,189,255,.48)', lineHeight: 1.7, padding: '10px 0' }}>
              {ux.emptyFavorites}
            </div>
          )}
        </>
      )}

      {activeTab === 'curated' && (
        <>
          <div style={{ fontSize: 10, color: 'rgba(155,145,255,.42)', letterSpacing: '.18em', textTransform: 'uppercase', margin: '20px 0 12px' }}>
            {ux.curatorSection}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
            {CURATED_GALAXIES.map((galaxy) => {
              const displayGalaxy = getLocalizedGalaxy(galaxy, language);
              const isCurrent = galaxy.id === currentGalaxyId;
              return (
                <div
                  key={galaxy.id}
                  style={{
                    padding: 16,
                    borderRadius: 18,
                    background: isCurrent
                      ? 'linear-gradient(145deg, rgba(83,74,183,.28), rgba(8,6,24,.68))'
                      : 'rgba(8,6,24,.56)',
                    border: `1px solid ${isCurrent ? 'rgba(155,145,255,.4)' : 'rgba(123,112,224,.11)'}`,
                  }}
                >
                  <div style={{ fontSize: 14, color: '#F0EEFF', marginBottom: 7 }}>{galaxy.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(196,189,255,.48)', lineHeight: 1.6, minHeight: 48 }}>
                    {displayGalaxy.description}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 14 }}>
                    <span style={{ fontSize: 10, color: 'rgba(196,189,255,.34)' }}>
                      {galaxy.planets.length} {ux.planets}
                    </span>
                    <MiniButton disabled={isCurrent} onClick={() => onHopGalaxy(galaxy.id)}>
                      {isCurrent ? ux.current : ux.enter}
                    </MiniButton>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'partner' && (
        <>
          <div style={{ fontSize: 10, color: 'rgba(155,145,255,.42)', letterSpacing: '.18em', textTransform: 'uppercase', margin: '20px 0 12px' }}>
            {ux.partnerSection}
          </div>
          {renderGalaxyGrid(featuredGalaxies)}
          <div style={{ fontSize: 11, color: 'rgba(196,189,255,.48)', lineHeight: 1.7, marginTop: 12 }}>
            {ux.partnerHint}
          </div>
        </>
      )}
    </div>
  );
}
