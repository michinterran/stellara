import { getPlanetStyle } from '@utils/planetStyles';

const DEFAULT_LIMITS = {
  freePlanetMax: 3,
  plusPlanetMax: 30,
  freeStarsPerPlanet: 10,
  plusStarsPerPlanet: 30,
};

const DEFAULT_DESIGN = {
  colorPalette: 'pastel',
  planetType: 'rocky',
  hasRing: true,
  particleStyle: 'stardust',
  sizeTier: 'medium',
};

function clampNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function trimText(value = '') {
  return String(value || '').trim();
}

function slugify(value = '') {
  return trimText(value)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48);
}

export function extractYouTubeId(url = '') {
  const input = trimText(url);
  if (!input) return '';

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&?/]+)/i,
    /(?:youtu\.be\/)([^&?/]+)/i,
    /(?:youtube\.com\/shorts\/)([^&?/]+)/i,
    /(?:youtube\.com\/embed\/)([^&?/]+)/i,
    /(?:music\.youtube\.com\/watch\?v=)([^&?/]+)/i,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match?.[1]) return match[1];
  }

  return '';
}

export function isValidYouTubeUrl(url = '') {
  return Boolean(extractYouTubeId(url));
}

export function resolveRuntimeLimits(settings = {}) {
  const raw = settings?.limits ?? settings ?? {};
  return {
    freePlanetMax: clampNumber(raw.freePlanetMax, DEFAULT_LIMITS.freePlanetMax),
    plusPlanetMax: clampNumber(raw.plusPlanetMax, DEFAULT_LIMITS.plusPlanetMax),
    freeStarsPerPlanet: clampNumber(raw.freeStarsPerPlanet, DEFAULT_LIMITS.freeStarsPerPlanet),
    plusStarsPerPlanet: clampNumber(raw.plusStarsPerPlanet, DEFAULT_LIMITS.plusStarsPerPlanet),
  };
}

export function getTierLabel(isPremium = false) {
  return isPremium ? 'plus' : 'free';
}

export function getPlanetLimitSummary({ isPremium = false, settings = {} } = {}) {
  const limits = resolveRuntimeLimits(settings);
  return {
    planetMax: isPremium ? limits.plusPlanetMax : limits.freePlanetMax,
    starsPerPlanet: isPremium ? limits.plusStarsPerPlanet : limits.freeStarsPerPlanet,
    tier: getTierLabel(isPremium),
  };
}

function normalizeTags(tags = []) {
  return asArray(tags)
    .map((tag) => trimText(tag).replace(/^#+/, ''))
    .filter(Boolean)
    .slice(0, 5)
    .map((tag) => `#${tag}`);
}

function normalizeStars(stars = [], { maxStars = DEFAULT_LIMITS.freeStarsPerPlanet } = {}) {
  return asArray(stars)
    .map((star, index) => {
      const url = trimText(star?.url || star);
      if (!url || !isValidYouTubeUrl(url)) return null;
      return {
        url,
        ytId: extractYouTubeId(url),
        addedAt: star?.addedAt || new Date().toISOString(),
        order: index,
      };
    })
    .filter(Boolean)
    .slice(0, maxStars);
}

function buildUrlFromTrack(track = {}) {
  const directUrl = trimText(track?.url || '');
  if (directUrl) return directUrl;
  const ytId = trimText(track?.ytId || '');
  return ytId ? `https://www.youtube.com/watch?v=${ytId}` : '';
}

function deriveStarsFromTracks(tracks = [], { maxStars = DEFAULT_LIMITS.freeStarsPerPlanet } = {}) {
  return asArray(tracks)
    .map((track, index) => {
      const url = buildUrlFromTrack(track);
      if (!url || !isValidYouTubeUrl(url)) return null;
      return {
        url,
        ytId: extractYouTubeId(url),
        addedAt: track?.addedAt || new Date().toISOString(),
        order: index,
      };
    })
    .filter(Boolean)
    .slice(0, maxStars);
}

function buildFallbackTracks(stars = []) {
  return stars.map((star, index) => ({
    title: `Track ${index + 1}`,
    artist: 'YouTube URL',
    duration: '--:--',
    ytId: star.ytId || extractYouTubeId(star.url),
    url: star.url,
  }));
}

function normalizeTracks(tracks = [], stars = []) {
  const normalized = asArray(tracks)
    .map((track, index) => {
      const ytId = trimText(track?.ytId || extractYouTubeId(track?.url || stars[index]?.url || ''));
      if (!ytId) return null;
      return {
        title: trimText(track?.title) || `Track ${index + 1}`,
        artist: trimText(track?.artist) || 'YouTube URL',
        duration: trimText(track?.duration) || '--:--',
        ytId,
        url: trimText(track?.url || stars[index]?.url || ''),
      };
    })
    .filter(Boolean);

  return normalized.length ? normalized : buildFallbackTracks(stars);
}

export function createPlanetId({ ownerId = '', name = '' } = {}) {
  const base = slugify(name) || 'planet';
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${ownerId || 'planet'}__${base}__${suffix}`.slice(0, 96);
}

export function createDefaultPlanetDraft(language = 'ko') {
  return {
    name: '',
    description: '',
    tags: [],
    visibility: 'public',
    design: { ...DEFAULT_DESIGN },
    stars: [{ url: '' }],
    language,
  };
}

export function getStarterPlanetTemplates(language = 'ko') {
  return language === 'en'
    ? [
        {
          id: 'starter_dawn',
          name: 'Dawn Mood',
          description: 'A quiet first orbit for slow light and softer gravity.',
          tags: ['dawn', 'calm', 'lofi'],
          visibility: 'public',
          design: {
            ...DEFAULT_DESIGN,
            colorPalette: 'pastel',
            planetType: 'ice',
            hasRing: true,
            particleStyle: 'mist',
          },
          stars: [{ url: '' }],
        },
        {
          id: 'starter_focus',
          name: 'Focus Mode',
          description: 'A clean work orbit that keeps noise outside the ring.',
          tags: ['focus', 'deep-work', 'study'],
          visibility: 'public',
          design: {
            ...DEFAULT_DESIGN,
            colorPalette: 'deep',
            planetType: 'rocky',
            hasRing: true,
            particleStyle: 'trail',
          },
          stars: [{ url: '' }],
        },
        {
          id: 'starter_jazz',
          name: 'Jazz Night',
          description: 'A small late-night room with warmer light and slower air.',
          tags: ['jazz', 'night', 'lounge'],
          visibility: 'public',
          design: {
            ...DEFAULT_DESIGN,
            colorPalette: 'vivid',
            planetType: 'gas',
            hasRing: false,
            particleStyle: 'pulse',
          },
          stars: [{ url: '' }],
        },
      ]
    : [
        {
          id: 'starter_dawn',
          name: '새벽 감성',
          description: '느린 빛과 낮은 중력으로 시작하는 조용한 첫 궤도입니다.',
          tags: ['새벽', '잔잔', 'lofi'],
          visibility: 'public',
          design: {
            ...DEFAULT_DESIGN,
            colorPalette: 'pastel',
            planetType: 'ice',
            hasRing: true,
            particleStyle: 'mist',
          },
          stars: [{ url: '' }],
        },
        {
          id: 'starter_focus',
          name: '집중 모드',
          description: '잡음을 바깥으로 밀어내고 몰입만 남기는 작업 궤도입니다.',
          tags: ['집중', '작업', 'study'],
          visibility: 'public',
          design: {
            ...DEFAULT_DESIGN,
            colorPalette: 'deep',
            planetType: 'rocky',
            hasRing: true,
            particleStyle: 'trail',
          },
          stars: [{ url: '' }],
        },
        {
          id: 'starter_jazz',
          name: '재즈 나이트',
          description: '조명이 낮은 작은 방처럼, 밤 공기와 여유가 머무는 궤도입니다.',
          tags: ['재즈', '밤', '라운지'],
          visibility: 'public',
          design: {
            ...DEFAULT_DESIGN,
            colorPalette: 'vivid',
            planetType: 'gas',
            hasRing: false,
            particleStyle: 'pulse',
          },
          stars: [{ url: '' }],
        },
      ];
}

export function normalizePlanetRecord(record = {}, options = {}) {
  const maxStars = clampNumber(options.maxStars, DEFAULT_LIMITS.plusStarsPerPlanet);
  const stars = normalizeStars(record.stars || record.urls || [], { maxStars });
  const resolvedStars = stars.length ? stars : deriveStarsFromTracks(record.tracks, { maxStars });
  const index = clampNumber(record.index, options.index ?? 0);
  const planetId = trimText(record.planetId || record.id) || createPlanetId({
    ownerId: record.ownerId || record.galaxyId || 'planet',
    name: record.name,
  });
  const name = trimText(record.name) || `Planet ${index + 1}`;
  const design = {
    ...DEFAULT_DESIGN,
    ...(record.design ?? {}),
  };

  return {
    planetId,
    id: planetId,
    ownerId: trimText(record.ownerId || ''),
    galaxyId: trimText(record.galaxyId || record.ownerId || ''),
    name,
    description: trimText(record.description || ''),
    tags: normalizeTags(record.tags),
    visibility: trimText(record.visibility || 'public') || 'public',
    type: trimText(record.type || record.sourceType || 'user') || 'user',
    sourceType: trimText(record.sourceType || (record.type === 'user' ? 'library' : 'manual')) || 'manual',
    artist: trimText(record.artist || record.ownerLabel || record.displayName || ''),
    mood: trimText(record.mood || ''),
    genre: trimText(record.genre || ''),
    r: clampNumber(record.r, 8),
    index,
    stars: resolvedStars,
    tracks: normalizeTracks(record.tracks, resolvedStars),
    design,
    createdAt: record.createdAt || null,
    updatedAt: record.updatedAt || null,
  };
}

export function toPlanetDocument(draft = {}, context = {}) {
  const maxStars = clampNumber(context.maxStars, DEFAULT_LIMITS.plusStarsPerPlanet);
  const normalizedStars = normalizeStars(draft.stars, { maxStars });
  const stars = normalizedStars.length ? normalizedStars : deriveStarsFromTracks(draft.tracks, { maxStars });
  const planetId = trimText(draft.planetId || draft.id) || createPlanetId({
    ownerId: context.ownerId || draft.ownerId,
    name: draft.name,
  });

  return {
    planetId,
    ownerId: context.ownerId || trimText(draft.ownerId || ''),
    galaxyId: context.galaxyId || trimText(draft.galaxyId || context.ownerId || ''),
    name: trimText(draft.name),
    description: trimText(draft.description || ''),
    tags: normalizeTags(draft.tags),
    visibility: trimText(draft.visibility || 'public') || 'public',
    design: {
      ...DEFAULT_DESIGN,
      ...(draft.design ?? {}),
    },
    sourceType: trimText(draft.sourceType || 'manual') || 'manual',
    type: 'user',
    artist: trimText(draft.artist || context.ownerLabel || ''),
    mood: trimText(draft.mood || ''),
    genre: trimText(draft.genre || ''),
    stars,
    renderTracks: normalizeTracks(draft.tracks, stars),
    updatedAt: draft.updatedAt || null,
    createdAt: draft.createdAt || null,
  };
}

export function buildRenderablePlanet(record = {}, index = 0) {
  const normalized = normalizePlanetRecord(record, { index, maxStars: DEFAULT_LIMITS.plusStarsPerPlanet });
  const style = getPlanetStyle(index);
  const paletteGenreMap = {
    pastel: 'Pastel Orbit',
    vivid: 'Vivid Orbit',
    deep: 'Deep Orbit',
  };

  return {
    ...normalized,
    type: normalized.type || 'user',
    artist: normalized.artist || 'My Galaxy',
    mood: normalized.mood || (normalized.visibility === 'public' ? 'Open Orbit' : normalized.visibility === 'link' ? 'Shared Route' : 'Private Shelter'),
    genre: normalized.genre || paletteGenreMap[normalized.design?.colorPalette] || 'Custom Orbit',
    tracks: normalized.tracks,
    stars: normalized.stars,
    r: normalized.r || (normalized.design?.planetType === 'gas' ? 11 : normalized.design?.planetType === 'ice' ? 9 : normalized.design?.planetType === 'lava' ? 10 : 8),
    index,
    styleHex: style.hex,
  };
}

export function validatePlanetDraft(draft = {}, context = {}) {
  const { isPremium = false, settings = {}, existingPlanets = [] } = context;
  const limitSummary = getPlanetLimitSummary({ isPremium, settings });
  const errors = {};
  const trimmedName = trimText(draft.name);
  const stars = normalizeStars(draft.stars, { maxStars: limitSummary.starsPerPlanet });
  const isEditing = Boolean(draft.planetId);

  if (!trimmedName) {
    errors.name = context.language === 'en' ? 'Name your planet so the orbit can recognize it.' : '궤도가 이 행성을 기억할 수 있도록 이름을 붙여주세요.';
  } else if (trimmedName.length > 20) {
    errors.name = context.language === 'en' ? 'Planet names can be up to 20 characters.' : '행성 이름은 20자까지 입력할 수 있습니다.';
  }

  if (trimText(draft.description || '').length > 100) {
    errors.description = context.language === 'en' ? 'Keep the description within 100 characters.' : '행성 설명은 100자 안에서 적어주세요.';
  }

  if (!stars.length) {
    errors.stars = context.language === 'en' ? 'Add at least one YouTube or YouTube Music URL.' : 'YouTube 또는 YouTube Music URL을 최소 1개 넣어주세요.';
  } else if (stars.length > limitSummary.starsPerPlanet) {
    errors.stars = context.language === 'en'
      ? `This tier supports up to ${limitSummary.starsPerPlanet} tracks per planet.`
      : `이 티어에서는 행성당 최대 ${limitSummary.starsPerPlanet}곡까지 담을 수 있습니다.`;
  }

  const invalidUrlIndex = asArray(draft.stars).findIndex((star) => {
    const url = trimText(star?.url || '');
    return url && !isValidYouTubeUrl(url);
  });
  if (invalidUrlIndex >= 0) {
    errors.stars = context.language === 'en'
      ? `Track ${invalidUrlIndex + 1} is not a valid YouTube URL.`
      : `${invalidUrlIndex + 1}번째 곡 URL이 올바른 YouTube 주소가 아닙니다.`;
  }

  if (!isEditing && existingPlanets.length >= limitSummary.planetMax) {
    errors.limit = context.language === 'en'
      ? `Your current tier can hold up to ${limitSummary.planetMax} planets.`
      : `현재 티어에서는 최대 ${limitSummary.planetMax}개의 행성까지 만들 수 있습니다.`;
  }

  if (!isPremium && (draft.visibility === 'private' || draft.visibility === 'link')) {
    errors.visibility = context.language === 'en'
      ? 'Private and link-only planets open in Plus Tribe.'
      : '비공개와 링크 전용 행성은 Plus Tribe에서 열립니다.';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      ...draft,
      name: trimmedName,
      description: trimText(draft.description || ''),
      tags: normalizeTags(draft.tags),
      stars,
    },
    limitSummary,
  };
}
