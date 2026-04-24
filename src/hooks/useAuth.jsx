import {
  createContext, useCallback, useContext,
  useEffect, useState,
} from 'react';
import { AuthServiceFactory } from '@services/AuthServiceFactory';

/**
 * useAuth.jsx
 * Identity Layer Abstraction (Phase 3) 리팩토링 버전입니다.
 * 구체적인 인증 로직은 AuthService 어댑터로 위임되었습니다.
 */

export const AuthContext = createContext(null);

const authService = AuthServiceFactory.getAuthService();

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // AuthService를 통한 인증 상태 구독
    // 내부적으로 StellaraEvents('AUTH_STATE_CHANGED') 발행 포함
    const unsub = authService.onAuthStateChanged((userData) => {
      setUser(userData);
      setIsLoading(false);
    });
    return unsub;
  }, []);

  const login = useCallback(async () => {
    const res = await authService.login('GOOGLE');
    if (res.ok) {
      setUser(res.user);
    }
    return res;
  }, []);

  const logout = useCallback(async () => {
    const res = await authService.logout();
    if (res.ok) {
      setUser(null);
    }
  }, []);

  // 기존 Stellara의 특수 기능 (유튜브 수동 연결 등) 유지
  const connectYouTube = useCallback(async () => {
    const res = await authService.connectYouTube();
    if (res.ok) {
      setUser(res.user);
    }
    return res;
  }, []);

  const updateGalaxyProfile = useCallback(async (patch, planets = []) => {
    const res = await authService.updateGalaxyProfile(patch, planets);
    if (res.ok) {
      setUser(res.user);
    }
    return res;
  }, []);

  const clearYTState = useCallback(() => {
    // 세션 스토리지 클리어 (어댑터 내부에서 수행하거나 직접 수행)
    sessionStorage.removeItem('stellara_yt_v18');
    setUser(prev => prev ? { ...prev, ytToken: null } : prev);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isLoading,
      isGoogleConnected: Boolean(user?.uid),
      isYTConnected:     Boolean(user?.ytToken),
      isPremium:         Boolean(user?.isPremium),
      login, connectYouTube, logout, clearYTState, updateGalaxyProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth: AuthProvider 필요');
  return ctx;
}
