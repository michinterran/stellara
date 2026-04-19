// src/lib/store.js
import { create } from 'zustand'

export const useStore = create((set, get) => ({
  // ── 유저 ──────────────────────────────────────────────────
  user: null,
  setUser: (user) => set({ user }),

  // ── 플랫폼 ────────────────────────────────────────────────
  platform: null, // 'apple' | 'youtube' | null
  setPlatform: (platform) => set({ platform }),
  appleMusicToken: null,
  setAppleMusicToken: (token) => set({ appleMusicToken: token }),

  // ── 큐레이션 ──────────────────────────────────────────────
  moodText: '',
  setMoodText: (moodText) => set({ moodText }),
  curationResult: null,
  setCurationResult: (curationResult) => set({ curationResult }),
  isAnalyzing: false,
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

  // ── 3D 씬 ─────────────────────────────────────────────────
  selectedPlanetIdx: null,
  setSelectedPlanetIdx: (selectedPlanetIdx) => set({ selectedPlanetIdx }),
  zoomState: 'idle', // 'idle' | 'zooming-in' | 'landed' | 'zooming-out'
  setZoomState: (zoomState) => set({ zoomState }),

  // ── 플레이어 ──────────────────────────────────────────────
  nowPlaying: null,
  setNowPlaying: (nowPlaying) => set({ nowPlaying }),
  isPlaying: false,
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  tracks: [],
  setTracks: (tracks) => set({ tracks }),

  // ── UI ────────────────────────────────────────────────────
  showBetaModal: false,
  setShowBetaModal: (showBetaModal) => set({ showBetaModal }),
}))
