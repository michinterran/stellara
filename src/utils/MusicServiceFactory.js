import { YouTubeProvider } from './providers/YouTubeProvider';
import { NullMusicProvider } from './MusicProvider';

/**
 * MusicServiceFactory
 * 플랫폼 타입(YouTube, Spotify 등)에 따른 적절한 프로바이더 인스턴스를 반환합니다.
 * 에러 방지를 위해 Null Object Pattern(NullMusicProvider)을 기본값으로 사용합니다.
 */
class _MusicServiceFactory {
  constructor() {
    this._nullProvider = new NullMusicProvider();
    this._providers = {
      'YOUTUBE': new YouTubeProvider(),
      // 'SPOTIFY': new SpotifyProvider(), // 향후 확장 가능
    };
  }

  /**
   * 서비스 타입에 맞는 프로바이더를 가져옵니다.
   * 연동되지 않았거나 알 수 없는 타입인 경우 NullMusicProvider를 반환합니다.
   * @param {string} type - 'YOUTUBE', 'SPOTIFY' 등
   * @returns {BaseMusicProvider}
   */
  getProvider(type) {
    if (!type) return this._nullProvider;
    const key = type.toUpperCase();
    return this._providers[key] || this._nullProvider;
  }
}

export const MusicServiceFactory = new _MusicServiceFactory();
