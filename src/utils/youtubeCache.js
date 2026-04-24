const SEARCH_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const LIBRARY_CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const TOKEN_VALIDATION_TTL_MS = 1000 * 60 * 30;
const QUOTA_BLOCK_KEY = 'stellara_yt_quota_block_until_v1';
const SEARCH_PREFIX = 'stellara_yt_search_v1';
const LIBRARY_PREFIX = 'stellara_yt_library_v1';
const TOKEN_PREFIX = 'stellara_yt_token_validation_v1';

function getSessionStorage() {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

function readJson(key) {
  const storage = getSessionStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota issues; runtime should continue without cache.
  }
}

function removeValue(key) {
  const storage = getSessionStorage();
  if (!storage) return;
  storage.removeItem(key);
}

function fingerprintToken(token = '') {
  return String(token).slice(-16) || 'anonymous';
}

function wrapCachedValue(data, maxAge) {
  if (!data) return null;
  const savedAt = Number(data.savedAt ?? 0);
  const age = Date.now() - savedAt;
  return {
    ...data,
    fresh: age >= 0 && age <= maxAge,
  };
}

function nextLocalMidnight() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime();
}

export function getCachedSearchResult(query, maxResults = 10) {
  const key = `${SEARCH_PREFIX}:${query.trim().toLowerCase()}:${maxResults}`;
  return wrapCachedValue(readJson(key), SEARCH_CACHE_TTL_MS);
}

export function setCachedSearchResult(query, maxResults = 10, tracks = []) {
  const key = `${SEARCH_PREFIX}:${query.trim().toLowerCase()}:${maxResults}`;
  writeJson(key, {
    savedAt: Date.now(),
    tracks,
  });
}

export function getCachedLibraryOrbit(userId) {
  if (!userId) return null;
  const key = `${LIBRARY_PREFIX}:${userId}`;
  return wrapCachedValue(readJson(key), LIBRARY_CACHE_TTL_MS);
}

export function setCachedLibraryOrbit(userId, planets = []) {
  if (!userId) return;
  const key = `${LIBRARY_PREFIX}:${userId}`;
  writeJson(key, {
    savedAt: Date.now(),
    planets,
  });
}

export function clearCachedLibraryOrbit(userId) {
  if (!userId) return;
  removeValue(`${LIBRARY_PREFIX}:${userId}`);
}

export function getTokenValidationCache(token) {
  if (!token) return null;
  const key = `${TOKEN_PREFIX}:${fingerprintToken(token)}`;
  return wrapCachedValue(readJson(key), TOKEN_VALIDATION_TTL_MS);
}

export function setTokenValidationCache(token, status) {
  if (!token || !status) return;
  const key = `${TOKEN_PREFIX}:${fingerprintToken(token)}`;
  writeJson(key, {
    savedAt: Date.now(),
    status,
  });
}

export function isQuotaBlocked() {
  const blockedUntil = Number(readJson(QUOTA_BLOCK_KEY)?.blockedUntil ?? 0);
  if (!blockedUntil) return false;
  if (Date.now() >= blockedUntil) {
    removeValue(QUOTA_BLOCK_KEY);
    return false;
  }
  return true;
}

export function markQuotaBlocked() {
  writeJson(QUOTA_BLOCK_KEY, {
    blockedUntil: nextLocalMidnight(),
    savedAt: Date.now(),
  });
}

export function clearQuotaBlock() {
  removeValue(QUOTA_BLOCK_KEY);
}

export function getQuotaBlockInfo() {
  const payload = readJson(QUOTA_BLOCK_KEY);
  const blockedUntil = Number(payload?.blockedUntil ?? 0);
  if (!blockedUntil) {
    return { active: false, blockedUntil: null };
  }
  if (Date.now() >= blockedUntil) {
    removeValue(QUOTA_BLOCK_KEY);
    return { active: false, blockedUntil: null };
  }
  return {
    active: true,
    blockedUntil,
    savedAt: Number(payload?.savedAt ?? 0),
  };
}

export {
  LIBRARY_CACHE_TTL_MS,
  SEARCH_CACHE_TTL_MS,
  TOKEN_VALIDATION_TTL_MS,
};
