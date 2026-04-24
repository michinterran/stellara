import { 
  GoogleAuthProvider, onAuthStateChanged,
  signInWithPopup, signOut 
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, firebaseConfig, missingFirebaseConfig } from '@config/firebase';
import { validateYTToken } from '@utils/youtube';
import { events } from '@utils/StellaraEvents';
import { AuthService } from '../AuthService';
import { SocialGalaxyService } from '@services/SocialGalaxyService';

const YT_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';
const SS_KEY   = 'stellara_yt_v18';
const SILENT   = new Set(['auth/popup-closed-by-user','auth/cancelled-popup-request']);

/**
 * FirebaseAuthService
 * Firebase Auth 및 Firestore를 이용한 인증 어댑터입니다.
 */
export class FirebaseAuthService extends AuthService {
  constructor() {
    super();
    this._user = null;
    this._busy = false;
  }

  async init() {
    if (!auth) {
      this._ready = Promise.resolve(true);
      return;
    }

    // 초기화 완료 확인용 Promise
    this._ready = new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, () => {
        unsub();
        resolve(true);
      });
    });
  }

  async awaitReady() {
    if (!this._ready) await this.init();
    await this._ready;
  }

  // 인증 상태 리스너 (StellaraEvents 발행 포함)
  onAuthStateChanged(callback) {
    if (!auth) {
      this._user = null;
      events.emit('AUTH_STATE_CHANGED', null);
      if (callback) callback(null);
      return () => {};
    }

    return onAuthStateChanged(auth, async (fbUser) => {
      let userData = null;
      if (fbUser) {
        const cached = sessionStorage.getItem(SS_KEY);
        let ytToken = null;
        if (cached) {
          const s = await validateYTToken(cached).catch(() => 'error');
          if (s === 'valid') ytToken = cached;
          else sessionStorage.removeItem(SS_KEY);
        }
        const isPremium = await this._fetchPremium(fbUser.uid);
        const socialProfile = await SocialGalaxyService.ensureGalaxyProfile(this._pick(fbUser));
        userData = { ...this._pick(fbUser), ytToken, isPremium, galaxyProfile: socialProfile };
      }
      
      this._user = userData;
      events.emit('AUTH_STATE_CHANGED', userData);
      if (callback) callback(userData);
    });
  }

  async login(type = 'GOOGLE') {
    if (this._busy) {
      console.warn('⚠️ [AUTH] Login attempt blocked: already busy');
      return { ok: false, message: '이미 인증 창이 열려 있습니다.' };
    }
    this._busy = true;
    console.group('🚀 [AUTH] Login Process Started');

    try {
      if (missingFirebaseConfig.length > 0) {
        console.error('❌ [AUTH] Firebase config missing:', missingFirebaseConfig);
        return {
          ok: false,
          message: `Firebase 설정 누락: ${missingFirebaseConfig.join(', ')}`,
        };
      }

      console.log('📡 [AUTH] Waiting for Auth instance to be ready...');
      await this.awaitReady(); // [Fix] 초기화 완료 대기 가드

      console.log('📡 [AUTH] Preparing GoogleAuthProvider for basic sign-in...');
      const p = new GoogleAuthProvider();

      if (!auth) {
        throw new Error('Firebase Auth instance is NOT initialized. Check firebase configuration.');
      }

      console.log('🧪 [AUTH] Firebase Auth config snapshot:', {
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId,
        host: window.location.host,
      });

      console.log('🔗 [AUTH] Calling signInWithPopup...');
      const result = await signInWithPopup(auth, p);
      
      console.log('✅ [AUTH] signInWithPopup Success:', result.user.email);
      const cachedToken = sessionStorage.getItem(SS_KEY);
      const cachedTokenState = cachedToken
        ? await validateYTToken(cachedToken).catch(() => 'error')
        : 'error';
      const ytToken = cachedTokenState === 'valid' ? cachedToken : null;
      if (cachedToken && cachedTokenState !== 'valid') sessionStorage.removeItem(SS_KEY);

      console.log('💾 [AUTH] Syncing user data to Firestore...');
      await this._upsertUser(result.user);
      const isPremium = await this._fetchPremium(result.user.uid);
      const socialProfile = await SocialGalaxyService.ensureGalaxyProfile(this._pick(result.user));
      
      const userData = { ...this._pick(result.user), ytToken, isPremium, galaxyProfile: socialProfile };
      this._user = userData;
      
      console.log('🎉 [AUTH] Login process completed successfully');
      return { ok: true, user: userData, message: null };
    } catch (e) {
      console.error('❌ [AUTH] Login Process Halted with ERROR:');
      console.error(' - Code:', e.code);
      console.error(' - Message:', e.message);
      console.error(' - Full Object:', e);
      return { ok: false, message: this._getErrorMessage(e) };
    } finally {
      this._busy = false;
      console.groupEnd();
    }
  }

  async connectYouTube() {
    if (this._busy) {
      console.warn('⚠️ [AUTH] YouTube connect attempt blocked: already busy');
      return { ok: false, message: '이미 인증 창이 열려 있습니다.' };
    }
    this._busy = true;
    console.group('🎬 [AUTH] YouTube Connect Process Started');

    try {
      if (missingFirebaseConfig.length > 0) {
        return {
          ok: false,
          message: `Firebase 설정 누락: ${missingFirebaseConfig.join(', ')}`,
        };
      }

      await this.awaitReady();

      const provider = new GoogleAuthProvider();
      provider.addScope(YT_SCOPE);
      provider.setCustomParameters({
        prompt: 'consent',
        include_granted_scopes: 'true',
      });

      console.log('🔗 [AUTH] Requesting YouTube readonly scope...');
      const result = await signInWithPopup(auth, provider);
      const cred = GoogleAuthProvider.credentialFromResult(result);
      const ytToken = cred?.accessToken ?? null;

      if (!ytToken) {
        return { ok: false, message: 'YouTube 권한 토큰을 받지 못했습니다. 권한을 허용했는지 확인해주세요.' };
      }

      sessionStorage.setItem(SS_KEY, ytToken);
      await this._upsertUser(result.user);
      const isPremium = await this._fetchPremium(result.user.uid);
      const socialProfile = await SocialGalaxyService.ensureGalaxyProfile(this._pick(result.user));
      const userData = { ...this._pick(result.user), ytToken, isPremium, galaxyProfile: socialProfile };

      this._user = userData;
      events.emit('AUTH_STATE_CHANGED', userData);
      console.log('✅ [AUTH] YouTube Access Token acquired');
      return { ok: true, user: userData };
    } catch (e) {
      console.error('❌ [AUTH] YouTube Connect Failed:', e);
      return { ok: false, message: this._getErrorMessage(e) };
    } finally {
      this._busy = false;
      console.groupEnd();
    }
  }

  async logout() {
    console.log('🚪 [AUTH] Logging out...');
    sessionStorage.removeItem(SS_KEY);
    this._user = null;
    try {
      if (!auth) {
        return { ok: true };
      }
      await signOut(auth);
      console.log('✅ [AUTH] Logout success');
      return { ok: true };
    } catch (e) {
      console.error('❌ [AUTH] Logout Failed:', e);
      return { ok: false, message: e.message };
    }
  }

  getCurrentUser() {
    return this._user;
  }

  async updateGalaxyProfile(patch = {}, planets = []) {
    if (!this._user?.uid) {
      return { ok: false, message: '로그인이 필요합니다.' };
    }

    try {
      const nextProfile = await SocialGalaxyService.saveGalaxyProfile(this._user, patch, planets);
      const userData = {
        ...this._user,
        galaxyProfile: nextProfile,
      };
      this._user = userData;
      events.emit('AUTH_STATE_CHANGED', userData);
      return { ok: true, user: userData };
    } catch (e) {
      console.error('❌ [AUTH] Failed to update galaxy profile:', e);
      return { ok: false, message: e.message ?? '갤럭시 프로필 저장에 실패했습니다.' };
    }
  }

  // ── 내부 유틸리티 ───────────────────
  
  _pick(u) {
    return { uid: u.uid, displayName: u.displayName ?? '', email: u.email ?? '', photoURL: u.photoURL ?? '' };
  }

  async _fetchPremium(uid) {
    if (!uid || !db) return false;
    try { 
      const s = await getDoc(doc(db, 'users', uid)); 
      return s.exists() ? Boolean(s.data()?.isPremium) : false; 
    } catch { return false; }
  }

  async _upsertUser(u) {
    if (!u?.uid || !db) return;
    try { 
      await setDoc(doc(db, 'users', u.uid), { 
        uid: u.uid, displayName: u.displayName ?? '', 
        email: u.email ?? '', photoURL: u.photoURL ?? '', 
        lastLogin: serverTimestamp() 
      }, { merge: true }); 
    } catch (e) { console.warn('[upsertUser]', e.message); }
  }

  _getErrorMessage(e) {
    if (SILENT.has(e.code)) return null;
    if (e.code === 'auth/user-cancelled' || e.code === 'auth/access-denied') return 'YouTube 권한 허용이 필요합니다.';
    if (e.code === 'auth/popup-blocked') return '팝업이 차단됐습니다. 브라우저 설정에서 허용해주세요.';
    if (e.code === 'auth/network-request-failed') return '네트워크 오류가 발생했습니다.';
    if (e.code === 'auth/internal-error') {
      return `Firebase 내부 오류입니다. 현재 도메인(${window.location.host})이 Firebase Authentication > Authorized domains에 등록되어 있는지와 Vercel 환경변수(VITE_FB_*)가 모두 설정됐는지 확인해주세요.`;
    }
    return `로그인 오류: ${e.message}`;
  }
}
