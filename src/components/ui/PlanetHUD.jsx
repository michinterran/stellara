import React from 'react';
import { getLanguagePack, getLocalizedPlanet } from '@config/stellara';
import { getPlanetStyle } from '@utils/planetStyles';

const REFRESHABLE_CURATED_IDS = new Set(['dawn', 'heal', 'focus', 'heart', 'rain', 'energy', 'jazz', 'healv']);

/**
 * PlanetHUD
 * 행성 상세 정보 및 트랙 리스트를 표시하는 패널 컴포넌트입니다.
 */
export function PlanetHUD(props = {}) {
  if (!props) return null;
  const {
    planet, player, isPremium, refreshing, language = 'ko', engagement,
    onTrack, onRefresh, onClose, onLikePlanet, onSavePlanet, onSharePlanet,
  } = props;
  const pack = getLanguagePack(language);
  const displayPlanet = getLocalizedPlanet(planet, language);
  const open = !!planet;
  const limit = isPremium ? 20 : 5;
  const tracks = planet?.tracks ?? [];
  const canR = planet?.type === 'stellara' && REFRESHABLE_CURATED_IDS.has(planet?.planetId);
  const ps = planet ? getPlanetStyle(planet.index ?? 0) : null;
  
  const M = {
    user: { l: language === 'en' ? '◈ My Playlist' : '◈ 내 플레이리스트', c: '#60C0F0' },
    wandering: { l: language === 'en' ? '✦ Wandering Planet' : '✦ 떠도는 행성', c: '#F0C060' },
    stellara: { l: '◎ Stellara', c: 'rgba(155,145,255,.55)' }
  };
  const tg = M[planet?.type] ?? M.stellara;

  return (
    <div data-ui="planet-panel" style={{
      position: 'fixed', top: 0, left: 0, bottom: 0, width: 'min(420px, 90vw)', zIndex: 160,
      background: 'rgba(3,1,16,.97)', borderRight: '1px solid rgba(123,112,224,.14)',
      backdropFilter: 'blur(32px)', display: 'flex', flexDirection: 'column',
      transform: open ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform .44s cubic-bezier(.4, 0, .2, 1)',
      fontFamily: 'inherit', pointerEvents: 'auto'
    }}>
      <div style={{ padding: '28px 22px 16px', borderBottom: '1px solid rgba(123,112,224,.09)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 999,
              border: '1px solid rgba(123,112,224,.22)',
              background: 'rgba(14,10,36,.72)',
              color: 'rgba(240,238,255,.86)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 11,
              letterSpacing: '.04em',
            }}
          >
            <span style={{ fontSize: 13, color: 'rgba(155,145,255,.72)' }}>←</span>
            {pack.system.returnToSpace}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 8, background: `${tg.c}18`, border: `1px solid ${tg.c}33`, color: tg.c, letterSpacing: '.08em' }}>{tg.l}</span>
          {planet?.isPremium && <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 8, background: 'rgba(255,215,0,.08)', border: '1px solid rgba(255,215,0,.2)', color: '#FFD700', letterSpacing: '.08em' }}>⭐ Premium</span>}
        </div>
        <div style={{ fontSize: 'clamp(22px, 3.8vw, 46px)', fontWeight: 300, color: '#F0EEFF', lineHeight: 1.1, marginBottom: 5, textShadow: ps ? `0 0 60px ${ps.hex}55` : undefined }}>{displayPlanet?.name}</div>
        <div style={{ fontSize: 12, color: 'rgba(196,189,255,.6)', marginBottom: 2 }}>{displayPlanet?.artist}</div>
        <div style={{ fontSize: 11, color: 'rgba(155,145,255,.4)', marginBottom: canR ? 12 : 0, letterSpacing: '.04em' }}>{displayPlanet?.genre}{displayPlanet?.genre && displayPlanet?.mood ? ' · ' : ''}{displayPlanet?.mood}</div>
        {canR && (
          <button onClick={onRefresh} disabled={refreshing} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(155,145,255,.6)', cursor: refreshing ? 'wait' : 'pointer', background: 'rgba(30,20,70,.5)', border: '1px solid rgba(123,112,224,.18)', borderRadius: 9, padding: '5px 12px', fontFamily: 'inherit', opacity: refreshing ? .5 : 1, letterSpacing: '.04em' }}>
            <span style={{ animation: refreshing ? 'spin .8s linear infinite' : 'none', display: 'inline-block' }}>↺</span>
            {refreshing ? (language === 'en' ? 'Refreshing...' : '교체 중...') : (language === 'en' ? 'Refresh curation' : '큐레이션 교체')}
          </button>
        )}
        {planet && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <SocialButton active={engagement?.liked} onClick={onLikePlanet}>
              {language === 'en' ? `Like ${engagement?.likes ?? 0}` : `좋아요 ${engagement?.likes ?? 0}`}
            </SocialButton>
            <SocialButton active={engagement?.saved} onClick={onSavePlanet}>
              {language === 'en' ? `Save ${engagement?.saves ?? 0}` : `저장 ${engagement?.saves ?? 0}`}
            </SocialButton>
            <SocialButton onClick={onSharePlanet}>
              {language === 'en' ? 'Share planet' : '행성 공유'}
            </SocialButton>
          </div>
        )}
        {!isPremium && tracks.length > limit && <div style={{ fontSize: 11, color: 'rgba(255,215,0,.7)', background: 'rgba(255,215,0,.06)', border: '1px solid rgba(255,215,0,.15)', borderRadius: 8, padding: '7px 12px', marginTop: 10 }}>{language === 'en' ? '⭐ Subscribe to Pro to hear every track' : '⭐ Pro 구독 시 전체 트랙 감상 가능'}</div>}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 22px' }}>
        {tracks.map((tr, i) => {
          const locked = !isPremium && i >= limit;
          const isAct = player.pid === planet?.planetId && player.idx === i && player.playing;
          return (
            <button key={i} onClick={() => !locked && onTrack(i)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', marginBottom: 4, background: isAct ? `${ps?.hex ?? '#9B91FF'}14` : 'rgba(6,4,20,.5)', border: `1px solid ${isAct ? `${ps?.hex ?? '#9B91FF'}40` : 'rgba(123,112,224,.08)'}`, borderRadius: 9, cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? .38 : 1, textAlign: 'left', fontFamily: 'inherit', transition: 'all .18s' }}>
              <span style={{ fontSize: 10, color: 'rgba(155,145,255,.35)', width: 14, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#C4BDFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tr.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(155,145,255,.38)' }}>{tr.artist}</div>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(155,145,255,.35)', flexShrink: 0 }}>{tr.duration}</span>
              <span style={{ fontSize: 11, flexShrink: 0, color: isAct ? ps?.hex : 'transparent' }}>{locked ? '🔒' : isAct ? '▶' : ' '}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SocialButton({ active = false, onClick, children }) {
  const disabled = typeof onClick !== 'function';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        color: disabled
          ? 'rgba(196,189,255,.28)'
          : active
            ? '#F0EEFF'
            : 'rgba(196,189,255,.72)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: disabled
          ? 'rgba(14,10,36,.36)'
          : active
            ? 'rgba(83,74,183,.36)'
            : 'rgba(14,10,36,.7)',
        border: `1px solid ${
          disabled
            ? 'rgba(123,112,224,.08)'
            : active
              ? 'rgba(155,145,255,.34)'
              : 'rgba(123,112,224,.18)'
        }`,
        borderRadius: 999,
        padding: '7px 12px',
        fontFamily: 'inherit',
        opacity: disabled ? 0.65 : 1,
      }}
    >
      {children}
    </button>
  );
}
