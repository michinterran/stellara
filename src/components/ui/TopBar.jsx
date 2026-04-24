import React from 'react';
import { getLanguagePack } from '@config/stellara';

/**
 * TopBar
 * 상단 로고 및 서비스 연결 상태(Google/YouTube) 표시 컴포넌트입니다.
 */
export function TopBar(props = {}) {
  if (!props) return null;
  const {
    isGoogleConnected,
    onLoginGoogle,
    language = 'ko',
  } = props;
  const pack = getLanguagePack(language);
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 58, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
      padding: '0 20px', background: 'linear-gradient(to bottom, rgba(0,0,8,.9), transparent)',
      pointerEvents: 'none'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, pointerEvents: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 18, fontWeight: 300, letterSpacing: '.22em', color: '#E6DEFF' }}>
            S<em style={{ fontStyle: 'normal', color: '#BEB0FF' }}>tellara</em>
          </div>
          <div style={{ fontSize: 9, color: 'rgba(205,198,255,.58)', letterSpacing: '.12em', textTransform: 'uppercase' }}>
            {pack.stellara.badge}
          </div>
        </div>
        {!props.user ? (
          <StatusDot label={pack.topBar.googleLogin} active={isGoogleConnected} onClick={onLoginGoogle} />
        ) : null}
      </div>
    </div>
  );
}

function StatusDot({ label, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
      borderRadius: 14, background: 'rgba(6,4,18,.78)',
      border: `1px solid ${active ? 'rgba(68,255,136,.22)' : 'rgba(255,85,85,.2)'}`,
      cursor: onClick ? 'pointer' : 'default', transition: 'all .22s'
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: active ? '#44FF88' : '#FF5555',
        boxShadow: active ? '0 0 5px #44FF88' : '0 0 4px #FF5555', flexShrink: 0
      }} />
      <span style={{ fontSize: 10, color: active ? 'rgba(68,255,136,.85)' : 'rgba(255,85,85,.75)', letterSpacing: '.05em' }}>
        {label}
      </span>
    </div>
  );
}
