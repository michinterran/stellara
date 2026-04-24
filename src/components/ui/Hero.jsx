import React from 'react';
import { DISCOVERY_CHIPS, getLanguagePack } from '@config/stellara';
import { useTimePersona } from '@hooks/useTimePersona';

/**
 * Hero
 * 메인 검색창 및 무드 칩 컴포넌트입니다.
 */
export function Hero(props = {}) {
  if (!props) return null;
  const { mood, setMood, onSearch, onChip, language = 'ko', rollingSignal = null } = props;
  const pack = getLanguagePack(language);
  const persona = useTimePersona(language);
  const intentHint = language === 'en'
    ? 'Say the mood. The universe will move first.'
    : '기분만 말하면, 우주가 먼저 움직입니다.';

  return (
    <div data-ui="hero" style={{
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
      textAlign: 'center', width: 'min(580px,82vw)', zIndex: 30, fontFamily: 'inherit', pointerEvents: 'none'
    }}>
      <style>{`
        @keyframes stellaraSignalPulse {
          0%, 100% {
            opacity: .88;
            text-shadow: 0 0 10px rgba(244,151,44,.14);
          }
          50% {
            opacity: 1;
            text-shadow: 0 0 18px rgba(244,151,44,.28);
          }
        }
        @keyframes stellaraSignalFlipIn {
          0% { opacity: 0; transform: perspective(500px) rotateX(-78deg) translateY(10px); }
          100% { opacity: 1; transform: perspective(500px) rotateX(0deg) translateY(0); }
        }
        @keyframes stellaraSignalFlipOut {
          0% { opacity: 1; transform: perspective(500px) rotateX(0deg) translateY(0); }
          100% { opacity: 0; transform: perspective(500px) rotateX(78deg) translateY(-8px); }
        }
      `}</style>
      <div style={{ fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', color: 'rgba(123,112,224,.45)', marginBottom: 12 }}>
        {persona.eyebrow}
      </div>
      <CrossFadeText
        text={`${persona.label} · ${persona.range} · SIGNAL ${String(persona.signal).padStart(2, '0')}`}
        style={{ fontSize: 11, color: 'rgba(196,189,255,.58)', letterSpacing: '.12em', marginBottom: 18, minHeight: 16 }}
      />
      <CrossFadeHeadline headline={persona.headline ?? { lead: pack.stellara.title[0], accent: pack.stellara.title[1] }} />
      <CrossFadeText
        as="p"
        text={persona.slogan}
        style={{ fontSize: 'clamp(14px,1.5vw,17px)', color: 'rgba(218,214,255,.72)', lineHeight: 1.9, marginBottom: 14, minHeight: 62, textShadow: '0 0 28px rgba(155,145,255,.22)' }}
      />
      <RollingSignalTicker signal={rollingSignal} language={language} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 13, pointerEvents: 'auto' }}>
        <div data-ui="hero-input" style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          background: 'rgba(6,4,20,.8)', border: '1px solid rgba(123,112,224,.28)',
          borderRadius: 40, padding: '12px 12px 12px 22px', backdropFilter: 'blur(24px)'
        }}>
          <input 
            value={mood} 
            onChange={e => setMood(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && onSearch()} 
            placeholder={pack.stellara.searchPlaceholder}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: '#C4BDFF', fontFamily: 'inherit', caretColor: '#9B91FF' }} 
          />
          <button onClick={onSearch} style={{
            width: 38, height: 38, borderRadius: '50%', background: 'rgba(83,74,183,.55)',
            border: '1px solid rgba(123,112,224,.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C4BDFF" strokeWidth="2" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(196,189,255,.48)', lineHeight: 1.7, maxWidth: 520 }}>
          {intentHint}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {pack.discoveryChips.map((c, i) => (
            <button key={c} onClick={() => onChip(DISCOVERY_CHIPS[i] ?? c, i)} style={{
              fontSize: 11, color: 'rgba(155,145,255,.5)', background: 'rgba(14,10,44,.55)',
              border: '1px solid rgba(123,112,224,.15)', borderRadius: 20, padding: '5px 14px',
              cursor: 'pointer', fontFamily: 'inherit'
            }}>
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RollingSignalTicker({ signal, language = 'ko' }) {
  if (!signal?.title && !signal?.description) {
    return <div style={{ marginBottom: 18 }} />;
  }

  const line = [signal.title, signal.description].filter(Boolean).join(' · ');

  return (
    <div style={{ marginBottom: 18, pointerEvents: 'auto' }}>
      <button
        type="button"
        onClick={() => signal.onPrimaryAction?.()}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: '8px 18px',
          margin: '0 auto',
          minHeight: 44,
          borderRadius: 40,
          border: '1px solid rgba(244,151,44,.24)',
          background: 'rgba(28,14,6,.28)',
          boxShadow: '0 0 18px rgba(244,151,44,.08)',
          backdropFilter: 'blur(14px)',
          cursor: signal.onPrimaryAction ? 'pointer' : 'default',
          textAlign: 'center',
          color: '#FFD9A3',
          fontFamily: 'inherit',
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: '.16em',
            textTransform: 'uppercase',
            color: '#F59D33',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {language === 'en' ? 'Official Route' : '공식 항로'}
        </div>
        <CrossFadeText
          as="div"
          text={line}
          style={{
            fontSize: 12,
            fontWeight: 500,
            lineHeight: 1.2,
            color: '#FFE1B6',
            maxWidth: 380,
            minHeight: 16,
            letterSpacing: '.01em',
            animation: 'stellaraSignalPulse 2.8s ease-in-out infinite',
          }}
          animationType="flip"
        />
      </button>
    </div>
  );
}

function CrossFadeHeadline({ headline }) {
  const text = `${headline.lead}\n${headline.accent}`;

  return (
    <CrossFadeText
      as="h1"
      text={text}
      style={{
        fontSize: 'clamp(14px,2.1vw,22px)',
        fontWeight: 300,
        color: '#F0EEFF',
        lineHeight: 1.34,
        letterSpacing: '-.02em',
        marginBottom: 14,
        minHeight: 'clamp(38px,6vw,68px)',
        textShadow: '0 0 44px rgba(123,112,224,.32)',
      }}
      render={(value) => {
        const [lead, accent] = value.split('\n');
        return (
          <>
            {lead}
            <br />
            <em style={{ fontStyle: 'normal', color: '#9B91FF' }}>{accent}</em>
          </>
        );
      }}
    />
  );
}

function CrossFadeText({ text, style, as: Tag = 'div', render, animationType = 'fade' }) {
  const [layers, setLayers] = React.useState([{ id: 0, text, status: 'enter' }]);

  React.useEffect(() => {
    setLayers((prev) => {
      const current = prev[prev.length - 1];
      if (current?.text === text) return prev;

      const nextId = (current?.id ?? 0) + 1;
      return [
        ...prev.map((layer) => ({ ...layer, status: 'exit' })),
        { id: nextId, text, status: 'enter' },
      ];
    });

    const timer = window.setTimeout(() => {
      setLayers((prev) => prev.slice(-1));
    }, 520);

    return () => window.clearTimeout(timer);
  }, [text]);

  return (
    <Tag style={{ position: 'relative', ...style }}>
      {layers.map((layer) => (
        <span
          key={layer.id}
          style={{
            position: layer.id === layers[layers.length - 1]?.id ? 'relative' : 'absolute',
            inset: 0,
            display: 'block',
            opacity: layer.status === 'exit' ? 0 : 1,
            transform: animationType === 'flip'
              ? 'none'
              : layer.status === 'exit'
                ? 'translateY(-8px)'
                : 'translateY(0)',
            transition: animationType === 'flip' ? 'opacity .32s ease' : 'opacity .52s ease, transform .52s ease',
            animation: animationType === 'flip'
              ? `${layer.status === 'exit' ? 'stellaraSignalFlipOut' : 'stellaraSignalFlipIn'} .5s cubic-bezier(.22,.61,.36,1) both`
              : undefined,
            transformOrigin: '50% 50%',
          }}
        >
          {render ? render(layer.text) : layer.text}
        </span>
      ))}
    </Tag>
  );
}
