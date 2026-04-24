import { FirebaseAuthService } from './auth/FirebaseAuthService';

/**
 * AuthServiceFactory
 * 시스템에 필요한 인증 서비스를 생성하고 관리하는 팩토리입니다.
 */
class _AuthServiceFactory {
  constructor() {
    this._authService = new FirebaseAuthService();
  }

  /**
   * 전역 인증 서비스 인스턴스를 반환합니다.
   * @returns {AuthService}
   */
  getAuthService() {
    return this._authService;
  }
}

export const AuthServiceFactory = new _AuthServiceFactory();
