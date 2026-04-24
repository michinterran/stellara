import React from 'react';

export const PLANET_PALETTE_OPTIONS = [
  { value: 'pastel', label: { ko: '파스텔 글로우', en: 'Pastel Glow' }, colors: { primary: '#B7F2D4', secondary: '#F2D5FF', accent: '#E7F9FF', glow: '#DCC6FF' } },
  { value: 'vivid', label: { ko: '비비드 펄스', en: 'Vivid Pulse' }, colors: { primary: '#62F7C8', secondary: '#55BEFF', accent: '#FFF0A6', glow: '#8BD7FF' } },
  { value: 'deep', label: { ko: '딥 오비트', en: 'Deep Orbit' }, colors: { primary: '#7D5BFF', secondary: '#1E153C', accent: '#D8CBFF', glow: '#9F8CFF' } },
  { value: 'ember', label: { ko: '엠버 코어', en: 'Ember Core' }, colors: { primary: '#FF7A2F', secondary: '#A33918', accent: '#FFD6A5', glow: '#FF9A53' } },
  { value: 'aurora', label: { ko: '오로라 미스트', en: 'Aurora Mist' }, colors: { primary: '#68FFD8', secondary: '#7AA8FF', accent: '#D7FFFB', glow: '#B7D4FF' } },
];

export const PLANET_SURFACE_OPTIONS = [
  { value: 'rocky', label: { ko: '암석형', en: 'Rocky' } },
  { value: 'gas', label: { ko: '가스형', en: 'Gas' } },
  { value: 'ice', label: { ko: '빙결형', en: 'Ice' } },
  { value: 'lava', label: { ko: '용암형', en: 'Lava' } },
  { value: 'ocean', label: { ko: '해양형', en: 'Ocean' } },
];

export const PLANET_PARTICLE_OPTIONS = [
  { value: 'stardust', label: { ko: '스타더스트', en: 'Stardust' } },
  { value: 'trail', label: { ko: '트레일', en: 'Trail' } },
  { value: 'pulse', label: { ko: '펄스', en: 'Pulse' } },
  { value: 'mist', label: { ko: '미스트', en: 'Mist' } },
];

export const PLANET_SIZE_OPTIONS = [
  { value: 'small', label: { ko: '작게', en: 'Small' }, scale: 0.82 },
  { value: 'medium', label: { ko: '중간', en: 'Medium' }, scale: 1 },
  { value: 'large', label: { ko: '크게', en: 'Large' }, scale: 1.2 },
];

function hexToRgba(hex = '#FFFFFF', alpha = 1) {
  const normalized = hex.replace('#', '');
  const expanded = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;
  const int = parseInt(expanded, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getLabel(option, language = 'ko') {
  if (!option) return '';
  return typeof option.label === 'string' ? option.label : option.label?.[language] || option.label?.ko || option.value;
}

export function resolvePalette(design = {}, customPalette = null) {
  if (customPalette) return customPalette;
  const preset = PLANET_PALETTE_OPTIONS.find((option) => option.value === design.colorPalette);
  if (preset) return preset.colors;
  if (design.palette) {
    return {
      primary: design.palette.primary || '#E38CB8',
      secondary: design.palette.secondary || '#F4D4AE',
      accent: design.palette.accent || '#F6CCE4',
      glow: design.palette.glow || '#EBC8F0',
    };
  }
  return PLANET_PALETTE_OPTIONS[0].colors;
}

function getSurfaceOverlay(surface = 'rocky', palette) {
  switch (surface) {
    case 'gas':
      return `repeating-linear-gradient(165deg, ${hexToRgba(palette.primary, 0.28)} 0 14px, ${hexToRgba(palette.secondary, 0.18)} 14px 28px, transparent 28px 42px)`;
    case 'ice':
      return `radial-gradient(circle at 32% 30%, ${hexToRgba('#FFFFFF', 0.34)}, transparent 26%), linear-gradient(160deg, ${hexToRgba('#FFFFFF', 0.18)}, transparent 46%, ${hexToRgba(palette.glow, 0.16)} 76%)`;
    case 'lava':
      return `radial-gradient(circle at 30% 34%, ${hexToRgba('#FFFFFF', 0.16)}, transparent 20%), radial-gradient(circle at 65% 60%, ${hexToRgba('#FFB347', 0.26)}, transparent 18%), linear-gradient(140deg, ${hexToRgba('#220500', 0.3)}, transparent 44%, ${hexToRgba('#FFD18A', 0.12)} 100%)`;
    case 'ocean':
      return `linear-gradient(180deg, ${hexToRgba('#FFFFFF', 0.08)}, transparent 24%), repeating-linear-gradient(12deg, ${hexToRgba(palette.secondary, 0.2)} 0 10px, transparent 10px 20px)`;
    default:
      return `radial-gradient(circle at 24% 30%, ${hexToRgba('#FFFFFF', 0.2)}, transparent 16%), radial-gradient(circle at 62% 68%, ${hexToRgba(palette.accent, 0.16)}, transparent 20%), linear-gradient(145deg, ${hexToRgba('#000000', 0.18)}, transparent 38%)`;
  }
}

function getParticleStyle(style = 'stardust', palette) {
  const config = {
    stardust: { count: 10, spread: 82, size: 2.6, opacity: 0.44 },
    trail: { count: 16, spread: 102, size: 2.2, opacity: 0.42 },
    pulse: { count: 12, spread: 72, size: 3.4, opacity: 0.5 },
    mist: { count: 18, spread: 88, size: 4.4, opacity: 0.24 },
  }[style] || { count: 10, spread: 82, size: 2.6, opacity: 0.44 };

  return Array.from({ length: config.count }, (_, index) => {
    const angle = (index / config.count) * Math.PI * 2;
    const radius = config.spread + (index % 4) * 14;
    const left = 50 + Math.cos(angle) * radius;
    const top = 50 + Math.sin(angle * 1.12) * radius * 0.5;
    return {
      left: `calc(${left}% - ${config.size / 2}px)`,
      top: `calc(${top}% - ${config.size / 2}px)`,
      size: config.size + (index % 3) * 0.8,
      color: index % 2 === 0 ? palette.accent : palette.glow,
      opacity: config.opacity + (index % 5) * 0.04,
    };
  });
}

function getRingVisual(hasRing, palette, ringStyle = 'single') {
  if (!hasRing && ringStyle === 'none') return [];
  const mode = hasRing ? ringStyle : 'none';
  if (mode === 'none') return [];
  const base = {
    single: [{ w: 92, h: 24, rotate: -14, opacity: 0.72 }],
    double: [{ w: 100, h: 28, rotate: -14, opacity: 0.68 }, { w: 116, h: 32, rotate: -8, opacity: 0.4 }],
    broken: [{ w: 108, h: 30, rotate: -16, opacity: 0.62, dashed: true }],
    tilted: [{ w: 98, h: 26, rotate: -26, opacity: 0.72 }],
  }[mode] || [{ w: 92, h: 24, rotate: -14, opacity: 0.72 }];

  return base.map((ring) => ({
    ...ring,
    color: hexToRgba(palette.secondary, 0.8),
    glow: hexToRgba(palette.glow, 0.32),
  }));
}

export function PlanetOrbitPreview({
  language = 'ko',
  title,
  subtitle,
  description,
  design = {},
  accentLabel,
  compact = false,
  customPalette = null,
}) {
  const palette = resolvePalette(design, customPalette);
  const sizeScale = PLANET_SIZE_OPTIONS.find((option) => option.value === (design.sizeTier || 'medium'))?.scale || 1;
  const sphereSize = (compact ? 118 : 156) * sizeScale;
  const particles = getParticleStyle(design.particleStyle || design.particles || 'stardust', palette);
  const rings = getRingVisual(design.hasRing ?? true, palette, design.ringStyle || 'single');
  const surface = design.planetType || design.surface || 'rocky';

  return (
    <div
      style={{
        padding: compact ? 14 : 18,
        borderRadius: compact ? 20 : 24,
        background: 'linear-gradient(180deg, rgba(16,10,32,.96), rgba(7,4,18,.98))',
        border: '1px solid rgba(123,112,224,.18)',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes planetStudioSpin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes planetStudioPulse {
          0%,100% { opacity: .66; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        @keyframes planetStudioOrbit {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          position: 'relative',
          minHeight: compact ? 240 : 320,
          borderRadius: compact ? 18 : 22,
          overflow: 'hidden',
          background: 'radial-gradient(circle at 50% 34%, rgba(44,31,88,.84), rgba(5,4,18,.98) 74%)',
          border: '1px solid rgba(123,112,224,.14)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '-14%',
            background: `radial-gradient(circle at 50% 52%, ${hexToRgba(palette.glow, 0.28)}, transparent 54%)`,
            filter: 'blur(22px)',
            animation: 'planetStudioPulse 3.8s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '48%',
            width: '72%',
            height: 30,
            borderRadius: '50%',
            border: `1px solid ${hexToRgba(palette.glow, 0.18)}`,
            transform: 'translate(-50%, -50%) rotate(-12deg)',
            opacity: 0.48,
          }}
        />
        {particles.map((particle, index) => (
          <div
            key={`particle-${index}`}
            style={{
              position: 'absolute',
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              borderRadius: '50%',
              background: particle.color,
              opacity: particle.opacity,
              boxShadow: `0 0 12px ${hexToRgba(particle.color, 0.38)}`,
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: sphereSize,
            height: sphereSize,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            background: [
              `radial-gradient(circle at 34% 28%, ${hexToRgba('#FFFFFF', 0.34)}, transparent 20%)`,
              `radial-gradient(circle at 62% 72%, ${hexToRgba(palette.secondary, 0.28)}, transparent 28%)`,
              `radial-gradient(circle at 50% 50%, ${palette.secondary} 0%, ${palette.primary} 46%, ${palette.accent} 76%, ${palette.glow} 100%)`,
              getSurfaceOverlay(surface, palette),
            ].join(', '),
            boxShadow: `0 0 42px ${hexToRgba(palette.glow, 0.38)}, 0 0 90px ${hexToRgba(palette.primary, 0.18)}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: sphereSize,
            height: sphereSize,
            borderRadius: '50%',
            background: 'linear-gradient(115deg, rgba(255,255,255,.06), transparent 28%, rgba(0,0,0,.26) 88%)',
            animation: 'planetStudioSpin 24s linear infinite',
            transform: 'translate(-50%, -50%)',
            mixBlendMode: 'screen',
          }}
        />
        {rings.map((ring, index) => (
          <div
            key={`ring-${index}`}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: `${ring.w * sizeScale}%`,
              height: `${ring.h * sizeScale}px`,
              borderRadius: '50%',
              transform: `translate(-50%, -50%) rotate(${ring.rotate}deg)`,
              border: `${compact ? 1.6 : 2}px ${ring.dashed ? 'dashed' : 'solid'} ${ring.color}`,
              boxShadow: `0 0 16px ${ring.glow}`,
              opacity: ring.opacity,
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: compact ? 130 : 170,
            height: compact ? 130 : 170,
            transform: 'translate(-50%, -50%)',
            animation: 'planetStudioOrbit 18s linear infinite',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              width: compact ? 8 : 10,
              height: compact ? 8 : 10,
              borderRadius: '50%',
              background: palette.accent,
              boxShadow: `0 0 14px ${hexToRgba(palette.accent, 0.48)}`,
              transform: 'translateY(-50%)',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 'auto 18px 18px',
            padding: compact ? 14 : 16,
            borderRadius: 20,
            background: 'rgba(10,8,26,.82)',
            border: '1px solid rgba(123,112,224,.18)',
            backdropFilter: 'blur(18px)',
          }}
        >
          {accentLabel && (
            <div style={{ fontSize: 10, color: '#C8BEFF', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 8 }}>
              {accentLabel}
            </div>
          )}
          <div style={{ fontSize: compact ? 24 : 28, color: '#FFF7EF', fontWeight: 300, lineHeight: 1.15 }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 11, color: 'rgba(206,198,255,.76)', marginTop: 10, letterSpacing: '.08em', textTransform: 'uppercase' }}>
              {subtitle}
            </div>
          )}
          {description && (
            <div style={{ fontSize: 12, color: 'rgba(238,232,255,.78)', marginTop: 10, lineHeight: 1.65 }}>
              {description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function OptionTileGroup({ options, value, onChange, language = 'ko', columns = 3 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 10 }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange?.(option.value)}
            style={{
              minHeight: 72,
              padding: '10px 12px',
              borderRadius: 14,
              border: `1px solid ${active ? 'rgba(155,145,255,.42)' : 'rgba(123,112,224,.16)'}`,
              background: active ? 'linear-gradient(180deg, rgba(42,30,94,.88), rgba(19,13,44,.86))' : 'rgba(8,6,24,.72)',
              color: '#F0EEFF',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 500 }}>{getLabel(option, language)}</div>
            {option.description && (
              <div style={{ fontSize: 10, color: active ? 'rgba(224,219,255,.76)' : 'rgba(196,189,255,.52)', lineHeight: 1.55, marginTop: 6 }}>
                {typeof option.description === 'string' ? option.description : option.description?.[language] || option.description?.ko}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
