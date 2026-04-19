// src/components/BetaModal.jsx
import { useState } from 'react'
import { submitBetaRequest } from '../lib/userStore'

export default function BetaModal({ onClose }) {
  const [email, setEmail]       = useState('')
  const [platform, setPlatform] = useState('apple')
  const [status, setStatus]     = useState('idle') // idle | loading | done | error

  const handleSubmit = async () => {
    if (!email.includes('@')) return
    setStatus('loading')
    const result = await submitBetaRequest(email, platform)
    if (result.success) {
      setStatus('done')
    } else if (result.reason === 'already_registered') {
      setStatus('error')
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(1,0,6,.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'rgba(8,6,22,.95)', border: '1px solid rgba(123,112,224,.3)',
        borderRadius: 20, padding: '36px 40px', width: 'min(440px,90vw)',
        fontFamily: 'system-ui,sans-serif',
      }}>
        {status === 'done' ? (
          <div style={{ textAlign: 'center', color: '#C4BDFF' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>✦</div>
            <div style={{ fontSize: 18, fontWeight: 300, marginBottom: 10 }}>당신의 행성이 생성됩니다</div>
            <div style={{ fontSize: 13, color: 'rgba(155,145,255,.5)', lineHeight: 1.7 }}>
              초대장이 오면 꼭 와주세요.<br />우주에서 기다릴게요.
            </div>
            <button onClick={onClose} style={{ marginTop: 24, fontSize: 12, color: 'rgba(155,145,255,.4)', background: 'none', border: 'none', cursor: 'pointer' }}>닫기</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(123,112,224,.6)', marginBottom: 14 }}>
              첫 500명 우선 초대
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 300, color: '#F0EEFF', marginBottom: 8, letterSpacing: '-.02em' }}>
              당신의 행성이<br />기다리고 있습니다
            </h3>
            <p style={{ fontSize: 13, color: 'rgba(155,145,255,.45)', lineHeight: 1.7, marginBottom: 24 }}>
              이메일을 남겨주시면 우선 초대장을 드립니다.
            </p>

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 10,
                background: 'rgba(15,12,40,.8)', border: '1px solid rgba(123,112,224,.3)',
                color: '#D4D0F0', fontSize: 14, outline: 'none', marginBottom: 14,
                fontFamily: 'inherit',
              }}
            />

            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              {['apple','youtube'].map(p => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                    background: platform === p ? 'rgba(63,58,154,.5)' : 'rgba(15,12,40,.6)',
                    border: `1px solid ${platform === p ? 'rgba(155,145,255,.7)' : 'rgba(123,112,224,.2)'}`,
                    color: platform === p ? '#C4BDFF' : 'rgba(155,145,255,.45)',
                    fontSize: 12, transition: 'all .2s',
                  }}
                >
                  {p === 'apple' ? 'Apple Music' : 'YouTube Music'}
                </button>
              ))}
            </div>

            {status === 'error' && (
              <div style={{ fontSize: 12, color: '#F09595', marginBottom: 14 }}>
                이미 신청하셨어요. 초대장을 기다려주세요.
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={status === 'loading'}
              style={{
                width: '100%', padding: '13px', borderRadius: 10, cursor: 'pointer',
                background: 'rgba(63,58,154,.7)', border: '1px solid rgba(123,112,224,.6)',
                color: '#C4BDFF', fontSize: 14, fontWeight: 500, transition: 'all .3s',
              }}
            >
              {status === 'loading' ? '신청 중...' : '베타 초대 신청하기'}
            </button>

            <button onClick={onClose} style={{ width: '100%', marginTop: 12, fontSize: 12, color: 'rgba(155,145,255,.3)', background: 'none', border: 'none', cursor: 'pointer' }}>
              나중에
            </button>
          </>
        )}
      </div>
    </div>
  )
}
