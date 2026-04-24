/**
 * MusicProvider.js
 * 모든 뮤직 플랫폼(YouTube, Spotify 등)이 상속받아야 할 베이스 인터페이스 및 Null Object 구현입니다.
 */

export class BaseMusicProvider {
  constructor() {
    this._listeners = new Set();
  }

  // 초기화 (플레이어 로드 등)
  async init() {
    throw new Error('init() must be implemented');
  }

  // 이벤트 구독
  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  _emit(ev, data) {
    this._listeners.forEach(fn => fn(ev, data));
  }

  // 검색/조회
  async fetchTracks(query, options = {}) {
    throw new Error('fetchTracks() must be implemented');
  }

  async fetchPlaylists(token, options = {}) {
    throw new Error('fetchPlaylists() must be implemented');
  }

  async fetchPlaylistTracks(playlistId, token, options = {}) {
    throw new Error('fetchPlaylistTracks() must be implemented');
  }

  // 재생 제어 (Task Order 규격 준수)
  loadTrack(trackId, duration) {
    throw new Error('loadTrack() must be implemented');
  }

  play() {
    throw new Error('play() must be implemented');
  }

  pause() {
    throw new Error('pause() must be implemented');
  }

  seek(pct) {
    throw new Error('seek() must be implemented');
  }

  setVolume(v) {
    throw new Error('setVolume() must be implemented');
  }

  getMetadata() {
    return null;
  }

  getDuration() {
    return 0;
  }

  get isReady() {
    return false;
  }
}

/**
 * NullMusicProvider (Null Object Pattern)
 * 연동되지 않은 플랫폼이거나 에러 발생 시 앱의 충돌을 방지하기 위한 더미 객체입니다.
 */
export class NullMusicProvider extends BaseMusicProvider {
  async init() { console.warn('[NullProvider] No provider connected.'); return; }
  async fetchTracks() { return []; }
  async fetchPlaylists() { return []; }
  async fetchPlaylistTracks() { return []; }
  loadTrack() {}
  play() {}
  pause() {}
  seek() {}
  setVolume() {}
  getMetadata() { return { title: 'No Service', artist: 'Please connect a music service' }; }
  get isReady() { return true; }
}
