import React from 'react';

function buildStreaks(count, color) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    const distance = 10 + (index % 9) * 7;
    const left = 50 + Math.cos(angle) * distance;
    const top = 50 + Math.sin(angle) * distance;
    const width = 80 + (index % 6) * 28;
    const delay = (index % 12) * 0.025;
    const opacity = 0.24 + (index % 5) * 0.08;
    return { left, top, angle, width, delay, opacity, color };
  });
}

export function CosmicTransitionOverlay({ effect }) {
  if (!effect?.active) return null;

  const streakColor = effect.type === 'nearby-route'
    ? 'rgba(171,228,255,.95)'
    : effect.type === 'portal'
      ? 'rgba(202,214,255,.95)'
      : 'rgba(255,255,255,.96)';
  const accent = effect.type === 'blackhole' ? '#FFB15E' : '#F1F5FF';
  const streaks = buildStreaks(effect.type === 'blackhole' ? 42 : 30, streakColor);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 420,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 50%, rgba(18,10,26,.18) 0%, rgba(4,3,12,.74) 34%, rgba(1,0,7,.96) 78%)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <style>{`
        @keyframes stellaraWarpFade {
          0% { opacity: 0; }
          12% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes stellaraWarpLine {
          0% { transform: translate(-50%, -50%) scaleX(.12); opacity: 0; }
          18% { opacity: .95; }
          100% { transform: translate(-50%, -50%) scaleX(1.8); opacity: 0; }
        }
        @keyframes stellaraWarpCore {
          0% { transform: translate(-50%, -50%) scale(.2); opacity: .18; }
          40% { opacity: .78; }
          100% { transform: translate(-50%, -50%) scale(1.65); opacity: 0; }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          animation: 'stellaraWarpFade .95s ease both',
        }}
      >
        {streaks.map((streak, index) => (
          <div
            key={`streak-${index}`}
            style={{
              position: 'absolute',
              left: `${streak.left}%`,
              top: `${streak.top}%`,
              width: streak.width,
              height: 3,
              borderRadius: 999,
              background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, ${streak.color} 32%, rgba(255,255,255,0) 100%)`,
              transform: `translate(-50%, -50%) rotate(${streak.angle}rad)`,
              transformOrigin: 'center center',
              opacity: streak.opacity,
              boxShadow: `0 0 20px ${streak.color}`,
              animation: `stellaraWarpLine .8s cubic-bezier(.2,.75,.25,1) ${streak.delay}s both`,
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: effect.type === 'blackhole' ? 82 : 64,
          height: effect.type === 'blackhole' ? 82 : 64,
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          background: effect.type === 'blackhole'
            ? 'radial-gradient(circle, rgba(255,178,92,.92) 0%, rgba(255,133,42,.5) 18%, rgba(22,12,8,.12) 48%, rgba(0,0,0,0) 72%)'
            : 'radial-gradient(circle, rgba(255,255,255,.92) 0%, rgba(186,208,255,.38) 24%, rgba(0,0,0,0) 68%)',
          boxShadow: effect.type === 'blackhole'
            ? '0 0 140px rgba(255,145,44,.36)'
            : '0 0 120px rgba(174,204,255,.26)',
          animation: 'stellaraWarpCore .9s ease-out both',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '16%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          maxWidth: 580,
          padding: '0 24px',
          animation: 'stellaraWarpFade .95s ease both',
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: '.24em', textTransform: 'uppercase', color: 'rgba(255,255,255,.42)', marginBottom: 10 }}>
          {effect.kicker}
        </div>
        <div style={{ fontSize: 'clamp(20px, 3.1vw, 34px)', lineHeight: 1.15, fontWeight: 300, color: '#F6F4FF', textShadow: '0 0 30px rgba(255,255,255,.14)' }}>
          {effect.title}
        </div>
        {effect.description && (
          <div style={{ fontSize: 13, lineHeight: 1.8, color: 'rgba(235,232,255,.7)', marginTop: 12 }}>
            {effect.description}
          </div>
        )}
        {!!effect.target && (
          <div style={{ fontSize: 12, lineHeight: 1.7, color: accent, marginTop: 12, letterSpacing: '.08em' }}>
            {effect.target}
          </div>
        )}
      </div>
    </div>
  );
}
