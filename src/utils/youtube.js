/**
 * youtube.js
 * YouTube Data API v3 utilities
 * 
 * 저수준 API 통신 및 데이터 파싱 유틸리티만 남기고,
 * 플레이어 제어 로직은 YouTubeProvider로 이관되었습니다.
 */

import {
  clearQuotaBlock,
  getTokenValidationCache,
  isQuotaBlocked,
  markQuotaBlocked,
  setTokenValidationCache,
} from './youtubeCache';

// ─── API 설정 ────────────────────────────────────────────────
export const YT_API_KEY = (import.meta.env.VITE_YT_API_KEY ?? '').trim();
export const YT_BASE    = 'https://www.googleapis.com/youtube/v3';

// ─── 에러 코드 ───────────────────────────────────────────────
export const YT_ERRORS = Object.freeze({
  TIMEOUT:      'YT_TIMEOUT',
  AUTH_EXPIRED: 'YT_AUTH_EXPIRED',
  QUOTA:        'YT_QUOTA_EXCEEDED',
  PERMISSION:   'YT_PERMISSION_DENIED',
  API_DISABLED: 'YT_API_DISABLED',
  CHANNEL:      'YT_CHANNEL_REQUIRED',
  NO_TOKEN:     'YT_NO_TOKEN',
  NETWORK:      'YT_NETWORK_ERROR',
  UNKNOWN:      'YT_UNKNOWN',
});

// ─── 공통 fetch ──────────────────────────────────────────────
export async function ytFetch(url, { token = null, timeout = 6000 } = {}) {
  if (!token && !YT_API_KEY && url.includes('googleapis.com/youtube/v3')) {
    throw { code: YT_ERRORS.NO_TOKEN, message: 'YouTube API 키가 설정되지 않았습니다.' };
  }
  if (url.includes('googleapis.com/youtube/v3') && isQuotaBlocked()) {
    throw { code: YT_ERRORS.QUOTA, message: 'YouTube API Quota 초과 (캐시 보호 모드)', reason: 'quotaBlockedLocally' };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  let res;
  try {
    res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: ctrl.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') throw { code: YT_ERRORS.TIMEOUT,  message: 'YouTube 응답 시간 초과' };
    throw { code: YT_ERRORS.NETWORK, message: '네트워크 오류: ' + e.message };
  }
  clearTimeout(timer);
  if (!res.ok) {
    let payload = null;
    try {
      payload = await res.json();
    } catch (_) {
      payload = null;
    }

    const reason = payload?.error?.errors?.[0]?.reason ?? payload?.error?.status ?? '';
    const message = payload?.error?.message ?? `YouTube API 오류: ${res.status}`;

    if (res.status === 401) throw { code: YT_ERRORS.AUTH_EXPIRED, message, reason, status: res.status };

    if (res.status === 403) {
      if (['quotaExceeded', 'dailyLimitExceeded', 'rateLimitExceeded'].includes(reason)) {
        markQuotaBlocked();
        throw { code: YT_ERRORS.QUOTA, message: 'YouTube API Quota 초과', reason, status: res.status };
      }
      if (['insufficientPermissions', 'forbidden'].includes(reason)) {
        throw { code: YT_ERRORS.PERMISSION, message, reason, status: res.status };
      }
      if (['accessNotConfigured', 'SERVICE_DISABLED'].includes(reason)) {
        throw { code: YT_ERRORS.API_DISABLED, message, reason, status: res.status };
      }
    }

    if (res.status === 404 && message.toLowerCase().includes('channel')) {
      throw { code: YT_ERRORS.CHANNEL, message, reason, status: res.status };
    }

    throw { code: YT_ERRORS.UNKNOWN, message, reason, status: res.status };
  }
  if (url.includes('googleapis.com/youtube/v3')) {
    clearQuotaBlock();
  }
  return res.json();
}

// ─── 토큰 검증 ───────────────────────────────────────────────
export async function validateYTToken(token) {
  if (!token) return 'error';
  const cached = getTokenValidationCache(token);
  if (cached?.fresh && cached.status) return cached.status;
  if (isQuotaBlocked()) return cached?.status ?? 'quota';
  try {
    await ytFetch(`${YT_BASE}/playlists?part=id&mine=true&maxResults=1`, { token });
    setTokenValidationCache(token, 'valid');
    return 'valid';
  } catch (e) {
    if (e.code === YT_ERRORS.AUTH_EXPIRED) {
      setTokenValidationCache(token, 'expired');
      return 'expired';
    }
    if (e.code === YT_ERRORS.QUOTA) {
      setTokenValidationCache(token, 'quota');
      return 'quota';
    }
    if (e.code === YT_ERRORS.PERMISSION) {
      setTokenValidationCache(token, 'permission');
      return 'permission';
    }
    if (e.code === YT_ERRORS.API_DISABLED) {
      setTokenValidationCache(token, 'api_disabled');
      return 'api_disabled';
    }
    if (e.code === YT_ERRORS.CHANNEL) {
      setTokenValidationCache(token, 'channel');
      return 'channel';
    }
    setTokenValidationCache(token, 'error');
    return 'error';
  }
}

// ─── 파싱 유틸 (Provider에서 사용) ───────────────────────────
export function parseIsoDuration(iso) {
  if (!iso) return '3:30';
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '3:30';
  const total = (parseInt(m[1]||0)*3600) + (parseInt(m[2]||0)*60) + parseInt(m[3]||0);
  return `${Math.floor(total/60)}:${String(total%60).padStart(2,'0')}`;
}

export function parseTrackMeta(item) {
  const sn = item?.snippet ?? {};
  return {
    title:    sn.title ?? 'Unknown',
    artist:   sn.videoOwnerChannelTitle ?? sn.channelTitle ?? 'Unknown',
    duration: parseIsoDuration(item?.contentDetails?.duration),
    ytId:     item?.contentDetails?.videoId ?? null,
  };
}

export function parseSearchItemMeta(item) {
  return {
    title:    item?.snippet?.title ?? 'Unknown',
    artist:   item?.snippet?.channelTitle ?? 'Unknown',
    duration: '3:30',
    ytId:     item?.id?.videoId ?? null,
  };
}

/**
 * @deprecated YouTubeManager는 이제 YouTubeProvider로 대체되었습니다.
 * 하위 호환성을 위해 빈 객체 또는 경고를 남길 수 있습니다.
 */
export const YouTubeManager = {
  init: () => console.warn('YouTubeManager.init() is deprecated. Use MusicServiceFactory.getProvider().init()'),
};
