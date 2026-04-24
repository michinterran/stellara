import React from 'react';
import { COSMIC_TUNING_COPY, getLanguagePack } from '@config/stellara';
import { MiniButton, panelDescriptionStyle, panelKickerStyle, panelTitleStyle } from './panelStyles';

const SLIDERS = [
  {
    key: 'planetSpin',
    label: '◎ 행성 자전 속도',
    min: 1,
    max: 30,
    format: (value) => `${(value / 10).toFixed(1)}x`,
  },
  {
    key: 'cameraDrift',
    label: '✦ 카메라 회전',
    min: 1,
    max: 30,
    format: (value) => `${(value / 10).toFixed(1)}x`,
  },
  {
    key: 'starlight',
    label: '⋆ 별빛 밀도',
    min: 1,
    max: 200,
    format: (value) => `${value}%`,
  },
  {
    key: 'serendipity',
    label: '◈ 세렌디피티 감도',
    min: 1,
    max: 100,
    format: (value) => `${value}%`,
  },
  {
    key: 'orbitRange',
    label: '◌ 탐험 거리',
    min: 1,
    max: 100,
    format: (value) => `${value}%`,
  },
];

export function CosmicTuningPanel({
  tuning,
  onTuningChange,
  isYTConnected,
  isGoogleConnected,
  onConnectYT,
  onLoginGoogle,
  authAction,
  language = 'ko',
  onLanguageChange,
  compact = false,
  onManualSync,
  syncMeta,
  quotaMeta,
  hoverMode,
  onHoverModeToggle,
}) {
  const copy = COSMIC_TUNING_COPY[language] ?? COSMIC_TUNING_COPY.ko;
  const pack = getLanguagePack(language);
  const tuningCopy = pack.panels.tuning;
  const [draftLanguage, setDraftLanguage] = React.useState(language);
  const languageChanged = draftLanguage !== language;

  React.useEffect(() => {
    setDraftLanguage(language);
  }, [language]);

  const sliderLabels = language === 'en'
    ? {
        planetSpin: '◎ Planet spin',
        cameraDrift: '✦ Camera drift',
        starlight: '⋆ Starlight density',
        serendipity: '◈ Serendipity sensitivity',
        orbitRange: '◌ Exploration range',
      }
    : {};
  const hoverCopy = language === 'en'
    ? {
        title: 'Hovering Mode',
        description: 'While music is playing, Stellara slowly drifts past nearby planets and listener galaxies.',
        active: 'Auto-hover is active when playback is running and the interface is calm.',
        inactive: 'Paused until music resumes or you leave active UI focus.',
        enable: 'Enable Hovering',
        disable: 'Pause Hovering',
      }
    : {
        title: '호버링 모드',
        description: '음악이 재생되는 동안 Stellara가 가까운 행성과 청취 은하 옆을 천천히 유영합니다.',
        active: '재생 중이고 화면이 한가할 때 자동 호버링이 작동합니다.',
        inactive: '음악 재생이 돌아오거나 활성 UI가 정리되면 다시 시작합니다.',
        enable: '호버링 켜기',
        disable: '호버링 멈추기',
      };

  return (
    <div style={{ animation: 'fadeUp .28s ease both' }}>
      <div style={panelKickerStyle}>Physics Console</div>
      <h2 style={panelTitleStyle}>{copy.title}</h2>
      <p style={panelDescriptionStyle}>{copy.description}</p>

      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '1.15fr .85fr', gap: 18, alignItems: 'start', marginTop: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {SLIDERS.map((slider) => (
            <TuningSlider
              key={slider.key}
              {...slider}
              label={sliderLabels[slider.key] ?? slider.label}
              value={tuning[slider.key]}
              onChange={(value) => onTuningChange(slider.key, value)}
            />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            style={{
              padding: 14,
              borderRadius: 16,
              background: 'rgba(8,6,24,.68)',
              border: '1px solid rgba(155,145,255,.16)',
            }}
          >
            <div style={{ fontSize: 10, color: 'rgba(155,145,255,.42)', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 10 }}>
              {tuningCopy.languageTitle}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <LanguageButton active={draftLanguage === 'ko'} onClick={() => setDraftLanguage('ko')}>
                한국어
              </LanguageButton>
              <LanguageButton active={draftLanguage === 'en'} onClick={() => setDraftLanguage('en')}>
                English
              </LanguageButton>
            </div>
            <button
              type="button"
              disabled={!languageChanged}
              onClick={() => onLanguageChange?.(draftLanguage)}
              style={{
                width: '100%',
                marginTop: 10,
                padding: '9px 12px',
                borderRadius: 12,
                border: `1px solid ${languageChanged ? 'rgba(155,145,255,.5)' : 'rgba(123,112,224,.14)'}`,
                background: languageChanged ? 'rgba(83,74,183,.36)' : 'rgba(8,6,24,.48)',
                color: languageChanged ? '#F0EEFF' : 'rgba(196,189,255,.34)',
                cursor: languageChanged ? 'pointer' : 'default',
                fontFamily: 'inherit',
                fontSize: 11,
                letterSpacing: '.08em',
              }}
            >
              {languageChanged ? tuningCopy.ok : tuningCopy.saved}
            </button>
            <p style={{ fontSize: 10, color: 'rgba(196,189,255,.36)', lineHeight: 1.65, marginTop: 10 }}>
              {tuningCopy.pendingNote} {tuningCopy.languageHelp}
            </p>
          </div>

          <div
            style={{
              marginTop: 2,
              padding: 14,
              borderRadius: 16,
              background: 'rgba(8,6,24,.66)',
              border: '1px solid rgba(155,145,255,.14)',
            }}
          >
            <div style={{ fontSize: 10, color: 'rgba(155,145,255,.42)', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 10 }}>
              {language === 'en' ? 'Library Sync' : '라이브러리 동기화'}
            </div>
            <div style={{ fontSize: 12, color: '#F0EEFF', lineHeight: 1.7 }}>
              {syncMeta?.label || (language === 'en'
                ? 'No sync has been completed yet.'
                : '아직 라이브러리 동기화가 완료되지 않았습니다.')}
            </div>
            <div style={{ fontSize: 11, color: quotaMeta?.active ? '#FFD166' : 'rgba(196,189,255,.42)', lineHeight: 1.7, marginTop: 8 }}>
              {quotaMeta?.active
                ? (language === 'en'
                  ? 'Quota protection mode is active until local midnight. Stellara will lean on cache-first playback.'
                  : '쿼터 보호 모드가 자정까지 활성화되어 있습니다. 지금은 캐시 기반 라이브러리를 우선 사용합니다.')
                : (language === 'en'
                  ? 'Quota protection mode is currently inactive.'
                  : '쿼터 보호 모드는 현재 비활성 상태입니다.')}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              <MiniButton disabled={!isYTConnected || Boolean(authAction)} onClick={onManualSync}>
                {authAction === 'sync-library'
                  ? (language === 'en' ? 'Syncing...' : '동기화 중...')
                  : (language === 'en' ? 'Sync Now' : '지금 동기화')}
              </MiniButton>
              {quotaMeta?.active && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '7px 10px',
                    borderRadius: 999,
                    border: '1px solid rgba(255,209,102,.18)',
                    background: 'rgba(255,209,102,.08)',
                    color: '#FFD166',
                    fontSize: 10,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {language === 'en' ? 'Quota Shield On' : '쿼터 보호 활성'}
                </span>
              )}
            </div>
          </div>
          <div
            style={{
              marginTop: 6,
              padding: 14,
              borderRadius: 16,
              background: 'rgba(83,74,183,.14)',
              border: '1px solid rgba(155,145,255,.16)',
              fontSize: 11,
              color: 'rgba(196,189,255,.46)',
              lineHeight: 1.7,
            }}
          >
            {tuningCopy.nextStep}
          </div>
          <div
            style={{
              padding: 14,
              borderRadius: 16,
              background: 'rgba(8,6,24,.66)',
              border: '1px solid rgba(155,145,255,.14)',
            }}
          >
            <div style={{ fontSize: 10, color: 'rgba(155,145,255,.42)', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 10 }}>
              {hoverCopy.title}
            </div>
            <div style={{ fontSize: 12, color: '#F0EEFF', lineHeight: 1.7 }}>
              {hoverCopy.description}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(196,189,255,.42)', lineHeight: 1.7, marginTop: 8 }}>
              {hoverMode?.enabled ? hoverCopy.active : hoverCopy.inactive}
            </div>
            <div style={{ marginTop: 12 }}>
              <MiniButton onClick={() => onHoverModeToggle?.(!hoverMode?.enabled)}>
                {hoverMode?.enabled ? hoverCopy.disable : hoverCopy.enable}
              </MiniButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LanguageButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '9px 10px',
        borderRadius: 12,
        border: `1px solid ${active ? 'rgba(155,145,255,.46)' : 'rgba(123,112,224,.14)'}`,
        background: active ? 'rgba(83,74,183,.26)' : 'rgba(6,4,20,.55)',
        color: active ? '#F0EEFF' : 'rgba(196,189,255,.5)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 11,
        letterSpacing: '.04em',
        transition: 'all .2s ease',
      }}
    >
      {children}
    </button>
  );
}

function TuningSlider({ label, min, max, value, format, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <label style={{ display: 'block' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 9 }}>
        <span style={{ fontSize: 12, color: 'rgba(196,189,255,.54)', letterSpacing: '.05em' }}>{label}</span>
        <span style={{ fontSize: 12, color: '#C4BDFF' }}>{format(value)}</span>
      </div>
      <div style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', width: '100%', height: 3, borderRadius: 999, background: 'rgba(155,145,255,.1)' }} />
        <div
          style={{
            position: 'absolute',
            width: `${pct}%`,
            height: 3,
            borderRadius: 999,
            background: 'linear-gradient(90deg,#534AB7,#9B91FF,#D4C7FF)',
            boxShadow: '0 0 16px rgba(155,145,255,.35)',
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', margin: 0 }}
        />
      </div>
    </label>
  );
}
