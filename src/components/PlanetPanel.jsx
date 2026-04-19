// src/components/PlanetPanel.jsx
import { PLANET_DATA } from './SpaceScene'

export default function PlanetPanel({ planetIdx, tracks, onBack }) {
  if (planetIdx === null) return null
  const planet = PLANET_DATA[planetIdx]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 30, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: '80px 60px', fontFamily: 'system-ui,sans-serif',
    }}>
      <div style={{ maxWidth: 360, pointerEvents: 'auto' }}>
        <div style={{
          fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase',
          color: 'rgba(155,145,255,.45)', marginBottom: 14,
        }}>
          {planet.mood} 무드 · {tracks.length}개 트랙
        </div>

        <h2 style={{
          fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 300, color: '#F0EEFF',
          lineHeight: 1.1, letterSpacing: '-.03em', marginBottom: 8,
          textShadow: '0 0 60px rgba(123,112,224,.5)',
        }}>
          {planet.name}
        </h2>

        <div style={{ fontSize: 15, color: 'rgba(196,189,255,.55)', marginBottom: 28 }}>
          행성처럼 떠 있는 플레이리스트 사이를 유영하며
        </div>

        {/* Tracks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
          {tracks.map((track, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(8,6,20,.7)', border: '1px solid rgba(123,112,224,.18)',
              borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
              backdropFilter: 'blur(16px)', transition: 'all .22s',
            }}>
              <div style={{ fontSize: 10, color: 'rgba(155,145,255,.3)', width: 16, textAlign: 'right', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#C4BDFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {track.title}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(155,145,255,.35)' }}>
                  {track.duration || '--:--'}
                </div>
              </div>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(63,58,154,.4)', border: '1px solid rgba(123,112,224,.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#9B91FF">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Back button */}
        <button onClick={onBack} style={{
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(15,12,40,.75)', border: '1px solid rgba(123,112,224,.3)',
          borderRadius: 24, padding: '10px 18px 10px 14px',
          backdropFilter: 'blur(16px)', transition: 'all .25s',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(63,58,154,.5)', border: '1px solid rgba(123,112,224,.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C4BDFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#C4BDFF', lineHeight: 1.2 }}>
              우주로 돌아가기
            </span>
            <span style={{ fontSize: 10, color: 'rgba(155,145,255,.4)', letterSpacing: '.06em' }}>
              ESC · 더블클릭
            </span>
          </div>
        </button>
      </div>
    </div>
  )
}
