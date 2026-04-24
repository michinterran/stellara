import React from 'react';
import { TopBar } from './TopBar';
import { Hero } from './Hero';
import { PlanetHUD } from './PlanetHUD';
import { PlayerControls } from './PlayerControls';
import { ImmersiveNav } from './ImmersiveNav';
import { Toasts } from './Toasts';
import { FadePresence } from './FadePresence';
import { CosmicTransitionOverlay } from './CosmicTransitionOverlay';

/**
 * OverlayLayout
 * 3D 캔버스 위에 겹쳐지는 모든 UI 요소를 배치하는 최상위 UI 컨테이너입니다.
 */
export function OverlayLayout(props = {}) {
  if (!props) return null;
  const {
    // Global State
    user, isGoogleConnected, isYTConnected, isPremium,
    // Nav State
    navOpen, setNavOpen, navHover, setNavHover, navVisible, uiVisible,
    // SubPanel State
    subPanel, setSubPanel, filterKey, setFilterKey, activeMenu, setActiveMenu, tuning, onTuningChange,
    language, onLanguageChange, authAction,
    // Page/Context State
    planet, activePlanet, player, toasts, refreshing,
    // Interaction Handlers
    onLoginGoogle, onLoginYT, onLogout, onSearch, onChip, 
    onTrack, onRefresh, onCloseHUD, onSaveGalaxyProfile, onSaveFeaturedGalaxy, onLikePlanet, onSavePlanet, onSharePlanet, onShareGalaxy, onGoPlanet, onHopGalaxy,
    onTogglePlay, onPrev, onNext, onShuffle, onRepeat, onVol, onSeek,
    // Refs
    mood, setMood, planets, filtered, settingsRef, currentGalaxyId, discoverableGalaxies,
    onManualSync, syncMeta, quotaMeta, hoverMode, onHoverModeToggle, adminAccess, onOpenAdminCenter, rollingSignal,
    runtimeSettings, onOpenPlanetStudio
  } = props;
  return (
    <div 
      id="ui-overlay"
      style={{
        position: 'fixed', inset: 0, zIndex: 100, pointerEvents: 'none',
        display: 'flex', flexDirection: 'column'
      }}
    >
      {/* 1. 상단 정보 바 */}
      {uiVisible && (
        <TopBar 
          user={user}
          language={language}
          isGoogleConnected={isGoogleConnected} 
          isYTConnected={isYTConnected} 
          onLoginGoogle={onLoginGoogle} 
          onLoginYT={onLoginYT}
          onLogout={onLogout}
        />
      )}

      {/* 2. 중앙 히어로 (홈 상태일 때만) */}
      <FadePresence show={!activePlanet && uiVisible} duration={520}>
        <Hero
          mood={mood}
          setMood={setMood}
          onSearch={onSearch}
          onChip={onChip}
          language={language}
          rollingSignal={rollingSignal}
        />
      </FadePresence>

      {/* 3. 행성 상세 정보 (HUD) */}
      <PlanetHUD 
        planet={activePlanet} 
        player={player}
        isPremium={isPremium}
        refreshing={refreshing}
        language={language}
        engagement={props.engagement}
        onTrack={onTrack}
        onRefresh={onRefresh}
        onClose={onCloseHUD}
        onLikePlanet={onLikePlanet}
        onSavePlanet={onSavePlanet}
        onSharePlanet={onSharePlanet}
      />

      {/* 4. 하단 재생 바 */}
      {uiVisible && (
        <PlayerControls 
          player={player}
          active={activePlanet}
          onTogglePlay={onTogglePlay}
          onPrev={onPrev}
          onNext={onNext}
          onShuffle={onShuffle}
          onRepeat={onRepeat}
          onVol={onVol}
          onSeek={onSeek}
          language={language}
          onFocusPlanet={props.onFocusPlanet}
        />
      )}

      {/* 5. 몰입형 내비게이션 (사이드바) */}
        <ImmersiveNav 
        user={user}
        navOpen={navOpen}
        navVisible={navVisible}
        uiVisible={uiVisible}
        subPanel={subPanel}
        activeMenu={activeMenu}
        setNavOpen={setNavOpen}
        setNavHover={setNavHover}
        setSubPanel={setSubPanel}
        setActiveMenu={setActiveMenu}
        isYTConnected={isYTConnected}
        isPremium={isPremium}
        planets={planets}
        filtered={filtered}
        filterKey={filterKey}
        setFilterKey={setFilterKey}
        isGoogleConnected={isGoogleConnected}
        tuning={tuning}
        onTuningChange={onTuningChange}
        language={language}
        onLanguageChange={onLanguageChange}
        authAction={authAction}
        handleLogin={onLoginGoogle}
        handleConnectYT={onLoginYT}
        handleLogout={onLogout}
        onSaveGalaxyProfile={onSaveGalaxyProfile}
        onSaveFeaturedGalaxy={onSaveFeaturedGalaxy}
        onShareGalaxy={onShareGalaxy}
        onGo={onGoPlanet}
        onHop={onHopGalaxy}
        currentGalaxyId={currentGalaxyId}
        discoverableGalaxies={discoverableGalaxies}
        settingsRef={settingsRef}
        onManualSync={onManualSync}
        syncMeta={syncMeta}
        quotaMeta={quotaMeta}
        hoverMode={hoverMode}
        onHoverModeToggle={onHoverModeToggle}
        adminAccess={adminAccess}
        onOpenAdminCenter={onOpenAdminCenter}
        runtimeSettings={runtimeSettings}
        onOpenPlanetStudio={onOpenPlanetStudio}
      />

      {/* 6. 알림 (Toasts) */}
      <Toasts toasts={toasts} />

      <CosmicTransitionOverlay effect={props.cosmicTransition} />
    </div>
  );
}
