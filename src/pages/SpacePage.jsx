// src/pages/SpacePage.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { useCuration } from '../hooks/useCuration'
import { useAuth } from '../hooks/useAuth'
import { toggleApplePlayback } from '../lib/appleMusic'
import { toggleYouTubePlayback, getCurrentTime, getDuration } from '../lib/youtubeMusic'
import { initSpaceScene } from '../components/SpaceScene'
import PlayerBar from '../components/PlayerBar'
import PlanetPanel from '../components/PlanetPanel'
import BetaModal from '../components/BetaModal'

export default function SpacePage() {
  const canvasRef = useRef(null)
  const sceneRef  = useRef(null)
  const navigate  = useNavigate()
  const { user, signInWithGoogle } = useAuth()
  const { curate } = useCuration()
  const {
    platform, zoomState, setZoomState,
    selectedPlanetIdx, setSelectedPlanetIdx,
    moodText, setMoodText, isAnalyzing,
    showBetaModal, setShowBetaModal,
    nowPlaying, isPlaying, setIsPlaying,
    tracks,
  } = useStore()

  const [activeChip, setActiveChip] = useState(null)

  // Three.js 씬 초기화
  useEffect(() => {
    if (!canvasRef.current) return
    const cleanup = initSpaceScene(canvasRef.current, {
      onPlanetClick: (idx) => {
        setSelectedPlanetIdx(idx)
        setZoomState('zooming-in')
      },
      onZoomComplete: () => setZoomState('landed'),
      onZoomOutComplete: () => setZoomState('idle'),
    })
    return cleanup
  }, [])

  // zoomState가 변경되면 씬에 전달
  useEffect(() => {
    if (!sceneRef.current) return
    sceneRef.current.setZoomState(zoomState, selectedPlanetIdx)
  }, [zoomState, selectedPlanetIdx])

  const handleMoodSubmit = async () => {
    if (!moodText.trim() || isAnalyzing) return
    if (!platform) { navigate('/connect'); return }
    await curate(moodText)
  }

  const handleTogglePlay = async () => {
    if (platform === 'apple') await toggleApplePlayback()
    else if (platform === 'youtube') toggleYouTubePlayback()
    setIsPlaying(!isPlaying)
  }

  const handleZoomOut = () => setZoomState('zooming-out')

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#010006', overflow: 'hidden' }}>
      {/* Three.js 캔버스 */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 1 }} />

      {/* Hero UI */}
      {zoomState === 'idle' && (
        <div className="hero-overlay">
          <div className="eyebrow">Cosmic Sound · Deep Space</div>
          <h1>지금 이 기분을,<br /><em>우주로</em> 띄워드립니다</h1>
          <p>행성처럼 떠 있는 플레이리스트 사이를 유영하며</p>

          <div className="mood-box">
            <input
              value={moodText}
              onChange={e => setMoodText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleMoodSubmit()}
              placeholder="지금 기분을 말해보세요 — 새벽, 빗소리, 설렘..."
            />
            <button onClick={handleMoodSubmit} disabled={isAnalyzing}>
              {isAnalyzing ? '분석 중...' : '→'}
            </button>
          </div>

          <div className="chips">
            {['새벽 감성','힐링','집중','설렘','빗소리','에너지'].map((c, i) => (
              <span
                key={c}
                className={`chip ${activeChip === i ? 'active' : ''}`}
                onClick={() => { setActiveChip(i); setMoodText(c); curate(c) }}
              >{c}</span>
            ))}
          </div>

          {/* 로그인 / 베타 신청 */}
          <div className="nav-actions">
            {user
              ? <span className="user-badge">{user.displayName?.split(' ')[0]}</span>
              : <button className="beta-btn" onClick={() => setShowBetaModal(true)}>베타 초대 신청</button>
            }
          </div>
        </div>
      )}

      {/* 행성 착륙 후 패널 */}
      {zoomState === 'landed' && (
        <PlanetPanel
          planetIdx={selectedPlanetIdx}
          tracks={tracks}
          onBack={handleZoomOut}
        />
      )}

      {/* 플레이어 바 */}
      <PlayerBar
        nowPlaying={nowPlaying}
        isPlaying={isPlaying}
        onToggle={handleTogglePlay}
        platform={platform}
      />

      {/* 베타 신청 모달 */}
      {showBetaModal && <BetaModal onClose={() => setShowBetaModal(false)} />}
    </div>
  )
}
