import React, { useEffect, useRef, memo } from 'react';
import { useThreeEngine } from './useThreeEngine';

/**
 * CanvasLayer
 * 3D 엔진의 캔버스를 호스팅하는 물리적 레이어입니다.
 * React의 리렌더링 사이클로부터 3D 씬을 격리하기 위해 memo를 사용하며,
 * 엔진 초기화는 단 1회만 이루어집니다.
 */
const CanvasLayer = memo(({ settingsRef }) => {
  const mountRef = useRef(null);

  // 1. 엔진 격리 실행 (settingsRef만 관찰)
  useThreeEngine({
    settingsRef,
    containerRef: mountRef
  });

  // 2. Lifecycle Logging (디버깅용)
  useEffect(() => {
    console.log("🛡️ [STABILITY] CanvasLayer Mounted (Root Level)");
    return () => {
      // 절대 renderer.dispose() 하지 않음
      console.warn("⚠️ [STABILITY] CanvasLayer Unmounting - 엔진 인스턴스는 절대 파괴되지 않습니다.");
    };
  }, []);

  return (
    <div 
      ref={mountRef}
      id="stellara-canvas-host"
      className="engine-isolation-layer"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0, // 캔버스는 맨 아래 레이어
        background: '#010008',
        pointerEvents: 'auto',
        overflow: 'hidden'
      }}
    />
  );
});

CanvasLayer.displayName = 'CanvasLayer';

export default CanvasLayer;
