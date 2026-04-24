import React from 'react';

/**
 * Toasts
 * 시스템 알림 메시지 표시 컴포넌트입니다.
 */
export function Toasts({ toasts }) {
  if (!toasts || toasts.length === 0) return null;
  
  return (
    <div data-ui="toasts" style={{
      position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 7, pointerEvents: 'none'
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: 'rgba(6,4,20,.92)', border: '1px solid rgba(123,112,224,.22)',
          borderRadius: 20, padding: '9px 20px', fontSize: 12, color: '#C4BDFF',
          backdropFilter: 'blur(18px)', fontFamily: 'inherit',
          animation: 'fadeUp .3s ease both', letterSpacing: '.04em'
        }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
