import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import CanvasLayer from '@components/ThreeEngine/CanvasLayer';
import SpacePage from '@pages/SpacePage';
import { AuthProvider } from '@hooks/useAuth';
import { AdminService } from '@services/AdminService';

const css = `
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;-webkit-user-select:none;user-select:none;}
html,body,#root{width:100%;height:100%;overflow:hidden;background:#010008;font-family:'Apple SD Gothic Neo',system-ui,sans-serif;}
body{color:#F0EEFF;}
input,textarea{-webkit-user-select:text;user-select:text;}
button{font-family:inherit;}
::-webkit-scrollbar{width:2px;}
::-webkit-scrollbar-thumb{background:rgba(123,112,224,.3);border-radius:2px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes cosmicFade{0%{opacity:0}12%{opacity:1}88%{opacity:1}100%{opacity:0}}
@keyframes portalRipple{0%{transform:scale(.82);opacity:0}40%{opacity:.88}100%{transform:scale(1.18);opacity:0}}
@keyframes blackholePulse{0%{transform:scale(.78) rotate(0deg);opacity:0}40%{opacity:.55}100%{transform:scale(1.32) rotate(18deg);opacity:0}}
@keyframes portalCore{0%,100%{transform:translate(-50%,-50%) scale(.96)}50%{transform:translate(-50%,-50%) scale(1.04)}}
@keyframes blackholeCore{0%,100%{transform:translate(-50%,-50%) scale(.94) rotate(0deg)}50%{transform:translate(-50%,-50%) scale(1.03) rotate(6deg)}}
@keyframes blackholeDrift{0%{transform:translate(-50%,-50%) scale(.92);opacity:.18}50%{transform:translate(-50%,-50%) scale(1.06);opacity:.36}100%{transform:translate(-50%,-50%) scale(1.18);opacity:0}}
#ui-root{
  position:absolute;
  inset:0;
  z-index:10;
  pointer-events:none;
}
#ui-root>*{
  pointer-events:auto;
}
`;

const style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);

function GlobalApp() {
  const settingsRef = useRef({ rotSpeed: 1, starDensity: 1, shootingSpeed: 1 });

  useEffect(() => {
    const handleWindowError = (event) => {
      AdminService.captureClientError({
        title: 'Window Error',
        message: event.message || 'Unhandled window error',
        level: 'error',
        context: 'window.onerror',
        stack: event.error?.stack || '',
      }).catch(() => {});
    };

    const handleUnhandledRejection = (event) => {
      const reason = event.reason;
      AdminService.captureClientError({
        title: 'Unhandled Promise Rejection',
        message: typeof reason === 'string' ? reason : reason?.message || 'Unhandled promise rejection',
        level: 'error',
        context: 'window.unhandledrejection',
        stack: reason?.stack || '',
      }).catch(() => {});
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <>
      <CanvasLayer settingsRef={settingsRef} />
      <div id="ui-root">
        <AuthProvider>
          <SpacePage settingsRef={settingsRef} />
        </AuthProvider>
      </div>
    </>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

createRoot(root).render(
  <React.StrictMode>
    <GlobalApp />
  </React.StrictMode>
);
