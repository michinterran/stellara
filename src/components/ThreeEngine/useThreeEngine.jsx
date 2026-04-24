import { useEffect } from 'react';
import * as THREE from 'three';
import { getPlanetStyle, generateSphericalPos } from '@utils/planetStyles';
import { events } from '@utils/StellaraEvents';

// ── 이징 ──────────────────────────────────────────────────────
const EASE_IO  = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
const EASE_IN3 = t => t * t * t;

// ── 셰이더 ───────────────────
const VERT = [
  'varying vec2 vUv;varying vec3 vNormal;',
  'void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);',
  'gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
].join('\n');

function mkGas(c1,c2,c3) { return [
  'uniform float time;uniform float pulse;',
  'varying vec2 vUv;varying vec3 vNormal;',
  'vec3 C1=vec3('+c1+'),C2=vec3('+c2+'),C3=vec3('+c3+');',
  'float hn(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}',
  'float sn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hn(i),hn(i+vec2(1,0)),f.x),mix(hn(i+vec2(0,1)),hn(i+vec2(1,1)),f.x),f.y);}',
  'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*sn(p);p*=2.1;a*=.5;}return v;}',
  'void main(){',
  'float b=sin((vUv.y*7.+fbm(vec2(vUv.x*2.8+time*.055,vUv.y*1.8))*2.2)*3.14159)*.5+.5;',
  'float sw=fbm(vec2(vUv.x*4.+time*.038,vUv.y*3.8-time*.028));',
  'float t=clamp(b*.6+sw*.35,0.,1.);',
  'vec3 col=mix(C1,mix(C2,C3,t*t),t);',
  'col+=C1*pow(1.-abs(dot(vNormal,vec3(0,0,1))),.7)*.22;',
  'col*=(max(0.,dot(vNormal,normalize(vec3(.8,.6,.4)))*.75+.25)*(1.+pulse*.2));',
  'gl_FragColor=vec4(col,1.);}',
].join('\n'); }

const ICE = [
  'uniform float time;uniform float pulse;varying vec2 vUv;varying vec3 vNormal;',
  'float hn(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}',
  'float sn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hn(i),hn(i+vec2(1,0)),f.x),mix(hn(i+vec2(0,1)),hn(i+vec2(1,1)),f.x),f.y);}',
  'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*sn(p);p*=2.1;a*=.5;}return v;}',
  'void main(){float n=fbm(vUv*5.+time*.016)*fbm(vUv*10.-time*.012);',
  'vec3 col=mix(vec3(.48,.66,.92)+n*.16,vec3(.84,.92,1.),smoothstep(.38,.44,n));',
  'col=mix(col,vec3(.92,.96,1.),smoothstep(.28,.0,abs(vUv.y-.5))*.52);',
  'col+=vec3(.24,.44,.78)*pow(1.-abs(dot(vNormal,vec3(0,0,1))),1.8)*.36;',
  'col*=(max(0.,dot(vNormal,normalize(vec3(.8,.5,.6)))*.8+.2)*(1.+pulse*.18));',
  'gl_FragColor=vec4(col,1.);}',
].join('\n');

const LAVA = [
  'uniform float time;uniform float pulse;varying vec2 vUv;varying vec3 vNormal;',
  'float hn(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}',
  'float sn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hn(i),hn(i+vec2(1,0)),f.x),mix(hn(i+vec2(0,1)),hn(i+vec2(1,1)),f.x),f.y);}',
  'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*sn(p);p*=2.1;a*=.5;}return v;}',
  'void main(){vec2 w=vec2(fbm(vUv*2.4+time*.058),fbm(vUv*2.4+vec2(5.2,1.3)+time*.048));',
  'float f=fbm(vUv*3.+w*.2+vec2(time*.086,-time*.065));float c=smoothstep(.36,.60,f);',
  'vec3 col=mix(mix(vec3(.05,.01,.01),vec3(.92,.20,.03),c),vec3(1.,.76,.12),smoothstep(.66,1.,f));',
  'col+=vec3(.65,.12,.0)*pow(1.-abs(dot(vNormal,vec3(0,0,1))),1.4)*.46;',
  'col*=(max(0.,dot(vNormal,normalize(vec3(.6,.8,.4)))*.5+.5)*(1.+pulse*.25));',
  'gl_FragColor=vec4(col,1.);}',
].join('\n');

const JAZZ = [
  'uniform float time;uniform float pulse;varying vec2 vUv;varying vec3 vNormal;',
  'float hn(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}',
  'float sn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hn(i),hn(i+vec2(1,0)),f.x),mix(hn(i+vec2(0,1)),hn(i+vec2(1,1)),f.x),f.y);}',
  'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*sn(p);p*=2.1;a*=.5;}return v;}',
  'void main(){float n=fbm(vUv*4.+time*.025);',
  'vec3 gold=vec3(.72,.56,.18);vec3 blue=vec3(.12,.25,.55);',
  'vec3 col=mix(blue,gold,smoothstep(.3,.7,n+sin(vUv.y*6.+time*.08)*.18));',
  'col+=gold*pow(1.-abs(dot(vNormal,vec3(0,0,1))),1.2)*.35;',
  'col*=(max(0.,dot(vNormal,normalize(vec3(.8,.6,.4)))*.8+.2)*(1.+pulse*.15));',
  'gl_FragColor=vec4(col,1.);}',
].join('\n');

const FRAGS = [
  mkGas('.45,.18,.65','.25,.08,.45','.7,.35,.85'),
  mkGas('.08,.42,.32','.15,.62,.45','.25,.75,.55'),
  ICE,
  mkGas('.65,.35,.08','.8,.5,.12','.9,.65,.2'),
  ICE,
  LAVA,
  JAZZ,
  mkGas('.3,.1,.5','.5,.2,.7','.8,.4,.9'),
];

// ── 별 텍스처 (모듈 스코프 싱글톤) ───────────────────────────
let _starTex = null;
function getStarTex() {
  if (_starTex) return _starTex;
  const c=document.createElement('canvas'); c.width=c.height=32;
  const ctx=c.getContext('2d'), g=ctx.createRadialGradient(16,16,0,16,16,16);
  g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.4,'rgba(255,255,255,.6)'); g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=g; ctx.fillRect(0,0,32,32);
  return (_starTex = new THREE.CanvasTexture(c));
}

function addStars(scene, n, r, sz, col, op) {
  const geo=new THREE.BufferGeometry(), pos=new Float32Array(n*3);
  for(let i=0;i<n;i++){
    const th=Math.random()*Math.PI*2, ph=Math.acos(Math.random()*2-1), d=r*(.3+Math.random()*.7);
    pos[i*3]=d*Math.sin(ph)*Math.cos(th); pos[i*3+1]=d*Math.sin(ph)*Math.sin(th); pos[i*3+2]=d*Math.cos(ph);
  }
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({color:col,size:sz,sizeAttenuation:true,transparent:true,opacity:op,map:getStarTex(),alphaTest:.01,depthWrite:false})));
}

function addNebula(scene) {
  [[0x3D1A7A,-100,50,-180,1.2,.022],[0x0D2A5A,90,-40,-140,1.0,.018],[0x1A0A4A,30,80,-220,1.5,.015]]
  .forEach(([col,x,y,z,sx,op])=>{
    const m=new THREE.Mesh(new THREE.SphereGeometry(100,8,8),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,side:THREE.BackSide,depthWrite:false}));
    m.position.set(x,y,z); m.scale.x=sx; scene.add(m);
  });
}

function buildBlackhole(scene) {
  const BH = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(11, 32, 32), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  BH.add(core);
  const ringDefs = [
    { r:16, t:0.50, col:0xFF8833, op:0.82 },
    { r:22, t:0.30, col:0xFFBB55, op:0.55 },
    { r:29, t:0.15, col:0xFF5500, op:0.32 },
  ];
  const rings = ringDefs.map(({r,t,col,op}) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 4, 120), new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:op }));
    m.rotation.x = Math.PI / 3;
    BH.add(m); return m;
  });
  BH.add(new THREE.Mesh(new THREE.SphereGeometry(26, 16, 16), new THREE.MeshBasicMaterial({ color:0xFF4400, transparent:true, opacity:0.05, side:THREE.BackSide, depthWrite:false })));
  const pg = new THREE.BufferGeometry(), pp = new Float32Array(800 * 3);
  for(let i=0;i<800;i++){ const a=Math.random()*Math.PI*2, rv=13+Math.random()*22; pp[i*3]=Math.cos(a)*rv; pp[i*3+1]=(Math.random()-.5)*2.8; pp[i*3+2]=Math.sin(a)*rv; }
  pg.setAttribute('position', new THREE.BufferAttribute(pp,3));
  const part = new THREE.Points(pg, new THREE.PointsMaterial({color:0xFF9944,size:0.55,transparent:true,opacity:0.58,depthWrite:false}));
  BH.add(part); BH.userData = { core, rings, part };
  scene.add(BH); return BH;
}

function buildShootingStars(scene) {
  return Array.from({length:8}, () => {
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12*3), 3));
    const mat = new THREE.LineBasicMaterial({ color:0xE8E4FF, transparent:true, opacity:0 });
    scene.add(new THREE.Line(geo, mat));
    return { geo, mat, active:false, t:0, dur:0, sx:0,sy:0,sz:0, dx:0,dy:0,dz:0, spd:0 };
  });
}

function buildPlanet(data, idx) {
  const style = getPlanetStyle(idx);
  const r     = (data.r ?? 9) * 0.80;
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 64), new THREE.ShaderMaterial({ uniforms: { time:{value:0}, pulse:{value:0} }, vertexShader: VERT, fragmentShader: FRAGS[idx % FRAGS.length] }));
  mesh.scale.set(0.85, 0.85, 0.85);
  group.add(mesh);
  if (style.hasRing && style.ring) {
    const rm = new THREE.Mesh(new THREE.TorusGeometry(r*style.ring.radiusMult, style.ring.thickness, 4, 100), new THREE.MeshBasicMaterial({ color:style.ring.colorInt, transparent:true, opacity:style.ring.opacity }));
    rm.rotation.x = style.ring.tiltX; group.add(rm);
    const rm2 = new THREE.Mesh(new THREE.TorusGeometry(r*style.ring.radiusMult*1.24, style.ring.thickness*.35, 3, 90), new THREE.MeshBasicMaterial({ color:style.ring.colorInt2, transparent:true, opacity:style.ring.opacity*.50 }));
    rm2.rotation.x = style.ring.tiltX + 0.09; group.add(rm2);
    group.userData.ringMesh = rm; group.userData.ringMesh2 = rm2; group.userData.ringSpd = style.ring.rotSpeed;
  }
  const glow = new THREE.Mesh(new THREE.SphereGeometry(r * 1.55, 16, 16), new THREE.MeshBasicMaterial({ color:style.colorInt, transparent:true, opacity:style.glowOp*1.6, side:THREE.BackSide, depthWrite:false }));
  group.add(glow); group.userData.glowMesh = glow; group.userData.mesh = mesh; group.userData.style = style; group.userData.r = r;
  return { group, mesh };
}

function isFiniteVec3(vec) {
  return vec && Number.isFinite(vec.x) && Number.isFinite(vec.y) && Number.isFinite(vec.z);
}

function getOrbitPoint(th, ph, dist, time = 0) {
  const bobbing = Math.sin(time * 0.11) * 2;
  const r = dist + bobbing;
  return new THREE.Vector3(
    r * Math.sin(ph) * Math.sin(th),
    r * Math.cos(ph),
    r * Math.sin(ph) * Math.cos(th),
  );
}

// ═══════════════════════════════════════════════════════════════
// Singleton Core Object
// ═══════════════════════════════════════════════════════════════
const _core = {
  initialized: false,
  scene: null, renderer: null, camera: null,
  planets: new Map(), shooters: [], bh: null, galaxyBeacons: new Map(),
  raycaster: new THREE.Raycaster(), mouse: new THREE.Vector2(-9, -9),
  clock: new THREE.Clock(), prevT: 0,
  
  sph: { th:0, ph: Math.PI/2 - 0.08 }, tSph: { th:0, ph: Math.PI/2 - 0.08 },
  dist: 130, tDist: 130, autoRot: true, autoTimer: null,
  isDrag: false, prevMX: 0, prevMY: 0, ssTimer: 5,
  
  camSM: {
    state: 'idle', target: null, progress: 0,
    startPos: new THREE.Vector3(), endPos: new THREE.Vector3(),
    startLook: new THREE.Vector3(), endLook: new THREE.Vector3(),
    returnSph: { th: 0, ph: Math.PI / 2 - 0.08 },
    returnDist: 130,
    _lookNow: new THREE.Vector3(),
  },
  
  bhSM: {
    state: 'idle', progress: 0,
    startPos: new THREE.Vector3(), endPos: new THREE.Vector3(0, 0, 26),
    _now: new THREE.Vector3(),
  },

  settings: { rotSpeed: 1, shootingSpeed: 1, starDensity: 1 },
  callbacks: { onPlanetClick: null, onHover: null, onBHClick: null, onGalaxyHover: null, onGalaxyClick: null },
  hovId: null, galaxyHoverId: null,
  posCache: new Map(), // 행성 ID별 좌표 캐시 (Position Locking)
  driftFocus: null,
};

const PLANET_LAYOUT_VERSION = 2;
const ORIGIN = new THREE.Vector3(0, 0, 0);
function hashString(input = '') {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function parseColorToInt(value, fallback) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.trim().replace('#', '');
    if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
      return parseInt(normalized, 16);
    }
  }
  return fallback;
}

function getPromotionDesignPreset(type, design = {}) {
  const theme = design?.theme || (type === 'campaign' ? 'broadcast' : type === 'label' ? 'editorial' : 'luxury');
  const presets = {
    luxury: {
      haloOpacity: 0.3,
      orbitOpacity: 0.18,
      glowOpacity: 0.09,
      shellScale: 4.1,
    },
    broadcast: {
      haloOpacity: 0.28,
      orbitOpacity: 0.16,
      glowOpacity: 0.08,
      shellScale: 4.25,
    },
    editorial: {
      haloOpacity: 0.24,
      orbitOpacity: 0.13,
      glowOpacity: 0.072,
      shellScale: 3.78,
    },
    aurora: {
      haloOpacity: 0.26,
      orbitOpacity: 0.15,
      glowOpacity: 0.085,
      shellScale: 4.35,
    },
    signal: {
      haloOpacity: 0.22,
      orbitOpacity: 0.12,
      glowOpacity: 0.07,
      shellScale: 3.58,
    },
    ceramic: {
      haloOpacity: 0.18,
      orbitOpacity: 0.1,
      glowOpacity: 0.06,
      shellScale: 3.42,
    },
  };

  return presets[theme] || presets.luxury;
}

function getGalaxyBeaconPosition(data, idx) {
  const seed = hashString(data?.id || `galaxy-${idx}`);
  const isPromotion = Boolean(data?.isFeatured || data?.promotionType);
  const band = data?.stageBand || (isPromotion ? 'promotion' : 'far');
  const radiusByBand = {
    near: 146 + (seed % 18),
    mid: 176 + (seed % 24),
    far: 204 + (seed % 26),
    promotion: 232 + (seed % 30),
  };
  const verticalByBand = {
    near: 26,
    mid: 34,
    far: 42,
    promotion: 52,
  };
  const angleStride = band === 'near'
    ? 0.46
    : band === 'mid'
      ? 0.56
      : band === 'promotion'
        ? 0.78
        : 0.64;
  const radius = radiusByBand[band] ?? radiusByBand.far;
  const angle = ((seed % 360) * Math.PI) / 180 + (idx * angleStride);
  const heightRange = verticalByBand[band] ?? verticalByBand.far;
  const height = ((Math.floor(seed / 9) % (heightRange * 2)) - heightRange) * (isPromotion ? 0.76 : 0.88);
  return new THREE.Vector3(
    Math.cos(angle) * radius,
    height,
    Math.sin(angle) * radius,
  );
}

function buildGalaxyBeacon(data, idx) {
  const isPromotion = Boolean(data?.isFeatured || data?.promotionType);
  const seed = hashString(data?.id || `galaxy-${idx}`);
  const seededUnit = (offset = 0) => ((seed + offset * 131) % 1000) / 1000;
  const promotionProfiles = {
    brand: {
      glow: 0xE38CB8,
      ring: 0xF4D4AE,
      shell: 0xEBC8F0,
      haloOpacity: 0.28,
      orbitOpacity: 0.16,
      glowOpacity: 0.07,
      haloTilt: Math.PI / 2.55,
      orbitTilt: Math.PI / 2.2,
      shellScale: 3.6,
    },
    campaign: {
      glow: 0x71C7D8,
      ring: 0xB6F3F7,
      shell: 0x92C5F8,
      haloOpacity: 0.24,
      orbitOpacity: 0.14,
      glowOpacity: 0.065,
      haloTilt: Math.PI / 2.9,
      orbitTilt: Math.PI / 2.05,
      shellScale: 3.85,
    },
    label: {
      glow: 0xB0A6FF,
      ring: 0xDDD6FF,
      shell: 0xC3B2FF,
      haloOpacity: 0.22,
      orbitOpacity: 0.12,
      glowOpacity: 0.06,
      haloTilt: Math.PI / 2.45,
      orbitTilt: Math.PI / 2.3,
      shellScale: 3.45,
    },
    default: {
      glow: 0x4A5BFF,
      ring: 0xA89FFF,
      shell: 0x8A7CFF,
      haloOpacity: 0.18,
      orbitOpacity: 0.09,
      glowOpacity: 0.045,
      haloTilt: Math.PI / 2.6,
      orbitTilt: Math.PI / 2.2,
      shellScale: 3.2,
    },
  };
  const profile = promotionProfiles[data?.promotionType] || (isPromotion ? promotionProfiles.brand : promotionProfiles.default);
  const designPreset = getPromotionDesignPreset(data?.promotionType, data?.design);
  const designPalette = data?.design?.palette ?? {};
  const palette = {
    glow: parseColorToInt(designPalette.glow, profile.glow),
    ring: parseColorToInt(designPalette.secondary, profile.ring),
    shell: parseColorToInt(designPalette.primary, profile.shell),
    accent: parseColorToInt(designPalette.accent, data?.promotionType === 'campaign'
      ? 0xFFE7AE
      : data?.promotionType === 'label'
        ? 0x9BC0FF
        : 0xF6CCE4),
  };
  const band = data?.stageBand || (isPromotion ? 'promotion' : 'far');
  const size = isPromotion
    ? (data?.design?.scaleTier === 'monument'
      ? 4.2 + seededUnit(1) * 1.2
      : data?.design?.scaleTier === 'standard'
        ? 2.92 + seededUnit(1) * 0.78
        : 3.25 + seededUnit(1) * 1.02)
    : band === 'near'
      ? 2.7 + seededUnit(1) * 0.22
      : band === 'mid'
        ? 2.34 + seededUnit(1) * 0.16
        : 2.02 + seededUnit(1) * 0.1;
  const styleIndex = data?.promotionType === 'brand'
    ? 6
    : data?.promotionType === 'campaign'
      ? 5
      : data?.promotionType === 'label'
        ? 2
        : seed % FRAGS.length;
  const { group, mesh } = buildPlanet({ r: size }, styleIndex);
  const variantA = seededUnit(2);
  const variantB = seededUnit(3);
  const variantC = seededUnit(4);
  const ringStyle = data?.design?.ringStyle || 'double';
  const hasSecondHalo = isPromotion && variantA > 0.42;
  const hasParticleVeil = isPromotion && variantB > 0.34;
  const hasPolarAurora = isPromotion && variantC > 0.28;
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(size * (isPromotion ? 1.94 + variantA * 0.34 : 1.72), isPromotion ? 0.05 + variantB * 0.045 : 0.06, 4, 72),
    new THREE.MeshBasicMaterial({
      color: palette.ring,
      transparent: true,
      opacity: isPromotion ? designPreset.haloOpacity * (0.72 + variantA * 0.34) : 0.18,
      depthWrite: false,
    }),
  );
  halo.rotation.x = isPromotion ? profile.haloTilt + (variantB - 0.5) * 0.34 : Math.PI / 2.7;
  if (!(isPromotion && ringStyle === 'none')) {
    group.add(halo);
  }
  let haloSecondary = null;
  if (hasSecondHalo && ringStyle !== 'single' && ringStyle !== 'none') {
    haloSecondary = new THREE.Mesh(
      new THREE.TorusGeometry(size * (2.24 + variantB * 0.42), 0.018 + variantC * 0.016, 3, 88),
      new THREE.MeshBasicMaterial({
        color: palette.accent,
        transparent: true,
        opacity: 0.08 + variantA * 0.08,
        depthWrite: false,
      }),
    );
    haloSecondary.rotation.x = halo.rotation.x + 0.18 + variantC * 0.18;
    haloSecondary.rotation.z = variantB * Math.PI;
    group.add(haloSecondary);
  }
  const orbit = new THREE.Mesh(
    new THREE.TorusGeometry(size * (isPromotion ? 2.44 + variantC * 0.54 : 2.2), isPromotion ? 0.018 + variantA * 0.02 : 0.022, 3, 96),
    new THREE.MeshBasicMaterial({
      color: palette.glow,
      transparent: true,
      opacity: isPromotion ? designPreset.orbitOpacity * (0.68 + variantB * 0.45) : 0.09,
      depthWrite: false,
    }),
  );
  orbit.rotation.x = isPromotion
    ? profile.orbitTilt + (ringStyle === 'tilted' ? 0.28 : 0) + (variantA - 0.5) * 0.22
    : Math.PI / 2.2;
  if (!(isPromotion && ringStyle === 'none')) {
    group.add(orbit);
  }
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(size * (isPromotion ? 2.55 + variantB * 0.65 : 2.45), 18, 18),
    new THREE.MeshBasicMaterial({
      color: palette.glow,
      transparent: true,
      opacity: isPromotion ? designPreset.glowOpacity * (0.72 + variantC * 0.42) : 0.045,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  group.add(glow);
  if (isPromotion) {
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(size * (designPreset.shellScale + variantA * 0.4), 12, 12),
      new THREE.MeshBasicMaterial({
        color: palette.shell,
        transparent: true,
        opacity: 0.014 + variantB * 0.016,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    );
    shell.scale.set(1.0 + variantC * 0.06, 0.8 + variantA * 0.12, 1.04 + variantB * 0.16);
    group.add(shell);
    group.userData.shell = shell;

    const auraMode = data?.design?.aura || 'veil';
    const aurora = new THREE.Mesh(
      new THREE.SphereGeometry(size * (1.9 + variantA * 0.52), 16, 16),
      new THREE.MeshBasicMaterial({
        color: palette.glow,
        transparent: true,
        opacity: auraMode === 'storm'
          ? 0.036 + variantC * 0.028
          : auraMode === 'pulse'
            ? 0.026 + variantC * 0.024
            : 0.016 + variantC * 0.024,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    );
    aurora.scale.set(1.06 + variantB * 0.22, 0.72 + variantA * 0.18, 0.96 + variantC * 0.18);
    aurora.rotation.z = (idx % 7) * 0.22;
    aurora.rotation.x = variantB * 0.4;
    group.add(aurora);
    group.userData.aurora = aurora;

    if (hasPolarAurora) {
      const polarAurora = new THREE.Mesh(
        new THREE.TorusGeometry(size * (1.08 + variantC * 0.12), 0.04 + variantA * 0.03, 4, 48),
        new THREE.MeshBasicMaterial({
          color: palette.accent,
          transparent: true,
          opacity: 0.045 + variantB * 0.04,
          depthWrite: false,
        }),
      );
      polarAurora.rotation.y = Math.PI / 2;
      polarAurora.rotation.z = variantA * Math.PI;
      group.add(polarAurora);
      group.userData.polarAurora = polarAurora;
    }

    const particleTier = data?.design?.particles || 'medium';
    if (hasParticleVeil || particleTier === 'high') {
      const particleCount = particleTier === 'high'
        ? 32 + Math.floor(variantC * 18)
        : particleTier === 'low'
          ? 12 + Math.floor(variantC * 8)
          : 14 + Math.floor(variantC * 14);
      const particleGeo = new THREE.BufferGeometry();
      const particlePos = new Float32Array(particleCount * 3);
      for (let particleIndex = 0; particleIndex < particleCount; particleIndex += 1) {
        const angle = (particleIndex / particleCount) * Math.PI * 2;
        const radius = size * (2.35 + ((particleIndex + seed) % 5) * 0.16);
        particlePos[particleIndex * 3] = Math.cos(angle) * radius;
        particlePos[(particleIndex * 3) + 1] = (seededUnit(10 + particleIndex) - 0.5) * size * 0.95;
        particlePos[(particleIndex * 3) + 2] = Math.sin(angle) * radius;
      }
      particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
      const particles = new THREE.Points(
        particleGeo,
        new THREE.PointsMaterial({
          color: palette.accent,
          size: particleTier === 'high' ? 0.32 + variantA * 0.18 : 0.2 + variantA * 0.16,
          transparent: true,
          opacity: particleTier === 'low' ? 0.12 + variantB * 0.1 : 0.22 + variantB * 0.16,
          depthWrite: false,
        }),
      );
      particles.rotation.x = variantC * 0.6;
      particles.rotation.z = variantB * Math.PI;
      group.add(particles);
      group.userData.particles = particles;
    }
  }
  const hitTarget = new THREE.Mesh(
    new THREE.SphereGeometry(size * (isPromotion ? 2.8 : 2.35), 10, 10),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  group.add(hitTarget);
  const position = getGalaxyBeaconPosition(data, idx);
  group.position.copy(position);
  group.userData = {
    ...data,
    type: 'galaxy-beacon',
    beaconId: data.id,
    isPromotion,
    core: mesh,
    glow,
    halo,
    haloSecondary,
    orbit,
    shell: group.userData.shell,
    aurora: group.userData.aurora,
    polarAurora: group.userData.polarAurora,
    particles: group.userData.particles,
    profile,
    design: data?.design || null,
    hitTarget,
    baseX: position.x,
    baseY: position.y,
    baseZ: position.z,
    hoverScale: isPromotion ? 1.22 : band === 'near' ? 1.16 : 1.1,
    band,
    t0: (hashString(data?.title || data?.id || String(idx)) % 600) / 10,
  };
  return group;
}

function addPlanetInternal(data) {
    if(!_core.scene) return;
    const idx = data.index ?? _core.planets.size;
    const orbitTotal = Math.max(data.orbitTotal ?? data.totalPlanets ?? (idx + 1), idx + 1, 1);
    // Position & Animation Locking: 캐시된 데이터가 있으면 사용, 없으면 새로 생성 후 저장
    let cached = _core.posCache.get(data.planetId);
    const needsRelayout =
      !cached ||
      !isFiniteVec3(cached.pos) ||
      cached.layoutVersion !== PLANET_LAYOUT_VERSION ||
      cached.orbitTotal !== orbitTotal ||
      cached.index !== idx;
    if (needsRelayout) {
      const pos = generateSphericalPos(idx, orbitTotal);
      cached = {
        pos,
        index: idx,
        orbitTotal,
        layoutVersion: PLANET_LAYOUT_VERSION,
        t0: Math.random() * 100,
        baseSpd: 0.0002 + Math.random() * 0.0004
      };
      _core.posCache.set(data.planetId, cached);
      console.log(`📍 [ENGINE] New Data Cached for ${data.planetId}`);
    } else {
      console.log(`🎯 [ENGINE] Data Cache Hit for ${data.planetId}`);
    }
    
    const { pos, t0, baseSpd } = cached;
    const { group, mesh } = buildPlanet(data, idx);
    group.position.set(pos.x, pos.y, pos.z);
    Object.assign(group.userData, {
      ...data,
      baseX:pos.x,
      baseY:pos.y,
      baseZ:pos.z,
      t0,
      baseSpd,
      birthStart: data?.justBornAt ? _core.clock.getElapsedTime() : null,
    });
    if (data?.justBornAt) {
      group.scale.setScalar(0.42);
      if (group.userData.glowMesh?.material) {
        group.userData.glowMesh.material.opacity *= 1.8;
      }
    }
    _core.scene.add(group);
    _core.planets.set(data.planetId, { group, mesh, data });
}

function removePlanetByIdInternal(id) {
    const e = _core.planets.get(id);
    if(!e || !_core.scene) return;
    _core.scene.remove(e.group);
    
    // 메모리 해제 보강
    e.group.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });

    _core.planets.delete(id);
}

function clearAllPlanetsInternal() {
  if (!_core.scene) return;
  const ids = Array.from(_core.planets.keys());
  ids.forEach(id => removePlanetByIdInternal(id));
  _core.planets.clear();
  console.log('🌌 [ENGINE] Galaxy cleared');
}

function clearAllGalaxyBeaconsInternal() {
  if (!_core.scene) return;
  const ids = Array.from(_core.galaxyBeacons.keys());
  ids.forEach((id) => {
    const beacon = _core.galaxyBeacons.get(id);
    if (!beacon) return;
    _core.scene.remove(beacon);
    beacon.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((material) => material.dispose());
        else obj.material.dispose();
      }
    });
    _core.galaxyBeacons.delete(id);
  });
  _core.galaxyHoverId = null;
}

function reloadGalaxyBeaconsInternal(galaxies = []) {
  clearAllGalaxyBeaconsInternal();
  galaxies.forEach((galaxy, idx) => {
    if (!galaxy?.id) return;
    const beacon = buildGalaxyBeacon(galaxy, idx);
    _core.scene.add(beacon);
    _core.galaxyBeacons.set(galaxy.id, beacon);
  });
}

function zoomInInternal(id) {
    const e = _core.planets.get(id); if(!e) return;
    if (!isFiniteVec3(e.group.position)) {
      console.warn(`[ENGINE] Cannot zoom to invalid planet position: ${id}`);
      return;
    }
    const sm = _core.camSM; if(sm.state !== 'idle') return;
    
    // [Fix] 줌 시작 전 구면 좌표계 동기화
    const pos = _core.camera.position.clone();
    const d = pos.length();
    _core.dist = _core.tDist = d;
    _core.sph.ph = _core.tSph.ph = Math.acos(THREE.MathUtils.clamp(pos.y / d, -1, 1));
    _core.sph.th = _core.tSph.th = Math.atan2(pos.x, pos.z);

    const pp = e.group.position;
    const r = (e.data.r ?? 9) * 0.8;
    const rv = r * 4;
    const dur = 1 / 0.52; // 0.52는 sm.progress 증가분 (1/0.52초)
    const tEnd = _core.clock.getElapsedTime() + dur;
    sm.returnSph = {
      th: _core.tSph.th,
      ph: _core.tSph.ph,
    };
    sm.returnDist = _core.tDist || _core.dist || 130;

    // [Fix] 줌인이 끝날 때의 행성 궤도(landed) 위치를 미리 계산하여 도착지로 설정 (Seamless!)
    const targetDX = Math.sin(tEnd * 0.18) * rv;
    const targetDY = Math.sin(tEnd * 0.08) * 2;
    const targetDZ = Math.cos(tEnd * 0.18) * rv;

    sm.state='zooming-in'; sm.progress=0; sm.target=e.group;
    sm.startPos.copy(_core.camera.position); sm.startLook.set(0,0,0);
    sm.endPos.set(pp.x + targetDX, pp.y + targetDY, pp.z + targetDZ); 
    sm.endLook.copy(pp);
    
    _core.autoRot = false;
}

function zoomOutInternal() {
    const sm = _core.camSM; if(sm.state !== 'landed' && sm.state !== 'zooming-in') return;
    sm.state='zooming-out'; sm.progress=0;
    sm.startPos.copy(_core.camera.position);
    sm.startLook.copy(sm.target?.position ?? ORIGIN);
    const dist = 176;
    const th = _core.tSph.th ?? 0;
    const ph = Math.PI / 2 - 0.18;
    sm.endPos.copy(getOrbitPoint(th, ph, dist, _core.clock.getElapsedTime()));
    sm.endLook.set(0,0,0);
    sm.returnDist = dist;
    sm.returnSph = { th, ph };
}

function triggerBHSuckInternal() {
    const bh = _core.bhSM; bh.state = 'sucking'; bh.progress = 0;
    bh.startPos.copy(_core.camera.position);
}

function setDriftFocusInternal(payload = {}) {
  const { kind, id } = payload;

  if (kind === 'planet') {
    const entry = _core.planets.get(id);
    if (!entry?.group) return;
    _core.driftFocus = {
      kind,
      id,
      target: entry.group,
      anchor: 'drift',
      lookBlend: 0.12,
      distanceScale: 1,
      fov: 58,
      lift: 1.5,
    };
    return;
  }

  if (kind === 'galaxy') {
    const entry = _core.galaxyBeacons.get(id);
    if (!entry) return;
    _core.driftFocus = {
      kind,
      id,
      target: entry,
      anchor: 'drift',
      lookBlend: entry.userData?.isPromotion ? 0.18 : 0.14,
      distanceScale: 1,
      fov: 58,
      lift: entry.userData?.isPromotion ? 3 : 2,
    };
    return;
  }

  _core.driftFocus = null;
}

function clearDriftFocusInternal() {
  _core.driftFocus = null;
}

function initEngine(container) {
  if (!container) return;

  // 이미 초기화된 경우, 컨테이너가 바뀌었는지 확인하고 렌더러만 재부착 (Re-attach)
  if (_core.initialized) {
    if (_core.renderer && !container.contains(_core.renderer.domElement)) {
      console.log('🔄 [ENGINE] Re-attaching renderer to new container');
      container.appendChild(_core.renderer.domElement);
      // 리사이즈 강제 트리거로 뷰포트 맞춤
      _core.camera.aspect = window.innerWidth / window.innerHeight;
      _core.camera.updateProjectionMatrix();
      _core.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    return;
  }

  console.group('🚀 [ENGINE_INIT] Initializing Three.js Singleton');
  
  const W = () => window.innerWidth, H = () => window.innerHeight;
  _core.scene = new THREE.Scene();
  _core.scene.fog = new THREE.FogExp2(0x010008, 0.0022);
  
  _core.camera = new THREE.PerspectiveCamera(58, W()/H(), 0.1, 3000);
  _core.camera.position.set(0, 8, 130);
  
  _core.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  _core.renderer.setSize(W(), H());
  _core.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  _core.renderer.setClearColor(0x010008, 1);
  const el = _core.renderer.domElement;
  el.style.cssText = 'display:block;width:100%;height:100%;';
  container.appendChild(el);

  addStars(_core.scene, 5000, 800, 0.8, 0xE8E4FF, 0.65);
  addStars(_core.scene, 1500, 500, 1.5, 0xC4BDFF, 0.80);
  addStars(_core.scene, 400, 250, 2.5, 0xFFFFFF, 0.90);
  addNebula(_core.scene);
  _core.bh = buildBlackhole(_core.scene);
  _core.shooters = buildShootingStars(_core.scene);
  
  _core.scene.add(new THREE.AmbientLight(0x1A1040, 0.5));
  const pl1 = new THREE.PointLight(0x7B70E0, 3, 350); pl1.position.set(60,60,40); _core.scene.add(pl1);
  const pl2 = new THREE.PointLight(0x3D9A78, 1.8, 250); _core.scene.add(pl2);

  const startAuto = () => { clearTimeout(_core.autoTimer); _core.autoTimer = setTimeout(() => { _core.autoRot = true; }, 3500); };
  
  window.addEventListener('mousemove', (e) => {
    _core.mouse.x = (e.clientX/W())*2 - 1; _core.mouse.y = -(e.clientY/H())*2 + 1;
    if(!_core.isDrag) return;
    _core.tSph.th -= (e.clientX - _core.prevMX) * 0.004;
    _core.tSph.ph = Math.max(0.15, Math.min(Math.PI - 0.15, _core.tSph.ph + (e.clientY - _core.prevMY) * 0.004));
    _core.prevMX = e.clientX; _core.prevMY = e.clientY;
  }, { passive: true });

  window.addEventListener('mousedown', (e) => {
    if(e.target.closest('[data-ui]')) return;
    _core.isDrag = true; _core.autoRot = false; _core.prevMX = e.clientX; _core.prevMY = e.clientY; clearTimeout(_core.autoTimer);
  });
  window.addEventListener('mouseup', () => { _core.isDrag = false; startAuto(); });
  el.addEventListener('wheel', (e) => { _core.tDist = Math.max(50, Math.min(220, _core.tDist + e.deltaY * 0.12)); _core.autoRot = false; startAuto(); }, { passive: true });
  el.addEventListener('click', (e) => {
    if(e.target.closest('[data-ui]') || Math.abs(e.clientX - _core.prevMX) > 5) return;
    if(_core.camSM.state !== 'idle') return;
    _core.raycaster.setFromCamera(_core.mouse, _core.camera);
    if(_core.raycaster.intersectObject(_core.bh.userData.core).length) { _core.callbacks.onBHClick?.(); return; }
    const meshes = [..._core.planets.values()].map(p => p.mesh);
    const hits = _core.raycaster.intersectObjects(meshes);
    if(hits.length) { _core.callbacks.onPlanetClick?.(hits[0].object.parent.userData); return; }
    const beaconHits = _core.raycaster.intersectObjects([..._core.galaxyBeacons.values()].map((group) => group.userData.hitTarget));
    if (beaconHits.length) _core.callbacks.onGalaxyClick?.(beaconHits[0].object.parent.userData);
  });
  window.addEventListener('resize', () => { _core.camera.aspect = W()/H(); _core.camera.updateProjectionMatrix(); _core.renderer.setSize(W(), H()); });

  events.on('ADD_PLANET', (data) => addPlanetInternal(data));
  events.on('REMOVE_PLANET', (id) => removePlanetByIdInternal(id));
  events.on('ZOOM_IN', (planetId) => zoomInInternal(planetId));
  events.on('ZOOM_OUT', () => zoomOutInternal());
  events.on('TRIGGER_BH_SUCK', () => triggerBHSuckInternal());
  events.on('RELOAD_GALAXY_BEACONS', (galaxies) => reloadGalaxyBeaconsInternal(galaxies));
  events.on('SET_DRIFT_FOCUS', (payload) => setDriftFocusInternal(payload));
  events.on('CLEAR_DRIFT_FOCUS', () => clearDriftFocusInternal());
  
  events.on('RELOAD_GALAXY', (newPlanets) => {
    clearAllPlanetsInternal();
    clearDriftFocusInternal();
    if (newPlanets && Array.isArray(newPlanets)) {
      const orbitTotal = Math.max(newPlanets.length, 1);
      newPlanets.forEach((planet) => addPlanetInternal({ ...planet, orbitTotal }));
    }
  });

  function spawnSS(s) {
    const a=Math.random()*Math.PI*2, el=(Math.random()-.5)*Math.PI*.6, d=165+Math.random()*80;
    s.sx=Math.cos(a)*Math.cos(el)*d; s.sy=Math.sin(el)*d*.5; s.sz=Math.sin(a)*Math.cos(el)*d;
    s.dx=(-s.sx+(Math.random()-.5)*60)*.012; s.dy=(-s.sy+(Math.random()-.5)*30)*.012; s.dz=(-s.sz+(Math.random()-.5)*60)*.012;
    s.spd=3.5+Math.random()*3; s.dur=.5+Math.random()*.8; s.t=0; s.active=true; s.mat.opacity=.85;
  }
  function tickSS(s, dt) {
    if(!s.active) return; s.t += dt*s.spd; const p = s.t/s.dur;
    if(p >= 1) { s.active=false; s.mat.opacity=0; return; }
    const pos=s.geo.attributes.position.array, T=12;
    for(let i=0;i<T;i++){const f=(i/(T-1))*p; pos[i*3]=s.sx+s.dx*f*s.dur*120; pos[i*3+1]=s.sy+s.dy*f*s.dur*120; pos[i*3+2]=s.sz+s.dz*f*s.dur*120;}
    s.geo.attributes.position.needsUpdate=true; s.mat.opacity=Math.max(0, .85*(1-p*p));
  }

  function animate() {
    requestAnimationFrame(animate);
    const t = _core.clock.getElapsedTime();
    const dt = Math.min(t - _core.prevT, 0.05);
    _core.prevT = t;
    const rotMult = _core.settings.rotSpeed;
    const camSpd  = _core.settings.shootingSpeed;

    if (!isFiniteVec3(_core.camera.position)) {
      console.warn('[ENGINE] Camera position became invalid. Resetting to safe orbit.');
      _core.camera.position.set(0, 8, 130);
      _core.camera.lookAt(0, 0, 0);
      _core.camera.fov = 58;
      _core.camera.updateProjectionMatrix();
      _core.dist = _core.tDist = 130;
      _core.sph = { th:0, ph: Math.PI/2 - 0.08 };
      _core.tSph = { th:0, ph: Math.PI/2 - 0.08 };
      _core.camSM.state = 'idle';
      _core.camSM.target = null;
      _core.camSM.progress = 0;
      _core.autoRot = true;
    }

    const { rings: bhRings, part: bhPart } = _core.bh.userData;
    bhRings[0].rotation.z += 0.007; bhRings[1].rotation.z -= 0.004; bhRings[2].rotation.z += 0.002; bhPart.rotation.y += 0.003;

    _core.planets.forEach(({ group, mesh }) => {
      const ud = group.userData;
      const birthElapsed = ud.birthStart == null ? null : Math.min(1, Math.max(0, (t - ud.birthStart) / 1.15));
      if (birthElapsed != null) {
        const easedBirth = EASE_IO(birthElapsed);
        const birthScale = 0.42 + (0.58 * easedBirth);
        group.scale.setScalar(birthScale);
        if (ud.glowMesh?.material) {
          const baseGlow = (ud.style?.glowOp ?? 0.06) * 1.6;
          ud.glowMesh.material.opacity = THREE.MathUtils.lerp(baseGlow * 1.9, baseGlow, easedBirth);
        }
        if (birthElapsed >= 1) {
          ud.birthStart = null;
          group.scale.setScalar(1);
        }
      }
      group.position.y = (ud.baseY||0) + Math.sin(t*0.3 + (ud.t0||0)) * 2.5;
      group.position.x = (ud.baseX||0) + Math.cos(t*0.2 + (ud.t0||0)*0.9) * 1.5;
      mesh.rotation.y += (ud.baseSpd||0.0003) * 1.2 * rotMult;
      if(ud.ringMesh) ud.ringMesh.rotation.z += (ud.ringSpd||0.0004) * rotMult;
      if(ud.ringMesh2) ud.ringMesh2.rotation.z -= (ud.ringSpd||0.0004) * rotMult * 0.65;
      if(mesh.material.uniforms) { mesh.material.uniforms.time.value = t; mesh.material.uniforms.pulse.value = Math.max(0, Math.sin(t*0.8+(ud.t0||0))*0.15); }
      if(ud.glowMesh?.material) {
        const bg = (ud.style?.glowOp ?? 0.045) * 1.6; const tgt = bg + Math.sin(t*0.02+(ud.t0||0))*bg*0.4;
        ud._gv = ud._gv == null ? bg : ud._gv + (tgt - ud._gv)*0.008;
        ud.glowMesh.material.opacity = ud._gv;
      }
    });

    _core.galaxyBeacons.forEach((group) => {
      const { glow, halo, haloSecondary, orbit, shell, aurora, polarAurora, particles, mesh, isPromotion, t0, profile } = group.userData;
      const drift = t0 || 0;
      const motionMode = group.userData.design?.motion || 'drift';
      const motionScalar = motionMode === 'broadcast'
        ? 1.34
        : motionMode === 'ceremonial'
          ? 0.72
          : motionMode === 'calm'
            ? 0.56
            : 1;
      group.position.y = (group.userData.baseY||0) + Math.sin((t + drift) * (isPromotion ? 0.18 : 0.12) * motionScalar) * (isPromotion ? 4.5 : 3);
      group.position.x = (group.userData.baseX||0) + Math.cos((t + drift) * (isPromotion ? 0.14 : 0.1) * motionScalar) * (isPromotion ? 3.8 : 2.4);
      if (halo) halo.rotation.z += (isPromotion ? 0.0035 : 0.0022) * rotMult;
      if (haloSecondary) haloSecondary.rotation.z -= (isPromotion ? 0.0024 : 0.0014) * rotMult;
      if (orbit) orbit.rotation.z -= (isPromotion ? 0.0026 : 0.0016) * rotMult;
      if (mesh) mesh.rotation.y += (isPromotion ? 0.0028 : 0.0019) * rotMult;
      if (glow?.material) {
        const baseGlow = isPromotion ? (profile?.glowOpacity ?? 0.065) : 0.045;
        const bandBoost = group.userData.band === 'near'
          ? 0.018
          : group.userData.band === 'mid'
            ? 0.01
            : 0;
        glow.material.opacity = baseGlow + bandBoost + Math.sin((t + drift) * 0.9) * (isPromotion ? 0.016 : 0.012);
      }
      if (shell?.material) {
        shell.material.opacity = 0.012 + Math.sin((t + drift) * 0.5) * 0.008;
      }
      if (aurora?.material) {
        aurora.material.opacity = 0.014 + Math.sin((t + drift) * 0.7) * 0.012;
        aurora.rotation.y += 0.0012 * rotMult;
      }
      if (polarAurora?.material) {
        polarAurora.material.opacity = 0.03 + Math.sin((t + drift) * 0.82) * 0.015;
        polarAurora.rotation.x += 0.0015 * rotMult;
      }
      if (particles?.material) {
        particles.material.opacity = 0.16 + Math.sin((t + drift) * 1.05) * 0.08;
        particles.rotation.y += 0.0018 * rotMult;
        particles.rotation.z -= 0.0008 * rotMult;
      }
    });

    if(_core.camSM.state === 'idle' && !_core.isDrag) {
      _core.raycaster.setFromCamera(_core.mouse, _core.camera);
      const hits = _core.raycaster.intersectObjects([..._core.planets.values()].map(p => p.mesh));
      const nid = hits.length ? hits[0].object.parent.userData.planetId : null;
      if(nid !== _core.hovId) { _core.hovId = nid; _core.callbacks.onHover?.(nid ? _core.planets.get(nid)?.data : null); }
      if (!hits.length) {
        const beaconHits = _core.raycaster.intersectObjects([..._core.galaxyBeacons.values()].map((group) => group.userData.hitTarget));
        const gid = beaconHits.length ? beaconHits[0].object.parent.userData.beaconId : null;
        if (gid !== _core.galaxyHoverId) {
          if (_core.galaxyHoverId) {
            const prevGroup = _core.galaxyBeacons.get(_core.galaxyHoverId);
            if (prevGroup) prevGroup.scale.setScalar(1);
          }
          _core.galaxyHoverId = gid;
          if (gid) {
            const nextGroup = _core.galaxyBeacons.get(gid);
            if (nextGroup) nextGroup.scale.setScalar(nextGroup.userData.hoverScale || 1.1);
            _core.callbacks.onGalaxyHover?.(nextGroup?.userData ?? null);
          } else {
            _core.callbacks.onGalaxyHover?.(null);
          }
        }
      } else if (_core.galaxyHoverId) {
        const prevGroup = _core.galaxyBeacons.get(_core.galaxyHoverId);
        if (prevGroup) prevGroup.scale.setScalar(1);
        _core.galaxyHoverId = null;
        _core.callbacks.onGalaxyHover?.(null);
      }
    }

    _core.ssTimer -= dt;
    if(_core.ssTimer <= 0) { const idle = _core.shooters.find(s=>!s.active); if(idle) spawnSS(idle); _core.ssTimer = 5 + Math.random()*12; }
    _core.shooters.forEach(s => tickSS(s, dt));

    const bhS = _core.bhSM;
    if(bhS.state === 'sucking') {
        bhS.progress = Math.min(1, bhS.progress + dt * 0.72);
        const e = EASE_IN3(bhS.progress);
        bhS._now.lerpVectors(bhS.startPos, bhS.endPos, e);
        _core.camera.position.copy(bhS._now); _core.camera.lookAt(0,0,0);
        bhRings.forEach((r,i) => { r.rotation.z += 0.022*(i+1)*e; }); bhPart.rotation.y += 0.014 * e;
        _core.camera.fov = 58 + 22 * e; _core.camera.updateProjectionMatrix();
        if(bhS.progress >= 1) { bhS.state='idle'; bhS.progress=0; }
        _core.renderer.render(_core.scene, _core.camera); return;
    }

    const sm = _core.camSM;
    if(sm.state === 'idle') {
        if(_core.autoRot) _core.tSph.th += 0.00042 * camSpd;
        _core.sph.th += (_core.tSph.th - _core.sph.th)*0.044;
        _core.sph.ph += (_core.tSph.ph - _core.sph.ph)*0.044;
        _core.dist += (_core.tDist - _core.dist)*0.06;
        const driftFocus = _core.driftFocus?.target?.position
          ? _core.driftFocus
          : null;
        const focusPoint = driftFocus?.anchor === 'target'
          ? (driftFocus?.target?.position ?? ORIGIN)
          : driftFocus?.anchor === 'drift'
            ? ORIGIN.clone().lerp(driftFocus.target.position, driftFocus.lookBlend ?? 0.12)
            : ORIGIN;
        const focusRadius = driftFocus
          ? _core.dist * (driftFocus.distanceScale ?? 1)
          : _core.dist;
        const r = focusRadius + Math.sin(t*0.11)*2;
        _core.camera.position.set(
          focusPoint.x + r*Math.sin(_core.sph.ph)*Math.sin(_core.sph.th),
          focusPoint.y + r*Math.cos(_core.sph.ph) + (driftFocus?.lift ?? 0),
          focusPoint.z + r*Math.sin(_core.sph.ph)*Math.cos(_core.sph.th),
        );
        _core.camera.lookAt(focusPoint);
        const targetFov = driftFocus?.fov ?? 58;
        if(Math.abs(_core.camera.fov - targetFov) > 0.1) {
          _core.camera.fov += (targetFov - _core.camera.fov) * 0.08;
          _core.camera.updateProjectionMatrix();
        } else if (_core.camera.fov !== targetFov) {
          _core.camera.fov = targetFov;
          _core.camera.updateProjectionMatrix();
        }
    } else if(sm.state === 'zooming-in' || sm.state === 'zooming-out') {
        sm.progress = Math.min(1, sm.progress + dt * 0.52);
        const e = EASE_IO(sm.progress);
        _core.camera.position.lerpVectors(sm.startPos, sm.endPos, e);
        sm._lookNow.lerpVectors(sm.startLook, sm.endLook, e);
        _core.camera.lookAt(sm._lookNow);
        _core.camera.fov = sm.state==='zooming-in' ? 58-6*sm.progress : 52+6*sm.progress;
        _core.camera.updateProjectionMatrix();
        if(sm.progress >= 1) {
          if(sm.state==='zooming-in') { 
            sm.state='landed'; 
          } else { 
            const returnTh = sm.returnSph?.th ?? 0;
            const returnPh = sm.returnSph?.ph ?? (Math.PI / 2 - 0.08);
            const returnDist = sm.returnDist || 130;
            _core.dist = _core.tDist = returnDist;
            _core.sph.th = _core.tSph.th = returnTh;
            _core.sph.ph = _core.tSph.ph = THREE.MathUtils.clamp(returnPh, 0.01, Math.PI - 0.01);
            sm.state='idle'; 
            sm.target=null; 
            sm.progress=0; 
            _core.hovId=null; 
            _core.driftFocus = null;
            _core.autoRot = true;
          }
        }
    } else if(sm.state==='landed' && sm.target) {
        const pp = sm.target.position; const rv = sm.target.userData.r * 4;
        _core.camera.position.set(pp.x+Math.sin(t*0.18)*rv, pp.y+Math.sin(t*0.08)*2, pp.z+Math.cos(t*0.18)*rv); _core.camera.lookAt(pp);
    }

    pl1.position.x = 60 + Math.sin(t*0.18)*22; pl1.position.y = 60 + Math.cos(t*0.13)*16;
    _core.renderer.render(_core.scene, _core.camera);
  }

  animate();
  _core.initialized = true;
  console.groupEnd();
}

export function useThreeEngine({ settingsRef, containerRef }) {
  useEffect(() => {
    if (containerRef?.current) {
      initEngine(containerRef.current);
    }
  }, [containerRef]);

  // 설정 실시간 동기화 (리렌더링 유발 없이 Ref로 접근)
  useEffect(() => {
    if (settingsRef?.current) {
      _core.settings = settingsRef.current;
    }
  }, [settingsRef]);

  // 클릭/호버 핸들러를 전역 이벤트 발행 방식으로 전환
  useEffect(() => {
    _core.callbacks.onPlanetClick = (pd) => events.emit('ENGINE_PLANET_CLICK', pd);
    _core.callbacks.onHover       = (pd) => events.emit('ENGINE_HOVER_CHANGED', pd);
    _core.callbacks.onBHClick      = () => events.emit('ENGINE_BH_CLICK');
    _core.callbacks.onGalaxyHover  = (galaxy) => events.emit('ENGINE_GALAXY_HOVER_CHANGED', galaxy);
    _core.callbacks.onGalaxyClick  = (galaxy) => events.emit('ENGINE_GALAXY_CLICK', galaxy);
  }, []);

  return { 
    addPlanet: (d) => events.emit('ADD_PLANET', d),
    removePlanetById: (id) => events.emit('REMOVE_PLANET', id),
    zoomIn: (id) => events.emit('ZOOM_IN', id),
    zoomOut: () => events.emit('ZOOM_OUT'),
    triggerBHSuck: () => events.emit('TRIGGER_BH_SUCK'),
    setDriftFocus: (payload) => events.emit('SET_DRIFT_FOCUS', payload),
    clearDriftFocus: () => events.emit('CLEAR_DRIFT_FOCUS'),
  };
}
