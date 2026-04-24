import React from 'react';

export function ProfileMiniCard({
  user,
  language = 'ko',
  onOpenGalaxy,
  onShareGalaxy,
  onSyncLibrary,
  syncMeta,
  quotaMeta,
  isYTConnected,
  onClose,
}) {
  if (!user) return null;

  const copy = language === 'en'
    ? {
        kicker: 'Explorer Profile',
        openGalaxy: 'Open My Galaxy',
        shareGalaxy: 'Share My Galaxy',
        sync: 'Sync Library Now',
        youtubeConnected: 'YouTube library connected',
        youtubeMissing: 'YouTube connection required',
        syncNever: 'No sync has been completed yet.',
        syncAt: 'Last sync',
        quotaOn: 'Quota protection is active until local midnight.',
        quotaOff: 'Quota protection is currently inactive.',
      }
    : {
        kicker: '탐험자 프로필',
        openGalaxy: '나의 은하 열기',
        shareGalaxy: '내 은하 공유',
        sync: '지금 라이브러리 동기화',
        youtubeConnected: 'YouTube 라이브러리 연결됨',
        youtubeMissing: 'YouTube 연결이 필요합니다.',
        syncNever: '아직 라이브러리 동기화 기록이 없습니다.',
        syncAt: '마지막 동기화',
        quotaOn: '쿼터 보호 모드가 자정까지 활성화되어 있습니다.',
        quotaOff: '쿼터 보호 모드는 현재 비활성 상태입니다.',
      };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 325, background: 'transparent' }}
      />
      <div
        style={{
          position: 'fixed',
          top: 68,
          right: 18,
          zIndex: 330,
          width: 'min(360px, calc(100vw - 28px))',
          padding: 16,
          borderRadius: 20,
          border: '1px solid rgba(123,112,224,.18)',
          background: 'rgba(6,4,20,.94)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 22px 80px rgba(0,0,0,.36)',
          animation: 'fadeUp .22s ease both',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={user.photoURL}
            alt=""
            style={{ width: 46, height: 46, borderRadius: '50%', border: '1px solid rgba(155,145,255,.35)' }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(155,145,255,.46)' }}>
              {copy.kicker}
            </div>
            <div style={{ fontSize: 16, color: '#F0EEFF', marginTop: 5 }}>{user.displayName}</div>
            <div style={{ fontSize: 11, color: 'rgba(196,189,255,.44)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          <InfoRow
            label="YouTube"
            value={isYTConnected ? copy.youtubeConnected : copy.youtubeMissing}
            tone={isYTConnected ? '#44FF88' : '#FF8B8B'}
          />
          <InfoRow
            label={copy.syncAt}
            value={syncMeta?.label || copy.syncNever}
            tone="rgba(155,145,255,.75)"
          />
          <InfoRow
            label="Quota"
            value={quotaMeta?.active ? copy.quotaOn : copy.quotaOff}
            tone={quotaMeta?.active ? '#FFD166' : 'rgba(196,189,255,.5)'}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          <MiniCardButton onClick={onOpenGalaxy}>{copy.openGalaxy}</MiniCardButton>
          <MiniCardButton onClick={onSyncLibrary}>{copy.sync}</MiniCardButton>
          <MiniCardButton onClick={onShareGalaxy}>{copy.shareGalaxy}</MiniCardButton>
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value, tone }) {
  return (
    <div
      style={{
        padding: '11px 12px',
        borderRadius: 14,
        border: '1px solid rgba(123,112,224,.14)',
        background: 'rgba(10,8,30,.74)',
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(155,145,255,.42)' }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: tone, marginTop: 5, lineHeight: 1.55 }}>
        {value}
      </div>
    </div>
  );
}

function MiniCardButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 12px',
        borderRadius: 999,
        border: '1px solid rgba(155,145,255,.24)',
        background: 'rgba(83,74,183,.26)',
        color: '#E8E4FF',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 11,
        letterSpacing: '.04em',
      }}
    >
      {children}
    </button>
  );
}
