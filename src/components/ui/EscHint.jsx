import React, { useState, useEffect } from 'react';
import { getLanguagePack } from '@config/stellara';

/**
 * EscHint
 * 우주로 돌아가기 가이드 표시 컴포넌트입니다.
 */
export function EscHint({ onClose, language = 'ko' }) {
  const [show, setShow] = useState(false);
  const pack = getLanguagePack(language);

  useEffect(() => {
    const t1 = setTimeout(() => setShow(true), 900);
    const t2 = setTimeout(() => setShow(false), 5900);
    
    const k = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', k);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('keydown', k);
    };
  }, [onClose]);

  if (!show) return null;

  return (
    <div data-ui="esc" style={{
      position: 'fixed', top: 64, left: '50%', transform: 'translateX(-50%)',
      zIndex: 44, display: 'flex', alignItems: 'center', gap: 8,
      background: 'rgba(4,2,18,.88)', border: '1px solid rgba(123,112,224,.2)',
      borderRadius: 20, padding: '7px 16px', backdropFilter: 'blur(20px)',
      fontFamily: 'inherit', pointerEvents: 'auto'
    }}>
      <span style={{
        fontSize: 10, fontWeight: 700, color: '#9B91FF',
        background: 'rgba(83,74,183,.35)', border: '1px solid rgba(123,112,224,.4)',
        borderRadius: 5, padding: '2px 7px', letterSpacing: '.08em'
      }}>
        ESC
      </span>
      <span style={{ fontSize: 11, color: 'rgba(155,145,255,.45)', letterSpacing: '.06em' }}>
        {pack.system.returnToSpace}
      </span>
    </div>
  );
}
