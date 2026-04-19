// src/App.jsx
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import SpacePage   from './pages/SpacePage'
import PlatformPage from './pages/PlatformPage'
import BetaPage    from './pages/BetaPage'

export default function App() {
  useAuth() // Auth 상태 감지 시작

  return (
    <BrowserRouter>
      {/* 숨겨진 YouTube 플레이어 DOM */}
      <div id="yt-player" style={{ display: 'none' }} />

      <Routes>
        {/* 메인 3D 우주 씬 */}
        <Route path="/"          element={<SpacePage />} />
        {/* 플랫폼 연결 선택 */}
        <Route path="/connect"   element={<PlatformPage />} />
        {/* 베타 신청 완료 */}
        <Route path="/beta"      element={<BetaPage />} />
      </Routes>
    </BrowserRouter>
  )
}
