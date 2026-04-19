// src/hooks/useCuration.js
import { useStore } from '../lib/store'
import { analyzeMood } from '../lib/claudeCuration'
import { searchAppleTracks, playAppleTracks } from '../lib/appleMusic'
import { searchYouTubeTracks, playYouTubeVideo } from '../lib/youtubeMusic'
import { saveMoodHistory } from '../lib/userStore'

export function useCuration() {
  const {
    platform, user,
    setIsAnalyzing, setCurationResult,
    setSelectedPlanetIdx, setTracks, setNowPlaying,
  } = useStore()

  /**
   * 기분 텍스트를 입력받아 Claude 분석 → 플랫폼별 트랙 검색 → 재생까지 처리합니다.
   * @param {string} moodText
   */
  const curate = async (moodText) => {
    if (!moodText.trim()) return
    setIsAnalyzing(true)

    try {
      // 1. Claude로 감성 분석
      const result = await analyzeMood(moodText)
      setCurationResult(result)
      setSelectedPlanetIdx(result.planetIndex)

      // 2. Firestore에 기록
      if (user) {
        await saveMoodHistory(user.uid, moodText, result)
      }

      // 3. 플랫폼별 트랙 검색
      let tracks = []

      if (platform === 'apple') {
        const appleItems = await searchAppleTracks(result.searchQuery, 8)
        tracks = appleItems.map(item => ({
          id:        item.id,
          title:     item.attributes.name,
          artist:    item.attributes.artistName,
          duration:  msToTime(item.attributes.durationInMillis),
          thumbnail: item.attributes.artwork
            ? window.MusicKit.formatArtworkURL(item.attributes.artwork, 200, 200)
            : null,
          source: 'apple',
        }))
        // 첫 트랙 재생
        if (tracks.length > 0) {
          await playAppleTracks(tracks.map(t => t.id))
          setNowPlaying(tracks[0])
        }

      } else if (platform === 'youtube') {
        const ytItems = await searchYouTubeTracks(result.searchQuery, 8)
        tracks = ytItems.map(item => ({
          id:        item.videoId,
          title:     item.title,
          artist:    item.channel,
          duration:  '--:--',
          thumbnail: item.thumbnail,
          source:    'youtube',
        }))
        // 첫 트랙 재생
        if (tracks.length > 0) {
          await playYouTubeVideo(tracks[0].id)
          setNowPlaying(tracks[0])
        }
      }

      setTracks(tracks)
      return result

    } catch (err) {
      console.error('Curation error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return { curate }
}

function msToTime(ms) {
  if (!ms) return '--:--'
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}
