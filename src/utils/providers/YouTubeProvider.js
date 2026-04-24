import { BaseMusicProvider } from '../MusicProvider';
import { 
  ytFetch, YT_BASE, YT_API_KEY, 
  parseSearchItemMeta, parseTrackMeta, parseIsoDuration 
} from '../youtube';
import {
  getCachedSearchResult,
  isQuotaBlocked,
  setCachedSearchResult,
} from '../youtubeCache';

/**
 * YouTubeProvider
 * YouTube IFrame Player 및 Data API를 활용한 뮤직 프로바이더 구현체입니다.
 */
export class YouTubeProvider extends BaseMusicProvider {
  constructor() {
    super();
    this._player      = null;
    this._ready       = false;
    this._queue       = null;
    this._simTimer    = null;
    this._simState    = { elapsed: 0, total: 0, playing: false };
    this._currentTrack = null;
    this._retryTimer  = null;
  }

  async init() {
    if (this._player) return;
    const mountId = '__yt_singleton__';
    let el = document.getElementById(mountId);
    if (!el) {
      el = document.createElement('div');
      el.id = mountId;
      el.style.cssText = 'position:fixed;bottom:-500px;left:50%;transform:translateX(-50%);width:200px;height:200px;z-index:-1;pointer-events:none;';
      document.body.appendChild(el);
    }

    return new Promise((resolve) => {
      const create = () => {
        if (this._player) { resolve(); return; }
        this._player = new window.YT.Player(el, {
          height: '200', width: '200',
          playerVars: {
            autoplay: 0, controls: 0, disablekb: 1,
            modestbranding: 1, playsinline: 1, rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              this._ready = true;
              if (this._queue) { this._execLoad(this._queue); this._queue = null; }
              resolve();
            },
            onStateChange: (e) => {
              if (e.data === window.YT.PlayerState.ENDED)   this._emit('ended');
              if (e.data === window.YT.PlayerState.PLAYING) this._emit('playing');
              if (e.data === window.YT.PlayerState.PAUSED)  this._emit('paused');
            },
            onError: () => { this._emit('error'); },
          },
        });
      };

      if (window.YT && window.YT.Player) { create(); return; }
      
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(s);
      }

      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); create(); };
    });
  }

  async fetchTracks(query, maxResults = 10) {
    const cached = getCachedSearchResult(query, maxResults);
    if (cached?.fresh && cached.tracks?.length) {
      return cached.tracks;
    }
    if (isQuotaBlocked() && cached?.tracks?.length) {
      return cached.tracks;
    }

    try {
      const data = await ytFetch(
        `${YT_BASE}/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${YT_API_KEY}`
      );
      const tracks = (data.items ?? [])
        .sort(() => Math.random() - 0.5)
        .slice(0, 6)
        .map(parseSearchItemMeta);

      if (tracks.length) {
        setCachedSearchResult(query, maxResults, tracks);
      }
      return tracks;
    } catch (error) {
      if (cached?.tracks?.length) {
        return cached.tracks;
      }
      throw error;
    }
  }

  async fetchPlaylists(token, maxResults = 6) {
    const data = await ytFetch(
      `${YT_BASE}/playlists?part=snippet,contentDetails&mine=true&maxResults=${maxResults}`,
      { token }
    );
    return data.items ?? [];
  }

  async fetchPlaylistTracks(playlistId, token, maxResults = 5) {
    try {
      const data = await ytFetch(
        `${YT_BASE}/playlistItems?part=snippet,contentDetails&maxResults=${maxResults}&playlistId=${playlistId}`,
        { token }
      );
      return (data.items ?? []).map(parseTrackMeta);
    } catch { return []; }
  }

  // 재생 제어 (새로운 규격 준수)
  loadTrack(ytId, duration) {
    this._stopSim();
    if (ytId) {
      if (this._ready) { this._execLoad({ ytId }); }
      else             { this._queue = { ytId }; }
    } else {
      this._runSim(duration);
    }
  }

  _execLoad({ ytId }) {
    clearTimeout(this._retryTimer);
    try { this._player.loadVideoById(ytId); }
    catch (e) { console.warn('[YTP] loadVideoById 실패:', e); this._emit('error'); }
  }

  play() { try { if (this._ready) this._player.playVideo(); } catch (_) {} }
  pause() { try { if (this._ready) this._player.pauseVideo(); } catch (_) {} }
  
  seek(pct) {
    try {
      if (this._ready) {
        const d = this._player.getDuration() || 0;
        this._player.seekTo(pct * d, true);
      }
    } catch (_) {}
  }

  setVolume(v) { try { if (this._ready) this._player.setVolume(v); } catch (_) {} }
  
  getMetadata() {
    if (!this._ready) return null;
    try {
      const vid = this._player.getVideoData();
      return {
        title: vid.title,
        artist: vid.author,
        id: vid.video_id
      };
    } catch { return null; }
  }

  getDuration() { 
    try { return this._ready ? (this._player.getDuration() || 0) : 0; } 
    catch { return 0; } 
  }

  get isReady() { return this._ready; }

  _runSim(duration) {
    const [m, s] = (duration || '3:30').split(':').map(Number);
    const total  = m * 60 + (s || 0);
    let elapsed  = 0;
    this._simState = { elapsed: 0, total, playing: true };
    this._emit('simStart', { total });
    this._emit('playing');
    this._simTimer = setInterval(() => {
      elapsed += 0.1;
      this._simState.elapsed = elapsed;
      this._emit('simProgress', { elapsed, total });
      if (elapsed >= total) { this._stopSim(); this._emit('ended'); }
    }, 100);
  }

  _stopSim() { clearInterval(this._simTimer); this._simTimer = null; }
}
