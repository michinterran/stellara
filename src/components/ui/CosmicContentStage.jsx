import React, { useEffect, useMemo, useState } from 'react';
import { MyGalaxyPanel } from './panels/MyGalaxyPanel';
import { ClusterRecordsPanel } from './panels/ClusterRecordsPanel';
import { CosmicGatewayPanel } from './panels/CosmicGatewayPanel';
import { CosmicTuningPanel } from './panels/CosmicTuningPanel';

const TRANSITION_MS = 300;

const panelStyle = {
  width: 'min(680px, 82vw)',
  maxHeight: 'min(70vh, 720px)',
  overflowY: 'auto',
  padding: '28px',
  borderRadius: 28,
  background:
    'linear-gradient(145deg, rgba(7,5,24,.9), rgba(16,10,42,.72) 55%, rgba(3,1,16,.9))',
  border: '1px solid rgba(155,145,255,.22)',
  boxShadow: '0 28px 90px rgba(0,0,8,.48), inset 0 1px 0 rgba(255,255,255,.04)',
  backdropFilter: 'blur(28px)',
  pointerEvents: 'auto',
};

export function CosmicContentStage({
  activeMenu,
  planets,
  filtered,
  filterKey,
  setFilterKey,
  isYTConnected,
  isGoogleConnected,
  isPremium,
  user,
  currentGalaxyId,
  tuning,
  onTuningChange,
  authAction,
  onConnectYT,
  onLoginGoogle,
  onGoPlanet,
  onHopGalaxy,
}) {
  const [renderedMenu, setRenderedMenu] = useState(activeMenu);
  const [visible, setVisible] = useState(Boolean(activeMenu));

  useEffect(() => {
    if (activeMenu) {
      setVisible(false);
      const timer = window.setTimeout(() => {
        setRenderedMenu(activeMenu);
        setVisible(true);
      }, renderedMenu ? TRANSITION_MS : 0);

      return () => window.clearTimeout(timer);
    }

    setVisible(false);
    const timer = window.setTimeout(() => setRenderedMenu(null), TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [activeMenu, renderedMenu]);

  const content = useMemo(() => {
    if (renderedMenu === 'galaxy') {
      return (
        <MyGalaxyPanel
          user={user}
          planets={planets}
          currentGalaxyId={currentGalaxyId}
          isYTConnected={isYTConnected}
          isGoogleConnected={isGoogleConnected}
          isPremium={isPremium}
          onConnectYT={onConnectYT}
          onLoginGoogle={onLoginGoogle}
          authAction={authAction}
        />
      );
    }

    if (renderedMenu === 'records') {
      return (
        <ClusterRecordsPanel
          planets={planets}
          filtered={filtered}
          filterKey={filterKey}
          setFilterKey={setFilterKey}
          onGoPlanet={onGoPlanet}
        />
      );
    }

    if (renderedMenu === 'portal') {
      return <CosmicGatewayPanel currentGalaxyId={currentGalaxyId} onHopGalaxy={onHopGalaxy} />;
    }

    if (renderedMenu === 'tuning') {
      return (
        <CosmicTuningPanel
          tuning={tuning}
          onTuningChange={onTuningChange}
          isYTConnected={isYTConnected}
          isGoogleConnected={isGoogleConnected}
          onConnectYT={onConnectYT}
          onLoginGoogle={onLoginGoogle}
          authAction={authAction}
        />
      );
    }

    return null;
  }, [
    currentGalaxyId,
    filterKey,
    filtered,
    isGoogleConnected,
    isPremium,
    isYTConnected,
    onConnectYT,
    onGoPlanet,
    onHopGalaxy,
    onLoginGoogle,
    onTuningChange,
    authAction,
    planets,
    renderedMenu,
    setFilterKey,
    tuning,
    user,
  ]);

  if (!renderedMenu) return null;

  return (
    <section
      aria-live="polite"
      style={{
        position: 'fixed',
        top: '50%',
        left: 'calc(50% - 120px)',
        transform: `translate(-50%, -50%) translateY(${visible ? 0 : 10}px)`,
        opacity: visible ? 1 : 0,
        transition: `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`,
        zIndex: 78,
        fontFamily: 'inherit',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div style={panelStyle}>{content}</div>
    </section>
  );
}
