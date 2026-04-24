const GA  = 137.508;
const PAL = [
  { sMin:45, sMax:65, lMin:68, lMax:78, label:'pastel' },
  { sMin:72, sMax:88, lMin:50, lMax:62, label:'vivid'  },
  { sMin:58, sMax:78, lMin:34, lMax:50, label:'deep'   },
];
const rf = (a, b) => a + Math.random() * (b - a);

export function hslToHex(h, s, l) {
  const S=s/100, L=l/100, c=(1-Math.abs(2*L-1))*S, x=c*(1-Math.abs(((h/60)%2)-1)), m=L-c/2;
  let r=0,g=0,b=0;
  if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}
  else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}
  const hex = v => Math.round((v+m)*255).toString(16).padStart(2,'0');
  return '#'+hex(r)+hex(g)+hex(b);
}
export function hslToInt(h,s,l) { return parseInt(hslToHex(h,s,l).slice(1),16); }

export function getPlanetStyle(index) {
  const hue      = (index * GA) % 360;
  const pal      = PAL[index % 3];
  const sat      = rf(pal.sMin, pal.sMax);
  const lig      = rf(pal.lMin, pal.lMax);
  const hex      = hslToHex(hue, sat, lig);
  const colorInt = hslToInt(hue, sat, lig);
  const glowOp   = pal.label==='deep' ? 0.032 : pal.label==='vivid' ? 0.055 : 0.044;

  const hasRing  = Math.random() < 0.60;
  const compHue  = (hue + 155 + Math.random() * 50) % 360;
  const ring = hasRing ? {
    thickness:  rf(0.05, 0.20),
    radiusMult: rf(1.45, 2.1),
    opacity:    rf(0.20, 0.46),
    tiltX:      Math.PI * rf(0.22, 0.65),
    rotSpeed:   (Math.random() > 0.5 ? 1 : -1) * rf(0.0003, 0.001),
    colorInt,
    colorInt2:  hslToInt(compHue, rf(62, 85), rf(44, 66)),
  } : null;

  return { hue, sat, lig, hex, colorInt, palette: pal.label, glowOp, hasRing, ring };
}

export function generateSphericalPos(index, total, { rMin=54, rMax=108 }={}) {
  const safeTotal = Math.max(Number(total) || 1, 1);
  const safeIndex = ((Number(index) || 0) % safeTotal + safeTotal) % safeTotal;

  // Use a Fibonacci sphere so planets wrap the black hole evenly in 360 degrees.
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const t = safeTotal === 1 ? 0.5 : safeIndex / (safeTotal - 1);
  const y = 1 - (t * 2);
  const polarRadius = Math.sqrt(Math.max(0.08, 1 - y * y));
  const theta = safeIndex * goldenAngle;

  // Add a golden-ratio radius phase so planets occupy multiple shells without clumping.
  const radiusPhase = (safeIndex * 0.61803398875) % 1;
  const radius = rMin + (rMax - rMin) * (0.24 + radiusPhase * 0.68);

  // Slightly compress the vertical spread so the black hole remains readable from the home camera.
  const yNorm = y * 0.78;
  const planarRadius = radius * polarRadius;

  return {
    x: Math.cos(theta) * planarRadius,
    y: yNorm * radius,
    z: Math.sin(theta) * planarRadius,
  };
}
