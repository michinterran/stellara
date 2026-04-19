// src/pages/PlatformPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { useAuth } from '../hooks/useAuth'
import { initAppleMusic, signInAppleMusic } from '../lib/appleMusic'
import { initYouTubePlayer } from '../lib/youtubeMusic'
import { savePlatform } from '../lib/userStore'

export default function PlatformPage() {
  const navigate = useNavigate()
  const { user, signInWithGoogle } = useAuth()
  const { setPlatform, setAppleMusicToken } = useStore()
  const [loading, setLoading] = useState(null)
  const [error, setError]     = useState(null)

  const connectApple = async () => {
    setLoading('apple'); setError(null)
    try {
      if (!user) await signInWithGoogle()
      const token = await signInAppleMusic()
      setAppleMusicToken(token)
      setPlatform('apple')
      if (user) await savePlatform(user.uid, 'apple')
      navigate('/')
    } catch (err) {
      setError('Apple Music 연결에 실패했습니다. Developer Token을 확인해주세요.')
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  const connectYouTube = async () => {
    setLoading('youtube'); setError(null)
    try {
      if (!user) await signInWithGoogle()
      await initYouTubePlayer('yt-player')
      setPlatform('youtube')
      if (user) await savePlatform(user.uid, 'youtube')
      navigate('/')
    } catch (err) {
      setError('YouTube Music 연결에 실패했습니다.')
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#010006',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 32,
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(123,112,224,.6)', marginBottom: 14 }}>
          우주 입구를 선택하세요
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 300, color: '#F0EEFF', marginBottom: 8, letterSpacing: '-.02em' }}>
          어떤 서비스로 입장할까요?
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(196,189,255,.45)', lineHeight: 1.7 }}>
          이미 구독 중인 서비스 그대로 연결됩니다.<br />
          새 구독 없이 Stellara 우주가 열립니다.
        </p>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: '#F09595', background: 'rgba(240,149,149,.08)', border: '1px solid rgba(240,149,149,.2)', borderRadius: 8, padding: '10px 16px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Apple Music */}
        <button
          onClick={connectApple}
          disabled={!!loading}
          style={{
            width: 200, padding: '28px 20px', borderRadius: 16, cursor: 'pointer',
            background: 'rgba(10,8,28,.8)', border: '1px solid rgba(123,112,224,.3)',
            backdropFilter: 'blur(20px)', color: '#C4BDFF', transition: 'all .25s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="#C97BF0"/>
          </svg>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
              {loading === 'apple' ? '연결 중...' : 'Apple Music'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(155,145,255,.5)' }}>별빛 게이트웨이</div>
          </div>
        </button>

        {/* YouTube Music */}
        <button
          onClick={connectYouTube}
          disabled={!!loading}
          style={{
            width: 200, padding: '28px 20px', borderRadius: 16, cursor: 'pointer',
            background: 'rgba(10,8,28,.8)', border: '1px solid rgba(61,202,165,.25)',
            backdropFilter: 'blur(20px)', color: '#C4BDFF', transition: 'all .25s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M10 15l5.19-3L10 9v6zM21.56 7.17c-.25-.93-1-1.67-1.94-1.92C17.88 4.94 12 4.94 12 4.94s-5.88 0-7.62.31c-.94.25-1.69.99-1.94 1.92C2.13 8.9 2 11 2 12s.13 3.1.44 4.83c.25.93 1 1.67 1.94 1.92C6.12 19.06 12 19.06 12 19.06s5.88 0 7.62-.31c.94-.25 1.69-.99 1.94-1.92C21.87 15.1 22 13 22 12s-.13-3.1-.44-4.83z" fill="#5DCAA5"/>
          </svg>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
              {loading === 'youtube' ? '연결 중...' : 'YouTube Music'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(155,145,255,.5)' }}>행성 게이트웨이</div>
          </div>
        </button>
      </div>

      <button
        onClick={() => navigate('/')}
        style={{ fontSize: 12, color: 'rgba(155,145,255,.35)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 8 }}
      >
        나중에 연결하기
      </button>
    </div>
  )
}
