// src/pages/BetaPage.jsx
import { useNavigate } from 'react-router-dom'

export default function BetaPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh', background: '#010006',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif', padding: '40px 20px',
      textAlign: 'center',
    }}>
      {/* 별 배경 효과 */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: Math.random() > 0.7 ? '2px' : '1px',
            height: Math.random() > 0.7 ? '2px' : '1px',
            borderRadius: '50%',
            background: '#E8E4FF',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.3 + Math.random() * 0.6,
          }} />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
        {/* 행성 아이콘 */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(63,58,154,.4)', border: '2px solid rgba(123,112,224,.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px',
          boxShadow: '0 0 60px rgba(123,112,224,.3)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="5" fill="#9B91FF" opacity="0.9"/>
            <circle cx="12" cy="12" r="8" stroke="#7B70E0" strokeWidth="0.8" fill="none" opacity="0.5"/>
            <circle cx="12" cy="12" r="11" stroke="#534AB7" strokeWidth="0.5" fill="none" opacity="0.3"/>
          </svg>
        </div>

        <div style={{
          fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase',
          color: 'rgba(123,112,224,.65)', marginBottom: 16,
        }}>
          베타 신청 완료
        </div>

        <h1 style={{
          fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 300,
          color: '#F0EEFF', lineHeight: 1.2, letterSpacing: '-.025em',
          marginBottom: 16, textShadow: '0 0 60px rgba(123,112,224,.4)',
        }}>
          당신의 행성이<br />생성되고 있습니다
        </h1>

        <p style={{
          fontSize: 15, color: 'rgba(196,189,255,.55)',
          lineHeight: 1.75, marginBottom: 8,
        }}>
          초대장이 오면 꼭 와주세요.
        </p>
        <p style={{
          fontSize: 13, color: 'rgba(155,145,255,.35)',
          fontStyle: 'italic', marginBottom: 40,
        }}>
          우주에서 기다릴게요.
        </p>

        {/* 공유 버튼 */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Stellara — 우주 음악 탐험',
                  text: '우주를 여행하면서 음악을 탐험하는 Stellara 베타에 신청했어요!',
                  url: window.location.origin,
                })
              }
            }}
            style={{
              padding: '10px 20px', borderRadius: 20, cursor: 'pointer',
              background: 'rgba(63,58,154,.4)', border: '1px solid rgba(123,112,224,.5)',
              color: '#C4BDFF', fontSize: 13, transition: 'all .25s',
            }}
          >
            공유하기
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 20px', borderRadius: 20, cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(123,112,224,.25)',
              color: 'rgba(155,145,255,.55)', fontSize: 13, transition: 'all .25s',
            }}
          >
            우주 구경하기
          </button>
        </div>

        {/* 예상 오픈 */}
        <div style={{
          padding: '16px 24px', borderRadius: 12,
          background: 'rgba(8,6,22,.8)', border: '1px solid rgba(123,112,224,.2)',
          backdropFilter: 'blur(16px)',
        }}>
          <div style={{ fontSize: 11, color: 'rgba(155,145,255,.4)', marginBottom: 6 }}>
            초대 예정
          </div>
          <div style={{ fontSize: 16, fontWeight: 500, color: '#C4BDFF' }}>
            상위 500명 우선 초대
          </div>
          <div style={{ fontSize: 12, color: 'rgba(155,145,255,.35)', marginTop: 4 }}>
            신청 순서대로 순차 초대됩니다
          </div>
        </div>
      </div>
    </div>
  )
}
