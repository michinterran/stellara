// src/lib/appleMusic.js
// Apple MusicKit JS를 로드하고 초기화합니다.
// Developer Token은 .env의 VITE_APPLE_MUSIC_DEVELOPER_TOKEN 에서 읽습니다.

let musicKit = null

/**
 * MusicKit JS SDK를 동적으로 로드하고 초기화합니다.
 * 최초 1회만 실행되며 이후 호출은 캐시된 인스턴스를 반환합니다.
 */
export async function initAppleMusic() {
  if (musicKit) return musicKit

  // SDK 스크립트 동적 주입
  await new Promise((resolve, reject) => {
    if (document.getElementById('apple-musickit-script')) { resolve(); return }
    const script = document.createElement('script')
    script.id  = 'apple-musickit-script'
    script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js'
    script.onload  = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })

  await window.MusicKit.configure({
    developerToken: import.meta.env.VITE_APPLE_MUSIC_DEVELOPER_TOKEN,
    app: {
      name:  'Stellara',
      build: '1.0.0',
      icon:  '/icon.png',
    },
  })

  musicKit = window.MusicKit.getInstance()
  return musicKit
}

/**
 * Apple Music 사용자 로그인 (Authorize)
 */
export async function signInAppleMusic() {
  const mk = await initAppleMusic()
  const token = await mk.authorize()
  return token // Music User Token
}

/**
 * 검색어로 Apple Music 트랙을 검색합니다.
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<Array>} 트랙 배열
 */
export async function searchAppleTracks(query, limit = 10) {
  const mk = await initAppleMusic()
  const result = await mk.api.music(`/v1/catalog/kr/search`, {
    term:  query,
    types: 'songs',
    limit,
  })
  return result.data?.results?.songs?.data || []
}

/**
 * 트랙 ID 배열로 큐를 만들고 재생합니다.
 * @param {string[]} trackIds
 */
export async function playAppleTracks(trackIds) {
  const mk = await initAppleMusic()
  await mk.setQueue({ songs: trackIds })
  await mk.play()
}

/**
 * 재생/일시정지 토글
 */
export async function toggleApplePlayback() {
  const mk = await initAppleMusic()
  if (mk.playbackState === window.MusicKit.PlaybackStates.playing) {
    await mk.pause()
  } else {
    await mk.play()
  }
}

/**
 * 현재 재생 중인 트랙 정보를 반환합니다.
 */
export async function getNowPlaying() {
  const mk = await initAppleMusic()
  const item = mk.nowPlayingItem
  if (!item) return null
  return {
    id:       item.id,
    title:    item.attributes.name,
    artist:   item.attributes.artistName,
    album:    item.attributes.albumName,
    artwork:  item.attributes.artwork
      ? window.MusicKit.formatArtworkURL(item.attributes.artwork, 300, 300)
      : null,
    duration: item.attributes.durationInMillis,
  }
}
