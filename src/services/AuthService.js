/**
 * AuthService.js (Interface)
 * 모든 인증 공급자(Firebase, Apple, Email 등)가 상속받아야 할 베이스 인터페이스입니다.
 */

export class AuthService {
  // 인증 서비스 초기화
  async init() {
    throw new Error('init() must be implemented');
  }

  // 로그인 (구체적인 provider는 구현체에서 정의)
  async login(options = {}) {
    throw new Error('login() must be implemented');
  }

  // 음악 서비스 연결용 추가 권한 요청
  async connectYouTube() {
    throw new Error('connectYouTube() must be implemented');
  }

  // 로그아웃
  async logout() {
    throw new Error('logout() must be implemented');
  }

  // 소셜 갤럭시 프로필 업데이트
  async updateGalaxyProfile(patch = {}, planets = []) {
    throw new Error('updateGalaxyProfile() must be implemented');
  }

  // 현재 유저 정보 반환
  getCurrentUser() {
    throw new Error('getCurrentUser() must be implemented');
  }

  // 인증 상태 리스너 등록
  onAuthStateChanged(callback) {
    throw new Error('onAuthStateChanged() must be implemented');
  }
}
