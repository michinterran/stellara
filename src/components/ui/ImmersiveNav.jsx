import React from 'react';
import { getLanguagePack } from '@config/stellara';
import { MyGalaxyPanel } from './panels/MyGalaxyPanel';
import { ClusterRecordsPanel } from './panels/ClusterRecordsPanel';
import { CosmicGatewayPanel } from './panels/CosmicGatewayPanel';
import { CosmicTuningPanel } from './panels/CosmicTuningPanel';

/**
 * ImmersiveNav
 * 좌측 사이드바 내비게이션 컴포넌트입니다.
 */
export function ImmersiveNav(props = {}) {
  if (!props) return null;
  const { 
    user, navOpen, navVisible, uiVisible,
    setNavOpen, setNavHover, setSubPanel, activeMenu, setActiveMenu,
    isGoogleConnected, isYTConnected, isPremium, planets, filtered, filterKey, setFilterKey,
    tuning, onTuningChange, language, onLanguageChange, authAction,
    handleLogin, handleConnectYT, handleLogout, onSaveGalaxyProfile, onSaveFeaturedGalaxy, onShareGalaxy, onGo, onHop, currentGalaxyId, discoverableGalaxies,
    onManualSync, syncMeta, quotaMeta, hoverMode, onHoverModeToggle, adminAccess, onOpenAdminCenter,
    runtimeSettings, onOpenPlanetStudio
  } = props;
  const [pending, setPending] = React.useState(null);
  const selectedMenu = activeMenu || 'galaxy';
  const pack = getLanguagePack(language);
  const [renderedMenu, setRenderedMenu] = React.useState(selectedMenu);
  const [panelVisible, setPanelVisible] = React.useState(true);
  const wrapAction = async (id, fn) => {
    if (pending || authAction) return;
    setPending(id);
    try {
      await fn();
    } catch (e) {
      console.error(`[UI_ERR] Action ${id} failed:`, e);
    } finally {
      setPending(null);
    }
  };

  React.useEffect(() => {
    if (navVisible && !activeMenu) setActiveMenu('galaxy');
  }, [activeMenu, navVisible, setActiveMenu]);

  React.useEffect(() => {
    if (selectedMenu === renderedMenu) return undefined;

    setPanelVisible(false);
    const swapTimer = window.setTimeout(() => {
      setRenderedMenu(selectedMenu);
      setPanelVisible(true);
    }, 180);

    return () => window.clearTimeout(swapTimer);
  }, [renderedMenu, selectedMenu]);

  const renderPanel = (menuId) => {
    if (menuId === 'records') {
      return (
        <ClusterRecordsPanel
          planets={planets}
          filtered={filtered}
          filterKey={filterKey}
          setFilterKey={setFilterKey}
          onGoPlanet={onGo}
          language={language}
        />
      );
    }

    if (menuId === 'portal') {
      return (
        <CosmicGatewayPanel
          compact
          currentGalaxyId={currentGalaxyId}
          onHopGalaxy={onHop}
          discoverableGalaxies={discoverableGalaxies}
          planets={planets}
          language={language}
          user={user}
        />
      );
    }

    if (menuId === 'tuning') {
      return (
        <CosmicTuningPanel
          compact
          tuning={tuning}
          onTuningChange={onTuningChange}
          language={language}
          onLanguageChange={onLanguageChange}
          isYTConnected={isYTConnected}
          isGoogleConnected={isGoogleConnected}
          onConnectYT={handleConnectYT}
          onLoginGoogle={handleLogin}
          authAction={authAction || pending}
          onManualSync={onManualSync}
          syncMeta={syncMeta}
          quotaMeta={quotaMeta}
          hoverMode={hoverMode}
          onHoverModeToggle={onHoverModeToggle}
        />
      );
    }

    return (
      <MyGalaxyPanel
        compact
        user={user}
        planets={planets}
        currentGalaxyId={currentGalaxyId}
        isYTConnected={isYTConnected}
        isGoogleConnected={isGoogleConnected}
        isPremium={isPremium}
        onConnectYT={handleConnectYT}
        onLoginGoogle={handleLogin}
        onSaveGalaxyProfile={onSaveGalaxyProfile}
        onSaveFeaturedGalaxy={onSaveFeaturedGalaxy}
        onShareGalaxy={onShareGalaxy}
        authAction={authAction || pending}
        language={language}
        onManualSync={onManualSync}
        syncMeta={syncMeta}
        quotaMeta={quotaMeta}
        adminAccess={adminAccess}
        onOpenAdminCenter={onOpenAdminCenter}
        runtimeSettings={runtimeSettings}
        onOpenPlanetStudio={onOpenPlanetStudio}
      />
    );
  };

  return (
    <div data-ui="nav" 
      onMouseEnter={() => setNavHover(true)} 
      onMouseLeave={() => setNavHover(false)}
      style={{ position: 'fixed', top: 0, left: 0, width: navVisible ? 'min(440px, 92vw)' : 60, height: '100vh', zIndex: 190, pointerEvents: 'auto' }}
    >
      {/* 햄버거 버튼 */}
      <button onClick={() => { console.log("[DEBUG] Sidebar Toggle Clicked"); setNavOpen(v => !v); }}
        style={{ position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', background: 'rgba(8,6,22,.82)', border: '1px solid rgba(123,112,224,.28)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all .25s', opacity: uiVisible ? 1 : 0.35, pointerEvents: 'auto' }}
      >
        {[0, 1, 2].map(i => (
          <span key={i} style={{ display: 'block', width: 14, height: 1.5, background: navOpen ? '#9B91FF' : 'rgba(155,145,255,.7)', borderRadius: 1, transform: navOpen ? (i === 0 ? 'rotate(45deg) translateY(3.5px)' : i === 2 ? 'rotate(-45deg) translateY(-3.5px)' : 'none') : 'none', opacity: navOpen && i === 1 ? 0 : 1, transition: 'all .25s' }} />
        ))}
      </button>

      {/* 메뉴 컨테이너 */}
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 'min(440px, 92vw)', background: 'rgba(3,1,16,.96)', borderRight: '1px solid rgba(123,112,224,.18)', backdropFilter: 'blur(28px)', display: 'flex', flexDirection: 'column', transform: navVisible ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform .38s cubic-bezier(.4, 0, .2, 1)', boxShadow: navVisible ? '8px 0 40px rgba(0,0,8,.6)' : 'none' }}>
        
        {/* 사용자 정보 */}
        <div style={{ padding: '24px 22px 14px', borderBottom: '1px solid rgba(123,112,224,.1)', flexShrink: 0 }}>
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(155,145,255,.3)' }} />
                ) : (
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #3D1A7A, #1A0A3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, border: '1px solid rgba(123,112,224,.2)', flexShrink: 0 }}>
                    ◉
                  </div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#F7F3FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.displayName}</div>
                  <div style={{ fontSize: 10, color: isPremium ? '#FFE38A' : 'rgba(215,208,255,.62)', marginTop: 1 }}>{isPremium ? '⭐ Extended Discovery' : 'Discovery Layer'}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button 
                onClick={() => wrapAction('login', handleLogin)} 
                disabled={pending === 'login' || Boolean(authAction)}
                style={{ width: '100%', padding: '9px 14px', borderRadius: 10, cursor: pending === 'login' ? 'wait' : 'pointer', background: 'rgba(66,133,244,.18)', border: '1px solid rgba(66,133,244,.35)', color: 'rgba(200,210,255,.85)', fontSize: 12, fontFamily: 'inherit', letterSpacing: '.04em', textAlign: 'left', opacity: pending === 'login' ? 0.6 : 1 }}
              >
                {pending === 'login' || authAction === 'login' ? pack.nav.loggingIn : pack.nav.googleStart}
              </button>
              <div style={{ fontSize: 10, color: 'rgba(214,208,255,.56)', lineHeight: 1.6, padding: '2px 2px 0' }}>
                {pack.nav.youtubeNote} {pack.stellara.serviceNote}
              </div>
            </div>
          )}
        </div>

        {/* 탭 메뉴 */}
        <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(123,112,224,.08)', flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            {pack.menus.map(item => {
              const isActive = selectedMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setSubPanel?.(null); setActiveMenu(item.id); }}
                  style={{
                    minHeight: 76,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 14,
                    border: `1px solid ${isActive ? 'rgba(155,145,255,.42)' : 'rgba(123,112,224,.11)'}`,
                    background: isActive ? 'rgba(83,74,183,.24)' : 'rgba(8,6,24,.55)',
                    color: isActive ? '#FAF7FF' : 'rgba(223,217,255,.72)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all .2s ease',
                  }}
                >
                  <span style={{ fontSize: 18, textShadow: isActive ? '0 0 10px rgba(155,145,255,.55)' : 'none', flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                    <span style={{ fontSize: 11, letterSpacing: '.03em', whiteSpace: 'nowrap', color: isActive ? '#FFF9F2' : 'rgba(245,241,255,.88)' }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: 9, lineHeight: 1.45, color: isActive ? 'rgba(255,232,214,.72)' : 'rgba(199,193,235,.56)', textAlign: 'left' }}>
                      {item.sub}
                    </span>
                  </span>
                </button>
              );
          })}
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 20px' }}>
          <div
            style={{
              opacity: panelVisible ? 1 : 0,
              transform: panelVisible ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity .22s ease, transform .22s ease',
            }}
          >
            {renderPanel(renderedMenu)}
          </div>
            {user && (
              <button 
                onClick={() => wrapAction('logout', handleLogout)} 
                disabled={pending === 'logout'}
                style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '14px 22px', background: 'none', border: 'none', cursor: pending === 'logout' ? 'wait' : 'pointer', textAlign: 'left', fontFamily: 'inherit', pointerEvents: 'auto', opacity: pending === 'logout' ? 0.5 : 1 }}
              >
                <span style={{ fontSize: 17, color: 'rgba(255,80,80,.5)', flexShrink: 0, width: 20, textAlign: 'center' }}>◌</span>
                <span style={{ fontSize: 12, color: 'rgba(255,156,156,.86)', letterSpacing: '.06em' }}>
                  {pending === 'logout' ? pack.nav.loggingOut : pack.nav.logout}
                </span>
              </button>
            )}
            <div style={{ padding: '14px 22px' }}>
              <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(123,112,224,.12), transparent)', marginBottom: 12 }} />
              <div style={{ fontSize: 9, letterSpacing: '.2em', color: 'rgba(205,198,255,.38)', textTransform: 'uppercase' }}>Stellara · Discovery Interface</div>
            </div>
          </div>
      </div>
    </div>
  );
}
