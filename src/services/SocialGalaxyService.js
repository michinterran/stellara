import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '@config/firebase';
import { FEATURED_SIGNAL_GALAXIES, PORTAL_DISCOVERY_GALAXIES } from '@config/stellara';

function slugify(value = '') {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48);
}

function fallbackSlug(user = {}) {
  const base =
    slugify(user.displayName) ||
    slugify(user.email?.split('@')[0]) ||
    `galaxy-${String(user.uid ?? '').slice(0, 8)}`;
  return base;
}

export function createDefaultGalaxyProfile(user = {}) {
  const displayName = user.displayName?.trim() || 'Stellara Voyager';
  return {
    visibility: 'private',
    slug: fallbackSlug(user),
    title: `${displayName}'s Galaxy`,
    description: '',
    featuredPlanetIds: [],
    tags: [],
    stats: {
      likes: 0,
      visits: 0,
      landings: 0,
      resonances: 0,
      shares: 0,
    },
  };
}

function normalizeProfile(user = {}, profile = {}) {
  const defaults = createDefaultGalaxyProfile(user);
  return {
    ...defaults,
    ...profile,
    slug: slugify(profile.slug || defaults.slug) || defaults.slug,
    featuredPlanetIds: Array.isArray(profile.featuredPlanetIds) ? profile.featuredPlanetIds : defaults.featuredPlanetIds,
    tags: Array.isArray(profile.tags) ? profile.tags.slice(0, 8) : defaults.tags,
    stats: {
      ...defaults.stats,
      ...(profile.stats ?? {}),
    },
  };
}

function normalizeFeaturedGalaxy(galaxy = {}, id = '') {
  return {
    id: id || galaxy.id,
    visibility: 'public',
    isFeatured: true,
    isSeed: false,
    promotionType: galaxy.promotionType || 'brand',
    featuredOrder: galaxy.featuredOrder ?? 999,
    tags: Array.isArray(galaxy.tags) ? galaxy.tags : [],
    audienceSignals: Array.isArray(galaxy.audienceSignals) ? galaxy.audienceSignals : [],
    planets: Array.isArray(galaxy.planets) ? galaxy.planets : [],
    stats: {
      likes: 0,
      visits: 0,
      landings: 0,
      resonances: 0,
      shares: 0,
      ...(galaxy.stats ?? {}),
    },
    design: {
      theme: 'luxury',
      palette: {
        primary: '#E38CB8',
        secondary: '#F4D4AE',
        accent: '#F6CCE4',
        glow: '#EBC8F0',
      },
      surface: 'glass',
      ringStyle: 'double',
      aura: 'veil',
      particles: 'medium',
      motion: 'drift',
      scaleTier: 'hero',
      story: '',
      ...(galaxy.design ?? {}),
      palette: {
        primary: '#E38CB8',
        secondary: '#F4D4AE',
        accent: '#F6CCE4',
        glow: '#EBC8F0',
        ...(galaxy.design?.palette ?? {}),
      },
    },
    ...galaxy,
  };
}

function mergeById(primary = [], fallback = []) {
  const merged = new Map();
  [...fallback, ...primary].forEach((item) => {
    if (!item?.id) return;
    merged.set(item.id, item);
  });
  return [...merged.values()];
}

export function createDefaultFeaturedGalaxy() {
  return {
    id: '',
    slug: '',
    title: '',
    description: '',
    ownerLabel: 'Stellara Brand Studio',
    ownerId: '',
    visibility: 'public',
    status: 'draft',
    approvalStatus: 'curation_review',
    promotionType: 'brand',
    packageName: 'Brand Orbit',
    recommendedDurationDays: 30,
    promotedBy: '',
    spotlightText: '',
    isFeatured: true,
    featuredOrder: 10,
    tags: [],
    audienceSignals: [],
    planets: [],
    stats: {
      likes: 0,
      visits: 0,
      landings: 0,
      resonances: 0,
      shares: 0,
    },
    startsAt: null,
    endsAt: null,
    design: {
      theme: 'luxury',
      palette: {
        primary: '#E38CB8',
        secondary: '#F4D4AE',
        accent: '#F6CCE4',
        glow: '#EBC8F0',
      },
      surface: 'glass',
      ringStyle: 'double',
      aura: 'veil',
      particles: 'medium',
      motion: 'drift',
      scaleTier: 'hero',
      story: '',
    },
  };
}

export const SocialGalaxyService = {
  async fetchDiscoverableGalaxies({ excludeOwnerId } = {}) {
    if (!db) {
      const seededGalaxies = PORTAL_DISCOVERY_GALAXIES.filter((galaxy) => galaxy.ownerId !== excludeOwnerId);
      return seededGalaxies;
    }

    const [publicSnapshot, featuredSnapshot] = await Promise.all([
      getDocs(collection(db, 'public_galaxies')),
      getDocs(collection(db, 'featured_galaxies')).catch(() => ({ docs: [] })),
    ]);

    const liveGalaxies = publicSnapshot.docs
      .map((item) => ({ id: item.id, ...item.data(), isSeed: false }))
      .filter((galaxy) => galaxy.ownerId !== excludeOwnerId);

    const featuredGalaxies = featuredSnapshot.docs
      .map((item) => normalizeFeaturedGalaxy(item.data(), item.id))
      .filter((galaxy) => galaxy.ownerId !== excludeOwnerId && galaxy.visibility !== 'private' && galaxy.status !== 'ended');

    const seededFeaturedGalaxies = FEATURED_SIGNAL_GALAXIES.filter((galaxy) => galaxy.ownerId !== excludeOwnerId);
    const mergedFeaturedGalaxies = mergeById(featuredGalaxies, seededFeaturedGalaxies);
    const seededPublicGalaxies = PORTAL_DISCOVERY_GALAXIES
      .filter((galaxy) => !galaxy.isFeatured && !galaxy.promotionType)
      .filter((galaxy) => galaxy.ownerId !== excludeOwnerId);

    return [...mergedFeaturedGalaxies, ...seededPublicGalaxies, ...liveGalaxies];
  },

  async fetchGalaxyProfile(user = {}) {
    if (!db) return createDefaultGalaxyProfile(user);
    if (!user.uid) return createDefaultGalaxyProfile(user);
    const snapshot = await getDoc(doc(db, 'users', user.uid));
    return normalizeProfile(user, snapshot.data()?.galaxyProfile);
  },

  async ensureGalaxyProfile(user = {}) {
    if (!db) return createDefaultGalaxyProfile(user);
    if (!user.uid) return createDefaultGalaxyProfile(user);
    const profile = await this.fetchGalaxyProfile(user);
    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        galaxyProfile: profile,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return profile;
  },

  async saveGalaxyProfile(user = {}, patch = {}, planets = []) {
    if (!db) throw new Error('Firebase 설정이 없어 갤럭시 프로필을 저장할 수 없습니다.');
    if (!user.uid) throw new Error('saveGalaxyProfile requires a user uid');
    const current = await this.fetchGalaxyProfile(user);
    const nextProfile = normalizeProfile(user, {
      ...current,
      ...patch,
      stats: {
        ...(current.stats ?? {}),
        ...(patch.stats ?? {}),
      },
    });

    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        displayName: user.displayName ?? '',
        email: user.email ?? '',
        photoURL: user.photoURL ?? '',
        galaxyProfile: nextProfile,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await this.syncPublicGalaxy(user, nextProfile, planets);
    return nextProfile;
  },

  async saveFeaturedGalaxy(draft = {}) {
    if (!db) throw new Error('Firebase 설정이 없어 featured galaxy를 저장할 수 없습니다.');

    const base = createDefaultFeaturedGalaxy();
    const normalized = normalizeFeaturedGalaxy({
      ...base,
      ...draft,
      id: slugify(draft.id || draft.slug || draft.title || base.id),
      slug: slugify(draft.slug || draft.id || draft.title || base.slug),
      title: draft.title?.trim() || base.title,
      description: draft.description?.trim() || '',
      ownerLabel: draft.ownerLabel?.trim() || base.ownerLabel,
      ownerId: draft.ownerId?.trim() || slugify(draft.promotedBy || draft.ownerLabel || draft.title || 'featured'),
      promotedBy: draft.promotedBy?.trim() || '',
      spotlightText: draft.spotlightText?.trim() || '',
      status: draft.status || 'draft',
      approvalStatus: draft.approvalStatus || base.approvalStatus,
      promotionType: draft.promotionType || 'brand',
      packageName: draft.packageName || base.packageName,
      recommendedDurationDays: Number.isFinite(Number(draft.recommendedDurationDays)) ? Number(draft.recommendedDurationDays) : base.recommendedDurationDays,
      featuredOrder: Number.isFinite(Number(draft.featuredOrder)) ? Number(draft.featuredOrder) : base.featuredOrder,
      tags: Array.isArray(draft.tags) ? draft.tags : [],
      audienceSignals: Array.isArray(draft.audienceSignals) ? draft.audienceSignals : [],
      startsAt: draft.startsAt || null,
      endsAt: draft.endsAt || null,
      updatedAt: serverTimestamp(),
      createdAt: draft.createdAt ?? serverTimestamp(),
    });

    if (!normalized.id) {
      throw new Error('featured galaxy id를 만들 수 없습니다. title 또는 slug를 입력해주세요.');
    }

    await setDoc(doc(db, 'featured_galaxies', normalized.id), normalized, { merge: true });
    return normalized;
  },

  async syncPublicGalaxy(user = {}, profile = {}, planets = []) {
    if (!db) return null;
    if (!user.uid) return null;

    const publicRef = doc(db, 'public_galaxies', user.uid);
    const normalized = normalizeProfile(user, profile);

    if (normalized.visibility !== 'public') {
      await deleteDoc(publicRef).catch(() => {});
      return null;
    }

    const publicPlanets = planets.filter((planet) => planet.type === 'user' && (planet.visibility || 'public') === 'public');
    const featuredPlanets = normalized.featuredPlanetIds.length
      ? publicPlanets.filter((planet) => normalized.featuredPlanetIds.includes(planet.planetId))
      : publicPlanets.slice(0, 3);

    const payload = {
      ownerId: user.uid,
      slug: normalized.slug,
      title: normalized.title,
      description: normalized.description,
      displayName: user.displayName ?? '',
      photoURL: user.photoURL ?? '',
      tags: normalized.tags,
      visibility: normalized.visibility,
      stats: normalized.stats,
      metrics: {
        publicPlanetCount: publicPlanets.length,
        featuredPlanetCount: featuredPlanets.length,
      },
      featuredPlanets: featuredPlanets.map((planet) => ({
        planetId: planet.planetId,
        name: planet.name,
        artist: planet.artist,
        mood: planet.mood,
        genre: planet.genre,
        trackCount: planet.tracks?.length ?? 0,
      })),
      updatedAt: serverTimestamp(),
    };

    await setDoc(publicRef, payload, { merge: true });
    return payload;
  },
};
