// src/components/SpaceScene.js
// Three.js 씬 전체 로직. React 컴포넌트가 아닌 순수 JS 모듈.
// SpacePage.jsx에서 initSpaceScene()을 호출해 초기화합니다.

import * as THREE from 'three'

const rand = (a, b) => a + Math.random() * (b - a)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const lerp = (a, b, t) => a + (b - a) * t

// ── 행성 데이터 ───────────────────────────────────────────────
export const PLANET_DATA = [
  { name:'새벽 감성', mood:'몽환·잔잔', hex:'#C97BF0', color:0xC97BF0, emissive:0x4A1A6A, r:11, x:-52,y:22,z:-28, spd:.00022 },
  { name:'힐링·자연', mood:'치유·고요', hex:'#3DCAA5', color:0x3DCAA5, emissive:0x0A3A28, r:13, x:44, y:-14,z:-18, spd:.00018 },
  { name:'집중 모드', mood:'맑은 집중', hex:'#5BA8F0', color:0x5BA8F0, emissive:0x0A1E38, r:8,  x:-18,y:-34,z:-48, spd:.00048 },
  { name:'설렘',      mood:'따뜻한 두근거림', hex:'#F0A060', color:0xF0A060, emissive:0x3A1808, r:9,  x:58, y:28, z:-52, spd:.00032 },
  { name:'빗소리',    mood:'차분·내면', hex:'#7BB0E0', color:0x7BB0E0, emissive:0x101828, r:7,  x:-65,y:-18,z:-60, spd:.00055 },
  { name:'에너지',    mood:'강렬·해방', hex:'#F07070', color:0xF07070, emissive:0x380808, r:10, x:22, y:45, z:-78, spd:.00026 },
]

/**
 * Three.js 씬을 초기화하고 애니메이션 루프를 시작합니다.
 * @param {HTMLCanvasElement} canvas
 * @param {{ onPlanetClick, onZoomComplete, onZoomOutComplete }} callbacks
 * @returns {Function} cleanup 함수
 */
export function initSpaceScene(canvas, { onPlanetClick, onZoomComplete, onZoomOutComplete }) {
  const W = () => window.innerWidth
  const H = () => window.innerHeight

  const scene    = new THREE.Scene()
  scene.fog      = new THREE.FogExp2(0x010006, 0.0028)
  const camera   = new THREE.PerspectiveCamera(58, W()/H(), 0.1, 3000)
  camera.position.set(0, 8, 130)

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setSize(W(), H())
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.setClearColor(0x010006, 1)

  // ── Stars ──────────────────────────────────────────────────
  const addStars = (n, r, sz, col, op) => {
    const g = new THREE.BufferGeometry()
    const p = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const t=rand(0,Math.PI*2), ph=Math.acos(rand(-1,1)), d=rand(r*.3,r)
      p[i*3]=d*Math.sin(ph)*Math.cos(t); p[i*3+1]=d*Math.sin(ph)*Math.sin(t); p[i*3+2]=d*Math.cos(ph)
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color:col, size:sz, sizeAttenuation:true, transparent:true, opacity:op })))
  }
  addStars(5000,800,.8,0xE8E4FF,.65)
  addStars(1500,500,1.5,0xC4BDFF,.8)
  addStars(400,250,2.5,0xFFFFFF,.9)

  // ── Nebula ─────────────────────────────────────────────────
  ;[[0x3D1A7A,-100,50,-180,1.2,.38,1.0,.022],[0x0D2A5A,90,-40,-140,1.0,.32,1.3,.018],[0x1A0A4A,30,80,-220,1.5,.28,.9,.015]].forEach(([c,x,y,z,sx,sy,sz,op])=>{
    const m=new THREE.Mesh(new THREE.SphereGeometry(100,10,10),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:op,side:THREE.BackSide,depthWrite:false}))
    m.position.set(x,y,z); m.scale.set(sx,sy,sz); scene.add(m)
  })

  // ── Black Hole ─────────────────────────────────────────────
  const bh = new THREE.Group()
  bh.add(new THREE.Mesh(new THREE.SphereGeometry(4,32,32),new THREE.MeshBasicMaterial({color:0x000000})))
  ;[8,13,19,28,40].forEach((r,i)=>{
    const t=new THREE.Mesh(new THREE.TorusGeometry(r,.22-i*.025,4,80),new THREE.MeshBasicMaterial({color:[0x7B70E0,0x9B91FF,0x534AB7,0x3D1A7A,0x1A0A3A][i],transparent:true,opacity:.68-i*.11,depthWrite:false}))
    t.rotation.x=Math.PI/2+i*.14; t.rotation.z=i*.3; bh.add(t)
  })
  const adG=new THREE.BufferGeometry(),adP=new Float32Array(2000*3)
  for(let i=0;i<2000;i++){const a=rand(0,Math.PI*2),r=rand(6,46);adP[i*3]=Math.cos(a)*r;adP[i*3+1]=rand(-.35,.35)*(1-r/50);adP[i*3+2]=Math.sin(a)*r}
  adG.setAttribute('position',new THREE.BufferAttribute(adP,3))
  bh.add(new THREE.Points(adG,new THREE.PointsMaterial({color:0x9B91FF,size:.55,sizeAttenuation:true,transparent:true,opacity:.5,depthWrite:false})))
  scene.add(bh)

  // ── Planets ────────────────────────────────────────────────
  const planetGroups = [], planetMeshes = []
  PLANET_DATA.forEach((d, idx) => {
    const g = new THREE.Group()
    const mat = new THREE.MeshPhongMaterial({ color:d.color, emissive:d.emissive, emissiveIntensity:.7, shininess:90 })
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(d.r,40,40), mat)
    g.add(mesh); planetMeshes.push(mesh)
    const ring=new THREE.Mesh(new THREE.TorusGeometry(d.r*1.7,.25,4,80),new THREE.MeshBasicMaterial({color:d.color,transparent:true,opacity:.32}))
    ring.rotation.x=Math.PI*.38; ring.rotation.z=idx*.4; g.add(ring)
    const glow=new THREE.Mesh(new THREE.SphereGeometry(d.r*1.55,16,16),new THREE.MeshBasicMaterial({color:d.color,transparent:true,opacity:.065,side:THREE.BackSide,depthWrite:false}))
    g.add(glow)
    g.position.set(d.x,d.y,d.z)
    g.userData={...d,baseX:d.x,baseY:d.y,baseZ:d.z,t0:Math.random()*100,idx}
    scene.add(g); planetGroups.push(g)
  })

  // ── Lights ─────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0x1A1040,.5))
  const pl1=new THREE.PointLight(0x7B70E0,3,350); pl1.position.set(60,60,40); scene.add(pl1)
  const pl2=new THREE.PointLight(0x3D9A78,1.8,250); pl2.position.set(-70,-35,20); scene.add(pl2)

  // ── Camera Control ─────────────────────────────────────────
  let sph={th:0,ph:Math.PI/2-.08}, tSph={th:0,ph:Math.PI/2-.08}
  let camDist=130, tCamDist=130, autoRot=true, autoTimer=null
  let isDrag=false, prevM={x:0,y:0}
  const mouse=new THREE.Vector2(-9,-9)
  const raycaster=new THREE.Raycaster()

  // ── Zoom State ─────────────────────────────────────────────
  let zoomState='idle', zoomTarget=null, zoomProgress=0
  let camStartPos=new THREE.Vector3(), camEndPos=new THREE.Vector3()
  let camStartLook=new THREE.Vector3(), camEndLook=new THREE.Vector3()
  const easeInOut=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2
  const easeOut=t=>1-Math.pow(1-t,3)

  // 마우스/터치 이벤트
  const startAuto=()=>{clearTimeout(autoTimer);autoTimer=setTimeout(()=>{autoRot=true},3500)}
  canvas.addEventListener('mousedown',e=>{if(zoomState!=='idle')return;isDrag=true;autoRot=false;prevM={x:e.clientX,y:e.clientY};clearTimeout(autoTimer)})
  window.addEventListener('mousemove',e=>{
    mouse.x=(e.clientX/W())*2-1; mouse.y=-(e.clientY/H())*2+1
    if(!isDrag||zoomState!=='idle')return
    tSph.th-=(e.clientX-prevM.x)*.004; tSph.ph=clamp(tSph.ph+(e.clientY-prevM.y)*.004,.15,Math.PI-.15)
    prevM={x:e.clientX,y:e.clientY}
  })
  window.addEventListener('mouseup',()=>{isDrag=false;startAuto()})
  canvas.addEventListener('wheel',e=>{if(zoomState!=='idle')return;tCamDist=clamp(tCamDist+e.deltaY*.12,50,220);autoRot=false;startAuto()},{passive:true})

  // 클릭 → 행성 줌인
  canvas.addEventListener('click',e=>{
    if(Math.abs(e.clientX-prevM.x)>5||zoomState!=='idle')return
    raycaster.setFromCamera(mouse,camera)
    const hits=raycaster.intersectObjects(planetMeshes)
    if(hits.length>0){
      const g=hits[0].object.parent
      triggerZoomIn(g)
      onPlanetClick?.(g.userData.idx)
    }
  })

  function triggerZoomIn(g) {
    zoomState='zooming-in'; zoomTarget=g; zoomProgress=0
    camStartPos.copy(camera.position); camStartLook.set(0,0,0)
    const pos=g.position, dir=pos.clone().normalize()
    camEndPos.copy(pos).sub(dir.clone().multiplyScalar(g.userData.r*3.5))
    camEndLook.copy(pos)
  }

  function triggerZoomOut() {
    if(zoomState!=='landed')return
    zoomState='zooming-out'; zoomProgress=0
    camStartPos.copy(camera.position); camStartLook.copy(zoomTarget.position); camEndLook.set(0,0,0)
    const r=camDist
    camEndPos.set(r*Math.sin(sph.ph)*Math.sin(sph.th),r*Math.cos(sph.ph),r*Math.sin(sph.ph)*Math.cos(sph.th))
  }

  // ESC / 더블클릭 탈출
  window.addEventListener('keydown',e=>{ if(e.key==='Escape') triggerZoomOut() })
  canvas.addEventListener('dblclick',()=>{ if(zoomState==='landed') triggerZoomOut() })

  // ── Animate ────────────────────────────────────────────────
  const clock=new THREE.Clock(); let prevT=0; let rafId

  const animate=()=>{
    rafId=requestAnimationFrame(animate)
    const t=clock.getElapsedTime(), dt=t-prevT; prevT=t

    // 행성 부유
    planetGroups.forEach((g,i)=>{
      const d=g.userData,ti=d.t0+t
      g.position.y=d.baseY+Math.sin(ti*.32+i)*2.8
      g.position.x=d.baseX+Math.cos(ti*.22+i*.9)*1.8
      g.children[0].rotation.y+=d.spd*1.2
      g.children[1].rotation.z+=d.spd*.32
    })

    // 블랙홀
    bh.rotation.y+=.00035
    bh.children.forEach((c,i)=>{ if(i>1) c.rotation.z+=.00012*(i+1) })
    pl1.position.x=60+Math.sin(t*.18)*22

    if(zoomState==='zooming-in'){
      zoomProgress=clamp(zoomProgress+dt*.55,0,1)
      const e=easeInOut(zoomProgress)
      camera.position.lerpVectors(camStartPos,camEndPos,e)
      camera.lookAt(new THREE.Vector3().lerpVectors(camStartLook,camEndLook,e))
      camera.fov=lerp(58,52,zoomProgress); camera.updateProjectionMatrix()
      if(zoomProgress>=1){ zoomState='landed'; onZoomComplete?.() }
    }
    else if(zoomState==='zooming-out'){
      zoomProgress=clamp(zoomProgress+dt*.5,0,1)
      const e=easeInOut(zoomProgress)
      camera.position.lerpVectors(camStartPos,camEndPos,e)
      camera.lookAt(new THREE.Vector3().lerpVectors(camStartLook,camEndLook,e))
      camera.fov=lerp(52,58,easeOut(zoomProgress)); camera.updateProjectionMatrix()
      if(zoomProgress>=1){ zoomState='idle'; zoomTarget=null; onZoomOutComplete?.() }
    }
    else if(zoomState==='idle'){
      if(autoRot) tSph.th+=.00045
      sph.th+=(tSph.th-sph.th)*.045; sph.ph+=(tSph.ph-sph.ph)*.045
      camDist+=(tCamDist-camDist)*.06
      const r=camDist+Math.sin(t*.11)*2.2
      camera.position.set(r*Math.sin(sph.ph)*Math.sin(sph.th),r*Math.cos(sph.ph),r*Math.sin(sph.ph)*Math.cos(sph.th))
      camera.lookAt(0,0,0)
    }
    else if(zoomState==='landed'&&zoomTarget){
      const pos=zoomTarget.position, r=zoomTarget.userData.r*4
      camera.position.set(pos.x+Math.sin(t*.18)*r,pos.y+Math.sin(t*.08)*2,pos.z+Math.cos(t*.18)*r)
      camera.lookAt(pos)
    }

    renderer.render(scene,camera)
  }
  animate()

  // 리사이즈
  const onResize=()=>{ camera.aspect=W()/H(); camera.updateProjectionMatrix(); renderer.setSize(W(),H()) }
  window.addEventListener('resize',onResize)

  // cleanup
  return ()=>{
    cancelAnimationFrame(rafId)
    window.removeEventListener('resize',onResize)
    renderer.dispose()
  }
}
