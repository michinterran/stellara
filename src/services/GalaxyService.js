import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@config/firebase';
import {
  buildRenderablePlanet,
  getPlanetLimitSummary,
  normalizePlanetRecord,
  resolveRuntimeLimits,
  toPlanetDocument,
  validatePlanetDraft,
} from '@services/PlanetService';

const DEFAULT_SETTINGS = {
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

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function chunk(list = [], size = 10) {
  const result = [];
  for (let index = 0; index < list.length; index += size) {
    result.push(list.slice(index, index + size));
  }
  return result;
}

function buildLegacyPlanetId(ownerId, planet = {}, index = 0) {
  const base = String(planet.planetId || planet.id || `legacy_${index}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${ownerId}__${base}`.slice(0, 96);
}

function createGalaxyDocument(userId, patch = {}) {
  return {
    galaxyId: userId,
    ownerId: userId,
    name: patch.name || '',
    title: patch.title || '',
    description: patch.description || '',
    visibility: patch.visibility || 'private',
    planetIds: asArray(patch.planetIds),
    blackHoleCache: patch.blackHoleCache || {
      starUrls: [],
      lastUpdated: null,
    },
    sourceVersion: 2,
    migratedAt: patch.migratedAt || null,
    updatedAt: patch.updatedAt || null,
    createdAt: patch.createdAt || null,
  };
}

async function fetchPlanetsByIds(ids = []) {
  if (!db || !ids.length) return [];
  const snapshots = await Promise.all(
    chunk(ids, 10).map((idChunk) => getDocs(query(collection(db, 'planets'), where('planetId', 'in', idChunk))))
  );
  return snapshots.flatMap((snapshot) => snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
}

function sortPlanets(planets = []) {
  return [...planets].sort((left, right) => {
    const leftIndex = Number(left.index ?? 0);
    const rightIndex = Number(right.index ?? 0);
    if (leftIndex !== rightIndex) return leftIndex - rightIndex;
    return String(left.createdAt || '').localeCompare(String(right.createdAt || ''));
  });
}

function buildBlackHoleCache(planets = []) {
  const starUrls = planets.flatMap((planet) => asArray(planet.stars).map((star) => star?.url).filter(Boolean));
  return {
    starUrls,
    lastUpdated: serverTimestamp(),
  };
}

async function upsertGalaxyGraph({
  ownerId,
  galaxyDoc = {},
  planets = [],
  merge = true,
} = {}) {
  if (!db || !ownerId) return null;
  const batch = writeBatch(db);
  const sortedPlanets = sortPlanets(planets).map((planet, index) => normalizePlanetRecord(planet, { index, maxStars: 30 }));
  const planetIds = sortedPlanets.map((planet) => planet.planetId);

  sortedPlanets.forEach((planet, index) => {
    const ref = doc(db, 'planets', planet.planetId);
    batch.set(ref, {
      ...toPlanetDocument(planet, {
        ownerId,
        galaxyId: ownerId,
        ownerLabel: galaxyDoc.title || galaxyDoc.name || '',
        maxStars: 30,
      }),
      index,
      updatedAt: serverTimestamp(),
      createdAt: planet.createdAt ?? serverTimestamp(),
    }, { merge: true });
  });

  const galaxyRef = doc(db, 'galaxies', ownerId);
  batch.set(galaxyRef, {
    ...createGalaxyDocument(ownerId, galaxyDoc),
    planetIds,
    blackHoleCache: buildBlackHoleCache(sortedPlanets),
    updatedAt: serverTimestamp(),
    createdAt: galaxyDoc.createdAt ?? serverTimestamp(),
    migratedAt: serverTimestamp(),
  }, { merge });

  await batch.commit();
  return { planetIds };
}

export const GalaxyService = {
  getDefaultRuntimeSettings() {
    return {
      ...DEFAULT_SETTINGS,
      limits: resolveRuntimeLimits(DEFAULT_SETTINGS),
    };
  },

  async fetchRuntimeSettings() {
    const defaults = this.getDefaultRuntimeSettings();
    if (!db) return defaults;

    try {
      const snapshot = await getDoc(doc(db, 'admin_settings', 'global'));
      if (!snapshot.exists()) return defaults;
      const data = snapshot.data() || {};
      return {
        ...defaults,
        ...data,
        limits: resolveRuntimeLimits(data),
      };
    } catch (error) {
      console.warn('[GalaxyService.fetchRuntimeSettings] Error:', error);
      return defaults;
    }
  },

  async fetchGalaxySnapshot(userId, options = {}) {
    if (!userId || !db) return null;

    try {
      const viewerId = options.viewerId || null;
      const includePrivate = Boolean(options.includePrivate || (viewerId && viewerId === userId));
      const galaxyRef = doc(db, 'galaxies', userId);
      const galaxyDoc = await getDoc(galaxyRef);
      const galaxyData = galaxyDoc.exists() ? galaxyDoc.data() : {};

      let rawPlanets = [];
      const planetIds = asArray(galaxyData?.planetIds);

      if (planetIds.length) {
        rawPlanets = await fetchPlanetsByIds(planetIds);
      } else if (asArray(galaxyData?.planets).length) {
        rawPlanets = galaxyData.planets.map((planet, index) => ({
          ...planet,
          planetId: buildLegacyPlanetId(userId, planet, index),
          ownerId: userId,
          galaxyId: userId,
          sourceType: planet.type === 'user' ? 'library' : 'manual',
        }));
      }

      const normalized = sortPlanets(rawPlanets)
        .map((planet, index) => buildRenderablePlanet({
          ...planet,
          ownerId: planet.ownerId || userId,
          galaxyId: planet.galaxyId || userId,
        }, index))
        .filter((planet) => includePrivate || planet.visibility === 'public');

      const isLegacy = !planetIds.length && asArray(galaxyData?.planets).length > 0;
      if (isLegacy && includePrivate) {
        upsertGalaxyGraph({
          ownerId: userId,
          planets: normalized,
          galaxyDoc: {
            ...galaxyData,
            title: galaxyData?.title || galaxyData?.name || '',
            description: galaxyData?.description || '',
            visibility: galaxyData?.visibility || 'private',
          },
        }).catch((error) => {
          console.warn('[GalaxyService.fetchGalaxySnapshot] Legacy galaxy migration failed:', error);
        });
      }

      return {
        galaxy: createGalaxyDocument(userId, {
          ...galaxyData,
          planetIds: normalized.map((planet) => planet.planetId),
        }),
        planets: normalized,
        isLegacy,
      };
    } catch (error) {
      console.error('[GalaxyService.fetchGalaxySnapshot] Error:', error);
      throw error;
    }
  },

  async fetchGalaxy(userId, options = {}) {
    const snapshot = await this.fetchGalaxySnapshot(userId, options);
    return snapshot?.planets ?? null;
  },

  async saveGalaxy(userId, planets, options = {}) {
    if (!userId || !planets || !db) return null;
    try {
      const profile = options.profile || {};
      const existingSnapshot = await this.fetchGalaxySnapshot(userId, {
        viewerId: userId,
        includePrivate: true,
      }).catch(() => null);
      const preservedManualPlanets = (existingSnapshot?.planets || []).filter((planet) => planet.sourceType === 'manual');
      const mergedPlanets = [
        ...preservedManualPlanets,
        ...planets.map((planet) => normalizePlanetRecord({
          ...planet,
          ownerId: userId,
          galaxyId: userId,
          sourceType: planet.sourceType || 'library',
        }, { maxStars: 30 })),
      ];
      await upsertGalaxyGraph({
        ownerId: userId,
        planets: mergedPlanets,
        galaxyDoc: {
          title: profile.title || options.title || '',
          name: profile.title || options.title || '',
          description: profile.description || options.description || '',
          visibility: profile.visibility || options.visibility || 'private',
        },
      });

      return this.fetchGalaxy(userId, { viewerId: userId, includePrivate: true });
    } catch (error) {
      console.error('[GalaxyService.saveGalaxy] Error:', error);
      throw error;
    }
  },

  async createPlanet({ user, draft, isPremium = false, settings = null } = {}) {
    if (!db) throw new Error('Firebase 설정이 없어 행성을 저장할 수 없습니다.');
    if (!user?.uid) throw new Error('로그인이 필요합니다.');

    const runtimeSettings = settings || await this.fetchRuntimeSettings();
    const currentSnapshot = await this.fetchGalaxySnapshot(user.uid, {
      viewerId: user.uid,
      includePrivate: true,
    });
    const currentPlanets = currentSnapshot?.planets ?? [];
    const validation = validatePlanetDraft(draft, {
      isPremium,
      settings: runtimeSettings,
      existingPlanets: currentPlanets.filter((planet) => planet.sourceType === 'manual'),
      language: draft?.language || 'ko',
    });

    if (!validation.ok) {
      const firstError = Object.values(validation.errors)[0];
      throw new Error(firstError || '행성 초안을 저장할 수 없습니다.');
    }

    const limitSummary = getPlanetLimitSummary({ isPremium, settings: runtimeSettings });
    const nextPlanet = toPlanetDocument(validation.sanitized, {
      ownerId: user.uid,
      galaxyId: user.uid,
      ownerLabel: user?.displayName || user?.email || 'My Galaxy',
      maxStars: limitSummary.starsPerPlanet,
    });

    const mergedPlanets = sortPlanets([
      ...currentPlanets.filter((planet) => planet.planetId !== nextPlanet.planetId),
      {
        ...nextPlanet,
        tracks: nextPlanet.renderTracks,
      },
    ]).map((planet, index) => ({
      ...planet,
      index,
    }));

    await upsertGalaxyGraph({
      ownerId: user.uid,
      planets: mergedPlanets,
      galaxyDoc: {
        ...(currentSnapshot?.galaxy ?? {}),
        title: user?.galaxyProfile?.title || currentSnapshot?.galaxy?.title || `${user.displayName || 'My'} Galaxy`,
        description: user?.galaxyProfile?.description || currentSnapshot?.galaxy?.description || '',
        visibility: user?.galaxyProfile?.visibility || currentSnapshot?.galaxy?.visibility || 'private',
      },
    });

    const created = buildRenderablePlanet(nextPlanet, mergedPlanets.findIndex((planet) => planet.planetId === nextPlanet.planetId));
    return {
      planet: created,
      planets: mergedPlanets.map((planet, index) => buildRenderablePlanet(planet, index)),
      runtimeSettings,
    };
  },
};
