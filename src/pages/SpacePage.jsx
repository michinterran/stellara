import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useAuth } from '@hooks/useAuth';
import { OFFICIAL_GALAXY_ID, useGalaxyNavigation } from '@hooks/useGalaxyNavigation';
import { MusicServiceFactory } from '@utils/MusicServiceFactory';
import { YT_API_KEY, YT_ERRORS } from '@utils/youtube';
import {
  clearCachedLibraryOrbit,
  getCachedLibraryOrbit,
  getQuotaBlockInfo,
  setCachedLibraryOrbit,
} from '@utils/youtubeCache';
import { events } from '@utils/StellaraEvents';
import { GalaxyService } from '@services/GalaxyService';
import { SocialGalaxyService } from '@services/SocialGalaxyService';
import { SocialEngagementService } from '@services/SocialEngagementService';
import { AdminService } from '@services/AdminService';
import { missingFirebaseConfig } from '@config/firebase';
import {
  DISCOVERY_QUERIES,
  getLanguagePack,
  getLocalizedPlanetFlavor,
  getLocalizedPlanetName,
  WANDERING_SIGNAL_QUERIES,
  getCuratedGalaxy,
  withIndexes,
} from '@config/stellara';
import { OverlayLayout } from '@components/ui/OverlayLayout';
import { FadePresence } from '@components/ui/FadePresence';
import { ArrivalBriefingOverlay } from '@components/ui/ArrivalBriefingOverlay';
import { CurationSignalCard } from '@components/ui/CurationSignalCard';
import { CommandCenterModal } from '@components/ui/CommandCenterModal';
import { PlanetStudioModal } from '@components/ui/PlanetStudioModal';

const PLAYER_INITIAL = {
  list: [],
  idx: 0,
  playing: false,
  shuffle: false,
  repeat: false,
  elapsed: 0,
  total: 0,
  pid: null,
  vol: 80,
};

const COSMIC_TUNING_INITIAL = {
  planetSpin: 10,
  cameraDrift: 10,
  starlight: 100,
  serendipity: 60,
  orbitRange: 50,
};

const HOVER_MODE_INITIAL = {
  enabled: true,
  active: false,
  targetLabel: '',
  targetKind: null,
  reason: '',
};

const LANGUAGE_STORAGE_KEY = 'stellara_language';
const LIVE_POPUP_STORAGE_KEY = 'stellara_seen_live_popup';
function upsertUserPlanets(planets, createdPlanets) {
  const base = planets.filter((planet) => planet.type !== 'user');
  return [...base, ...createdPlanets];
}

function normalizeIntentText(value = '') {
  return value.toLowerCase().trim();
}

function scoreTextMatch(text = '', query = '') {
  if (!text || !query) return 0;
  const normalizedText = normalizeIntentText(text);
  const normalizedQuery = normalizeIntentText(query);
  if (!normalizedText || !normalizedQuery) return 0;
  if (normalizedText.includes(normalizedQuery)) return 6;

  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  return queryTokens.reduce((score, token) => {
    if (token.length < 2) return score;
    return normalizedText.includes(token) ? score + 2 : score;
  }, 0);
}

function scorePlanetIntent(planet, query) {
  const fields = [
    planet.name,
    planet.artist,
    planet.mood,
    planet.genre,
    ...(planet.tracks ?? []).slice(0, 4).flatMap((track) => [track.title, track.artist]),
  ];
  return fields.reduce((score, field) => score + scoreTextMatch(field, query), 0);
}

function scoreGalaxyIntent(galaxy, query) {
  const fields = [
    galaxy.title,
    galaxy.name,
    galaxy.displayName,
    galaxy.ownerLabel,
    galaxy.description,
    ...(galaxy.tags ?? []),
  ];
  return fields.reduce((score, field) => score + scoreTextMatch(field, query), 0);
}

function tokenizeOrbitValue(value = '') {
  return String(value)
    .toLowerCase()
    .split(/[^a-z0-9가-힣]+/)
    .filter((token) => token.length > 1);
}

function collectOrbitSignals({ planets = [], user } = {}) {
  const tokens = new Set();
  const pushValue = (value) => tokenizeOrbitValue(value).forEach((token) => tokens.add(token));

  planets.slice(0, 18).forEach((planet) => {
    pushValue(planet.name);
    pushValue(planet.artist);
    pushValue(planet.mood);
    pushValue(planet.genre);
    (planet.tracks ?? []).slice(0, 3).forEach((track) => {
      pushValue(track.title);
      pushValue(track.artist);
    });
  });

  (user?.galaxyProfile?.tags ?? []).forEach(pushValue);
  pushValue(user?.galaxyProfile?.title);
  pushValue(user?.galaxyProfile?.description);

  return [...tokens];
}

function getPersonalizedGalaxyScore(galaxy, orbitSignals = []) {
  const searchable = [
    galaxy.title,
    galaxy.name,
    galaxy.description,
    galaxy.ownerLabel,
    galaxy.promotedBy,
    galaxy.spotlightText,
    ...(galaxy.tags ?? []),
    ...(galaxy.audienceSignals ?? []),
    ...(galaxy.featuredPlanets ?? []).flatMap((planet) => [planet.name, planet.artist, planet.mood, planet.genre]),
    ...(galaxy.planets ?? []).slice(0, 4).flatMap((planet) => [planet.name, planet.artist, planet.mood, planet.genre]),
  ].join(' ').toLowerCase();

  const signalScore = orbitSignals.reduce((score, signal) => (
    signal && searchable.includes(signal) ? score + 4 : score
  ), 0);

  return signalScore + (galaxy.stats?.likes ?? 0) * 3 + (galaxy.stats?.visits ?? 0) + (galaxy.featuredOrder ? Math.max(0, 12 - galaxy.featuredOrder) : 0);
}

function getGalaxyMatchReason(galaxy, orbitSignals = [], language = 'ko') {
  const signalSources = [
    ...(galaxy.tags ?? []),
    ...(galaxy.audienceSignals ?? []),
    ...(galaxy.featuredPlanets ?? []).flatMap((planet) => [planet.mood, planet.genre, planet.artist, planet.name]),
    ...(galaxy.planets ?? []).slice(0, 4).flatMap((planet) => [planet.mood, planet.genre, planet.artist, planet.name]),
  ]
    .map((value) => String(value || '').toLowerCase())
    .filter(Boolean);

  const matched = orbitSignals.find((signal) => signalSources.some((entry) => entry.includes(signal)));
  if (matched) {
    return language === 'en'
      ? `Close to your current orbit through "${matched}".`
      : `"${matched}" 신호가 현재 궤도와 가깝습니다.`;
  }

  if (galaxy?.promotionType) {
    return language === 'en'
      ? 'A promoted route is being surfaced near your current orbit.'
      : '현재 궤도 가까이에서 프로모션 항로가 먼저 포착되었습니다.';
  }

  return language === 'en'
    ? 'This listener galaxy is drifting near your current taste field.'
    : '이 청취 은하가 현재 취향 성역 가까이 떠오르고 있습니다.';
}

function getGalaxyDistanceLabel(galaxy, language = 'ko') {
  const band = galaxy?.stageBand || 'far';
  const copy = {
    ko: {
      near: '가까운 궤도',
      mid: '중간 항로',
      far: '원거리 항로',
      promotion: '프로모션 외곽 항로',
    },
    en: {
      near: 'Close orbit',
      mid: 'Mid route',
      far: 'Outer route',
      promotion: 'Promoted outer route',
    },
  };

  return copy[language]?.[band] ?? copy.ko[band] ?? null;
}

function shouldHopGalaxy(query) {
  const keywords = ['다른', '남의', '공개', '은하', '갤럭시', 'portal', 'galaxy', 'someone', 'stranger', 'new orbit', '낯선'];
  return keywords.some((keyword) => query.includes(keyword));
}

function shouldUseBlackhole(query) {
  const keywords = ['추천', '큐레이션', 'blackhole', '블랙홀', 'random', 'serendipity', '우연', '맡겨', 'curate'];
  return keywords.some((keyword) => query.includes(keyword));
}

function getGalaxyStageOneScore(galaxy) {
  const promotionBoost = galaxy?.isFeatured || galaxy?.promotionType ? 1000 : 0;
  const promotionTypeBoost = galaxy?.promotionType === 'brand'
    ? 140
    : galaxy?.promotionType === 'campaign'
      ? 120
      : galaxy?.promotionType === 'label'
        ? 110
        : 0;
  const socialBoost = (galaxy?.stats?.likes ?? 0) * 3 + (galaxy?.stats?.visits ?? 0);
  const planetBoost = galaxy?.metrics?.publicPlanetCount ?? galaxy?.planets?.length ?? 0;
  return promotionBoost + promotionTypeBoost + socialBoost + planetBoost;
}

function getInitialLanguage() {
  if (typeof window === 'undefined') return 'ko';
  const sessionValue = window.sessionStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (sessionValue) return sessionValue;
  const legacyValue = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (legacyValue) {
    window.sessionStorage.setItem(LANGUAGE_STORAGE_KEY, legacyValue);
    window.localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    return legacyValue;
  }
  return 'ko';
}

function playerReducer(state, action) {
  switch (action.type) {
    case 'LOAD':
      return {
        ...state,
        list: action.list,
        idx: action.idx ?? 0,
        pid: action.pid,
        elapsed: 0,
        total: 0,
        playing: action.list.length > 0,
      };
    case 'IDX':
      return { ...state, idx: action.idx, elapsed: 0 };
    case 'PLAY':
      return { ...state, playing: true };
    case 'PAUSE':
      return { ...state, playing: false };
    case 'PROG':
      return { ...state, elapsed: action.e, total: action.t };
    case 'SHUF':
      return { ...state, shuffle: !state.shuffle };
    case 'REP':
      return { ...state, repeat: !state.repeat };
    case 'VOL':
      return { ...state, vol: action.v };
    case 'RESET':
      return PLAYER_INITIAL;
    default:
      return state;
  }
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Set());
  const activeMessagesRef = useRef(new Set());

  useEffect(() => () => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  const toast = useCallback((message, ms = 2800) => {
    if (activeMessagesRef.current.has(message)) return;
    activeMessagesRef.current.add(message);
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, msg: message }]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
      activeMessagesRef.current.delete(message);
      timersRef.current.delete(timer);
    }, ms);
    timersRef.current.add(timer);
  }, []);

  return { toasts, toast };
}

function createOfficialGalaxyPlanets() {
  return withIndexes(getCuratedGalaxy('stellara_official')?.planets ?? []);
}

function getYouTubePlaylistErrorMessage(error, language = 'ko') {
  const messages = getLanguagePack(language).system.youtubeErrors;
  if (error?.code === YT_ERRORS.AUTH_EXPIRED) {
    return messages.authExpired;
  }
  if (error?.code === YT_ERRORS.PERMISSION) {
    return messages.permission;
  }
  if (error?.code === YT_ERRORS.QUOTA) {
    return messages.quota;
  }
  if (error?.code === YT_ERRORS.API_DISABLED) {
    return messages.apiDisabled;
  }
  if (error?.code === YT_ERRORS.CHANNEL) {
    return messages.channel;
  }
  if (error?.code === YT_ERRORS.NO_TOKEN) {
    return messages.noToken;
  }
  return messages.fallback;
}

function getAuthMessage(message, language = 'ko') {
  if (!message || language === 'ko') return message;
  if (message.includes('이미 인증 창이 열려 있습니다')) {
    return 'A sign-in window is already open.';
  }
  if (message.includes('YouTube 권한 토큰을 받지 못했습니다')) {
    return 'We could not receive the YouTube permission token. Please allow access and try again.';
  }
  if (message.includes('YouTube 권한 허용이 필요합니다')) {
    return 'YouTube permission is required to import playlists.';
  }
  if (message.includes('팝업이 차단됐습니다')) {
    return 'The sign-in popup was blocked. Please allow popups in your browser settings.';
  }
  if (message.includes('네트워크 오류')) {
    return 'A network error occurred. Please try again.';
  }
  if (message.includes('Firebase 설정 누락')) {
    return 'Firebase configuration is missing. Please check the Vercel environment variables.';
  }
  if (message.includes('Firebase 내부 오류')) {
    return 'Firebase reported an internal error. Please check authorized domains and Vercel Firebase environment variables.';
  }
  if (message.includes('로그인 오류')) {
    return message.replace('로그인 오류', 'Sign-in error');
  }
  return message;
}

function formatSyncLabel(savedAt, language = 'ko') {
  if (!savedAt) return null;
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return null;
  const formatted = new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
  return language === 'en'
    ? `Last sync ${formatted}`
    : `마지막 동기화 ${formatted}`;
}

function buildBlackholeReason(planet, query, language = 'ko') {
  const mood = planet?.mood || planet?.genre || planet?.artist || planet?.name;
  if (language === 'en') {
    if (query) {
      return `"${query}" drifted closest to ${mood}.`;
    }
    return `${mood} answered the curator first.`;
  }
  if (query) {
    return `"${query}" 신호가 ${mood}에 가장 가까웠습니다.`;
  }
  return `${mood}의 궤도가 먼저 응답했습니다.`;
}

function buildIntentResponse({ query, planet, galaxy, language = 'ko', type = 'planet' }) {
  if (language === 'en') {
    if (type === 'galaxy') {
      return `${galaxy?.title || galaxy?.name} opened a nearby route.`;
    }
    return `${planet?.name} moved closest to your signal.`;
  }
  if (type === 'galaxy') {
    return `${galaxy?.title || galaxy?.name} 쪽으로 가까운 항로가 열렸습니다.`;
  }
  return `${planet?.name} 쪽 궤도가 지금 신호에 가장 가까웠습니다.`;
}

function formatGalaxyHoverStats(galaxy, language = 'ko') {
  if (!galaxy) return null;
  const planetCount = galaxy?.metrics?.publicPlanetCount ?? galaxy?.planets?.length ?? 0;
  const visits = galaxy?.stats?.visits ?? 0;
  const likes = galaxy?.stats?.likes ?? 0;

  if (language === 'en') {
    return `${planetCount} planets · ${visits} visits · ${likes} likes`;
  }
  return `${planetCount} 행성 · ${visits} 방문 · ${likes} 좋아요`;
}

function getGalaxyBand(index, galaxy) {
  if (galaxy?.isFeatured || galaxy?.promotionType) return 'promotion';
  if (index < 4) return 'near';
  if (index < 9) return 'mid';
  return 'far';
}

function getHoverModeDelayMs(serendipity = 60) {
  return Math.max(5200, 11800 - Math.round(serendipity * 36));
}

function getHoverModePanelCopy(language = 'ko') {
  return language === 'en'
    ? {
        kicker: 'Hovering Mode',
        active: 'Auto-drifting through nearby music bodies',
        inactive: 'Paused until music resumes or the interface clears',
        off: 'Hovering mode is currently off',
        planetTrail: 'Skimming a nearby planet',
        galaxyTrail: 'Passing a nearby galaxy route',
        toggleOn: 'On',
        toggleOff: 'Off',
      }
    : {
        kicker: '호버링 모드',
        active: '가까운 음악 천체를 따라 자동 유영 중',
        inactive: '음악 재생이 돌아오거나 화면이 비면 다시 시작됩니다',
        off: '호버링 모드가 현재 꺼져 있습니다',
        planetTrail: '가까운 행성 곁을 스치고 있습니다',
        galaxyTrail: '근처 은하 항로 옆을 지나고 있습니다',
        toggleOn: '켜짐',
        toggleOff: '꺼짐',
      };
}

function buildHoverDiscoverySignal({ target, language = 'ko', kind = 'planet', reason = '' }) {
  if (!target) return null;

  if (kind === 'galaxy') {
    return {
      kicker: language === 'en' ? 'Hovering Mode' : '호버링 모드',
      title: target.title || target.displayName || target.name,
      subtitle: language === 'en' ? 'Passing route' : '스쳐 가는 항로',
      description: reason || getGalaxyMatchReason(target, [], language),
      compact: true,
      duration: 2200,
    };
  }

  return {
    kicker: language === 'en' ? 'Hovering Mode' : '호버링 모드',
    title: target.name,
    subtitle: language === 'en' ? 'Passing planet' : '스쳐 가는 행성',
    description: language === 'en'
      ? `${target.mood || target.genre || target.artist || 'A quiet signal'} is drifting past your current listening field.`
      : `${target.mood || target.genre || target.artist || '조용한 신호'} 결의 행성이 현재 청취장 곁을 지나갑니다.`,
    compact: true,
    duration: 2200,
  };
}

export default function SpacePage({ settingsRef }) {
  const {
    user,
    isLoading,
    isGoogleConnected,
    isYTConnected,
    isPremium,
    login,
    connectYouTube,
    logout,
    clearYTState,
    updateGalaxyProfile,
  } = useAuth();

  const provider = MusicServiceFactory.getProvider('YOUTUBE');
  const [planets, setPlanets] = useState([]);
  const [activePlanet, setActivePlanet] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const [navHover, setNavHover] = useState(false);
  const [subPanel, setSubPanel] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [filterKey, setFilterKey] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [mood, setMood] = useState('');
  const [language, setLanguage] = useState(getInitialLanguage);
  const [cosmicTuning, setCosmicTuning] = useState(COSMIC_TUNING_INITIAL);
  const [authAction, setAuthAction] = useState(null);
  const [uiVisible, setUiVisible] = useState(true);
  const [hoverPlanet, setHoverPlanet] = useState(null);
  const [hoverGalaxy, setHoverGalaxy] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [isHydratingLibrary, setIsHydratingLibrary] = useState(false);
  const [discoverableGalaxies, setDiscoverableGalaxies] = useState([]);
  const [cosmicTransition, setCosmicTransition] = useState({ active: false, type: null });
  const [arrivalBriefing, setArrivalBriefing] = useState(null);
  const [curationSignal, setCurationSignal] = useState(null);
  const [rollingSignal, setRollingSignal] = useState(null);
  const [syncMeta, setSyncMeta] = useState({ savedAt: null, label: null });
  const [quotaMeta, setQuotaMeta] = useState({ active: false, blockedUntil: null });
  const [planetEngagement, setPlanetEngagement] = useState({
    likes: 0,
    saves: 0,
    liked: false,
    saved: false,
  });
  const [adminAccess, setAdminAccess] = useState(() => AdminService.getLocalAccess());
  const [adminCenterOpen, setAdminCenterOpen] = useState(false);
  const [adminSnapshot, setAdminSnapshot] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSavingKey, setAdminSavingKey] = useState(null);
  const [liveSignals, setLiveSignals] = useState({ popup: null, rollingSignals: [] });
  const [hoverMode, setHoverMode] = useState(HOVER_MODE_INITIAL);
  const [hoverModeCooldownUntil, setHoverModeCooldownUntil] = useState(0);
  const [runtimeSettings, setRuntimeSettings] = useState(() => GalaxyService.getDefaultRuntimeSettings());
  const [planetStudioOpen, setPlanetStudioOpen] = useState(false);
  const [planetStudioSaving, setPlanetStudioSaving] = useState(false);
  const [planetStudioTemplate, setPlanetStudioTemplate] = useState(null);
  const [player, dispatch] = useReducer(playerReducer, PLAYER_INITIAL);
  const { toasts, toast } = useToast();
  const pack = getLanguagePack(language);
  const setProfileMiniOpen = useCallback(() => {}, []);

  const playerRef = useRef(player);
  const isPremiumRef = useRef(isPremium);
  const planetsRef = useRef([]);
  const idleTimerRef = useRef(null);
  const galaxyRequestRef = useRef(0);
  const playlistHydrationRef = useRef(false);
  const hydratedTokenRef = useRef(null);
  const failedPlaylistTokenRef = useRef(null);
  const initialGalaxyLoadedRef = useRef(false);
  const hoverModeTimerRef = useRef(null);
  const hoverModeCursorRef = useRef(0);
  const rollingSignalTimerRef = useRef(null);
  const rollingSignalCursorRef = useRef(0);
  const popupShownRef = useRef(null);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    isPremiumRef.current = isPremium;
  }, [isPremium]);

  useEffect(() => {
    window.sessionStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => () => {
    window.clearTimeout(hoverModeTimerRef.current);
    window.clearTimeout(rollingSignalTimerRef.current);
  }, []);

  const refreshSyncAndQuotaMeta = useCallback(() => {
    const cachedLibrary = getCachedLibraryOrbit(user?.uid);
    setSyncMeta({
      savedAt: cachedLibrary?.savedAt ?? null,
      label: formatSyncLabel(cachedLibrary?.savedAt, language),
      fresh: Boolean(cachedLibrary?.fresh),
    });

    const quotaInfo = getQuotaBlockInfo();
    setQuotaMeta(quotaInfo);
  }, [language, user?.uid]);

  useEffect(() => {
    refreshSyncAndQuotaMeta();
  }, [refreshSyncAndQuotaMeta]);

  useEffect(() => {
    if (!missingFirebaseConfig.length) return;
    toast(
      language === 'en'
        ? `Firebase setup is incomplete: ${missingFirebaseConfig.join(', ')}. Stellara is running in exploration-only mode.`
        : `Firebase 설정이 아직 비어 있습니다: ${missingFirebaseConfig.join(', ')}. 지금은 탐험 전용 모드로 실행됩니다.`,
      5600
    );
  }, [language, toast]);

  useEffect(() => {
    planetsRef.current = planets;
  }, [planets]);

  useEffect(() => {
    if (!user?.uid || user?.galaxyProfile?.visibility !== 'public') return;
    SocialGalaxyService.syncPublicGalaxy(user, user.galaxyProfile, planets).catch((error) => {
      console.warn('[SpacePage] Failed to sync public galaxy index:', error);
    });
  }, [planets, user]);

  useEffect(() => {
    AdminService.fetchAdminAccess(user || {})
      .then((nextAccess) => setAdminAccess(nextAccess))
      .catch((error) => {
        console.warn('[SpacePage] Failed to fetch admin access:', error);
        setAdminAccess(AdminService.getLocalAccess(user || {}));
      });
  }, [user]);

  const refreshDiscoverableGalaxies = useCallback(() => {
    SocialGalaxyService.fetchDiscoverableGalaxies({ excludeOwnerId: user?.uid })
      .then((galaxies) => setDiscoverableGalaxies(galaxies))
      .catch((error) => {
        console.warn('[SpacePage] Failed to fetch discoverable galaxies:', error);
        setDiscoverableGalaxies([]);
      });
  }, [user?.uid]);

  const refreshAdminSnapshot = useCallback(async () => {
    if (!adminAccess?.isApprovedAdmin) return;
    setAdminLoading(true);
    try {
      const snapshot = await AdminService.fetchCommandCenterSnapshot(user || {});
      setAdminSnapshot(snapshot);
    } finally {
      setAdminLoading(false);
    }
  }, [adminAccess?.isApprovedAdmin, user]);

  const refreshLiveSignals = useCallback(async () => {
    try {
      const signals = await AdminService.fetchLiveSignals();
      setLiveSignals(signals);
    } catch (error) {
      console.warn('[SpacePage] Failed to fetch live signals:', error);
      setLiveSignals({ popup: null, rollingSignals: [] });
    }
  }, []);

  useEffect(() => {
    if (!adminCenterOpen || !adminAccess?.isApprovedAdmin) return;
    refreshAdminSnapshot();
  }, [adminAccess?.isApprovedAdmin, adminCenterOpen, refreshAdminSnapshot]);

  useEffect(() => {
    refreshDiscoverableGalaxies();
  }, [refreshDiscoverableGalaxies]);

  useEffect(() => {
    refreshLiveSignals();
  }, [refreshLiveSignals]);

  useEffect(() => {
    GalaxyService.fetchRuntimeSettings()
      .then((settings) => setRuntimeSettings(settings))
      .catch((error) => {
        console.warn('[SpacePage] Failed to fetch runtime settings:', error);
        setRuntimeSettings(GalaxyService.getDefaultRuntimeSettings());
      });
  }, []);

  const orbitSignals = useMemo(
    () => collectOrbitSignals({ planets, user }),
    [planets, user]
  );

  useEffect(() => {
    if (!settingsRef?.current) return;
    settingsRef.current.rotSpeed = cosmicTuning.planetSpin / 10;
    settingsRef.current.shootingSpeed = cosmicTuning.cameraDrift / 10;
    settingsRef.current.starDensity = cosmicTuning.starlight / 100;
    settingsRef.current.serendipity = cosmicTuning.serendipity / 100;
    settingsRef.current.orbitRange = cosmicTuning.orbitRange / 100;
  }, [cosmicTuning, settingsRef]);

  const handleTuningChange = useCallback((key, value) => {
    setCosmicTuning((prev) => ({ ...prev, [key]: Math.max(1, value) }));
  }, []);

  const syncPlanetsToEngine = useCallback((nextPlanets) => {
    planetsRef.current = nextPlanets;
    setPlanets(nextPlanets);
    events.emit('RELOAD_GALAXY', nextPlanets);
  }, []);

  const resetPlayerState = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const clearActivePlanet = useCallback(() => {
    setActivePlanet(null);
  }, []);

  const closePanelsAfterHop = useCallback(() => {
    setNavOpen(false);
    setSubPanel(null);
    setActiveMenu(null);
  }, []);

  const playTrack = useCallback(
    async (list, idx, planetId = playerRef.current.pid) => {
      const track = list[idx];
      if (!track) return;
      dispatch({ type: 'LOAD', list, idx, pid: planetId });
      if (track.ytId) {
        try {
          await provider.init();
        } catch (error) {
          console.warn('[SpacePage] Failed to initialize YouTube player:', error);
          provider.loadTrack(null, track.duration);
          return;
        }
      }
      provider.loadTrack(track.ytId, track.duration);
    },
    [provider]
  );

  useEffect(() => {
    const unsubscribe = provider.subscribe((eventName, data) => {
      if (eventName === 'playing') dispatch({ type: 'PLAY' });
      if (eventName === 'paused') dispatch({ type: 'PAUSE' });
      if (eventName === 'simProgress') dispatch({ type: 'PROG', e: data.elapsed, t: data.total });
      if (eventName === 'simStart') dispatch({ type: 'PROG', e: 0, t: data.total });

      if (eventName === 'ended') {
        const current = playerRef.current;
        if (!current.list.length) return;
        const nextIdx = current.repeat
          ? current.idx
          : current.shuffle
            ? Math.floor(Math.random() * current.list.length)
            : (current.idx + 1) % current.list.length;
        playTrack(current.list, nextIdx, current.pid);
      }

      if (eventName === 'error') {
        const current = playerRef.current;
        const currentTrack = current.list[current.idx];
        if (currentTrack) {
          provider.loadTrack(null, currentTrack.duration);
        }
      }
    });

    return unsubscribe;
  }, [playTrack, provider]);

  const appendWanderingSignals = useCallback(
    async (requestId) => {
      if (!YT_API_KEY) return;
      const createdSignals = [];

      for (let index = 0; index < WANDERING_SIGNAL_QUERIES.length; index += 1) {
        const signal = WANDERING_SIGNAL_QUERIES[index];

        try {
          const tracks = await provider.fetchTracks(signal.q, 8);
          if (!tracks.length) continue;
          if (galaxyRequestRef.current !== requestId) return;

          createdSignals.push({
            planetId: `wandering_${index}`,
            type: 'wandering',
            name: signal.name,
            artist: 'Discovery Relay',
            mood: signal.mood,
            r: 6 + Math.random() * 4,
            genre: signal.genre,
            tracks,
            index: 100 + index,
          });
        } catch (error) {
          console.warn('[SpacePage] Wandering signal fetch failed:', error);
        }
      }

      if (!createdSignals.length || galaxyRequestRef.current !== requestId) return;

      setPlanets((prev) => {
        const merged = [...prev, ...createdSignals];
        planetsRef.current = merged;
        createdSignals.forEach((planet) => events.emit('ADD_PLANET', planet));
        return merged;
      });
    },
    [provider]
  );

  const {
    currentGalaxyId,
    currentGalaxyContext,
    travelStatusCopy,
    loadGalaxy,
    handleGalaxyHop,
    handleReturnHomeGalaxy,
  } = useGalaxyNavigation({
    user,
    language,
    packSystem: pack.system,
    discoverableGalaxies,
    toast,
    syncPlanetsToEngine,
    appendWanderingSignals,
    resetPlayer: resetPlayerState,
    clearActivePlanet,
    closePanelsAfterHop,
    setProfileMiniOpen,
    setCosmicTransition,
    setArrivalBriefing,
  });

  const hopToGalaxy = useCallback((targetId) => {
    return handleGalaxyHop(targetId, galaxyRequestRef);
  }, [handleGalaxyHop]);

  const stageOneGalaxyBeacons = useMemo(
    () => discoverableGalaxies
      .filter((galaxy) => galaxy?.id && galaxy.id !== currentGalaxyId)
      .sort((left, right) => {
        const rightScore = getGalaxyStageOneScore(right) + getPersonalizedGalaxyScore(right, orbitSignals);
        const leftScore = getGalaxyStageOneScore(left) + getPersonalizedGalaxyScore(left, orbitSignals);
        return rightScore - leftScore;
      })
      .map((galaxy, index) => {
        const proximityScore = getGalaxyStageOneScore(galaxy) + getPersonalizedGalaxyScore(galaxy, orbitSignals);
        const stageBand = getGalaxyBand(index, galaxy);
        return {
          ...galaxy,
          stageRank: index + 1,
          stageBand,
          proximityScore,
          distanceLabel: getGalaxyDistanceLabel({ stageBand }, language),
          proximityReason: getGalaxyMatchReason(galaxy, orbitSignals, language),
        };
      })
      .slice(0, 14),
    [currentGalaxyId, discoverableGalaxies, language, orbitSignals]
  );

  useEffect(() => {
    events.emit('RELOAD_GALAXY_BEACONS', stageOneGalaxyBeacons);
  }, [stageOneGalaxyBeacons]);

  const hoverModeCandidates = useMemo(() => {
    const planetCandidates = planets
      .filter((planet) => (planet.tracks ?? []).length)
      .slice(0, 8)
      .map((planet) => ({
        kind: 'planet',
        id: planet.planetId,
        label: planet.name,
        target: planet,
        reason: planet.mood || planet.genre || planet.artist || '',
      }));

    const galaxyCandidates = stageOneGalaxyBeacons
      .slice(0, 6)
      .map((galaxy) => ({
        kind: 'galaxy',
        id: galaxy.id,
        label: galaxy.title || galaxy.displayName || galaxy.name,
        target: galaxy,
        reason: galaxy.proximityReason,
      }));

    return [...planetCandidates, ...galaxyCandidates];
  }, [planets, stageOneGalaxyBeacons]);

  const hoverModeActive = hoverMode.enabled
    && player.playing
    && !activePlanet
    && !navOpen
    && !arrivalBriefing
    && !cosmicTransition.active
    && hoverModeCooldownUntil <= Date.now();

  useEffect(() => {
    if (!hoverModeCooldownUntil) return undefined;
    const remaining = hoverModeCooldownUntil - Date.now();
    if (remaining <= 0) {
      setHoverModeCooldownUntil(0);
      return undefined;
    }
    const timer = window.setTimeout(() => setHoverModeCooldownUntil(0), remaining);
    return () => window.clearTimeout(timer);
  }, [hoverModeCooldownUntil]);

  const returnHomeGalaxy = useCallback(() => {
    return handleReturnHomeGalaxy(galaxyRequestRef);
  }, [handleReturnHomeGalaxy]);

  const setHoverModeEnabled = useCallback((enabled) => {
    setHoverMode((prev) => ({
      ...prev,
      enabled,
      active: enabled ? prev.active : false,
      targetLabel: enabled ? prev.targetLabel : '',
      targetKind: enabled ? prev.targetKind : null,
      reason: enabled ? prev.reason : '',
    }));
    if (!enabled) {
      window.clearTimeout(hoverModeTimerRef.current);
      events.emit('CLEAR_DRIFT_FOCUS');
    }
  }, []);

  const stepHoverMode = useCallback(() => {
    if (!hoverModeCandidates.length) return;

    const nextIndex = hoverModeCursorRef.current % hoverModeCandidates.length;
    hoverModeCursorRef.current += 1;
    const nextCandidate = hoverModeCandidates[nextIndex];
    if (!nextCandidate) return;

    setHoverMode((prev) => ({
      ...prev,
      active: true,
      targetLabel: nextCandidate.label,
      targetKind: nextCandidate.kind,
      reason: nextCandidate.reason || '',
    }));

    const discoveryChance = 0.16 + (cosmicTuning.serendipity / 100) * 0.42;
    if (Math.random() < discoveryChance) {
      setCurationSignal(buildHoverDiscoverySignal({
        target: nextCandidate.target,
        kind: nextCandidate.kind,
        language,
        reason: nextCandidate.reason,
      }));
    }
  }, [cosmicTuning.serendipity, hoverModeCandidates, language]);

  const resolvePlanetOwnerId = useCallback((planet) => {
    if (!planet || planet.type !== 'user') return null;
    if (currentGalaxyId === OFFICIAL_GALAXY_ID) return user?.uid ?? null;
    return currentGalaxyId;
  }, [currentGalaxyId, user?.uid]);

  useEffect(() => {
    window.clearTimeout(hoverModeTimerRef.current);

    if (!hoverMode.enabled) {
      setHoverMode((prev) => ({
        ...prev,
        active: false,
        targetLabel: '',
        targetKind: null,
        reason: '',
      }));
      events.emit('CLEAR_DRIFT_FOCUS');
      return undefined;
    }

    if (!hoverModeActive || !hoverModeCandidates.length) {
      setHoverMode((prev) => ({
        ...prev,
        active: false,
        targetLabel: '',
        targetKind: null,
        reason: '',
      }));
      events.emit('CLEAR_DRIFT_FOCUS');
      return undefined;
    }

    stepHoverMode();

    const loop = () => {
      stepHoverMode();
      hoverModeTimerRef.current = window.setTimeout(loop, getHoverModeDelayMs(cosmicTuning.serendipity));
    };

    hoverModeTimerRef.current = window.setTimeout(loop, getHoverModeDelayMs(cosmicTuning.serendipity));
    return () => window.clearTimeout(hoverModeTimerRef.current);
  }, [cosmicTuning.serendipity, hoverMode.enabled, hoverModeActive, hoverModeCandidates, stepHoverMode]);

  useEffect(() => {
    if (!activePlanet) {
      setPlanetEngagement({ likes: 0, saves: 0, liked: false, saved: false });
      return;
    }

    const ownerId = resolvePlanetOwnerId(activePlanet);
    if (!ownerId) {
      setPlanetEngagement({ likes: 0, saves: 0, liked: false, saved: false });
      return;
    }

    SocialEngagementService.fetchPlanetEngagement({
      ownerId,
      planetId: activePlanet.planetId,
      viewerId: user?.uid,
    })
      .then((engagement) => setPlanetEngagement(engagement))
      .catch((error) => {
        console.warn('[SpacePage] Failed to fetch planet engagement:', error);
        setPlanetEngagement({ likes: 0, saves: 0, liked: false, saved: false });
      });
  }, [activePlanet, resolvePlanetOwnerId, user?.uid]);

  useEffect(() => {
    if (initialGalaxyLoadedRef.current) return;
    initialGalaxyLoadedRef.current = true;
    loadGalaxy(OFFICIAL_GALAXY_ID, galaxyRequestRef);
  }, [loadGalaxy]);

  const hydrateUserPlaylists = useCallback(
    async (token, { force = false } = {}) => {
      if (!token) return;
      if (playlistHydrationRef.current) return;
      if (!force && hydratedTokenRef.current === token) return;
      if (!force && failedPlaylistTokenRef.current === token) return;

      const cachedLibrary = getCachedLibraryOrbit(user?.uid);
      const applyUserLibrary = (createdPlanets) => {
        if (!createdPlanets?.length) return;
        setPlanets((prev) => {
          const merged = upsertUserPlanets(prev, createdPlanets);
          planetsRef.current = merged;
          events.emit('RELOAD_GALAXY', merged);
          return merged;
        });
      };

      if (cachedLibrary?.planets?.length) {
        applyUserLibrary(cachedLibrary.planets);
        if (!force && cachedLibrary.fresh) {
          hydratedTokenRef.current = token;
          failedPlaylistTokenRef.current = null;
          refreshSyncAndQuotaMeta();
          return;
        }
      }

      playlistHydrationRef.current = true;
      setIsHydratingLibrary(true);

      try {
        const playlists = await provider.fetchPlaylists(token, 6);
        const createdPlanets = [];

        for (let index = 0; index < Math.min(playlists.length, 4); index += 1) {
          const playlist = playlists[index];
          const tracks = await provider.fetchPlaylistTracks(
            playlist.id,
            token,
            isPremiumRef.current ? 20 : 5
          );

          createdPlanets.push({
            planetId: `user_${playlist.id}`,
            type: 'user',
            name: playlist.snippet?.title ?? pack.system.userPlaylistFallback,
            artist: playlist.snippet?.channelTitle ?? user?.displayName ?? pack.system.me,
            mood: pack.system.myTaste,
            r: 7 + Math.random() * 4,
            genre: 'Library Orbit',
            tracks,
            index: 200 + index,
          });
        }

        if (!createdPlanets.length) return;

        applyUserLibrary(createdPlanets);
        setCachedLibraryOrbit(user?.uid, createdPlanets);
        refreshSyncAndQuotaMeta();
        GalaxyService.saveGalaxy(user?.uid, createdPlanets, { profile: user?.galaxyProfile }).catch((error) => {
          console.warn('[SpacePage] Failed to persist cached user galaxy:', error);
        });

        toast(pack.system.playlistImported(createdPlanets.length));
        hydratedTokenRef.current = token;
        failedPlaylistTokenRef.current = null;
      } catch (error) {
        console.error('[SpacePage] Failed to hydrate user playlists:', {
          code: error?.code,
          reason: error?.reason,
          status: error?.status,
          message: error?.message,
          error,
        });
        if (error.code === YT_ERRORS.AUTH_EXPIRED) clearYTState();
        if (cachedLibrary?.planets?.length) {
          applyUserLibrary(cachedLibrary.planets);
          hydratedTokenRef.current = token;
          failedPlaylistTokenRef.current = null;
          refreshSyncAndQuotaMeta();
          toast(
            language === 'en'
              ? '⚠️ YouTube quota is tight, so Stellara is using your cached library orbit for now.'
              : '⚠️ YouTube 쿼터가 부족해 지금은 저장된 라이브러리 캐시를 먼저 사용합니다.',
            5200
          );
        } else {
          failedPlaylistTokenRef.current = token;
          toast(getYouTubePlaylistErrorMessage(error, language), 5200);
        }
      } finally {
        playlistHydrationRef.current = false;
        setIsHydratingLibrary(false);
      }
    },
    [clearYTState, language, pack, provider, refreshSyncAndQuotaMeta, toast, user?.displayName, user?.uid]
  );

  useEffect(() => {
    if (user?.ytToken && isYTConnected) {
      hydrateUserPlaylists(user.ytToken);
    }
  }, [hydrateUserPlaylists, isYTConnected, user?.ytToken]);

  const handlePlanetClick = useCallback(
    (planet) => {
      events.emit('CLEAR_DRIFT_FOCUS');
      setHoverMode((prev) => ({ ...prev, active: false }));
      setActivePlanet(planet);
      setNavOpen(false);
      setSubPanel(null);
      setActiveMenu(null);
      setHoverPlanet(null);
      setHoverGalaxy(null);
      events.emit('ZOOM_IN', planet.planetId);

      const flavorText = getLocalizedPlanetFlavor(planet, language);
      if (flavorText) {
        toast(`✦ ${flavorText}`, 3200);
      }

      const list = (planet.tracks ?? []).slice(0, isPremiumRef.current ? 20 : 5);
      playTrack(list, 0, planet.planetId);

      const ownerId = resolvePlanetOwnerId(planet);
      if (user?.uid && ownerId && ownerId !== user.uid) {
        SocialEngagementService.trackPlanetLanding({
          viewer: user,
          ownerId,
          galaxyId: currentGalaxyId,
          planet,
        }).catch((error) => {
          console.warn('[SpacePage] Failed to track planet landing:', error);
        });
      }
    },
    [currentGalaxyId, language, playTrack, resolvePlanetOwnerId, toast, user]
  );

  const handleRefresh = useCallback(async () => {
    if (!activePlanet || refreshing) return;
    if (!YT_API_KEY) {
      toast(pack.system.youtubeErrors.noToken, 4200);
      return;
    }

    setRefreshing(true);
    try {
      const query = DISCOVERY_QUERIES[activePlanet.name] ?? activePlanet.genre ?? activePlanet.name;
      const tracks = await provider.fetchTracks(query, 10);
      if (!tracks.length) return;

      setPlanets((prev) => {
        const updated = prev.map((planet) =>
          planet.planetId === activePlanet.planetId ? { ...planet, tracks } : planet
        );
        planetsRef.current = updated;
        events.emit('RELOAD_GALAXY', updated);
        return updated;
      });

      const nextPlanet = { ...activePlanet, tracks };
      setActivePlanet(nextPlanet);
      playTrack(tracks.slice(0, isPremiumRef.current ? 20 : 5), 0, activePlanet.planetId);
      toast(pack.system.curationRefreshed);
    } catch (error) {
      console.error('[SpacePage] Failed to refresh planet:', error);
      toast(pack.system.curationRefreshFailed);
    } finally {
      setRefreshing(false);
    }
  }, [activePlanet, pack, playTrack, provider, refreshing, toast]);

  const curatePlanetFromQuery = useCallback(async (planet, query) => {
    if (!planet || !query) return planet;
    if (!YT_API_KEY) return planet;

    try {
      const tracks = await provider.fetchTracks(query, 8);
      if (!tracks.length) return planet;

      const nextPlanet = { ...planet, tracks };
      setPlanets((prev) => {
        const updated = prev.map((item) =>
          item.planetId === planet.planetId ? { ...item, tracks } : item
        );
        planetsRef.current = updated;
        events.emit('RELOAD_GALAXY', updated);
        return updated;
      });
      return nextPlanet;
    } catch (error) {
      console.warn('[SpacePage] Failed to curate query-specific tracks:', error);
      return planet;
    }
  }, [provider]);

  const handleBlackholeClick = useCallback((options = {}) => {
    const { query = '', preferredPlanet = null } = options;
    events.emit('CLEAR_DRIFT_FOCUS');
    setHoverMode((prev) => ({ ...prev, active: false }));
    events.emit('TRIGGER_BH_SUCK');
    toast(pack.system.blackholeCalculating);
    setCosmicTransition({
      active: true,
      type: 'blackhole',
      kicker: language === 'en' ? 'Blackhole Curator' : '블랙홀 큐레이터',
      title: language === 'en' ? 'A distant pulse is unfolding in the dark.' : '어둠 속에서 먼 파동이 천천히 펼쳐집니다.',
      description: language === 'en'
        ? 'The curator is listening for a softer orbit beyond your current gravity.'
        : '블랙홀 큐레이터가 지금의 중력 바깥에서 더 부드러운 궤도를 듣고 있습니다.',
      target: language === 'en' ? 'Dream signal incoming' : '몽환 신호 수신 중',
    });

    const candidates = planetsRef.current.filter((planet) => planet.tracks?.length);
    if (!candidates.length) {
      window.setTimeout(() => setCosmicTransition({ active: false, type: null }), 920);
      return;
    }

    window.setTimeout(async () => {
      const chosenPlanet = preferredPlanet
        || candidates
          .map((planet) => ({ planet, score: scorePlanetIntent(planet, query) }))
          .sort((a, b) => b.score - a.score)[0]?.planet
        || candidates[Math.floor(Math.random() * candidates.length)];
      const curatedPlanet = query
        ? await curatePlanetFromQuery(chosenPlanet, query)
        : chosenPlanet;
      const list = (curatedPlanet.tracks ?? []).slice(0, isPremiumRef.current ? 20 : 5);
      if (list.length) {
        const randomIndex = Math.floor(Math.random() * list.length);
        playTrack(list, randomIndex, curatedPlanet.planetId);
      }
      setCurationSignal({
        kicker: language === 'en' ? 'Blackhole Curator' : '블랙홀 큐레이터',
        title: curatedPlanet.name,
        subtitle: language === 'en' ? 'Curated orbit' : '큐레이션 궤도',
        description: buildBlackholeReason(curatedPlanet, query, language),
        compact: true,
        duration: 2200,
      });
      handlePlanetClick(curatedPlanet);
      window.setTimeout(() => setCosmicTransition({ active: false, type: null }), 260);
    }, 760);
  }, [curatePlanetFromQuery, handlePlanetClick, language, pack, playTrack, toast]);

  useEffect(() => {
    const unsubscribers = [
      events.on('ENGINE_PLANET_CLICK', handlePlanetClick),
      events.on('ENGINE_HOVER_CHANGED', setHoverPlanet),
      events.on('ENGINE_BH_CLICK', handleBlackholeClick),
      events.on('ENGINE_GALAXY_HOVER_CHANGED', setHoverGalaxy),
      events.on('ENGINE_GALAXY_CLICK', (galaxy) => {
        if (!galaxy?.id) return;
        events.emit('CLEAR_DRIFT_FOCUS');
        setHoverMode((prev) => ({ ...prev, active: false }));
        setHoverPlanet(null);
        setHoverGalaxy(null);
        const targetTitle = galaxy.title || galaxy.displayName || galaxy.name;
        const routeReason = galaxy.proximityReason || getGalaxyMatchReason(galaxy, orbitSignals, language);
        setCosmicTransition({
          active: true,
          type: 'nearby-route',
          kicker: language === 'en' ? 'Nearby Route Locked' : '근처 항로 잠금',
          title: targetTitle,
          description: routeReason,
          target: language === 'en'
            ? `${formatGalaxyHoverStats(galaxy, language)}`
            : `${formatGalaxyHoverStats(galaxy, language)}`,
        });
        setCurationSignal({
          kicker: language === 'en' ? 'Nearby Route Locked' : '근처 항로 잠금',
          title: targetTitle,
          subtitle: galaxy.promotionType
            ? (language === 'en' ? 'Promoted signal' : '프로모션 신호')
            : (language === 'en' ? 'Listener galaxy' : '청취 은하'),
          description: routeReason,
          compact: true,
          duration: 2100,
        });
        window.setTimeout(() => {
          handleGalaxyHop(galaxy.id, galaxyRequestRef);
        }, 260);
        window.setTimeout(() => setCosmicTransition({ active: false, type: null }), 420);
      }),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [handleBlackholeClick, handleGalaxyHop, handlePlanetClick, language, orbitSignals]);

  const resetIdleTimer = useCallback(() => {
    setUiVisible(true);
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setUiVisible(false), 10000);
  }, []);

  useEffect(() => {
    resetIdleTimer();
    const eventsToWatch = ['mousemove', 'mousedown', 'keydown'];
    eventsToWatch.forEach((eventName) =>
      window.addEventListener(eventName, resetIdleTimer, { passive: true })
    );
    return () => {
      clearTimeout(idleTimerRef.current);
      eventsToWatch.forEach((eventName) =>
        window.removeEventListener(eventName, resetIdleTimer)
      );
    };
  }, [resetIdleTimer]);

  useEffect(() => {
    const handleMouseMove = (event) => setHoverPos({ x: event.clientX, y: event.clientY });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!arrivalBriefing) return undefined;
    const timer = window.setTimeout(() => setArrivalBriefing(null), 3400);
    return () => window.clearTimeout(timer);
  }, [arrivalBriefing]);

  useEffect(() => {
    if (!curationSignal) return undefined;
    const timer = window.setTimeout(() => setCurationSignal(null), curationSignal.duration ?? 2400);
    return () => window.clearTimeout(timer);
  }, [curationSignal]);

  const resolveSignalTarget = useCallback((signalItem) => {
    if (!signalItem) return null;
    if (signalItem.targetGalaxyId) {
      return discoverableGalaxies.find((galaxy) => galaxy.id === signalItem.targetGalaxyId) || null;
    }
    if (signalItem.targetGalaxySlug) {
      return discoverableGalaxies.find((galaxy) => galaxy.slug === signalItem.targetGalaxySlug) || null;
    }
    return null;
  }, [discoverableGalaxies]);

  useEffect(() => {
    if (!liveSignals?.popup || curationSignal || popupShownRef.current === liveSignals.popup.id) return undefined;
    if (typeof window !== 'undefined' && window.sessionStorage.getItem(LIVE_POPUP_STORAGE_KEY) === liveSignals.popup.id) {
      popupShownRef.current = liveSignals.popup.id;
      return undefined;
    }
    const targetGalaxy = resolveSignalTarget(liveSignals.popup);
    popupShownRef.current = liveSignals.popup.id;
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(LIVE_POPUP_STORAGE_KEY, liveSignals.popup.id);
    }
    const localizedPopup = AdminService.getLocalizedNoticeText(liveSignals.popup, language);
    setCurationSignal({
      kicker: language === 'en' ? 'Official Route Open' : '공식 항로 개방',
      title: localizedPopup.title,
      subtitle: language === 'en' ? 'Rare popup signal' : '희소 팝업 신호',
      description: localizedPopup.body,
      duration: 8200,
      ctaLabel: localizedPopup.ctaLabel || (language === 'en' ? 'Warp now' : '지금 워프'),
      onPrimaryAction: targetGalaxy ? () => handleGalaxyHop(targetGalaxy.id, galaxyRequestRef) : undefined,
    });
    return undefined;
  }, [curationSignal, handleGalaxyHop, language, liveSignals?.popup, resolveSignalTarget]);

  useEffect(() => {
    window.clearTimeout(rollingSignalTimerRef.current);
    const signals = liveSignals?.rollingSignals || [];
    if (!signals.length) {
      setRollingSignal(null);
      return undefined;
    }

    const queueNext = () => {
      const nextSignal = signals[rollingSignalCursorRef.current % signals.length];
      rollingSignalCursorRef.current += 1;
      const targetGalaxy = resolveSignalTarget(nextSignal);
      const localizedSignal = AdminService.getLocalizedNoticeText(nextSignal, language);
      setRollingSignal({
        kicker: language === 'en' ? 'Center Signal' : '중앙 신호',
        title: localizedSignal.title,
        description: localizedSignal.body,
        variant: 'rolling_signal',
        ctaLabel: localizedSignal.ctaLabel || (language === 'en' ? 'Warp' : '워프'),
        onPrimaryAction: targetGalaxy ? () => handleGalaxyHop(targetGalaxy.id, galaxyRequestRef) : undefined,
      });
      rollingSignalTimerRef.current = window.setTimeout(queueNext, 6200);
    };

    queueNext();
    return () => window.clearTimeout(rollingSignalTimerRef.current);
  }, [handleGalaxyHop, language, liveSignals?.rollingSignals, resolveSignalTarget]);

  useEffect(() => {
    if (!cosmicTransition.active) return;
    setHoverPlanet(null);
    setHoverGalaxy(null);
  }, [cosmicTransition.active]);

  const handleChipClick = useCallback(
    async (chipName, chipIndex) => {
      const existingPlanet = planetsRef.current[chipIndex];
      if (existingPlanet) {
        handlePlanetClick(existingPlanet);
      }

      const query = DISCOVERY_QUERIES[chipName];
      if (!query) return;
      if (!YT_API_KEY) return;

      try {
        const tracks = await provider.fetchTracks(query, 8);
        if (!tracks.length || !existingPlanet) return;

        setPlanets((prev) => {
          const updated = prev.map((planet) =>
            planet.planetId === existingPlanet.planetId ? { ...planet, tracks } : planet
          );
          planetsRef.current = updated;
          events.emit('RELOAD_GALAXY', updated);
          return updated;
        });

        if (activePlanet?.planetId === existingPlanet.planetId) {
          setActivePlanet((prev) => (prev ? { ...prev, tracks } : prev));
        }
      } catch (error) {
        console.error('[SpacePage] Chip exploration failed:', error);
      }
    },
    [activePlanet?.planetId, handlePlanetClick, provider]
  );

  const handleLogin = useCallback(async () => {
    if (authAction) return;
    setAuthAction('login');
    try {
      const result = await login();
      if (!result.ok && result.message) toast(getAuthMessage(result.message, language));
      if (result.ok) toast(pack.system.loginStarted);
    } finally {
      setAuthAction(null);
    }
  }, [authAction, language, login, pack, toast]);

  const handleConnectYT = useCallback(async () => {
    if (authAction) return;
    setAuthAction('youtube');
    try {
      const result = await connectYouTube();
      if (!result.ok && result.message) toast(getAuthMessage(result.message, language));
      if (result.ok) {
        failedPlaylistTokenRef.current = null;
        hydratedTokenRef.current = null;
        toast(pack.system.youtubeConnected);
        if (result.user?.ytToken) {
          hydrateUserPlaylists(result.user.ytToken);
        }
      }
    } finally {
      setAuthAction(null);
    }
  }, [authAction, connectYouTube, hydrateUserPlaylists, language, pack, toast]);

  const handleLogout = useCallback(async () => {
    await logout();
    hydratedTokenRef.current = null;
    failedPlaylistTokenRef.current = null;
    setPlanets((prev) => {
      const next = prev.filter((planet) => planet.type !== 'user');
      planetsRef.current = next;
      events.emit('RELOAD_GALAXY', next);
      return next;
    });
    setNavOpen(false);
    setSubPanel(null);
    setActiveMenu(null);
    setProfileMiniOpen(false);
    setArrivalBriefing(null);
    setCurationSignal(null);
    toast(pack.system.logout);
  }, [logout, pack, toast]);

  const handleSaveGalaxyProfile = useCallback(async (draftProfile) => {
    if (!draftProfile) return;
    setAuthAction('social-profile');
    try {
      const result = await updateGalaxyProfile(draftProfile, planetsRef.current);
      if (!result.ok && result.message) {
        toast(result.message);
        return;
      }
      refreshDiscoverableGalaxies();
      toast(language === 'en' ? '✅ Galaxy social profile saved.' : '✅ 은하 소셜 프로필이 저장되었습니다.');
    } finally {
      setAuthAction(null);
    }
  }, [language, refreshDiscoverableGalaxies, toast, updateGalaxyProfile]);

  const handleSaveFeaturedGalaxy = useCallback(async (draftFeaturedGalaxy) => {
    if (!draftFeaturedGalaxy) return;
    setAuthAction('featured-galaxy');
    setAdminSavingKey('featured-galaxy');
    try {
      await AdminService.saveFeaturedGalaxy(draftFeaturedGalaxy, user);
      await refreshDiscoverableGalaxies();
      await refreshAdminSnapshot();
      toast(language === 'en'
        ? 'Featured galaxy saved to the portal.'
        : 'Featured 은하를 포털에 저장했습니다.');
    } catch (error) {
      console.error('[SpacePage] Failed to save featured galaxy:', error);
      toast(error?.message || (language === 'en'
        ? 'We could not save this featured galaxy.'
        : 'Featured 은하를 저장하지 못했습니다.'));
    } finally {
      setAuthAction(null);
      setAdminSavingKey(null);
    }
  }, [language, refreshAdminSnapshot, refreshDiscoverableGalaxies, toast, user]);

  const handleSaveNotice = useCallback(async (draftNotice) => {
    if (!draftNotice) return;
    setAdminSavingKey('notice');
    try {
      await AdminService.saveNotice(draftNotice, user);
      await refreshAdminSnapshot();
      await refreshLiveSignals();
      toast(language === 'en' ? 'Notice saved.' : '공지사항을 저장했습니다.');
    } catch (error) {
      console.error('[SpacePage] Failed to save notice:', error);
      toast(error?.message || (language === 'en' ? 'We could not save this notice.' : '공지사항을 저장하지 못했습니다.'));
    } finally {
      setAdminSavingKey(null);
    }
  }, [language, refreshAdminSnapshot, refreshLiveSignals, toast, user]);

  const handleDeleteNotice = useCallback(async (noticeId) => {
    if (!noticeId) return;
    const confirmed = window.confirm(
      language === 'en' ? 'Are you sure you want to delete this notice?' : '정말 삭제하시겠습니까?'
    );
    if (!confirmed) return;
    setAdminSavingKey('notice');
    try {
      await AdminService.deleteNotice(noticeId, user);
      await refreshAdminSnapshot();
      await refreshLiveSignals();
      toast(language === 'en' ? 'Notice deleted.' : '공지 ID를 삭제했습니다.');
    } catch (error) {
      console.error('[SpacePage] Failed to delete notice:', error);
      toast(error?.message || (language === 'en' ? 'We could not delete this notice.' : '공지 ID를 삭제하지 못했습니다.'));
    } finally {
      setAdminSavingKey(null);
    }
  }, [language, refreshAdminSnapshot, refreshLiveSignals, toast, user]);

  const handleSaveDocument = useCallback(async (draftDocument) => {
    if (!draftDocument) return;
    setAdminSavingKey('document');
    try {
      await AdminService.saveDocument(draftDocument, user);
      await refreshAdminSnapshot();
      toast(language === 'en' ? 'Document saved.' : '문서를 저장했습니다.');
    } catch (error) {
      console.error('[SpacePage] Failed to save document:', error);
      toast(error?.message || (language === 'en' ? 'We could not save this document.' : '문서를 저장하지 못했습니다.'));
    } finally {
      setAdminSavingKey(null);
    }
  }, [language, refreshAdminSnapshot, toast, user]);

  const handleSaveSettings = useCallback(async (draftSettings) => {
    if (!draftSettings) return;
    setAdminSavingKey('settings');
    try {
      await AdminService.saveSettings(draftSettings, user);
      setRuntimeSettings((prev) => ({
        ...prev,
        ...draftSettings,
        limits: {
          ...(prev?.limits || {}),
          ...(draftSettings?.limits || {}),
        },
      }));
      await refreshAdminSnapshot();
      toast(language === 'en' ? 'Settings saved.' : '설정을 저장했습니다.');
    } catch (error) {
      console.error('[SpacePage] Failed to save settings:', error);
      toast(error?.message || (language === 'en' ? 'We could not save settings.' : '설정을 저장하지 못했습니다.'));
    } finally {
      setAdminSavingKey(null);
    }
  }, [language, refreshAdminSnapshot, toast, user]);

  const handleSaveAdminUser = useCallback(async (draftAdminUser) => {
    if (!draftAdminUser) return;
    setAdminSavingKey('admin-user');
    try {
      await AdminService.saveAdminUser(draftAdminUser, user);
      await refreshAdminSnapshot();
      toast(language === 'en' ? 'Admin permissions saved.' : '관리자 권한을 저장했습니다.');
    } catch (error) {
      console.error('[SpacePage] Failed to save admin user:', error);
      toast(error?.message || (language === 'en' ? 'We could not save admin permissions.' : '관리자 권한을 저장하지 못했습니다.'));
    } finally {
      setAdminSavingKey(null);
    }
  }, [language, refreshAdminSnapshot, toast, user]);

  const handleSavePayment = useCallback(async (draftPayment) => {
    if (!draftPayment) return;
    setAdminSavingKey('payment');
    try {
      await AdminService.savePayment(draftPayment, user);
      await refreshAdminSnapshot();
      toast(language === 'en' ? 'Payment saved.' : '결제 데이터를 저장했습니다.');
    } catch (error) {
      console.error('[SpacePage] Failed to save payment:', error);
      toast(error?.message || (language === 'en' ? 'We could not save this payment.' : '결제 데이터를 저장하지 못했습니다.'));
    } finally {
      setAdminSavingKey(null);
    }
  }, [language, refreshAdminSnapshot, toast, user]);

  const handleSaveApiUsage = useCallback(async (draftApiUsage) => {
    if (!draftApiUsage) return;
    setAdminSavingKey('api-usage');
    try {
      await AdminService.saveApiUsage(draftApiUsage, user);
      await refreshAdminSnapshot();
      toast(language === 'en' ? 'API usage saved.' : 'API 사용량 데이터를 저장했습니다.');
    } catch (error) {
      console.error('[SpacePage] Failed to save api usage:', error);
      toast(error?.message || (language === 'en' ? 'We could not save api usage.' : 'API 사용량 데이터를 저장하지 못했습니다.'));
    } finally {
      setAdminSavingKey(null);
    }
  }, [language, refreshAdminSnapshot, toast, user]);

  const handleSaveErrorLog = useCallback(async (draftErrorLog) => {
    if (!draftErrorLog) return;
    setAdminSavingKey('error-log');
    try {
      await AdminService.saveErrorLog(draftErrorLog, user);
      await refreshAdminSnapshot();
      toast(language === 'en' ? 'Error log saved.' : '에러 로그를 저장했습니다.');
    } catch (error) {
      console.error('[SpacePage] Failed to save error log:', error);
      toast(error?.message || (language === 'en' ? 'We could not save this error log.' : '에러 로그를 저장하지 못했습니다.'));
    } finally {
      setAdminSavingKey(null);
    }
  }, [language, refreshAdminSnapshot, toast, user]);

  const handleCreatePlanet = useCallback(async (draftPlanet) => {
    if (!user?.uid) {
      toast(language === 'en' ? 'Sign in before you give birth to a new planet.' : '새 행성을 만들기 전에 먼저 로그인해주세요.');
      return;
    }

    setPlanetStudioSaving(true);
    try {
      const result = await GalaxyService.createPlanet({
        user,
        draft: { ...draftPlanet, language },
        isPremium,
        settings: runtimeSettings,
      });

      const createdPlanet = result?.planet;
      if (createdPlanet) {
        const birthedPlanet = {
          ...createdPlanet,
          justBornAt: Date.now(),
        };
        setPlanets((prev) => {
          const nextUserPlanets = [
            ...prev.filter((planet) => planet.type === 'user' && planet.planetId !== createdPlanet.planetId),
            birthedPlanet,
          ];
          const next = upsertUserPlanets(prev, [
            ...nextUserPlanets,
          ]);
          planetsRef.current = next;
          events.emit('RELOAD_GALAXY', next);
          return next;
        });

        await updateGalaxyProfile(user.galaxyProfile || {}, result.planets);
      }

      refreshDiscoverableGalaxies();
      setPlanetStudioOpen(false);
      if (createdPlanet?.planetId) {
        window.setTimeout(() => {
          events.emit('SET_DRIFT_FOCUS', { kind: 'planet', id: createdPlanet.planetId });
        }, 180);
      }
      toast(language === 'en' ? '🪐 A new planet has entered your orbit.' : '🪐 새로운 행성이 당신의 궤도에 진입했습니다.');
    } catch (error) {
      console.error('[SpacePage] Failed to create planet:', error);
      toast(error?.message || (language === 'en' ? 'We could not create this planet yet.' : '행성을 아직 탄생시키지 못했습니다.'));
    } finally {
      setPlanetStudioSaving(false);
    }
  }, [isPremium, language, refreshDiscoverableGalaxies, runtimeSettings, toast, updateGalaxyProfile, user]);

  const handleManualSync = useCallback(async () => {
    if (!user?.ytToken) {
      toast(language === 'en'
        ? 'Connect YouTube Music before syncing your library.'
        : '라이브러리를 동기화하려면 먼저 YouTube Music을 연결해주세요.');
      return;
    }

    setAuthAction('sync-library');
    try {
      clearCachedLibraryOrbit(user.uid);
      hydratedTokenRef.current = null;
      failedPlaylistTokenRef.current = null;
      await hydrateUserPlaylists(user.ytToken, { force: true });
      refreshSyncAndQuotaMeta();
      toast(language === 'en'
        ? '↺ Your library orbit has been resynced.'
        : '↺ 라이브러리 궤도를 다시 동기화했습니다.');
    } finally {
      setAuthAction(null);
    }
  }, [hydrateUserPlaylists, language, refreshSyncAndQuotaMeta, toast, user?.uid, user?.ytToken]);

  const handleShareGalaxy = useCallback(async (draftProfile) => {
    if (!user?.uid) return;

    const profile = draftProfile ?? user.galaxyProfile;
    if (!profile || profile.visibility !== 'public') {
      toast(language === 'en'
        ? 'Set your galaxy to public before sharing it.'
        : '은하를 공개 상태로 바꾼 뒤 공유할 수 있습니다.');
      return;
    }

    const targetUrl = `${window.location.origin}/?galaxy=${encodeURIComponent(user.uid)}&slug=${encodeURIComponent(profile.slug)}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: profile.title,
          text: profile.description || (language === 'en' ? 'Enter my galaxy.' : '내 은하로 진입해보세요.'),
          url: targetUrl,
        });
      } else {
        await navigator.clipboard.writeText(targetUrl);
      }
      await SocialEngagementService.trackGalaxyShare({ ownerId: user.uid });
      toast(language === 'en'
        ? '🔗 Galaxy link ready to share.'
        : '🔗 은하 공유 링크를 준비했습니다.');
    } catch (error) {
      if (error?.name === 'AbortError') return;
      console.error('[SpacePage] Failed to share galaxy:', error);
      toast(language === 'en'
        ? 'We could not prepare the galaxy share link.'
        : '은하 공유 링크를 준비하지 못했습니다.');
    }
  }, [language, toast, user]);

  const handleLikePlanet = useCallback(async () => {
    if (!activePlanet) return;
    const ownerId = resolvePlanetOwnerId(activePlanet);
    if (!ownerId) {
      toast(language === 'en'
        ? 'Likes are available on user planets only.'
        : '좋아요는 사용자 행성에서만 사용할 수 있습니다.');
      return;
    }

    try {
      const result = await SocialEngagementService.togglePlanetLike({
        viewer: user,
        ownerId,
        galaxyId: ownerId,
        planet: activePlanet,
      });
      const nextLiked = Boolean(result.liked);
      setPlanetEngagement((prev) => ({
        ...prev,
        liked: nextLiked,
        likes: Math.max(0, (prev.likes ?? 0) + (nextLiked ? 1 : -1)),
      }));
      toast(nextLiked
        ? (language === 'en' ? '💜 Planet resonance recorded.' : '💜 행성에 공명을 남겼습니다.')
        : (language === 'en' ? 'Planet resonance removed.' : '행성 공명을 해제했습니다.'));
    } catch (error) {
      console.error('[SpacePage] Failed to like planet:', error);
      toast(language === 'en'
        ? 'You need to sign in before leaving resonance.'
        : '공명을 남기려면 먼저 로그인해야 합니다.');
    }
  }, [activePlanet, language, resolvePlanetOwnerId, toast, user]);

  const handleSavePlanet = useCallback(async () => {
    if (!activePlanet) return;
    const ownerId = resolvePlanetOwnerId(activePlanet);
    if (!ownerId) {
      toast(language === 'en'
        ? 'Saving is available on user planets only.'
        : '저장은 사용자 행성에서만 사용할 수 있습니다.');
      return;
    }

    try {
      const result = await SocialEngagementService.togglePlanetSave({
        viewer: user,
        ownerId,
        galaxyId: ownerId,
        planet: activePlanet,
      });
      const nextSaved = Boolean(result.saved);
      setPlanetEngagement((prev) => ({
        ...prev,
        saved: nextSaved,
        saves: Math.max(0, (prev.saves ?? 0) + (nextSaved ? 1 : -1)),
      }));
      toast(nextSaved
        ? (language === 'en' ? '🪐 Planet added to your orbit.' : '🪐 행성을 내 궤도에 저장했습니다.')
        : (language === 'en' ? 'Planet removed from your orbit.' : '행성을 내 궤도에서 제거했습니다.'));
    } catch (error) {
      console.error('[SpacePage] Failed to save planet:', error);
      toast(language === 'en'
        ? 'You need to sign in before saving planets.'
        : '행성을 저장하려면 먼저 로그인해야 합니다.');
    }
  }, [activePlanet, language, resolvePlanetOwnerId, toast, user]);

  const handleSharePlanet = useCallback(async () => {
    if (!activePlanet) return;

    const ownerId = resolvePlanetOwnerId(activePlanet) ?? currentGalaxyId;
    const targetUrl = `${window.location.origin}/?galaxy=${encodeURIComponent(ownerId)}&planet=${encodeURIComponent(activePlanet.planetId)}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: activePlanet.name,
          text: activePlanet.mood || activePlanet.genre || (language === 'en' ? 'A music planet from Stellara' : 'Stellara의 음악 행성'),
          url: targetUrl,
        });
      } else {
        await navigator.clipboard.writeText(targetUrl);
      }
      toast(language === 'en'
        ? '🔗 Planet link ready to share.'
        : '🔗 행성 공유 링크를 준비했습니다.');
    } catch (error) {
      if (error?.name === 'AbortError') return;
      console.error('[SpacePage] Failed to share planet:', error);
      toast(language === 'en'
        ? 'We could not prepare the planet share link.'
        : '행성 공유 링크를 준비하지 못했습니다.');
    }
  }, [activePlanet, currentGalaxyId, language, resolvePlanetOwnerId, toast]);

  const filteredPlanets = useMemo(() => {
    if (filterKey === 'user') return planets.filter((planet) => planet.type === 'user');
    if (filterKey === 'wander') return planets.filter((planet) => planet.type === 'wandering');
    if (filterKey === 'featured') return planets.filter((planet) => planet.type === 'stellara' || planet.isPremium);
    return planets;
  }, [filterKey, planets]);

  const handleOpenGalaxyPanel = useCallback(() => {
    setNavOpen(true);
    setSubPanel(null);
    setActiveMenu('galaxy');
  }, []);

  const handleSearch = useCallback(async () => {
    const query = normalizeIntentText(mood);
    if (!query) {
      handleBlackholeClick();
      return;
    }

    setMood('');

    const rankedPlanet = planets
      .map((planet) => ({ planet, score: scorePlanetIntent(planet, query) }))
      .sort((a, b) => b.score - a.score)[0];

    const rankedGalaxy = discoverableGalaxies
      .map((galaxy) => ({ galaxy, score: scoreGalaxyIntent(galaxy, query) }))
      .sort((a, b) => b.score - a.score)[0];

    if (rankedGalaxy?.score > Math.max(rankedPlanet?.score ?? 0, 5) && shouldHopGalaxy(query)) {
      setCurationSignal({
        kicker: language === 'en' ? 'Portal Route' : '포털 항로',
        title: rankedGalaxy.galaxy.title || rankedGalaxy.galaxy.name,
        description: buildIntentResponse({ query, galaxy: rankedGalaxy.galaxy, language, type: 'galaxy' }),
        compact: true,
        duration: 2200,
      });
      window.setTimeout(() => {
        handleGalaxyHop(rankedGalaxy.galaxy.id, galaxyRequestRef);
      }, 220);
      return;
    }

    if (rankedPlanet?.score > 0) {
      const curatedPlanet = await curatePlanetFromQuery(rankedPlanet.planet, query);
      setCurationSignal({
        kicker: language === 'en' ? 'Matched Orbit' : '일치한 궤도',
        title: curatedPlanet.name,
        description: buildIntentResponse({ query, planet: curatedPlanet, language, type: 'planet' }),
        compact: true,
        duration: 2200,
      });
      window.setTimeout(() => {
        handlePlanetClick(curatedPlanet);
      }, 180);
      return;
    }

    if (shouldUseBlackhole(query) || shouldHopGalaxy(query)) {
      handleBlackholeClick({ query });
      return;
    }

    if (rankedGalaxy?.score > 0) {
      setCurationSignal({
        kicker: language === 'en' ? 'Nearby Galaxy' : '가까운 은하',
        title: rankedGalaxy.galaxy.title || rankedGalaxy.galaxy.name,
        description: buildIntentResponse({ query, galaxy: rankedGalaxy.galaxy, language, type: 'galaxy' }),
        compact: true,
        duration: 2200,
      });
      window.setTimeout(() => {
        handleGalaxyHop(rankedGalaxy.galaxy.id, galaxyRequestRef);
      }, 220);
      return;
    }

    handleBlackholeClick({ query });
  }, [curatePlanetFromQuery, discoverableGalaxies, handleBlackholeClick, handleGalaxyHop, handlePlanetClick, language, mood, planets]);

  const closeActivePlanet = useCallback(() => {
    setActivePlanet(null);
    setPlanetEngagement({ likes: 0, saves: 0, liked: false, saved: false });
    setHoverPlanet(null);
    setHoverGalaxy(null);
    setHoverMode((prev) => ({
      ...prev,
      active: false,
      targetLabel: '',
      targetKind: null,
      reason: '',
    }));
    setHoverModeCooldownUntil(Date.now() + 2200);
    events.emit('CLEAR_DRIFT_FOCUS');
    events.emit('ZOOM_OUT');
  }, []);

  const focusPlayingPlanet = useCallback(() => {
    const planetId = playerRef.current.pid;
    if (!planetId) return;

    const planet = planetsRef.current.find((item) => item.planetId === planetId);
    if (!planet) return;

    events.emit('CLEAR_DRIFT_FOCUS');
    setHoverMode((prev) => ({ ...prev, active: false }));
    setActivePlanet(planet);
    setNavOpen(false);
    setSubPanel(null);
    setActiveMenu(null);
    setHoverPlanet(null);
    setHoverGalaxy(null);
    events.emit('ZOOM_IN', planet.planetId);
  }, []);

  const togglePlay = useCallback(() => {
    const current = playerRef.current;
    if (!current.list.length) return;
    if (current.playing) {
      provider.pause();
      dispatch({ type: 'PAUSE' });
    } else {
      provider.play();
      dispatch({ type: 'PLAY' });
    }
  }, [provider]);

  const playAdjacent = useCallback(
    (direction) => {
      const current = playerRef.current;
      if (!current.list.length) return;
      const length = current.list.length;
      const nextIdx = direction === 'prev'
        ? (current.idx - 1 + length) % length
        : (current.idx + 1) % length;
      playTrack(current.list, nextIdx, current.pid);
    },
    [playTrack]
  );

  return (
    <>
      {isLoading && <Loading />}

      <OverlayLayout
        user={user}
        isGoogleConnected={isGoogleConnected}
        isYTConnected={isYTConnected}
        isPremium={isPremium}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        navHover={navHover}
        setNavHover={setNavHover}
        navVisible={navOpen || navHover}
        uiVisible={uiVisible}
        subPanel={subPanel}
        setSubPanel={setSubPanel}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        filterKey={filterKey}
        setFilterKey={setFilterKey}
        tuning={cosmicTuning}
        onTuningChange={handleTuningChange}
        language={language}
        onLanguageChange={setLanguage}
        authAction={authAction}
        activePlanet={activePlanet}
        player={player}
        toasts={toasts}
        refreshing={refreshing}
        onLoginGoogle={handleLogin}
        onLoginYT={handleConnectYT}
        onLogout={handleLogout}
        onSaveGalaxyProfile={handleSaveGalaxyProfile}
        onSaveFeaturedGalaxy={handleSaveFeaturedGalaxy}
        onLikePlanet={resolvePlanetOwnerId(activePlanet) ? handleLikePlanet : undefined}
        onSavePlanet={resolvePlanetOwnerId(activePlanet) ? handleSavePlanet : undefined}
        onSharePlanet={activePlanet ? handleSharePlanet : undefined}
        onShareGalaxy={handleShareGalaxy}
        onSearch={handleSearch}
        onChip={handleChipClick}
        onTrack={(index) => playTrack(playerRef.current.list, index, activePlanet?.planetId)}
        onRefresh={handleRefresh}
        onCloseHUD={closeActivePlanet}
        onFocusPlanet={focusPlayingPlanet}
        onGoPlanet={(planet) => {
          setNavOpen(false);
          setSubPanel(null);
          setActiveMenu(null);
          handlePlanetClick(planet);
        }}
        onHopGalaxy={hopToGalaxy}
        onTogglePlay={togglePlay}
        onPrev={() => playAdjacent('prev')}
        onNext={() => playAdjacent('next')}
        onShuffle={() => dispatch({ type: 'SHUF' })}
        onRepeat={() => dispatch({ type: 'REP' })}
        onVol={(value) => {
          dispatch({ type: 'VOL', v: value });
          provider.setVolume(value);
        }}
        onSeek={(pct) => provider.seek(pct)}
        mood={mood}
        setMood={setMood}
        planets={planets}
        filtered={filteredPlanets}
        settingsRef={settingsRef}
        currentGalaxyId={currentGalaxyId}
        currentGalaxyLabel={currentGalaxyContext.title}
        currentGalaxyOwnerLabel={currentGalaxyContext.ownerLabel}
        isVisitingForeignGalaxy={currentGalaxyContext.isForeign}
        onReturnHomeGalaxy={returnHomeGalaxy}
        onManualSync={handleManualSync}
        syncMeta={syncMeta}
        quotaMeta={quotaMeta}
        engagement={planetEngagement}
        discoverableGalaxies={discoverableGalaxies}
        cosmicTransition={cosmicTransition}
        hoverMode={hoverMode}
        onHoverModeToggle={setHoverModeEnabled}
        adminAccess={adminAccess}
        onOpenAdminCenter={() => setAdminCenterOpen(true)}
        rollingSignal={rollingSignal}
        runtimeSettings={runtimeSettings}
        onOpenPlanetStudio={(template = null) => {
          setPlanetStudioTemplate(template);
          setPlanetStudioOpen(true);
        }}
      />

      <CommandCenterModal
        open={adminCenterOpen}
        language={language}
        access={adminAccess}
        user={user}
        snapshot={adminSnapshot}
        loading={adminLoading}
        savingKey={adminSavingKey}
        onClose={() => setAdminCenterOpen(false)}
        onRefresh={refreshAdminSnapshot}
        onSaveFeaturedGalaxy={handleSaveFeaturedGalaxy}
        onSaveAdminUser={handleSaveAdminUser}
        onSaveNotice={handleSaveNotice}
        onDeleteNotice={handleDeleteNotice}
        onSaveDocument={handleSaveDocument}
        onSaveSettings={handleSaveSettings}
        onSavePayment={handleSavePayment}
        onSaveApiUsage={handleSaveApiUsage}
        onSaveErrorLog={handleSaveErrorLog}
      />

      <PlanetStudioModal
        open={planetStudioOpen}
        language={language}
        isPremium={isPremium}
        runtimeSettings={runtimeSettings}
        existingPlanets={planets.filter((planet) => planet.type === 'user' && planet.sourceType === 'manual')}
        saving={planetStudioSaving}
        initialDraft={planetStudioTemplate}
        onClose={() => {
          setPlanetStudioOpen(false);
          setPlanetStudioTemplate(null);
        }}
        onSave={handleCreatePlanet}
      />

      <FadePresence show={Boolean(arrivalBriefing)} duration={260}>
        <ArrivalBriefingOverlay
          briefing={arrivalBriefing}
          language={language}
          onReturnHome={returnHomeGalaxy}
          onClose={() => setArrivalBriefing(null)}
        />
      </FadePresence>

      <FadePresence show={Boolean(curationSignal && curationSignal.variant !== 'rolling_signal')} duration={240}>
        <CurationSignalCard
          signal={curationSignal}
          language={language}
          onDismiss={() => setCurationSignal(null)}
          onPrimaryAction={() => {
            curationSignal?.onPrimaryAction?.();
            setCurationSignal(null);
          }}
        />
      </FadePresence>

      <FadePresence show={!activePlanet && uiVisible} duration={520}>
        <div
          style={{
            position: 'fixed',
            bottom: 96,
            right: 24,
            zIndex: 70,
            maxWidth: 360,
            padding: '14px 16px',
            borderRadius: 16,
            background: 'rgba(5,4,18,.7)',
            border: '1px solid rgba(123,112,224,.18)',
            backdropFilter: 'blur(24px)',
          }}
        >
          <div style={{ fontSize: 10, color: 'rgba(211,204,255,.6)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 6 }}>
            {currentGalaxyContext.isForeign ? travelStatusCopy.visiting : pack.currentOrbit.title}
          </div>
          <div style={{ fontSize: 14, color: '#FAF7FF', marginBottom: 4 }}>{currentGalaxyContext.title}</div>
          {currentGalaxyContext.ownerLabel && (
            <div style={{ fontSize: 11, color: 'rgba(195,224,255,.78)', marginBottom: 6 }}>
              {travelStatusCopy.host}: {currentGalaxyContext.ownerLabel}
            </div>
          )}
          <div style={{ fontSize: 11, color: 'rgba(220,214,255,.74)', lineHeight: 1.6 }}>
            {currentGalaxyContext.description
              || (currentGalaxyContext.isForeign
                ? travelStatusCopy.foreignDescription
                : travelStatusCopy.homeDescription)}
          </div>
          {currentGalaxyContext.isForeign && (
            <button
              type="button"
              onClick={returnHomeGalaxy}
              style={{
                marginTop: 12,
                padding: '8px 12px',
                borderRadius: 999,
                border: '1px solid rgba(115,188,255,.24)',
                background: 'rgba(22,36,74,.42)',
                color: '#E7F0FF',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 11,
                letterSpacing: '.05em',
              }}
            >
              {travelStatusCopy.returnHome}
            </button>
          )}
        </div>
      </FadePresence>

      {Boolean(missingFirebaseConfig.length) && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 74,
            width: 'min(360px, calc(100vw - 48px))',
            padding: '14px 16px',
            borderRadius: 16,
            background: 'rgba(16, 10, 30, .78)',
            border: '1px solid rgba(255, 184, 107, .28)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 18px 48px rgba(0,0,0,.24)',
          }}
        >
          <div style={{ fontSize: 10, color: 'rgba(255, 209, 148, .72)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 6 }}>
            {language === 'en' ? 'Setup Notice' : '설정 안내'}
          </div>
          <div style={{ fontSize: 14, color: '#FFF4E8', marginBottom: 6 }}>
            {language === 'en'
              ? 'Firebase credentials are missing in this environment.'
              : '이 환경에는 Firebase 자격정보가 아직 없습니다.'}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255, 233, 210, .72)', lineHeight: 1.65 }}>
            {language === 'en'
              ? `Missing: ${missingFirebaseConfig.join(', ')}. You can still inspect the official and seeded galaxies, but login and social sync stay disabled until env vars are added.`
              : `누락 항목: ${missingFirebaseConfig.join(', ')}. 공식/시드 은하는 둘러볼 수 있지만, 로그인과 소셜 동기화는 환경변수를 넣기 전까지 비활성화됩니다.`}
          </div>
        </div>
      )}

      <FadePresence show={Boolean(hoverPlanet && !activePlanet && !cosmicTransition.active)} duration={240}>
        <div
          style={{
            position: 'fixed',
            left: Math.min(hoverPos.x + 18, window.innerWidth - 220),
            top: Math.max(hoverPos.y - 90, 8),
            zIndex: 60,
            background: 'rgba(3,1,16,.92)',
            border: '1px solid rgba(123,112,224,.3)',
            borderRadius: 12,
            padding: '10px 14px',
            backdropFilter: 'blur(24px)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 500, color: '#F0EEFF' }}>{getLocalizedPlanetName(hoverPlanet, language)}</div>
          <div style={{ fontSize: 10, color: 'rgba(123,112,224,.5)', marginTop: 4 }}>
            {pack.hover.land}
          </div>
        </div>
      </FadePresence>

      <FadePresence show={Boolean(hoverGalaxy && !hoverPlanet && !activePlanet && !cosmicTransition.active)} duration={240}>
        <div
          style={{
            position: 'fixed',
            left: Math.min(hoverPos.x + 18, window.innerWidth - 260),
            top: Math.max(hoverPos.y - 112, 8),
            zIndex: 60,
            width: 240,
            background: 'rgba(3,1,16,.92)',
            border: `1px solid ${hoverGalaxy?.isFeatured || hoverGalaxy?.promotionType ? 'rgba(240,192,96,.34)' : 'rgba(123,112,224,.3)'}`,
            borderRadius: 14,
            padding: '12px 14px',
            backdropFilter: 'blur(24px)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 10, color: 'rgba(155,145,255,.48)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 6 }}>
            {hoverGalaxy?.promotionType
              ? (language === 'en' ? 'Featured Route' : '프로모션 항로')
              : (language === 'en' ? 'Nearby Galaxy' : '근처 은하')}
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#F0EEFF' }}>
            {hoverGalaxy?.title || hoverGalaxy?.displayName || hoverGalaxy?.name}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(212,204,255,.62)', marginTop: 5, lineHeight: 1.5 }}>
            {hoverGalaxy?.ownerLabel || hoverGalaxy?.promotedBy || 'Listener'}
            {(hoverGalaxy?.spotlightText || hoverGalaxy?.description)
              ? ` · ${hoverGalaxy.spotlightText || hoverGalaxy.description}`
              : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {hoverGalaxy?.distanceLabel && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 8px',
                  borderRadius: 999,
                  border: '1px solid rgba(123,112,224,.22)',
                  background: 'rgba(83,74,183,.16)',
                  color: 'rgba(228,223,255,.78)',
                  fontSize: 9,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                }}
              >
                {hoverGalaxy.distanceLabel}
              </span>
            )}
            {Number.isFinite(hoverGalaxy?.stageRank) && (
              <span style={{ fontSize: 10, color: 'rgba(196,189,255,.42)' }}>
                {language === 'en' ? `Route #${hoverGalaxy.stageRank}` : `항로 #${hoverGalaxy.stageRank}`}
              </span>
            )}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(196,189,255,.52)', marginTop: 7, lineHeight: 1.45 }}>
            {formatGalaxyHoverStats(hoverGalaxy, language)}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(240, 226, 178, .76)', marginTop: 8, lineHeight: 1.55 }}>
            {hoverGalaxy?.proximityReason}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(123,112,224,.5)', marginTop: 6 }}>
            {language === 'en' ? 'Click to open a portal route.' : '클릭하면 포털 항로가 열립니다.'}
          </div>
        </div>
      </FadePresence>

      {(navOpen || subPanel) && (
        <div
          onClick={() => {
            setNavOpen(false);
            setSubPanel(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 72,
            background: 'transparent',
            backdropFilter: 'none',
            pointerEvents: 'auto',
          }}
        />
      )}
    </>
  );
}

function Loading() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#010008',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        fontFamily: 'inherit',
        zIndex: 9999,
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 300, letterSpacing: '.25em', color: '#C4BDFF' }}>
        S<em style={{ fontStyle: 'normal', color: '#9B91FF' }}>tellara</em>
      </div>
      <div style={{ width: 140, height: 1, background: 'linear-gradient(90deg,transparent,rgba(123,112,224,.5),transparent)' }} />
      <div style={{ fontSize: 11, color: 'rgba(155,145,255,.4)', letterSpacing: '.16em' }}>
        {getLanguagePack(getInitialLanguage()).system.loading}
      </div>
    </div>
  );
}
