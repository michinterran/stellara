import React from 'react';

const DEFAULT_DURATION = 420;

export function FadePresence({ show, children, duration = DEFAULT_DURATION, style }) {
  const [shouldRender, setShouldRender] = React.useState(show);

  React.useEffect(() => {
    if (show) {
      setShouldRender(true);
      return undefined;
    }

    const timer = window.setTimeout(() => setShouldRender(false), duration);
    return () => window.clearTimeout(timer);
  }, [duration, show]);

  if (!shouldRender) return null;

  return (
    <div
      style={{
        opacity: show ? 1 : 0,
        transition: `opacity ${duration}ms ease`,
        pointerEvents: show ? 'auto' : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
