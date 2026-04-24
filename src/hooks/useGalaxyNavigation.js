import { useCallback, useMemo, useState } from 'react';
import { getCachedLibraryOrbit } from '@utils/youtubeCache';
import { GalaxyService } from '@services/GalaxyService';
import { SocialEngagementService } from '@services/SocialEngagementService';
import {
  getCuratedGalaxy,
  getSeededPublicGalaxy,
  withIndexes,
} from '@config/stellara';
import { events } from '@utils/StellaraEvents';

const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
export const OFFICIAL_GALAXY_ID = 'stellara_official';

function createGalaxyState({
  id = OFFICIAL_GALAXY_ID,
  title = 'Stellara Official',
  ownerLabel = 'Stellara Curator',
  description = '서비스 철학을 가장 잘 보여주는 기본 발견 은하계',
  isForeign = false,
} = {}) {
  return { id, title, ownerLabel, description, isForeign };
}

function getPromotionCopy(galaxy, language = 'ko') {
  const type = galaxy?.promotionType;
  if (!type) return null;

  const copy = {
    en: {
      brand: {
        kicker: 'Brand Portal',
        transitionTitle: 'Opening a branded route inside the portal.',
        transitionDescription: 'A featured brand galaxy is aligning with your current orbit.',
        arrivalDescription: `${galaxy?.promotedBy || galaxy?.ownerLabel || 'A brand partner'} has opened a curated route matched to your current listening gravity.`,
      },
      campaign: {
        kicker: 'Campaign Portal',
        transitionTitle: 'Opening a limited campaign route.',
        transitionDescription: 'A time-bound event galaxy is moving closer to your current orbit.',
        arrivalDescription: `${galaxy?.promotedBy || galaxy?.ownerLabel || 'A live campaign'} is now active as a temporary orbit inside Stellara.`,
      },
      label: {
        kicker: 'Label Portal',
        transitionTitle: 'Opening a label-curated route.',
        transitionDescription: 'A label galaxy is tuning itself to your current orbit.',
        arrivalDescription: `${galaxy?.promotedBy || galaxy?.ownerLabel || 'A label curator'} has arranged this route for listeners who share a nearby taste constellation.`,
      },
    },
    ko: {
      brand: {
        kicker: '브랜드 관문',
        transitionTitle: '브랜드 은하로 향하는 공식 항로를 엽니다.',
        transitionDescription: '현재 취향 궤도에 맞춘 브랜드 은하가 가까워지고 있습니다.',
        arrivalDescription: `${galaxy?.promotedBy || galaxy?.ownerLabel || '브랜드 파트너'}가 지금의 청취 중력에 맞춰 큐레이션한 공식 항로가 열렸습니다.`,
      },
      campaign: {
        kicker: '캠페인 관문',
        transitionTitle: '한정 캠페인 은하로 향하는 항로를 엽니다.',
        transitionDescription: '지금 열려 있는 이벤트 은하가 현재 궤도에 맞춰 정렬되고 있습니다.',
        arrivalDescription: `${galaxy?.promotedBy || galaxy?.ownerLabel || '라이브 캠페인'}이 Stellara 안에서 기간 한정 궤도로 열렸습니다.`,
      },
      label: {
        kicker: '레이블 관문',
        transitionTitle: '레이블 큐레이션 은하로 향하는 항로를 엽니다.',
        transitionDescription: '가까운 취향 성좌를 따라 레이블 은하가 응답하고 있습니다.',
        arrivalDescription: `${galaxy?.promotedBy || galaxy?.ownerLabel || '레이블 큐레이터'}가 비슷한 청취 결을 가진 탐험자를 위해 이 항로를 정렬했습니다.`,
      },
    },
  };

  return copy[language]?.[type] ?? null;
}

export function useGalaxyNavigation({
  user,
  language,
  packSystem,
  discoverableGalaxies,
  toast,
  syncPlanetsToEngine,
  appendWanderingSignals,
  resetPlayer,
  clearActivePlanet,
  closePanelsAfterHop,
  setProfileMiniOpen,
  setCosmicTransition,
  setArrivalBriefing,
}) {
  const [currentGalaxy, setCurrentGalaxy] = useState(() => createGalaxyState());
  const currentGalaxyId = currentGalaxy.id;

  const resolveGalaxySnapshot = useCallback(
    async (targetId) => {
      const isForeign = Boolean(user?.uid && targetId !== user.uid && targetId !== OFFICIAL_GALAXY_ID);
      const curatedGalaxy = getCuratedGalaxy(targetId);
      if (curatedGalaxy) {
        return {
          planets: withIndexes(curatedGalaxy.planets),
          galaxy: createGalaxyState({
            id: targetId,
            title: curatedGalaxy.name,
            ownerLabel: language === 'en' ? 'Stellara Curator' : 'Stellara 큐레이터',
            description: curatedGalaxy.description || '',
            isForeign: false,
          }),
        };
      }

      const seededGalaxy = getSeededPublicGalaxy(targetId);
      if (seededGalaxy) {
        return {
          planets: withIndexes(seededGalaxy.planets),
          galaxy: createGalaxyState({
            id: targetId,
            title: seededGalaxy.title,
            ownerLabel: seededGalaxy.ownerLabel || '',
            description: seededGalaxy.description || '',
            isForeign,
          }),
        };
      }

      if (user?.uid && targetId === user.uid) {
        const cachedLibrary = getCachedLibraryOrbit(user.uid);
        const storedGalaxy = await GalaxyService.fetchGalaxy(user.uid, {
          viewerId: user.uid,
          includePrivate: true,
        }).catch(() => null);
        const sourcePlanets = cachedLibrary?.planets?.length
          ? cachedLibrary.planets
          : (storedGalaxy?.length ? storedGalaxy : []);

        if (!sourcePlanets.length) {
          toast(
            language === 'en'
              ? 'Your home galaxy is still empty. Connect or sync your library first.'
              : '내 은하가 아직 비어 있습니다. 라이브러리를 연결하거나 동기화해주세요.'
          );
          return null;
        }

        return {
          planets: withIndexes(sourcePlanets),
          galaxy: createGalaxyState({
            id: targetId,
            title: user.galaxyProfile?.title || `${user.displayName || packSystem.me} Galaxy`,
            ownerLabel: user.displayName || '',
            description: user.galaxyProfile?.description || '',
            isForeign: false,
          }),
        };
      }

      try {
        const data = await GalaxyService.fetchGalaxy(targetId, { viewerId: user?.uid });
        if (!data?.length) {
          toast(packSystem.privateGalaxyEmpty);
          return null;
        }

        const liveGalaxy = discoverableGalaxies.find((galaxy) => galaxy.id === targetId);
        return {
          planets: withIndexes(data),
          galaxy: createGalaxyState({
            id: targetId,
            title: liveGalaxy?.title
              || liveGalaxy?.name
              || (language === 'en' ? `${targetId}'s Galaxy` : `${targetId}의 Galaxy`),
            ownerLabel: liveGalaxy?.displayName || '',
            description: liveGalaxy?.description || '',
            isForeign,
          }),
        };
      } catch (error) {
        console.error('[useGalaxyNavigation] Failed to load galaxy:', error);
        toast(packSystem.galaxyLoadFailed);
        return null;
      }
    },
    [discoverableGalaxies, language, packSystem.galaxyLoadFailed, packSystem.me, packSystem.privateGalaxyEmpty, toast, user]
  );

  const loadGalaxy = useCallback(
    async (targetId, requestIdRef) => {
      requestIdRef.current += 1;
      const requestId = requestIdRef.current;

      const snapshot = await resolveGalaxySnapshot(targetId);
      if (!snapshot) return false;
      if (requestIdRef.current !== requestId) return false;

      setCurrentGalaxy(snapshot.galaxy);
      clearActivePlanet();
      resetPlayer();
      syncPlanetsToEngine(snapshot.planets);

      toast(packSystem.galaxyEntered(snapshot.galaxy.title || packSystem.unknownGalaxy));
      appendWanderingSignals(requestId);
      return true;
    },
    [appendWanderingSignals, clearActivePlanet, packSystem, resetPlayer, resolveGalaxySnapshot, syncPlanetsToEngine, toast]
  );

  const resolvePreferredHomeGalaxyId = useCallback(async () => {
    if (!user?.uid) return OFFICIAL_GALAXY_ID;

    const cachedLibrary = getCachedLibraryOrbit(user.uid);
    if (cachedLibrary?.planets?.length) return user.uid;

    try {
      const storedGalaxy = await GalaxyService.fetchGalaxy(user.uid, {
        viewerId: user.uid,
        includePrivate: true,
      });
      if (storedGalaxy?.length) return user.uid;
    } catch (error) {
      console.warn('[useGalaxyNavigation] Failed to inspect home galaxy before return:', error);
    }

    return OFFICIAL_GALAXY_ID;
  }, [user?.uid]);

  const handleGalaxyHop = useCallback(
    async (targetId, requestIdRef) => {
      const resolvedTargetId = user?.uid && targetId === user.uid
        ? await resolvePreferredHomeGalaxyId()
        : targetId;
      const curatedGalaxy = getCuratedGalaxy(resolvedTargetId);
      const seededGalaxy = getSeededPublicGalaxy(resolvedTargetId);
      const liveGalaxy = discoverableGalaxies.find((galaxy) => galaxy.id === resolvedTargetId);
      const isReturningHome = Boolean(user?.uid && resolvedTargetId === user.uid);
      const isFallbackHome = Boolean(
        user?.uid && targetId === user.uid && resolvedTargetId === OFFICIAL_GALAXY_ID
      );
      const label = seededGalaxy?.title
        || curatedGalaxy?.name
        || (isReturningHome ? (user?.galaxyProfile?.title || `${user?.displayName || packSystem.me} Galaxy`) : null)
        || liveGalaxy?.title
        || liveGalaxy?.name
        || (language === 'en' ? `${resolvedTargetId}'s Galaxy` : `${resolvedTargetId}의 Galaxy`);
      const ownerLabel = seededGalaxy?.ownerLabel
        || liveGalaxy?.displayName
        || (curatedGalaxy
          ? (language === 'en' ? 'Stellara Curator' : 'Stellara 큐레이터')
          : (user?.uid === resolvedTargetId ? (user.displayName || '') : resolvedTargetId));
      const description = seededGalaxy?.description
        || (isReturningHome
          ? (language === 'en'
            ? 'Your own orbit is reforming from the playlists you connected and saved.'
            : '당신이 연결하고 저장한 플레이리스트들이 다시 홈 궤도로 정렬되고 있습니다.')
          : null)
        || liveGalaxy?.description
        || curatedGalaxy?.description
        || (language === 'en'
          ? 'A new orbit is settling around you.'
          : '새로운 궤도가 천천히 주위를 감싸고 있습니다.');
      const isForeign = Boolean(
        user?.uid && resolvedTargetId !== user.uid && resolvedTargetId !== OFFICIAL_GALAXY_ID
      );
      const promotionMeta = getPromotionCopy(seededGalaxy || liveGalaxy, language);

      setCosmicTransition({
        active: true,
        type: 'portal',
        kicker: promotionMeta?.kicker || (language === 'en' ? 'Portal Transit' : '우주 관문 이동'),
        title: promotionMeta?.transitionTitle || (language === 'en' ? 'Opening a route toward another galaxy.' : '다른 은하로 향하는 항로를 열고 있습니다.'),
        description: promotionMeta?.transitionDescription || (language === 'en'
          ? 'The current orbit is dissolving and a new field of planets is aligning.'
          : '현재 궤도를 접고, 새로운 행성군이 정렬되고 있습니다.'),
        target: label,
      });
      setProfileMiniOpen(false);
      events.emit('ZOOM_OUT');
      await delay(820);
      const didLoad = await loadGalaxy(resolvedTargetId, requestIdRef);
      if (!didLoad) {
        setCosmicTransition({ active: false, type: null });
        return false;
      }
      if (user?.uid && resolvedTargetId && !getCuratedGalaxy(resolvedTargetId) && resolvedTargetId !== user.uid) {
        SocialEngagementService.trackGalaxyVisit({
          viewer: user,
          ownerId: resolvedTargetId,
          galaxyId: resolvedTargetId,
          source: 'portal',
        }).catch((error) => {
          console.warn('[useGalaxyNavigation] Failed to track galaxy visit:', error);
        });
      }
      await delay(220);
      setCosmicTransition({ active: false, type: null });
      setArrivalBriefing({
        title: label,
        ownerLabel,
        description: isFallbackHome
          ? (language === 'en'
            ? 'Your personal orbit is still empty, so Stellara has guided you back to the official discovery galaxy for now.'
            : '개인 은하가 아직 비어 있어, 지금은 Stellara 공식 발견 은하로 안전하게 복귀했습니다.')
          : isReturningHome
            ? (language === 'en'
              ? 'Your own orbit has re-formed. The playlists you connected are gathering back into place.'
              : '당신의 홈 궤도가 다시 정렬되었습니다. 연결한 플레이리스트들이 제자리로 돌아오고 있습니다.')
            : (promotionMeta?.arrivalDescription || description),
        isForeign,
        compact: true,
      });
      closePanelsAfterHop();
      return true;
    },
    [
      closePanelsAfterHop,
      discoverableGalaxies,
      language,
      loadGalaxy,
      packSystem.me,
      resolvePreferredHomeGalaxyId,
      setArrivalBriefing,
      setCosmicTransition,
      setProfileMiniOpen,
      user,
    ]
  );

  const currentGalaxyContext = useMemo(() => {
    if (currentGalaxyId === OFFICIAL_GALAXY_ID) {
      const officialGalaxy = getCuratedGalaxy(OFFICIAL_GALAXY_ID);
      return {
        title: currentGalaxy.title,
        ownerLabel: currentGalaxy.ownerLabel,
        description: officialGalaxy?.description || currentGalaxy.description || '',
        isForeign: false,
      };
    }

    if (user?.uid && currentGalaxyId === user.uid) {
      return {
        title: user.galaxyProfile?.title || currentGalaxy.title || `${user.displayName || packSystem.me} Galaxy`,
        ownerLabel: user.displayName || currentGalaxy.ownerLabel || '',
        description: user.galaxyProfile?.description || currentGalaxy.description || '',
        isForeign: false,
      };
    }

    const seededGalaxy = getSeededPublicGalaxy(currentGalaxyId);
    if (seededGalaxy) {
      return {
        title: seededGalaxy.title || currentGalaxy.title,
        ownerLabel: seededGalaxy.ownerLabel || currentGalaxy.ownerLabel || '',
        description: seededGalaxy.description || currentGalaxy.description || '',
        isForeign: Boolean(user?.uid && currentGalaxyId !== user.uid),
      };
    }

    const discoverable = discoverableGalaxies.find((galaxy) => galaxy.id === currentGalaxyId);
    if (discoverable) {
      return {
        title: discoverable.title || discoverable.name || currentGalaxy.title,
        ownerLabel: discoverable.displayName || discoverable.ownerLabel || currentGalaxy.ownerLabel || '',
        description: discoverable.description || currentGalaxy.description || '',
        isForeign: Boolean(user?.uid && currentGalaxyId !== user.uid),
      };
    }

    return {
      title: currentGalaxy.title || '',
      ownerLabel: currentGalaxy.ownerLabel || '',
      description: currentGalaxy.description || '',
      isForeign: currentGalaxy.isForeign,
    };
  }, [currentGalaxy, currentGalaxyId, discoverableGalaxies, packSystem.me, user]);

  const travelStatusCopy = useMemo(() => (
    language === 'en'
      ? {
          visiting: 'Exploring',
          host: 'Host',
          foreignDescription: 'You are drifting inside another listener galaxy. Music, mood, and orbit rules now belong to this host world.',
          homeDescription: 'This is your home orbit. Your connected playlists gather here as personal planets.',
          returnHome: 'Return to My Galaxy',
        }
      : {
          visiting: '방문 중',
          host: '은하 주인',
          foreignDescription: '지금은 다른 탐험자의 은하 안을 유영하고 있습니다. 이 세계의 분위기와 음악 궤도는 해당 주인의 취향을 따릅니다.',
          homeDescription: '여기는 당신의 홈 궤도입니다. 연결된 플레이리스트들이 개인 행성으로 모여 있습니다.',
          returnHome: '내 은하로 복귀',
        }
  ), [language]);

  return {
    currentGalaxy,
    currentGalaxyId,
    currentGalaxyContext,
    travelStatusCopy,
    loadGalaxy,
    handleGalaxyHop,
    handleReturnHomeGalaxy: async (requestIdRef) => {
      if (user?.uid) {
        return handleGalaxyHop(user.uid, requestIdRef);
      }
      return handleGalaxyHop(OFFICIAL_GALAXY_ID, requestIdRef);
    },
  };
}
