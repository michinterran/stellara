import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db, missingFirebaseConfig } from '@config/firebase';
import { createDefaultFeaturedGalaxy, SocialGalaxyService } from '@services/SocialGalaxyService';
import { getQuotaBlockInfo } from '@utils/youtubeCache';
import { YT_API_KEY } from '@utils/youtube';

const DEFAULT_SUPER_ADMIN_EMAILS = ['benjamin@meta.camp', 'michinterran@gmail.com'];

function readListEnv(key) {
  return String(import.meta.env[key] || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function readLowerListEnv(key) {
  return readListEnv(key).map((value) => value.toLowerCase());
}

function isoDateOnly(value = Date.now()) {
  return new Date(value).toISOString().slice(0, 10);
}

function asDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysAgo(days) {
  const date = startOfToday();
  date.setDate(date.getDate() - days);
  return date;
}

function sumBy(items = [], selector = () => 0) {
  return items.reduce((total, item) => total + (Number(selector(item)) || 0), 0);
}

function getRevenueBuckets(payments = []) {
  const now = Date.now();
  const todayStart = startOfToday().getTime();
  const weekStart = daysAgo(6).getTime();
  const monthStart = daysAgo(29).getTime();
  const yearStart = daysAgo(364).getTime();

  const amount = (payment) => Number(payment.amount || payment.total || 0) || 0;
  const timestamp = (payment) => asDate(payment.createdAt || payment.paidAt || payment.updatedAt)?.getTime() || 0;

  return {
    today: sumBy(payments.filter((payment) => timestamp(payment) >= todayStart), amount),
    week: sumBy(payments.filter((payment) => timestamp(payment) >= weekStart), amount),
    month: sumBy(payments.filter((payment) => timestamp(payment) >= monthStart), amount),
    year: sumBy(payments.filter((payment) => timestamp(payment) >= yearStart), amount),
    all: sumBy(payments.filter((payment) => timestamp(payment) <= now), amount),
  };
}

function buildSeries(items = [], selector, { days = 7 } = {}) {
  const labels = Array.from({ length: days }, (_, index) => isoDateOnly(daysAgo(days - index - 1)));
  const map = new Map(labels.map((label) => [label, 0]));

  items.forEach((item) => {
    const date = asDate(item.createdAt || item.paidAt || item.updatedAt);
    if (!date) return;
    const key = isoDateOnly(date);
    if (!map.has(key)) return;
    map.set(key, (map.get(key) || 0) + (Number(selector(item)) || 0));
  });

  return labels.map((label) => ({
    label: label.slice(5),
    value: map.get(label) || 0,
  }));
}

function normalizeAdminRole(role = 'viewer') {
  const allowed = ['super_admin', 'admin', 'editor', 'finance_manager', 'support_manager', 'viewer'];
  return allowed.includes(role) ? role : 'viewer';
}

const SECTION_SCOPES = {
  overview: ['overview'],
  galaxy: ['galaxy_ops'],
  admins: ['admins'],
  notices: ['notices'],
  content: ['content'],
  settings: ['settings'],
  audit: ['audit_logs'],
  errors: ['errors'],
  finance: ['finance'],
  api: ['api_usage'],
};

const ROLE_SCOPES = {
  super_admin: ['*'],
  admin: ['overview', 'galaxy_ops', 'notices', 'content', 'settings', 'errors', 'finance', 'api_usage', 'admins', 'audit_logs'],
  editor: ['overview', 'galaxy_ops', 'notices', 'content'],
  finance_manager: ['overview', 'finance', 'api_usage'],
  support_manager: ['overview', 'notices', 'errors', 'content'],
  viewer: ['overview'],
};

const ROLE_DETAILS = {
  super_admin: {
    label: 'Super Admin',
    scopes: ['*'],
    description: '전체 우주 운영, 권한 승인, 설정, 재무, 로그를 모두 제어합니다.',
  },
  admin: {
    label: 'Admin',
    scopes: ROLE_SCOPES.admin,
    description: '일반 운영 총괄 역할입니다. 대부분의 섹션을 다루되 최상위 소유권은 없습니다.',
  },
  editor: {
    label: 'Editor',
    scopes: ROLE_SCOPES.editor,
    description: '콘텐츠, 공지, 프로모션 메시지와 노출 운영에 집중합니다.',
  },
  finance_manager: {
    label: 'Finance Manager',
    scopes: ROLE_SCOPES.finance_manager,
    description: '결제, 수익 분석, API 비용성 지표를 중점 관리합니다.',
  },
  support_manager: {
    label: 'Support Manager',
    scopes: ROLE_SCOPES.support_manager,
    description: '공지, 에러 대응, 운영 지원 문서 흐름을 담당합니다.',
  },
  viewer: {
    label: 'Viewer',
    scopes: ROLE_SCOPES.viewer,
    description: '읽기 전용 또는 승인 대기 역할입니다.',
  },
};

const YOUTUBE_STATUS_OPTIONS = [
  { value: 'unknown', label: 'Unknown', description: '아직 상태를 확정하지 않았거나 외부 모니터링 데이터가 없는 상태입니다.' },
  { value: 'healthy', label: 'Healthy', description: 'YouTube API 연결과 응답이 정상이며 즉시 운영 가능하다는 의미입니다.' },
  { value: 'degraded', label: 'Degraded', description: '응답은 되지만 일부 기능 저하, quota 압박, 지연 또는 오류 증가가 있는 상태입니다.' },
  { value: 'paused', label: 'Paused', description: '의도적으로 사용을 중지했거나 quota/정책 문제로 운영에서 잠시 제외한 상태입니다.' },
];

const KNOWN_API_LABELS = ['youtube', 'firebase', 'ai_api', 'spotify', 'openai', 'stripe', 'lemonsqueezy', 'toss', 'kakao'];

function normalizeStatus(status = 'active') {
  const allowed = ['pending', 'active', 'suspended'];
  return allowed.includes(status) ? status : 'active';
}

function getPromotionDefaults(promotionType = 'brand') {
  if (promotionType === 'campaign') {
    return { recommendedDurationDays: 14, approvalStatus: 'fast_track', packageName: 'Campaign Burst' };
  }
  if (promotionType === 'label') {
    return { recommendedDurationDays: 30, approvalStatus: 'curation_review', packageName: 'Label Residency' };
  }
  return { recommendedDurationDays: 30, approvalStatus: 'curation_review', packageName: 'Brand Orbit' };
}

function normalizeAdminDoc(data = {}, id = '') {
  return {
    uid: id || data.uid || '',
    email: data.email || '',
    displayName: data.displayName || '',
    role: normalizeAdminRole(data.role),
    status: normalizeStatus(data.status),
    scopes: Array.isArray(data.scopes) ? data.scopes : [],
    approvedBy: data.approvedBy || '',
    approvedAt: data.approvedAt || null,
    updatedAt: data.updatedAt || null,
    createdAt: data.createdAt || null,
    source: data.source || 'firestore',
  };
}

function mergeScopes(role = 'viewer', scopes = []) {
  const merged = new Set([...(ROLE_SCOPES[role] || ROLE_SCOPES.viewer), ...(Array.isArray(scopes) ? scopes : [])]);
  return [...merged];
}

function canAccessSection(access = {}, sectionId = 'overview') {
  if (!access?.isApprovedAdmin) return false;
  if (access?.isSuperAdmin) return true;
  const grantedScopes = new Set(mergeScopes(access.role, access.scopes));
  if (grantedScopes.has('*')) return true;
  const requiredScopes = SECTION_SCOPES[sectionId] || [sectionId];
  return requiredScopes.some((scope) => grantedScopes.has(scope));
}

function formatRelativeDay(date) {
  const target = asDate(date);
  if (!target) return null;
  const today = startOfToday();
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff < 0) return `${Math.abs(diff)}d ago`;
  return `in ${diff}d`;
}

function buildActionItems({ adminUsers = [], featuredGalaxies = [], notices = [], errors = [], settings = {}, payments = [], apiUsage = [] } = {}) {
  const pendingAdmins = adminUsers.filter((item) => item.status === 'pending');
  const soonEndingPromotions = featuredGalaxies
    .filter((item) => item.status === 'active' && item.endsAt)
    .sort((a, b) => (asDate(a.endsAt)?.getTime() || 0) - (asDate(b.endsAt)?.getTime() || 0))
    .slice(0, 3);
  const activePopups = notices.filter((item) => item.status === 'active' && item.placement === 'popup');
  const activeRollingSignals = notices.filter((item) => item.status === 'active' && item.placement === 'rolling_signal');
  const emergencyErrors = errors
    .filter((item) => ['critical', 'fatal', 'error'].includes(String(item.level || '').toLowerCase()))
    .slice(0, 3);
  const lowApiEntries = apiUsage
    .filter((item) => Number(item.remainingQuota ?? item.remaining ?? 999999) <= Number(item.warningThreshold ?? 1000))
    .slice(0, 3);

  const items = [];

  if (pendingAdmins.length) {
    items.push({
      id: 'pending-admins',
      section: 'admins',
      tone: 'gold',
      title: 'Pending admin approvals',
      detail: `${pendingAdmins.length} waiting for approval`,
    });
  }

  if (soonEndingPromotions.length) {
    const target = soonEndingPromotions[0];
    items.push({
      id: 'ending-promotions',
      section: 'galaxy',
      tone: 'blue',
      title: 'Campaign ending soon',
      detail: `${target.title || target.id} ${formatRelativeDay(target.endsAt) || 'soon'}`,
    });
  }

  if (activePopups.length > 1) {
    items.push({
      id: 'popup-overlap',
      section: 'notices',
      tone: 'red',
      title: 'Multiple active popups',
      detail: `${activePopups.length} popups are live at the same time`,
    });
  }

  if (activeRollingSignals.length > 3) {
    items.push({
      id: 'rolling-signal-overload',
      section: 'notices',
      tone: 'gold',
      title: 'Too many rolling signals',
      detail: `${activeRollingSignals.length} rolling signals are active now`,
    });
  }

  if (emergencyErrors.length) {
    items.push({
      id: 'errors',
      section: 'errors',
      tone: 'red',
      title: 'Emergency errors need review',
      detail: `${emergencyErrors.length} high-severity logs are open`,
    });
  }

  if (settings.maintenanceMode) {
    items.push({
      id: 'maintenance-mode',
      section: 'settings',
      tone: 'gold',
      title: 'Maintenance mode is active',
      detail: 'Check if the lock should remain enabled',
    });
  }

  if (lowApiEntries.length) {
    items.push({
      id: 'api-quota',
      section: 'api',
      tone: 'gold',
      title: 'API quota is running low',
      detail: `${lowApiEntries[0].label || lowApiEntries[0].id} is near its limit`,
    });
  }

  if (!payments.length) {
    items.push({
      id: 'payments-seed',
      section: 'finance',
      tone: 'dim',
      title: 'Revenue feed is empty',
      detail: 'Connect or seed payment records to unlock finance analytics',
    });
  }

  return items.slice(0, 6);
}

function normalizeLocalAccess(user = {}) {
  const superAdminEmails = [...new Set([...DEFAULT_SUPER_ADMIN_EMAILS, ...readLowerListEnv('VITE_STELLARA_SUPER_ADMIN_EMAILS')])];
  const superAdminUids = readListEnv('VITE_STELLARA_SUPER_ADMIN_UIDS');
  const adminEmails = readLowerListEnv('VITE_STELLARA_ADMIN_EMAILS');
  const adminUids = readListEnv('VITE_STELLARA_ADMIN_UIDS');
  const email = String(user?.email || '').toLowerCase();
  const uid = String(user?.uid || '');

  const isSuperAdmin = Boolean(
    uid && (superAdminUids.includes(uid) || superAdminEmails.includes(email))
  );
  const isAdmin = isSuperAdmin || Boolean(
    uid && (adminUids.includes(uid) || adminEmails.includes(email))
  );

  return {
    uid,
    email: user?.email || '',
    displayName: user?.displayName || '',
    role: isSuperAdmin ? 'super_admin' : isAdmin ? 'admin' : 'viewer',
    status: isAdmin ? 'active' : 'pending',
    isSuperAdmin,
    isApprovedAdmin: isAdmin,
    source: isAdmin ? 'env' : 'local',
  };
}

function normalizeFeaturedDesign(design = {}, promotionType = 'brand') {
  const defaultsByType = {
    brand: {
      theme: 'luxury',
      palette: {
        primary: '#E38CB8',
        secondary: '#F4D4AE',
        accent: '#F6CCE4',
        glow: '#EBC8F0',
      },
    },
    campaign: {
      theme: 'broadcast',
      palette: {
        primary: '#71C7D8',
        secondary: '#B6F3F7',
        accent: '#FFE7AE',
        glow: '#92C5F8',
      },
    },
    label: {
      theme: 'editorial',
      palette: {
        primary: '#B0A6FF',
        secondary: '#DDD6FF',
        accent: '#9BC0FF',
        glow: '#C3B2FF',
      },
    },
  };

  const fallback = defaultsByType[promotionType] || defaultsByType.brand;
  return {
    theme: design.theme || fallback.theme,
    palette: {
      ...fallback.palette,
      ...(design.palette ?? {}),
    },
    surface: design.surface || 'glass',
    ringStyle: design.ringStyle || 'double',
    aura: design.aura || 'veil',
    particles: design.particles || 'medium',
    motion: design.motion || 'drift',
    scaleTier: design.scaleTier || 'hero',
    story: design.story || '',
  };
}

function normalizeNotice(data = {}, id = '') {
  return {
    id: id || data.id || '',
    title: data.title || '',
    titleEn: data.titleEn || '',
    body: data.body || '',
    bodyEn: data.bodyEn || '',
    tone: data.tone || 'info',
    status: data.status || 'draft',
    placement: data.placement || 'rolling_signal',
    ctaLabel: data.ctaLabel || '',
    ctaLabelEn: data.ctaLabelEn || '',
    targetGalaxyId: data.targetGalaxyId || '',
    targetGalaxySlug: data.targetGalaxySlug || '',
    startsAt: data.startsAt || null,
    endsAt: data.endsAt || null,
    updatedAt: data.updatedAt || null,
    createdAt: data.createdAt || null,
  };
}

function sanitizeSettingsPatch(patch = {}) {
  const {
    monitoredYoutubeStatus,
    youtubeStatusDetail,
    ...rest
  } = patch || {};

  return {
    ...rest,
    limits: {
      ...AdminService.getDefaultSettings().limits,
      ...((rest?.limits) ?? {}),
    },
  };
}

function normalizeDocument(data = {}, id = '') {
  return {
    id: id || data.id || '',
    slug: data.slug || id || '',
    title: data.title || '',
    titleEn: data.titleEn || '',
    kind: data.kind || 'general',
    body: data.body || '',
    bodyEn: data.bodyEn || '',
    status: data.status || 'draft',
    version: data.version || '1.0',
    startsAt: data.startsAt || null,
    endsAt: data.endsAt || null,
    updatedAt: data.updatedAt || null,
    createdAt: data.createdAt || null,
  };
}

function normalizePayment(data = {}, id = '') {
  return {
    id: id || data.id || '',
    provider: data.provider || 'stripe',
    userId: data.userId || '',
    userEmail: data.userEmail || '',
    amount: Number(data.amount || 0) || 0,
    currency: data.currency || 'USD',
    status: data.status || 'paid',
    productType: data.productType || 'promotion',
    promotionType: data.promotionType || 'brand',
    paidAt: data.paidAt || data.createdAt || null,
    updatedAt: data.updatedAt || null,
    createdAt: data.createdAt || null,
  };
}

function normalizeApiUsage(data = {}, id = '') {
  return {
    id: id || data.id || '',
    label: data.label || 'youtube',
    date: data.date || isoDateOnly(),
    requests: Number(data.requests || 0) || 0,
    errors: Number(data.errors || 0) || 0,
    remainingQuota: Number(data.remainingQuota || 0) || 0,
    warningThreshold: Number(data.warningThreshold || 1000) || 1000,
    updatedAt: data.updatedAt || null,
    createdAt: data.createdAt || null,
  };
}

function normalizeErrorLog(data = {}, id = '') {
  return {
    id: id || data.id || '',
    title: data.title || '',
    message: data.message || '',
    level: data.level || 'error',
    context: data.context || '',
    stack: data.stack || '',
    status: data.status || (Boolean(data.resolved) ? 'resolved' : 'pending'),
    resolved: Boolean(data.resolved),
    updatedAt: data.updatedAt || null,
    createdAt: data.createdAt || null,
  };
}

function normalizeAuditLog(data = {}, id = '') {
  return {
    id: id || data.id || '',
    actorUid: data.actorUid || '',
    actorEmail: data.actorEmail || '',
    actorName: data.actorName || '',
    action: data.action || 'unknown',
    section: data.section || 'general',
    targetId: data.targetId || '',
    payload: data.payload || {},
    createdAt: data.createdAt || null,
  };
}

function getDefaultManagedDocuments(language = 'ko') {
  return [
    { id: 'privacy-policy', slug: 'privacy-policy', kind: 'privacy', title: '개인정보처리방침', titleEn: 'Privacy Policy', body: '', bodyEn: '', status: 'draft', version: '1.0', startsAt: null, endsAt: null },
    { id: 'terms-of-service', slug: 'terms-of-service', kind: 'terms', title: '이용약관', titleEn: 'Terms of Service', body: '', bodyEn: '', status: 'draft', version: '1.0', startsAt: null, endsAt: null },
    { id: 'faq', slug: 'faq', kind: 'faq', title: '자주 묻는 질문', titleEn: 'FAQ', body: '', bodyEn: '', status: 'draft', version: '1.0', startsAt: null, endsAt: null },
    { id: 'about-stellara', slug: 'about-stellara', kind: 'about', title: 'Stellara 소개', titleEn: 'About Stellara', body: '', bodyEn: '', status: 'draft', version: '1.0', startsAt: null, endsAt: null },
  ];
}

function mergeManagedDocuments(defaults = [], docs = []) {
  const map = new Map(defaults.map((item) => [item.id, item]));
  docs.forEach((item) => {
    if (!item?.id) return;
    map.set(item.id, { ...(map.get(item.id) || {}), ...item });
  });
  return [...map.values()];
}

function isWithinWindow(item = {}) {
  const now = Date.now();
  const startsAt = asDate(item.startsAt)?.getTime() || null;
  const endsAt = asDate(item.endsAt)?.getTime() || null;
  if (startsAt && startsAt > now) return false;
  if (endsAt && endsAt < now) return false;
  return true;
}

function isYouTubeErrorLog(item = {}) {
  const haystack = [
    item.title,
    item.message,
    item.context,
    item.stack,
  ].join(' ').toLowerCase();
  return haystack.includes('youtube') || haystack.includes('yt_');
}

function deriveYouTubeStatus({ settings = {}, apiUsage = [], errors = [] } = {}) {
  if (!YT_API_KEY) return 'missing';

  const manualStatus = settings.youtubeApiStatus;
  if (manualStatus === 'paused') return 'paused';

  const quotaInfo = getQuotaBlockInfo();
  if (quotaInfo?.active) return 'degraded';

  const youtubeUsage = apiUsage
    .map((item) => normalizeApiUsage(item, item.id))
    .filter((item) => String(item.label || '').toLowerCase() === 'youtube')
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

  const recentUsage = youtubeUsage.slice(0, 3);
  const youtubeErrors = errors
    .map((item) => normalizeErrorLog(item, item.id))
    .filter(isYouTubeErrorLog)
    .filter((item) => !item.resolved);

  const hasRecentYouTubeUsage = recentUsage.length > 0;
  const hasQuotaWarning = recentUsage.some((item) => {
    const remaining = Number(item.remainingQuota || 0);
    const threshold = Number(item.warningThreshold || 1000);
    return remaining > 0 && remaining <= threshold;
  });
  const hasApiErrors = recentUsage.some((item) => Number(item.errors || 0) > 0);
  const hasRecentCriticalErrors = youtubeErrors.some((item) => ['critical', 'error'].includes(String(item.level || '').toLowerCase()));

  if (manualStatus === 'healthy') {
    return hasQuotaWarning || hasApiErrors || hasRecentCriticalErrors ? 'degraded' : 'healthy';
  }

  if (manualStatus === 'degraded') return 'degraded';

  if (hasQuotaWarning || hasApiErrors || hasRecentCriticalErrors) return 'degraded';
  if (hasRecentYouTubeUsage) return 'healthy';
  return 'unknown';
}

function buildFallbackSnapshot() {
  const defaultSettings = AdminService.getDefaultSettings();
  return {
    overview: {
      totals: {
        totalUsers: 0,
        publicGalaxies: 0,
        featuredGalaxies: 0,
        activePromotions: 0,
        approvedAdmins: 0,
        activeNotices: 0,
        activePopups: 0,
      },
      revenue: { today: 0, week: 0, month: 0, year: 0, all: 0 },
      trends: {
        revenue: buildSeries([], () => 0),
        userGrowth: buildSeries([], () => 0),
        apiUsage: buildSeries([], () => 0),
      },
      apiStatus: {
        firebase: missingFirebaseConfig.length ? 'degraded' : 'healthy',
        youtube: YT_API_KEY ? 'unknown' : 'missing',
      },
      actionItems: [],
    },
    adminUsers: [],
    users: [],
    featuredGalaxies: [],
    notices: [],
    documents: [],
    settings: {
      ...defaultSettings,
      monitoredYoutubeStatus: defaultSettings.youtubeApiStatus,
    },
    errors: [],
    auditLogs: [],
    payments: [],
    apiUsage: [],
  };
}

async function safeGetCollection(name, constraints = []) {
  if (!db) return [];
  try {
    const ref = constraints.length ? query(collection(db, name), ...constraints) : collection(db, name);
    const snapshot = await getDocs(ref);
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  } catch (error) {
    console.warn(`[AdminService] Failed to read ${name}:`, error);
    return [];
  }
}

export const AdminService = {
  getLocalAccess(user = {}) {
    return normalizeLocalAccess(user);
  },

  async fetchAdminAccess(user = {}) {
    const localAccess = normalizeLocalAccess(user);
    if (!db || !user?.uid) return localAccess;

    try {
      const snapshot = await getDoc(doc(db, 'admin_users', user.uid));
      const remote = snapshot.exists() ? normalizeAdminDoc(snapshot.data(), snapshot.id) : null;
      if (!remote) return localAccess;
      const approved = remote.status === 'active' && remote.role !== 'viewer';
      return {
        ...remote,
        isSuperAdmin: localAccess.isSuperAdmin || remote.role === 'super_admin',
        isApprovedAdmin: localAccess.isApprovedAdmin || approved,
        role: localAccess.isSuperAdmin ? 'super_admin' : remote.role,
      };
    } catch (error) {
      console.warn('[AdminService] Failed to fetch admin access:', error);
      return localAccess;
    }
  },

  async fetchCommandCenterSnapshot(user = {}) {
    if (!db) return buildFallbackSnapshot();

    const [users, publicGalaxies, featuredGalaxiesRaw, adminUsersRaw, noticesRaw, documentsRaw, settingsDocs, errors, auditLogs, payments, apiUsage] = await Promise.all([
      safeGetCollection('users'),
      safeGetCollection('public_galaxies'),
      safeGetCollection('featured_galaxies'),
      safeGetCollection('admin_users'),
      safeGetCollection('admin_notices'),
      safeGetCollection('admin_documents'),
      safeGetCollection('admin_settings'),
      safeGetCollection('admin_error_logs'),
      safeGetCollection('admin_audit_logs'),
      safeGetCollection('payments'),
      safeGetCollection('api_usage_daily'),
    ]);

    const featuredGalaxies = featuredGalaxiesRaw.map((item) => ({
      ...createDefaultFeaturedGalaxy(),
      ...getPromotionDefaults(item.promotionType),
      ...item,
      design: normalizeFeaturedDesign(item.design, item.promotionType),
    }));
    const adminUsers = adminUsersRaw.map((item) => normalizeAdminDoc(item, item.id));
    const notices = noticesRaw.map((item) => normalizeNotice(item, item.id));
    const documents = mergeManagedDocuments(getDefaultManagedDocuments(user?.language || 'ko'), documentsRaw.map((item) => normalizeDocument(item, item.id)));
    const settings = {
      ...this.getDefaultSettings(),
      ...(settingsDocs[0] || {}),
      limits: {
        ...this.getDefaultSettings().limits,
        ...((settingsDocs[0] || {}).limits ?? {}),
      },
    };
    const todayRevenue = getRevenueBuckets(payments);
    const resolvedYouTubeStatus = deriveYouTubeStatus({
      settings,
      apiUsage,
      errors,
    });
    settings.monitoredYoutubeStatus = resolvedYouTubeStatus;
    const actionItems = buildActionItems({
      adminUsers,
      featuredGalaxies,
      notices,
      errors,
      settings,
      payments,
      apiUsage,
    });

    return {
      overview: {
        totals: {
          totalUsers: users.length,
          publicGalaxies: publicGalaxies.length,
          featuredGalaxies: featuredGalaxies.length,
          activePromotions: featuredGalaxies.filter((item) => item.status === 'active').length,
          approvedAdmins: adminUsers.filter((item) => item.status === 'active' && item.role !== 'viewer').length,
          activeNotices: notices.filter((item) => item.status === 'active').length,
          activePopups: notices.filter((item) => item.placement === 'popup' && item.status === 'active').length,
        },
        revenue: todayRevenue,
        trends: {
          revenue: buildSeries(payments, (item) => item.amount || item.total || 0, { days: 7 }),
          userGrowth: buildSeries(users, () => 1, { days: 7 }),
          apiUsage: buildSeries(apiUsage, (item) => item.requests || item.totalRequests || 0, { days: 7 }),
        },
        apiStatus: {
          firebase: missingFirebaseConfig.length ? 'degraded' : 'healthy',
          youtube: resolvedYouTubeStatus,
        },
        actionItems,
      },
      adminUsers,
      users,
      featuredGalaxies,
      notices,
      documents,
      settings,
      errors: errors.map((item) => normalizeErrorLog(item, item.id)),
      auditLogs: auditLogs
        .map((item) => normalizeAuditLog(item, item.id))
        .sort((a, b) => (asDate(b.createdAt)?.getTime() || 0) - (asDate(a.createdAt)?.getTime() || 0)),
      payments: payments.map((item) => normalizePayment(item, item.id)),
      apiUsage: apiUsage.map((item) => normalizeApiUsage(item, item.id)),
    };
  },

  async fetchLiveSignals() {
    if (!db) return { popup: null, rollingSignals: [] };
    const notices = (await safeGetCollection('admin_notices'))
      .map((item) => normalizeNotice(item, item.id))
      .filter((item) => item.status === 'active' && isWithinWindow(item));

    return {
      popup: notices.find((item) => item.placement === 'popup') || null,
      rollingSignals: notices.filter((item) => item.placement === 'rolling_signal'),
    };
  },

  async logAudit({ actor, action, section, targetId, payload } = {}) {
    if (!db || !actor?.uid) return null;
    await setDoc(doc(collection(db, 'admin_audit_logs')), {
      actorUid: actor.uid,
      actorEmail: actor.email || '',
      actorName: actor.displayName || '',
      action: action || 'unknown',
      section: section || 'general',
      targetId: targetId || '',
      payload: payload || {},
      createdAt: serverTimestamp(),
    });
    return true;
  },

  async saveFeaturedGalaxy(draft = {}, actor = null) {
    const defaults = getPromotionDefaults(draft.promotionType);
    const normalized = await SocialGalaxyService.saveFeaturedGalaxy({
      ...draft,
      approvalStatus: draft.approvalStatus || defaults.approvalStatus,
      packageName: draft.packageName || defaults.packageName,
      recommendedDurationDays: Number(draft.recommendedDurationDays || defaults.recommendedDurationDays) || defaults.recommendedDurationDays,
      design: normalizeFeaturedDesign(draft.design, draft.promotionType),
    });
    await this.logAudit({
      actor,
      action: 'save_featured_galaxy',
      section: 'galaxy_ops',
      targetId: normalized.id,
      payload: {
        title: normalized.title,
        promotionType: normalized.promotionType,
        status: normalized.status,
        approvalStatus: normalized.approvalStatus,
      },
    });
    return normalized;
  },

  async saveNotice(draft = {}, actor = null) {
    if (!db) throw new Error('Firebase 설정이 없어 notice를 저장할 수 없습니다.');
    const id = draft.id || `notice_${Date.now()}`;
    const normalized = normalizeNotice({
      ...draft,
      updatedAt: serverTimestamp(),
      createdAt: draft.createdAt ?? serverTimestamp(),
    }, id);
    await setDoc(doc(db, 'admin_notices', id), normalized, { merge: true });
    await this.logAudit({
      actor,
      action: 'save_notice',
      section: 'notices',
      targetId: id,
      payload: {
        title: normalized.title,
        titleEn: normalized.titleEn,
        placement: normalized.placement,
        status: normalized.status,
      },
    });
    return normalized;
  },

  async deleteNotice(id, actor = null) {
    if (!db) throw new Error('Firebase 설정이 없어 notice를 삭제할 수 없습니다.');
    if (!id) throw new Error('삭제할 notice id가 필요합니다.');
    await deleteDoc(doc(db, 'admin_notices', id));
    await this.logAudit({ actor, action: 'delete_notice', section: 'notices', targetId: id, payload: {} });
    return true;
  },

  async saveDocument(draft = {}, actor = null) {
    if (!db) throw new Error('Firebase 설정이 없어 document를 저장할 수 없습니다.');
    const id = draft.id || draft.slug || `document_${Date.now()}`;
    const normalized = normalizeDocument({
      ...draft,
      slug: draft.slug || id,
      updatedAt: serverTimestamp(),
      createdAt: draft.createdAt ?? serverTimestamp(),
    }, id);
    await setDoc(doc(db, 'admin_documents', id), normalized, { merge: true });
    await this.logAudit({
      actor,
      action: 'save_document',
      section: 'content',
      targetId: id,
      payload: {
        title: normalized.title,
        titleEn: normalized.titleEn,
        slug: normalized.slug,
        version: normalized.version,
      },
    });
    return normalized;
  },

  async saveSettings(patch = {}, actor = null) {
    if (!db) throw new Error('Firebase 설정이 없어 settings를 저장할 수 없습니다.');
    const safePatch = sanitizeSettingsPatch(patch);
    const payload = {
      ...safePatch,
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'admin_settings', 'global'), payload, { merge: true });
    await this.logAudit({ actor, action: 'save_settings', section: 'settings', targetId: 'global', payload: safePatch });
    return payload;
  },

  async saveAdminUser(draft = {}, actor = null) {
    if (!db) throw new Error('Firebase 설정이 없어 admin user를 저장할 수 없습니다.');
    let resolvedUid = draft.uid;
    if (!resolvedUid && draft.email) {
      const users = await safeGetCollection('users');
      const matchedUser = users.find((item) => String(item.email || '').toLowerCase() === String(draft.email || '').toLowerCase());
      resolvedUid = matchedUser?.id || matchedUser?.uid || '';
    }
    if (!resolvedUid) throw new Error('관리자 지정에는 UID가 필요합니다. 먼저 해당 사용자가 한 번 로그인해야 합니다.');
    const normalized = normalizeAdminDoc({
      ...draft,
      uid: resolvedUid,
      role: normalizeAdminRole(draft.role),
      status: normalizeStatus(draft.status),
      updatedAt: serverTimestamp(),
      createdAt: draft.createdAt ?? serverTimestamp(),
      approvedBy: actor?.uid || draft.approvedBy || '',
      approvedAt: draft.status === 'active' ? (draft.approvedAt ?? serverTimestamp()) : null,
    }, resolvedUid);
    await setDoc(doc(db, 'admin_users', resolvedUid), normalized, { merge: true });
    await this.logAudit({
      actor,
      action: 'save_admin_user',
      section: 'admins',
      targetId: resolvedUid,
      payload: { role: normalized.role, status: normalized.status, email: normalized.email },
    });
    return normalized;
  },

  async savePayment(draft = {}, actor = null) {
    if (!db) throw new Error('Firebase 설정이 없어 payment를 저장할 수 없습니다.');
    const id = draft.id || `payment_${Date.now()}`;
    const normalized = normalizePayment({
      ...draft,
      updatedAt: serverTimestamp(),
      createdAt: draft.createdAt ?? serverTimestamp(),
    }, id);
    await setDoc(doc(db, 'payments', id), normalized, { merge: true });
    await this.logAudit({ actor, action: 'save_payment', section: 'finance', targetId: id, payload: { provider: normalized.provider, amount: normalized.amount, promotionType: normalized.promotionType } });
    return normalized;
  },

  async saveApiUsage(draft = {}, actor = null) {
    if (!db) throw new Error('Firebase 설정이 없어 api usage를 저장할 수 없습니다.');
    const id = draft.id || `${draft.label || 'api'}_${draft.date || isoDateOnly()}`;
    const normalized = normalizeApiUsage({
      ...draft,
      updatedAt: serverTimestamp(),
      createdAt: draft.createdAt ?? serverTimestamp(),
    }, id);
    await setDoc(doc(db, 'api_usage_daily', id), normalized, { merge: true });
    await this.logAudit({ actor, action: 'save_api_usage', section: 'api_usage', targetId: id, payload: { label: normalized.label, requests: normalized.requests } });
    return normalized;
  },

  async saveErrorLog(draft = {}, actor = null) {
    if (!db) throw new Error('Firebase 설정이 없어 error log를 저장할 수 없습니다.');
    const id = draft.id || `error_${Date.now()}`;
    const normalized = normalizeErrorLog({
      ...draft,
      updatedAt: serverTimestamp(),
      createdAt: draft.createdAt ?? serverTimestamp(),
    }, id);
    await setDoc(doc(db, 'admin_error_logs', id), normalized, { merge: true });
    await this.logAudit({ actor, action: 'save_error_log', section: 'errors', targetId: id, payload: { title: normalized.title, level: normalized.level, resolved: normalized.resolved } });
    return normalized;
  },

  async captureClientError(errorPayload = {}, actor = null) {
    if (!db) return null;
    const fingerprint = [
      errorPayload.title || '',
      errorPayload.message || '',
      errorPayload.context || '',
    ].join('|').slice(0, 240);

    return this.saveErrorLog({
      ...errorPayload,
      context: errorPayload.context || 'client_runtime',
      level: errorPayload.level || 'error',
      fingerprint,
      resolved: false,
    }, actor);
  },

  getDefaultNotice(language = 'ko') {
    return {
      id: '',
      title: 'Stellara 공지',
      titleEn: 'Stellara Notice',
      body: '',
      bodyEn: '',
      tone: 'info',
      status: 'draft',
      placement: 'rolling_signal',
      ctaLabel: '지금 워프',
      ctaLabelEn: 'Warp now',
      targetGalaxyId: '',
      targetGalaxySlug: '',
      startsAt: null,
      endsAt: null,
    };
  },

  getDefaultDocument(language = 'ko') {
    return {
      id: '',
      slug: '',
      title: '새 문서',
      titleEn: 'New Document',
      kind: 'general',
      body: '',
      bodyEn: '',
      status: 'draft',
      version: '1.0',
      startsAt: null,
      endsAt: null,
    };
  },

  getManagedDocumentTemplates(language = 'ko') {
    return getDefaultManagedDocuments(language);
  },

  getDefaultPayment() {
    return {
      id: '',
      provider: 'stripe',
      userId: '',
      userEmail: '',
      amount: 0,
      currency: 'USD',
      status: 'paid',
      productType: 'promotion',
      promotionType: 'brand',
      paidAt: new Date().toISOString(),
    };
  },

  getDefaultApiUsage() {
    return {
      id: '',
      label: 'youtube',
      date: isoDateOnly(),
      requests: 0,
      errors: 0,
      remainingQuota: 0,
      warningThreshold: 1000,
    };
  },

  getDefaultErrorLog() {
    return {
      id: '',
      title: '',
      message: '',
      level: 'error',
      context: '',
      stack: '',
      status: 'pending',
      resolved: false,
    };
  },

  getDefaultSettings() {
    return {
      maintenanceMode: false,
      popupEnabled: true,
      supportEmail: '',
      youtubeApiStatus: 'unknown',
      apiNotes: '',
      universeEditLock: false,
      limits: {
        freePlanetMax: 3,
        plusPlanetMax: 30,
        freeStarsPerPlanet: 10,
        plusStarsPerPlanet: 30,
      },
    };
  },

  getLocalizedNoticeText(notice = {}, language = 'ko') {
    if (language === 'en') {
      return {
        title: notice.titleEn || notice.title || '',
        body: notice.bodyEn || notice.body || '',
        ctaLabel: notice.ctaLabelEn || notice.ctaLabel || 'Warp now',
      };
    }
    return {
      title: notice.title || notice.titleEn || '',
      body: notice.body || notice.bodyEn || '',
      ctaLabel: notice.ctaLabel || notice.ctaLabelEn || '지금 워프',
    };
  },

  normalizeFeaturedDesign,
  getRoleDetails() {
    return ROLE_DETAILS;
  },
  getYouTubeStatusOptions() {
    return YOUTUBE_STATUS_OPTIONS;
  },
  getKnownApiLabels() {
    return KNOWN_API_LABELS;
  },
  generateCommandDeskResponse(snapshot = {}, prompt = '', language = 'ko') {
    const query = String(prompt || '').toLowerCase().trim();
    const overview = snapshot?.overview || {};
    const totals = overview?.totals || {};
    const topPayments = (snapshot?.payments || []).slice(0, 3);
    const topErrors = (snapshot?.errors || []).filter((item) => !item.resolved).slice(0, 3);
    const topSignals = (snapshot?.notices || []).filter((item) => item.status === 'active').slice(0, 3);

    if (!query) {
      return language === 'en'
        ? 'Ask about revenue, active promotions, pending admins, notices, API pressure, or recent errors. This desk summarizes the current console snapshot.'
        : '매출, 활성 프로모션, 승인 대기 관리자, 공지, API 압박, 최근 에러 등에 대해 물어보세요. 이 데스크는 현재 콘솔 스냅샷을 기준으로 요약합니다.';
    }

    if (query.includes('매출') || query.includes('revenue') || query.includes('payment')) {
      return language === 'en'
        ? `Revenue snapshot: today ${pickCurrencyValue(overview?.revenue?.today)}, week ${pickCurrencyValue(overview?.revenue?.week)}, month ${pickCurrencyValue(overview?.revenue?.month)}. Recent payments: ${topPayments.map((item) => `${item.provider}:${item.amount}`).join(', ') || 'none'}.`
        : `매출 요약입니다. 오늘 ${pickCurrencyValue(overview?.revenue?.today)}, 이번 주 ${pickCurrencyValue(overview?.revenue?.week)}, 이번 달 ${pickCurrencyValue(overview?.revenue?.month)} 입니다. 최근 결제는 ${topPayments.map((item) => `${item.provider}:${item.amount}`).join(', ') || '없음'} 입니다.`;
    }

    if (query.includes('관리자') || query.includes('admin')) {
      return language === 'en'
        ? `Approved admins: ${totals.approvedAdmins || 0}. Pending approvals: ${(snapshot?.adminUsers || []).filter((item) => item.status === 'pending').length}.`
        : `승인된 관리자는 ${totals.approvedAdmins || 0}명이고, 승인 대기 관리자는 ${(snapshot?.adminUsers || []).filter((item) => item.status === 'pending').length}명입니다.`;
    }

    if (query.includes('공지') || query.includes('signal') || query.includes('notice') || query.includes('popup')) {
      return language === 'en'
        ? `Active notice routes: ${topSignals.map((item) => `${item.placement}:${item.title}`).join(', ') || 'none'}.`
        : `현재 활성 신호는 ${topSignals.map((item) => `${item.placement}:${item.title}`).join(', ') || '없음'} 입니다.`;
    }

    if (query.includes('에러') || query.includes('error')) {
      return language === 'en'
        ? `Open errors: ${topErrors.map((item) => `${item.level}:${item.title || item.message}`).join(', ') || 'none'}.`
        : `미해결 에러는 ${topErrors.map((item) => `${item.level}:${item.title || item.message}`).join(', ') || '없음'} 입니다.`;
    }

    if (query.includes('api') || query.includes('쿼터')) {
      const recentApi = (snapshot?.apiUsage || []).slice(0, 5);
      return language === 'en'
        ? `API status: Firebase ${overview?.apiStatus?.firebase || 'unknown'}, YouTube ${overview?.apiStatus?.youtube || 'unknown'}. Recent labels: ${recentApi.map((item) => `${item.label}:${item.requests}`).join(', ') || 'none'}.`
        : `API 상태는 Firebase ${overview?.apiStatus?.firebase || 'unknown'}, YouTube ${overview?.apiStatus?.youtube || 'unknown'} 입니다. 최근 사용량은 ${recentApi.map((item) => `${item.label}:${item.requests}`).join(', ') || '없음'} 입니다.`;
    }

    return language === 'en'
      ? `Overview: users ${totals.totalUsers || 0}, public galaxies ${totals.publicGalaxies || 0}, featured galaxies ${totals.featuredGalaxies || 0}, active promotions ${totals.activePromotions || 0}.`
      : `현재 개요는 사용자 ${totals.totalUsers || 0}명, 공개 은하 ${totals.publicGalaxies || 0}개, featured 은하 ${totals.featuredGalaxies || 0}개, 활성 프로모션 ${totals.activePromotions || 0}개입니다.`;
  },
  canAccessSection,
  getVisibleSections(access = {}) {
    return Object.keys(SECTION_SCOPES).filter((sectionId) => canAccessSection(access, sectionId));
  },
};

function pickCurrencyValue(value = 0) {
  return `$${Number(value || 0).toLocaleString('en-US')}`;
}
