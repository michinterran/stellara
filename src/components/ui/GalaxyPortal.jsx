import React from 'react';
import { CURATED_GALAXIES } from '@config/stellara';

/**
 * GalaxyPortal
 * 큐레이션된 은하계와 다른 사용자의 음악 세계로 이동하는 탐험 포털입니다.
 */
export function GalaxyPortal({ onHop, currentOwnerId }) {
  const [pendingGalaxy, setPendingGalaxy] = React.useState(null);

  const handleHopClick = async (id) => {
    if (!onHop || pendingGalaxy) return;
    setPendingGalaxy(id);
    try {
      await onHop(id);
    } catch (error) {
      console.error('[GalaxyPortal] Failed to hop galaxy:', error);
    } finally {
      setPendingGalaxy(null);
    }
  };

  return (
    <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 11, color: 'rgba(155,145,255,.45)', letterSpacing: '.14em', textTransform: 'uppercase' }}>
        Curated Gateways
      </div>

      {CURATED_GALAXIES.map((galaxy) => {
        const isCurrent = currentOwnerId === galaxy.id;
        const isPending = pendingGalaxy === galaxy.id;

        return (
          <button
            key={galaxy.id}
            onClick={() => handleHopClick(galaxy.id)}
            disabled={isCurrent || isPending}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              width: '100%',
              padding: '14px 15px',
              borderRadius: 14,
              textAlign: 'left',
              background: isCurrent ? 'rgba(83,74,183,.16)' : 'rgba(8,6,24,.62)',
              border: `1px solid ${isCurrent ? 'rgba(123,112,224,.5)' : 'rgba(123,112,224,.12)'}`,
              cursor: isCurrent || isPending ? 'default' : 'pointer',
              transition: 'all .22s',
              fontFamily: 'inherit',
              opacity: isPending ? 0.65 : 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#F0EEFF' }}>
                  {isPending ? '항로 계산 중...' : galaxy.name}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(155,145,255,.42)', marginTop: 2 }}>
                  {galaxy.ownerLabel}
                </div>
              </div>
              {isCurrent && (
                <span
                  style={{
                    fontSize: 9,
                    color: '#9B91FF',
                    background: 'rgba(155,145,255,.1)',
                    padding: '3px 7px',
                    borderRadius: 999,
                    whiteSpace: 'nowrap',
                  }}
                >
                  현재 위치
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(155,145,255,.36)', lineHeight: 1.45 }}>
              {galaxy.description}
            </div>
          </button>
        );
      })}

      <div
        style={{
          marginTop: 8,
          padding: '12px 14px',
          borderRadius: 12,
          background: 'rgba(123,112,224,.05)',
          border: '1px dotted rgba(123,112,224,.2)',
        }}
      >
        <p style={{ fontSize: 10, color: 'rgba(155,145,255,.34)', lineHeight: 1.65, margin: 0 }}>
          Stellara는 스트리밍을 제공하지 않고, 이미 연결된 음악 라이브러리를 더 발견하기 쉽게
          배치하는 소셜 인터페이스입니다.
        </p>
      </div>
    </div>
  );
}
