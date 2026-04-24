import React from 'react';
import { getLanguagePack, getLocalizedPlanetName } from '@config/stellara';
import { getPlanetStyle } from '@utils/planetStyles';

/**
 * PlayerControls
 * 음악 재생 제어 및 정보를 표시하는 하단 바 컴포넌트입니다.
 */
export function PlayerControls(props = {}) {
  if (!props) return null;
  const { player, active, language = 'ko', onFocusPlanet, onTogglePlay, onPrev, onNext, onShuffle, onRepeat, onVol, onSeek } = props;
  const pack = getLanguagePack(language);
  const track = player.list[player.idx];
  const pct = player.total > 0 ? player.elapsed / player.total : 0;
  
  const fmt = (s) => {
    const t = Math.floor(s);
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  };

  const ps = active ? getPlanetStyle(active.index ?? 0) : null;
  const grad = ps ? `linear-gradient(90deg, ${ps.hex}88, ${ps.hex})` : 'linear-gradient(90deg,#534AB7,#9B91FF)';
  const activeName = active ? getLocalizedPlanetName(active, language) : '';

  return (
    <div data-ui="playerbar" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: 76, zIndex: 300,
      display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center',
      background: 'linear-gradient(to top, rgba(0,0,8,.98) 0%, rgba(0,0,8,.7) 75%, transparent)',
      fontFamily: 'inherit', pointerEvents: 'auto'
    }}>
      {/* 트랙 정보 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 20px' }}>
        <button
          type="button"
          onClick={onFocusPlanet}
          disabled={!active}
          title={active ? pack.player.focusTitle(activeName) : pack.player.emptyFocusTitle}
          style={{
          width: 34, height: 34, borderRadius: '50%',
          border: `1.5px solid ${ps ? ps.hex + '55' : 'rgba(155,145,255,.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: player.playing ? 'spin 9s linear infinite' : 'none', flexShrink: 0,
          background: 'rgba(6,4,20,.42)',
          cursor: active ? 'pointer' : 'default',
          opacity: active ? 1 : .7,
          padding: 0,
          fontFamily: 'inherit',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: ps?.hex ?? 'rgba(155,145,255,.3)' }} />
        </button>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#C4BDFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
            {track?.title ?? pack.player.fallbackTitle}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(155,145,255,.38)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {track?.artist ?? pack.player.fallbackArtist}
          </div>
        </div>
      </div>

      {/* 컨트롤러 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '0 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {[
            { e: '⇌', fn: onShuffle, on: player.shuffle },
            { e: '⏮', fn: onPrev },
            { e: player.playing ? '⏸' : '▶', fn: onTogglePlay, big: true },
            { e: '⏭', fn: onNext },
            { e: '↻', fn: onRepeat, on: player.repeat }
          ].map((b, i) => (
            <button key={i} onClick={b.fn} style={{
              cursor: 'pointer', background: b.big ? 'rgba(83,74,183,.5)' : 'none',
              border: b.big ? '1.5px solid rgba(123,112,224,.45)' : 'none',
              borderRadius: b.big ? '50%' : 0, width: b.big ? 36 : 'auto', height: b.big ? 36 : 'auto',
              color: b.on ? (ps?.hex ?? '#9B91FF') : 'rgba(155,145,255,.38)',
              fontSize: b.big ? 14 : 15, display: 'flex', alignItems: 'center',
              justifyContent: 'center', transition: 'all .2s'
            }}>
              {b.e}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%' }}>
          <span style={{ fontSize: 10, color: 'rgba(155,145,255,.35)', flexShrink: 0, minWidth: 30, textAlign: 'center' }}>{fmt(player.elapsed)}</span>
          <div 
            onClick={e => { const r = e.currentTarget.getBoundingClientRect(); onSeek((e.clientX - r.left) / r.width); }} 
            style={{ flex: 1, height: 3, background: 'rgba(155,145,255,.08)', borderRadius: 2, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${pct * 100}%`, background: grad, borderRadius: 2, transition: 'width .1s linear' }} />
          </div>
          <span style={{ fontSize: 10, color: 'rgba(155,145,255,.35)', flexShrink: 0, minWidth: 30, textAlign: 'center' }}>{fmt(player.total)}</span>
        </div>
      </div>

      {/* 볼륨 */}
      <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(155,145,255,.3)" strokeWidth="2" strokeLinecap="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
        <div style={{ position: 'relative', width: 52, height: 18, display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', width: '100%', height: 2, background: 'rgba(155,145,255,.08)', borderRadius: 2 }} />
          <div style={{ position: 'absolute', width: `${player.vol}%`, height: 2, background: grad, borderRadius: 2 }} />
          <input type="range" min={0} max={100} value={player.vol} onChange={e => onVol(+e.target.value)} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0 }} />
        </div>
      </div>
    </div>
  );
}
