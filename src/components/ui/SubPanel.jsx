import React from 'react';
import { getPlanetStyle } from '@utils/planetStyles';
import { CURATED_GALAXIES } from '@config/stellara';
import { GalaxyPortal } from './GalaxyPortal';

/**
 * SubPanel
 * 내비게이션 바 내부의 상세 메뉴(내 갤럭시, 탐색, 설정)를 렌더링합니다.
 */
export function SubPanel({ panel, onBack, isYTConnected, isPremium, planets, filtered, filterKey, setFilterKey, onConnectYT, onGo, onHop, currentGalaxyId, settingsRef }) {
  const T = { galaxy: '◈  내 갤럭시', explore: '◎  탐색', settings: '◐  설정', portal: '✦  탐험 포털' };
  const up = planets.filter(p => p.type === 'user');
  const curatedCount = CURATED_GALAXIES.length;

  return (
    <>
      <div style={{ padding: '15px 22px 13px', borderBottom: '1px solid rgba(123,112,224,.09)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => { console.log("[DEBUG] SubPanel Back Clicked"); onBack(); }} 
          style={{ width: 30, height: 30, borderRadius: 9, cursor: 'pointer', background: 'rgba(20,15,50,.7)', border: '1px solid rgba(123,112,224,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, pointerEvents: 'auto' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(155,145,255,.6)" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span style={{ fontSize: 13, color: 'rgba(155,145,255,.6)', letterSpacing: '.06em' }}>{T[panel]}</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
        {panel === 'galaxy' && (
          <div style={{ padding: '0 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Row dot={isPremium ? 'gold' : 'dim'} label={isArgPremium(isPremium)} />
            <Row dot={isYTConnected ? 'green' : 'red'} label={isYTConnected ? 'YouTube Music 라이브러리 연결됨' : 'YouTube Music 라이브러리 미연결'}>
              {!isYTConnected && <Mini onClick={onConnectYT}>연결</Mini>}
            </Row>
            <div style={{ fontSize: 11, color: 'rgba(155,145,255,.4)', lineHeight: 1.7, padding: '4px 4px 0' }}>
              Stellara는 직접 스트리밍을 제공하지 않고, 당신의 기존 라이브러리를 우주 인터페이스로 재배치해
              발견 경험과 소셜 탐험을 돕습니다.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginTop: 4 }}>
              {[['궤도 행성', planets.length], ['내 플리', up.length], ['큐레이터 은하', curatedCount], ['탐험 신호', planets.filter((planet) => planet.type === 'wandering').length]].map(([l, v]) => (
                <div key={l} style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(8,6,24,.6)', border: '1px solid rgba(123,112,224,.1)', borderRadius: 11 }}>
                  <div style={{ fontSize: 24, fontWeight: 300, color: '#F0EEFF' }}>{v}</div>
                  <div style={{ fontSize: 10, color: 'rgba(155,145,255,.32)', marginTop: 3, letterSpacing: '.08em' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {panel === 'portal' && (
          <GalaxyPortal onHop={onHop} currentOwnerId={currentGalaxyId} />
        )}
        {panel === 'explore' && (
          <>
            <div style={{ display: 'flex', gap: 6, padding: '4px 22px 12px', flexWrap: 'wrap' }}>
              {[['all', '전체'], ['user', '내 라이브러리'], ['wander', '탐험 신호'], ['featured', '큐레이터 추천']].map(([k, l]) => (
                <button key={k} onClick={() => setFilterKey(k)} style={{ fontSize: 10, padding: '4px 11px', borderRadius: 14, cursor: 'pointer', background: filterKey === k ? 'rgba(83,74,183,.4)' : 'rgba(14,10,42,.55)', border: `1px solid ${filterKey === k ? 'rgba(123,112,224,.5)' : 'rgba(123,112,224,.12)'}`, color: filterKey === k ? '#C4BDFF' : 'rgba(155,145,255,.38)', fontFamily: 'inherit', letterSpacing: '.06em' }}>{l}</button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 22px' }}>
              {!filtered.length ? <div style={{ fontSize: 12, color: 'rgba(155,145,255,.3)', textAlign: 'center', padding: 24 }}>행성이 없습니다</div> : filtered.map(p => {
                const ps = getPlanetStyle(p.index ?? 0);
                return (
                  <button key={p.planetId} onClick={() => onGo(p)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', background: 'rgba(8,6,24,.6)', border: '1px solid rgba(123,112,224,.1)', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: ps.hex, boxShadow: `0 0 7px ${ps.hex}`, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#C4BDFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: 'rgba(155,145,255,.35)' }}>{p.type === 'user' ? '내 라이브러리' : p.type === 'wandering' ? '✦ 탐험 신호' : p.isPremium ? '⭐ 큐레이터' : 'Stellara 큐레이션'} · {(p.tracks ?? []).length}곡</div>
                    </div>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(123,112,224,.3)" strokeWidth="2" strokeLinecap="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </>
        )}
        {panel === 'settings' && (
          <div style={{ padding: '0 22px', display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={{ fontSize: 11, color: 'rgba(155,145,255,.4)', lineHeight: 1.7 }}>
              이 설정은 스트리밍 품질이 아니라 탐험 경험의 리듬을 조절합니다.
            </div>
            <LiveSlider label="◎ 행성 자전 속도" min={0} max={30} def={10} fmt={v => (v / 10).toFixed(1) + '×'} onChange={v => { settingsRef.current.rotSpeed = v / 10; }} />
            <LiveSlider label="✦ 카메라 회전" min={0} max={30} def={10} fmt={v => (v / 10).toFixed(1) + '×'} onChange={v => { settingsRef.current.shootingSpeed = v / 10; }} />
            <LiveSlider label="⭐ 별빛 효과" min={10} max={200} def={100} fmt={v => v + '%'} onChange={v => { settingsRef.current.starDensity = v / 100; }} />
          </div>
        )}
      </div>
    </>
  );
}

function isArgPremium(isP) { return isP ? 'Pro · 더 긴 발견 세션' : 'Free · 5곡 미리듣기'; }

function Row({ dot, label, children }) {
  const C = { green: '#44FF88', red: '#FF5555', gold: '#FFD700', dim: 'rgba(155,145,255,.4)' };
  const G = { green: '0 0 5px #44FF88', gold: '0 0 5px #FFD700' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(8,6,24,.6)', border: '1px solid rgba(123,112,224,.1)', borderRadius: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: C[dot] ?? '#888', boxShadow: G[dot] ?? 'none', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'rgba(155,145,255,.5)', letterSpacing: '.04em' }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

function Mini({ onClick, children }) {
  return <button onClick={onClick} style={{ fontSize: 10, color: 'rgba(155,145,255,.7)', cursor: 'pointer', background: 'rgba(40,30,100,.5)', border: '1px solid rgba(123,112,224,.18)', borderRadius: 8, padding: '4px 10px', fontFamily: 'inherit' }}>{children}</button>;
}

function LiveSlider({ label, min, max, def, fmt, onChange }) {
  const [v, setV] = React.useState(def);
  return (
    <div>
      <div style={{ display: 'flex', justifySelf: 'space-between', width: '100%', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: 'rgba(155,145,255,.45)', letterSpacing: '.06em' }}>{label}</span>
        <span style={{ fontSize: 12, color: '#9B91FF' }}>{fmt(v)}</span>
      </div>
      <div style={{ position: 'relative', height: 18, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', width: '100%', height: 2, background: 'rgba(155,145,255,.08)', borderRadius: 2 }} />
        <div style={{ position: 'absolute', width: `${((v - min) / (max - min)) * 100}%`, height: 2, background: 'linear-gradient(90deg,#534AB7,#9B91FF)', borderRadius: 2 }} />
        <input type="range" min={min} max={max} value={v} onChange={e => { const n = +e.target.value; setV(n); onChange?.(n); }} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0 }} />
      </div>
    </div>
  );
}
