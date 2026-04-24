import {
  deleteDoc,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@config/firebase';

function planetDocId({ ownerId = 'stellara', planetId = 'unknown' }) {
  return `${ownerId}__${planetId}`;
}

async function safeIncrementGalaxyStat(ownerId, field, amount = 1) {
  if (!ownerId || !db) return;
  try {
    await updateDoc(doc(db, 'public_galaxies', ownerId), {
      [`stats.${field}`]: increment(amount),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('[SocialEngagementService] Failed to increment galaxy stat:', field, error);
  }
}

export const SocialEngagementService = {
  async fetchPlanetEngagement({ ownerId, planetId, viewerId }) {
    if (!db) {
      return { likes: 0, saves: 0, liked: false, saved: false };
    }

    if (!ownerId || !planetId) {
      return { likes: 0, saves: 0, liked: false, saved: false };
    }

    const id = planetDocId({ ownerId, planetId });
    const [aggregateSnap, likeSnap, saveSnap] = await Promise.all([
      getDoc(doc(db, 'planet_stats', id)),
      viewerId ? getDoc(doc(db, 'planet_likes', `${viewerId}__${id}`)) : Promise.resolve(null),
      viewerId ? getDoc(doc(db, 'planet_saves', `${viewerId}__${id}`)) : Promise.resolve(null),
    ]);

    return {
      likes: aggregateSnap.data()?.likes ?? 0,
      saves: aggregateSnap.data()?.saves ?? 0,
      liked: Boolean(likeSnap?.exists()),
      saved: Boolean(saveSnap?.exists()),
    };
  },

  async togglePlanetLike({ viewer, ownerId, galaxyId, planet }) {
    if (!db) throw new Error('Firebase 설정이 필요합니다.');
    if (!viewer?.uid) throw new Error('로그인이 필요합니다.');
    const aggregateId = planetDocId({ ownerId, planetId: planet.planetId });
    const likeRef = doc(db, 'planet_likes', `${viewer.uid}__${aggregateId}`);
    const aggregateRef = doc(db, 'planet_stats', aggregateId);
    const existing = await getDoc(likeRef);

    if (existing.exists()) {
      await deleteDoc(likeRef);
      await setDoc(aggregateRef, {
        ownerId,
        galaxyId,
        planetId: planet.planetId,
        name: planet.name,
        likes: increment(-1),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await safeIncrementGalaxyStat(ownerId, 'likes', -1);
      return { liked: false };
    }

    await setDoc(likeRef, {
      viewerId: viewer.uid,
      ownerId,
      galaxyId,
      planetId: planet.planetId,
      createdAt: serverTimestamp(),
    });
    await setDoc(aggregateRef, {
      ownerId,
      galaxyId,
      planetId: planet.planetId,
      name: planet.name,
      likes: increment(1),
      saves: increment(0),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    await safeIncrementGalaxyStat(ownerId, 'likes', 1);
    return { liked: true };
  },

  async togglePlanetSave({ viewer, ownerId, galaxyId, planet }) {
    if (!db) throw new Error('Firebase 설정이 필요합니다.');
    if (!viewer?.uid) throw new Error('로그인이 필요합니다.');
    const aggregateId = planetDocId({ ownerId, planetId: planet.planetId });
    const saveRef = doc(db, 'planet_saves', `${viewer.uid}__${aggregateId}`);
    const aggregateRef = doc(db, 'planet_stats', aggregateId);
    const existing = await getDoc(saveRef);

    if (existing.exists()) {
      await deleteDoc(saveRef);
      await setDoc(aggregateRef, {
        ownerId,
        galaxyId,
        planetId: planet.planetId,
        name: planet.name,
        saves: increment(-1),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return { saved: false };
    }

    await setDoc(saveRef, {
      viewerId: viewer.uid,
      ownerId,
      galaxyId,
      planetId: planet.planetId,
      createdAt: serverTimestamp(),
    });
    await setDoc(aggregateRef, {
      ownerId,
      galaxyId,
      planetId: planet.planetId,
      name: planet.name,
      likes: increment(0),
      saves: increment(1),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { saved: true };
  },

  async trackGalaxyVisit({ viewer, ownerId, galaxyId, source = 'portal' }) {
    if (!db) return;
    if (!ownerId || !viewer?.uid || viewer.uid === ownerId) return;
    await setDoc(doc(db, 'galaxy_visits', `${viewer.uid}__${galaxyId}`), {
      viewerId: viewer.uid,
      ownerId,
      galaxyId,
      source,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    await safeIncrementGalaxyStat(ownerId, 'visits', 1);
  },

  async trackPlanetLanding({ viewer, ownerId, galaxyId, planet }) {
    if (!db) return;
    if (!ownerId || !viewer?.uid || viewer.uid === ownerId) return;
    await setDoc(doc(db, 'planet_landings', `${viewer.uid}__${ownerId}__${planet.planetId}`), {
      viewerId: viewer.uid,
      ownerId,
      galaxyId,
      planetId: planet.planetId,
      planetName: planet.name,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    await safeIncrementGalaxyStat(ownerId, 'landings', 1);
  },

  async trackGalaxyShare({ ownerId }) {
    if (!db) return;
    await safeIncrementGalaxyStat(ownerId, 'shares', 1);
  },
};
