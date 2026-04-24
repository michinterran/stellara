import React from 'react';

export function CurationSignalCard({ signal, language = 'ko', onDismiss, onPrimaryAction }) {
  if (!signal) return null;

  const copy = language === 'en'
    ? {
        kicker: 'Cosmic Reply',
        dismiss: 'Close',
      }
    : {
        kicker: 'Cosmic Reply',
        dismiss: '닫기',
      };

  const isRolling = signal.variant === 'rolling_signal';

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: isRolling ? 'auto' : 142,
        top: isRolling ? 106 : 'auto',
        transform: 'translateX(-50%)',
        zIndex: 305,
        width: 'min(360px, calc(100vw - 32px))',
        pointerEvents: 'auto',
        animation: 'fadeUp .28s ease both',
      }}
    >
      <div
        style={{
          padding: signal.compact ? '10px 12px 11px' : '13px 14px 14px',
          borderRadius: signal.compact ? 18 : 20,
          border: '1px solid rgba(155,145,255,.14)',
          background: 'linear-gradient(180deg, rgba(10,8,30,.76), rgba(6,4,20,.68))',
          backdropFilter: 'blur(22px)',
          boxShadow: '0 14px 42px rgba(0,0,0,.24), 0 0 18px rgba(155,145,255,.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(155,145,255,.88)', boxShadow: '0 0 12px rgba(155,145,255,.55)' }} />
            <div style={{ fontSize: 10, letterSpacing: '.16em', color: 'rgba(155,145,255,.54)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {signal.kicker || copy.kicker}
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(196,189,255,.42)',
              fontSize: 13,
              lineHeight: 1,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
            aria-label={copy.dismiss}
          >
            ×
          </button>
        </div>

        <div style={{ fontSize: signal.compact ? 15 : 18, fontWeight: 300, color: '#F0EEFF', lineHeight: 1.3, marginTop: 7 }}>
          {signal.title}
        </div>
        {signal.subtitle && (
          <div style={{ fontSize: 10, color: 'rgba(155,145,255,.62)', marginTop: 4, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            {signal.subtitle}
          </div>
        )}
        <div style={{ fontSize: signal.compact ? 11 : 12, color: 'rgba(212,204,255,.72)', lineHeight: 1.55, marginTop: 7 }}>
          {signal.description}
        </div>
        {signal.reason && !signal.compact && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 12px',
              borderRadius: 14,
              border: '1px solid rgba(123,112,224,.16)',
              background: 'rgba(16,12,38,.62)',
              fontSize: 11,
              color: 'rgba(196,189,255,.68)',
              lineHeight: 1.65,
            }}
          >
            {signal.reason}
          </div>
        )}
        {signal.ctaLabel && onPrimaryAction ? (
          <button
            type="button"
            onClick={onPrimaryAction}
            style={{
              marginTop: 12,
              padding: '9px 12px',
              borderRadius: 999,
              border: '1px solid rgba(155,145,255,.22)',
              background: 'rgba(83,74,183,.24)',
              color: '#F0EEFF',
              fontFamily: 'inherit',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            {signal.ctaLabel}
          </button>
        ) : null}
        <div style={{ fontSize: 9, color: 'rgba(155,145,255,.24)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 8 }}>
          {language === 'en' ? 'Signal will fade automatically' : '신호는 자동으로 사라집니다'}
        </div>
      </div>
    </div>
  );
}
