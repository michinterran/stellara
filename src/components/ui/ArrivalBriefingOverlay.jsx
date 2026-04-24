import React from 'react';

export function ArrivalBriefingOverlay({ briefing, language = 'ko' }) {
  if (!briefing) return null;

  const copy = language === 'en'
    ? {
        visiting: 'Arrival Briefing',
        host: 'Host',
        foreign: 'You are now exploring another listener galaxy.',
        home: 'You have returned to your home orbit.',
      }
    : {
        visiting: '도착 브리핑',
        host: '은하 주인',
        foreign: '지금 다른 탐험자의 은하에 진입해 있습니다.',
        home: '당신의 홈 궤도로 돌아왔습니다.',
      };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 340,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        pointerEvents: 'none',
        paddingTop: 82,
      }}
    >
      <div
        style={{
          width: 'min(340px, calc(100vw - 36px))',
          padding: '12px 14px',
          borderRadius: 16,
          border: '1px solid rgba(132, 197, 255, .18)',
          background: 'linear-gradient(180deg, rgba(9,14,34,.82), rgba(6,4,20,.74))',
          backdropFilter: 'blur(18px)',
          boxShadow: '0 18px 60px rgba(0,0,0,.28), 0 0 24px rgba(84, 130, 255, .1)',
          animation: 'fadeUp .42s ease both',
          pointerEvents: 'auto',
        }}
      >
        <div style={{ fontSize: 9, letterSpacing: '.18em', color: 'rgba(168,205,255,.66)', textTransform: 'uppercase', marginBottom: 6 }}>
          {copy.visiting}
        </div>
        <div style={{ fontSize: 18, fontWeight: 300, color: '#F3F0FF', lineHeight: 1.18, marginBottom: 4 }}>
          {briefing.title}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(196,189,255,.68)', marginBottom: 8 }}>
          {copy.host}: {briefing.ownerLabel || 'Stellara'}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(220,231,255,.72)', lineHeight: 1.65 }}>
          {briefing.description}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(196,189,255,.42)', lineHeight: 1.65, marginTop: 8 }}>
          {briefing.isForeign ? copy.foreign : copy.home}
        </div>
        <div style={{ fontSize: 8, color: 'rgba(155,145,255,.28)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 10 }}>
          {language === 'en' ? 'Briefing will fade automatically' : '브리핑은 자동으로 사라집니다'}
        </div>
      </div>
    </div>
  );
}
