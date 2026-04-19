// src/hooks/usePlatformSync.js
// Apple Music / YouTube Music 플레이리스트를 가져와 Firestore에 행성으로 저장합니다

import { useState, useCallback } from 'react'
import { useStore } from '../lib/store'
import { db } from '../lib/firebase'
import {
  collection, doc, setDoc, getDocs,
  query, where, serverTimestamp,
} from 'firebase/firestore'

// ── Apple Music 플레이리스트 가져오기 ───────────────────────
async function fetchApplePlaylists() {
  const mk = window.MusicKit?.getInstance()
  if (!mk || !mk.isAuthorized) return []

  try {
    // 사용자의 모든 플레이리스트 가져오기
    const result = await mk.api.music('/v1/me/library/playlists', {
      limit: 50,
      include: 'tracks',
    })
    return (result.data?.data || []).map(item => ({
      id: item.id,
      name: item.attributes?.name || '무제 플레이리스트',
      trackCount: item.attributes?.trackCount || 0,
      // 대표 앨범아트 (있을 경우)
      artworkUrl: item.attributes?.artwork
        ? window.MusicKit.formatArtworkURL(item.attributes.artwork, 300, 300)
        : null,
      platform: 'apple',
      description: item.attributes?.description?.standard || '',
    }))
  } catch (err) {
    console.error('Apple playlist fetch error:', err)
    return []
  }
}

// ── YouTube Music 플레이리스트 가져오기 ─────────────────────
async function fetchYoutubePlaylists(accessToken) {
  if (!accessToken) return []

  try {
    const params = new URLSearchParams({
      part: 'snippet,contentDetails',
      mine: 'true',
      maxResults: '50',
    })
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const data = await res.json()

    return (data.items || []).map(item => ({
      id: item.id,
      name: item.snippet?.title || '무제 플레이리스트',
      trackCount: item.contentDetails?.itemCount || 0,
      artworkUrl: item.snippet?.thumbnails?.medium?.url || null,
      platform: 'youtube',
      description: item.snippet?.description || '',
    }))
  } catch (err) {
    console.error('YouTube playlist fetch error:', err)
    return []
  }
}

// ── 무드 자동 태깅 (간단한 키워드 매핑) ─────────────────────
function autoTagMood(name, description = '') {
  const text = (name + ' ' + description).toLowerCase()
  const tags = []
  if (/새벽|밤|몽환|잠|조용/.test(text)) tags.push('새벽 감성')
  if (/힐링|자연|숲|바람|평온/.test(text)) tags.push('힐링·자연')
  if (/집중|공부|work|study|lofi/.test(text)) tags.push('집중 모드')
  if (/설렘|사랑|봄|happy|love/.test(text)) tags.push('설렘')
  if (/비|rain|슬픔|감성|우울/.test(text)) tags.push('빗소리')
  if (/에너지|gym|운동|workout|파워/.test(text)) tags.push('에너지')
  return tags.length > 0 ? tags : ['미분류']
}

// ── 메인 훅 ─────────────────────────────────────────────────
export function usePlatformSync() {
  const { user, platform } = useStore()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)

  const syncPlaylists = useCallback(async (ytAccessToken = null) => {
    if (!user) return
    setIsSyncing(true)

    try {
      let playlists = []

      // 플랫폼별 플레이리스트 수집
      if (platform === 'apple' || platform === 'both') {
        const applePl = await fetchApplePlaylists()
        playlists = [...playlists, ...applePl]
      }
      if ((platform === 'youtube' || platform === 'both') && ytAccessToken) {
        const ytPl = await fetchYoutubePlaylists(ytAccessToken)
        playlists = [...playlists, ...ytPl]
      }

      if (playlists.length === 0) {
        setSyncResult({ success: true, count: 0 })
        return
      }

      // Firestore에 갤럭시(유저) 문서 생성/업데이트
      const galaxyRef = doc(db, 'galaxies', user.uid)
      await setDoc(galaxyRef, {
        uid: user.uid,
        name: user.displayName || '나의 갤럭시',
        isPublic: true,
        platform,
        updatedAt: serverTimestamp(),
      }, { merge: true })

      // 각 플레이리스트를 행성으로 저장
      const batch = playlists.map(async (pl) => {
        const planetRef = doc(collection(db, 'planets'))
        await setDoc(planetRef, {
          galaxyId: user.uid,
          platformType: pl.platform,
          platformPlaylistId: pl.id,
          name: pl.name,
          trackCount: pl.trackCount,
          artworkUrl: pl.artworkUrl,
          description: pl.description,
          moodTags: autoTagMood(pl.name, pl.description),
          isPublic: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      })

      await Promise.all(batch)
      setSyncResult({ success: true, count: playlists.length })
    } catch (err) {
      console.error('Sync error:', err)
      setSyncResult({ success: false, error: err.message })
    } finally {
      setIsSyncing(false)
    }
  }, [user, platform])

  return { syncPlaylists, isSyncing, syncResult }
}
