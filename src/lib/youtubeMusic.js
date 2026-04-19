// src/lib/youtubeMusic.js
// YouTube Data API v3를 사용해 음악을 검색하고 재생합니다.
// YouTube IFrame Player API를 사용합니다.

const YT_API_BASE = 'https://www.googleapis.com/youtube/v3'
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY

let ytPlayer = null
let playerReady = false

/**
 * YouTube IFrame API를 동적으로 로드합니다.
 */
export function loadYouTubeAPI() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) { resolve(); return }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
    window.onYouTubeIframeAPIReady = resolve
  })
}

/**
 * 숨겨진 YouTube 플레이어를 초기화합니다.
 * @param {string} containerId - 플레이어를 마운트할 DOM 엘리먼트 ID
 */
export async function initYouTubePlayer(containerId = 'yt-player') {
  if (ytPlayer) return ytPlayer
  await loadYouTubeAPI()

  return new Promise((resolve) => {
    ytPlayer = new window.YT.Player(containerId, {
      height: '0',
      width:  '0',
      playerVars: {
        autoplay:       1,
        controls:       0,
        disablekb:      1,
        fs:             0,
        modestbranding: 1,
        playsinline:    1,
        rel:            0,
      },
      events: {
        onReady: () => { playerReady = true; resolve(ytPlayer) },
        onError: (e) => console.error('YT Player error:', e),
      },
    })
  })
}

/**
 * YouTube Data API로 음악 트랙을 검색합니다.
 * @param {string} query - 검색어 (Claude가 생성한 searchQuery 권장)
 * @param {number} maxResults
 * @returns {Promise<Array>} videoId, title, channel, thumbnail 배열
 */
export async function searchYouTubeTracks(query, maxResults = 8) {
  const params = new URLSearchParams({
    part:       'snippet',
    q:          `${query} official audio`,
    type:       'video',
    videoCategoryId: '10', // Music
    maxResults: String(maxResults),
    key:        API_KEY,
  })

  const res  = await fetch(`${YT_API_BASE}/search?${params}`)
  const data = await res.json()

  return (data.items || []).map(item => ({
    videoId:   item.id.videoId,
    title:     item.snippet.title,
    channel:   item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.medium?.url || '',
    publishedAt: item.snippet.publishedAt,
  }))
}

/**
 * videoId로 재생을 시작합니다.
 * @param {string} videoId
 */
export async function playYouTubeVideo(videoId) {
  if (!ytPlayer || !playerReady) await initYouTubePlayer()
  ytPlayer.loadVideoById(videoId)
}

/**
 * 재생/일시정지 토글
 */
export function toggleYouTubePlayback() {
  if (!ytPlayer || !playerReady) return
  const state = ytPlayer.getPlayerState()
  if (state === window.YT.PlayerState.PLAYING) {
    ytPlayer.pauseVideo()
  } else {
    ytPlayer.playVideo()
  }
}

/**
 * 볼륨 설정 (0~100)
 */
export function setYouTubeVolume(vol) {
  if (ytPlayer && playerReady) ytPlayer.setVolume(vol)
}

/**
 * 현재 재생 시간 (초)
 */
export function getCurrentTime() {
  if (!ytPlayer || !playerReady) return 0
  return ytPlayer.getCurrentTime() || 0
}

/**
 * 전체 길이 (초)
 */
export function getDuration() {
  if (!ytPlayer || !playerReady) return 0
  return ytPlayer.getDuration() || 0
}
