// src/components/PlayerBar.jsx
export default function PlayerBar({ nowPlaying, isPlaying, onToggle, platform }) {
  if (!nowPlaying) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', gap: 20, padding: '14px 40px',
      background: 'linear-gradient(to top, rgba(1,0,6,.98) 0%, rgba(1,0,6,.6) 70%, transparent 100%)',
      backdropFilter: 'blur(4px)', fontFamily: 'system-ui,sans-serif',
    }}>
      {/* Disc + Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: '0 0 auto' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1.5px solid ${nowPlaying.hex || 'rgba(155,145,255,.28)'}`,
          animation: isPlaying ? 'spin 8s linear infinite' : 'none',
        }}>
          <div style={{
            width: 12, height: 12, borderRadius: '50%',
            background: nowPlaying.discColor || 'rgba(155,145,255,.5)',
          }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#C4BDFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {nowPlaying.title}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(155,145,255,.38)' }}>
            {nowPlaying.artist}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <button style={{ opacity: .38, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C4BDFF" strokeWidth="1.5" strokeLinecap="round">
            <polygon points="19 20 9 12 19 4 19 20"/>
            <line x1="5" y1="19" x2="5" y2="5"/>
          </svg>
        </button>

        <button onClick={onToggle} style={{
          width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
          background: 'rgba(63,58,154,.52)', border: '1.5px solid rgba(123,112,224,.52)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .3s',
        }}>
          {isPlaying ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#C4BDFF">
              <rect x="6" y="4" width="4" height="16" rx="1"/>
              <rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#C4BDFF">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          )}
        </button>

        <button style={{ opacity: .38, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C4BDFF" strokeWidth="1.5" strokeLinecap="round">
            <polygon points="5 4 15 12 5 20 5 4"/>
            <line x1="19" y1="5" x2="19" y2="19"/>
          </svg>
        </button>
      </div>

      {/* Progress */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 10, color: 'rgba(155,145,255,.32)', flexShrink: 0 }}>
          1:47
        </span>
        <div style={{ flex: 1, height: 3, background: 'rgba(155,145,255,.1)', borderRadius: 2, cursor: 'pointer' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg,#534AB7,#9B91FF)', borderRadius: 2, width: '32%' }} />
        </div>
        <span style={{ fontSize: 10, color: 'rgba(155,145,255,.32)', flexShrink: 0 }}>
          4:12
        </span>
      </div>

      {/* Platform badge */}
      <div style={{
        fontSize: 10, color: 'rgba(201,123,240,.45)',
        background: 'rgba(26,13,46,.55)', border: '1px solid rgba(201,123,240,.15)',
        padding: '4px 12px', borderRadius: 20, flexShrink: 0,
      }}>
        {platform === 'apple' ? 'Apple Music' : platform === 'youtube' ? 'YouTube Music' : '연결됨'}
      </div>
    </div>
  )
}
