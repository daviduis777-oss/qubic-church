// @ts-nocheck: a hand-tuned three.js scene, kept as plain JS while its look is still being worked out
// The brain of the pool, as an X-ray: a real human cortex (FreeSurfer fsaverage5, via nilearn) drawn as glowing
// glass, 16,384 nodes inside it (one per cell of the Anna Matrix, coloured by her value), a network between
// them with pulses running along it, a cloud of miners round it like stars, and sparks from the miners in.
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

/** The cortex file: header (vertices, faces, cells), positions, faces, sulcal depth 0..1, the vertex of each Anna cell. */
export function parseBrain(buf) {
  const h = new Uint32Array(buf, 0, 3)
  const [nv, nf, nc] = [h[0], h[1], h[2]]
  let o = 12
  const pos = new Float32Array(buf, o, nv * 3); o += nv * 12
  const faces = new Uint16Array(buf, o, nf * 3); o += nf * 6
  o = (o + 3) & ~3 // the faces leave the floats that follow off a 4-byte boundary: padded
  const sulc = new Float32Array(buf, o, nv); o += nv * 4
  const cells = new Uint16Array(buf, o, nc)
  return { pos, faces, sulc, cells }
}

/** Anna's value as a neon colour: cold cyan-blue for negative, warm amber for positive, white for zero. */
function annaColour(v) {
  if (v === 0) return [1, 1, 1]
  const k = Math.min(1, Math.abs(v) / 128)
  const mix = (a, b) => a + (b - a) * k
  return v < 0 ? [mix(0.1, 0.25), mix(0.45, 0.85), mix(0.9, 1.0)] : [mix(0.95, 1.0), mix(0.45, 0.72), mix(0.25, 0.35)]
}

let glowTex = null
function glowTexture() {
  if (glowTex) return glowTex
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  gr.addColorStop(0, 'rgba(255,255,255,1)')
  gr.addColorStop(0.2, 'rgba(255,255,255,0.55)')
  gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr
  g.fillRect(0, 0, 128, 128)
  glowTex = new THREE.CanvasTexture(c)
  return glowTex
}
let ringTex = null
function ringTexture() {
  if (ringTex) return ringTex
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  g.strokeStyle = 'rgba(255,255,255,0.95)'
  g.lineWidth = 6
  g.beginPath(); g.arc(64, 64, 52, 0, Math.PI * 2); g.stroke()
  ringTex = new THREE.CanvasTexture(c)
  return ringTex
}

export function mountBrain(el, opts) {
  const { matrix, brain: B, miners = 2200, onPick, onHover, offset, wide = false } = opts
  const W = () => el.clientWidth || window.innerWidth, H = () => el.clientHeight || window.innerHeight
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
  renderer.setSize(W(), H())
  renderer.setClearColor(0x0b0a0e, 1)
  el.appendChild(renderer.domElement)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(34, W() / H(), 0.05, 100)
  // far enough that the whole brain fits the width, on a phone too
  // wide: the brain spreads behind something in the middle of the page (Maria's phone), so it is drawn larger
  const fit = () => (wide ? Math.max(3.4, 0.62 / (Math.tan((camera.fov * Math.PI) / 360) * camera.aspect)) : Math.max(offset ? 5.6 : 4.9, 0.98 / (Math.tan((camera.fov * Math.PI) / 360) * camera.aspect)))
  // where the brain sits on the screen: shifted off the centre by the page (to leave room for a column, a title)
  const place = () => {
    const o = offset?.() ?? { x: 0, y: 0 }
    if (o.x || o.y) camera.setViewOffset(W(), H(), o.x, -o.y, W(), H())
    else camera.clearViewOffset()
  }
  camera.position.set(4.1, 0.55, 1.0).setLength(fit())
  place()
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.enablePan = false
  controls.minDistance = 2.2
  controls.maxDistance = 12
  // the wheel scrolls the page, never zooms; on touch screens a finger scrolls the page too, taps still open cells
  controls.enableZoom = false
  if (window.matchMedia('(pointer: coarse)').matches) {
    controls.enabled = false
    renderer.domElement.style.touchAction = 'pan-y'
  }

  const brain = new THREE.Group()
  scene.add(brain)
  const { pos, faces, sulc, cells } = B
  const NV = pos.length / 3

  /* the cortex: glass lit from its edges, gyri brighter than sulci, a slow shimmer */
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aSulc', new THREE.BufferAttribute(sulc, 1))
  geo.setIndex(new THREE.BufferAttribute(faces, 1))
  geo.computeVertexNormals()
  const cortexMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `attribute float aSulc; varying vec3 vN; varying vec3 vV; varying float vS; varying vec3 vP;
      void main(){ vec4 wp = modelMatrix*vec4(position,1.); vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition-wp.xyz); vS = aSulc; vP = position; gl_Position = projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `uniform float uTime; varying vec3 vN; varying vec3 vV; varying float vS; varying vec3 vP;
      void main(){
        float f = 1.0 - abs(dot(vN, vV));
        float rim = pow(f, 2.2);
        float gyrus = 1.0 - smoothstep(0.35, 0.75, vS);          // crowns of the gyri light up, the sulci stay dark
        float sweep = 0.5 + 0.5*sin(vP.z*5.0 - uTime*0.8 + vP.y*3.0);
        vec3 deep = vec3(0.02, 0.10, 0.28);
        vec3 cyan = vec3(0.32, 0.60, 1.00);   // the site's blue glass
        vec3 warm = vec3(1.00, 0.72, 0.36);   // and its amber filament
        // a soft light from above and in front, so the folds read like the gyri they are
        float lit = max(dot(vN, normalize(vec3(0.35, 0.8, 0.45))), 0.0);
        vec3 col = deep*0.5 + cyan*(rim*0.8 + gyrus*(0.22 + 0.5*lit)*(0.7+0.3*sweep)) + warm*pow(f, 8.0)*0.6;
        float a = clamp(0.02 + pow(f, 3.0)*0.42 + gyrus*(0.05 + 0.12*lit), 0.0, 1.0);
        a *= smoothstep(-0.85, -0.7, vP.y);   // the brainstem thins away instead of ending on a cut
        gl_FragColor = vec4(col*a, a);
      }`,
    transparent: true, depthWrite: false, side: THREE.FrontSide, blending: THREE.AdditiveBlending,
  })
  brain.add(new THREE.Mesh(geo, cortexMat))

  /* the nodes: one per Anna cell, on the cortex, slightly inside it */
  const NC = cells.length
  const nPos = new Float32Array(NC * 3), nCol = new Float32Array(NC * 3), nSeed = new Float32Array(NC), nHit = new Float32Array(NC)
  for (let k = 0; k < NC; k++) {
    const v = cells[k]
    nPos.set([pos[v * 3] * 0.985, pos[v * 3 + 1] * 0.985, pos[v * 3 + 2] * 0.985], k * 3)
    const [r, g, b] = annaColour(matrix[Math.floor(k / 128)][k % 128])
    nCol.set([r, g, b], k * 3)
    nSeed[k] = Math.random()
  }
  const nGeo = new THREE.BufferGeometry()
  nGeo.setAttribute('position', new THREE.BufferAttribute(nPos, 3))
  nGeo.setAttribute('aCol', new THREE.BufferAttribute(nCol, 3))
  nGeo.setAttribute('aSeed', new THREE.BufferAttribute(nSeed, 1))
  const hitAttr = new THREE.BufferAttribute(nHit, 1)
  hitAttr.setUsage(THREE.DynamicDrawUsage)
  nGeo.setAttribute('aHit', hitAttr)
  const nodeMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPx: { value: renderer.getPixelRatio() }, uSel: { value: -1 } },
    vertexShader: `attribute vec3 aCol; attribute float aSeed; attribute float aHit; uniform float uTime; uniform float uPx; uniform float uSel;
      varying vec3 vC; varying float vA;
      void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mv;
        float wave = smoothstep(0.92, 1.0, sin(position.z*4.0 - uTime*0.9 + position.y*2.0));
        float tw = 0.55 + 0.45*sin(uTime*(0.8+aSeed*1.6) + aSeed*40.0);
        float sel = float(abs(float(gl_VertexID) - uSel) < 0.5);
        vA = 0.75*tw + wave*0.35 + aHit*2.0 + sel*3.0;
        vC = mix(aCol, vec3(1.0), clamp(aHit*0.6 + sel, 0.0, 1.0));
        gl_PointSize = (4.2 + aHit*6.0 + sel*10.0 + wave*1.2) * uPx * (4.0 / -mv.z); }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vC*a*vA, a*vA); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
  const nodes = new THREE.Points(nGeo, nodeMat)
  brain.add(nodes)

  /* the network: each of a few thousand nodes joined to its nearest ones, inside the brain */
  const NET = 2600, LINKS = 2
  const pick = Array.from({ length: NET }, () => Math.floor(Math.random() * NC))
  const pairs = []
  for (let a = 0; a < NET; a++) {
    const i = pick[a]
    const best = []
    for (let b = 0; b < NET; b++) {
      if (a === b) continue
      const j = pick[b]
      const dx = nPos[i * 3] - nPos[j * 3], dy = nPos[i * 3 + 1] - nPos[j * 3 + 1], dz = nPos[i * 3 + 2] - nPos[j * 3 + 2]
      const d = dx * dx + dy * dy + dz * dz
      if (best.length < LINKS || d < best[best.length - 1][0]) {
        best.push([d, j])
        best.sort((x, y) => x[0] - y[0])
        if (best.length > LINKS) best.pop()
      }
    }
    for (const [, j] of best) pairs.push([i, j])
  }
  // and some long ones across the brain, like the reference's web
  for (let k = 0; k < 220; k++) pairs.push([pick[Math.floor(Math.random() * NET)], pick[Math.floor(Math.random() * NET)]])
  const lPos = new Float32Array(pairs.length * 6), lCol = new Float32Array(pairs.length * 6)
  pairs.forEach(([i, j], k) => {
    const sag = 0.9
    lPos.set([nPos[i * 3] * sag, nPos[i * 3 + 1] * sag, nPos[i * 3 + 2] * sag, nPos[j * 3] * sag, nPos[j * 3 + 1] * sag, nPos[j * 3 + 2] * sag], k * 6)
    const long = k >= pairs.length - 220
    const c = long ? [0.10, 0.22, 0.40] : [0.18, 0.42, 0.70]
    lCol.set([...c, ...c], k * 6)
  })
  const lGeo = new THREE.BufferGeometry()
  lGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3))
  lGeo.setAttribute('color', new THREE.BufferAttribute(lCol, 3))
  brain.add(new THREE.LineSegments(lGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })))

  /* pulses running along the network */
  const PU = 260
  const puPos = new Float32Array(PU * 3)
  const pu = Array.from({ length: PU }, () => ({ e: Math.floor(Math.random() * pairs.length), t: Math.random(), s: 0.4 + Math.random() * 1.2 }))
  const puGeo = new THREE.BufferGeometry()
  puGeo.setAttribute('position', new THREE.BufferAttribute(puPos, 3))
  brain.add(new THREE.Points(puGeo, new THREE.PointsMaterial({ color: 0xbfe8ff, size: 0.035, map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })))

  /* hubs: soft bright spheres where many links meet, breathing */
  const HU = 36
  const hubs = []
  for (let k = 0; k < HU; k++) {
    const i = pick[Math.floor(Math.random() * NET)]
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: k % 5 === 0 ? 0xffc6a0 : k % 3 === 0 ? 0xe0b8ff : 0x9fdcff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 }))
    sp.position.set(nPos[i * 3] * 0.9, nPos[i * 3 + 1] * 0.9, nPos[i * 3 + 2] * 0.9)
    const s = 0.04 + Math.random() * 0.08
    sp.userData = { s, ph: Math.random() * 6.28 }
    sp.scale.setScalar(s)
    brain.add(sp)
    hubs.push(sp)
  }

  /* miners: stars round the brain */
  const M = miners
  const mPos = new Float32Array(M * 3), mSeed = new Float32Array(M), mSize = new Float32Array(M)
  for (let k = 0; k < M; k++) {
    const u = Math.random() * Math.PI * 2, v = Math.acos(2 * Math.random() - 1)
    const r = 1.9 + Math.pow(Math.random(), 0.7) * 3.0
    mPos.set([Math.sin(v) * Math.cos(u) * r, Math.cos(v) * r * 0.8, Math.sin(v) * Math.sin(u) * r], k * 3)
    mSeed[k] = Math.random()
    mSize[k] = 0.6 + Math.pow(Math.random(), 4) * 2.4
  }
  const mGeo = new THREE.BufferGeometry()
  mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3))
  mGeo.setAttribute('aSeed', new THREE.BufferAttribute(mSeed, 1))
  mGeo.setAttribute('aSize', new THREE.BufferAttribute(mSize, 1))
  const mMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPx: { value: renderer.getPixelRatio() } },
    vertexShader: `attribute float aSeed; attribute float aSize; uniform float uTime; uniform float uPx; varying float vA;
      void main(){ vec3 p = position + 0.06*vec3(sin(uTime*0.3+aSeed*40.), cos(uTime*0.25+aSeed*31.), sin(uTime*0.2+aSeed*17.));
        vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
        vA = 0.4 + 0.6*pow(0.5+0.5*sin(uTime*(0.6+aSeed)+aSeed*20.), 3.);
        gl_PointSize = aSize * uPx * (14.0 / -mv.z); }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5,0.0,d); gl_FragColor = vec4(vec3(1.0,0.84,0.62)*a*vA*0.75, a*vA); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
  scene.add(new THREE.Points(mGeo, mMat))
  const FS = 2400, fs = new Float32Array(FS * 3)
  for (let k = 0; k < FS; k++) {
    const u = Math.random() * Math.PI * 2, v = Math.acos(2 * Math.random() - 1), r = 18 + Math.random() * 20
    fs.set([Math.sin(v) * Math.cos(u) * r, Math.cos(v) * r, Math.sin(v) * Math.sin(u) * r], k * 3)
  }
  const fsGeo = new THREE.BufferGeometry()
  fsGeo.setAttribute('position', new THREE.BufferAttribute(fs, 3))
  scene.add(new THREE.Points(fsGeo, new THREE.PointsMaterial({ color: 0x7f8fc0, size: 1.1, sizeAttenuation: false, transparent: true, opacity: 0.5, depthWrite: false })))

  /* you */
  const youPos = new THREE.Vector3(1.6, 1.25, 2.4)
  const you = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xb9a6ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
  you.position.copy(youPos)
  you.scale.setScalar(0.07)
  scene.add(you)

  /* sparks from miners into nodes */
  const S = 360
  const sparks = Array.from({ length: S }, () => ({ alive: false, t: 0, dur: 1, from: new THREE.Vector3(), to: new THREE.Vector3(), mid: new THREE.Vector3(), node: 0, mine: false }))
  const trailPos = new Float32Array(S * 6), trailCol = new Float32Array(S * 6)
  const trailGeo = new THREE.BufferGeometry()
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3))
  trailGeo.setAttribute('color', new THREE.BufferAttribute(trailCol, 3))
  scene.add(new THREE.LineSegments(trailGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })))
  const wv = new THREE.Vector3()
  let connected = false
  function launch(mine) {
    const s = sparks.find(x => !x.alive)
    if (!s) return
    s.alive = true; s.t = 0; s.mine = mine
    s.dur = mine ? 1.3 + Math.random() * 0.5 : 2.8 + Math.random() * 2.4
    s.node = Math.floor(Math.random() * NC)
    if (mine) s.from.copy(youPos)
    else { const k = Math.floor(Math.random() * M); s.from.set(mPos[k * 3], mPos[k * 3 + 1], mPos[k * 3 + 2]) }
    s.to.copy(wv.set(nPos[s.node * 3], nPos[s.node * 3 + 1], nPos[s.node * 3 + 2]).applyMatrix4(brain.matrixWorld))
    s.mid.copy(s.from).add(s.to).multiplyScalar(0.5).add(new THREE.Vector3((Math.random() - 0.5) * 0.8, 0.3 + Math.random() * 0.5, (Math.random() - 0.5) * 0.8))
  }

  /* picking: hover and click on the nodes */
  const ray = new THREE.Raycaster()
  ray.params.Points.threshold = 0.018
  const mouse = new THREE.Vector2()
  const ring = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTexture(), color: 0xffffff, transparent: true, depthWrite: false, depthTest: false }))
  ring.scale.setScalar(0.06)
  ring.visible = false
  brain.add(ring)
  let down = null
  const pickAt = ev => {
    const r = renderer.domElement.getBoundingClientRect()
    mouse.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(mouse, camera)
    const hit = ray.intersectObject(nodes)[0]
    return hit ? hit.index : null
  }
  const onMove = ev => {
    const k = pickAt(ev)
    renderer.domElement.style.cursor = k != null ? 'pointer' : 'grab'
    onHover?.(k, ev.clientX, ev.clientY)
  }
  const onDown = ev => { down = [ev.clientX, ev.clientY] }
  const onUp = ev => {
    if (!down || Math.hypot(ev.clientX - down[0], ev.clientY - down[1]) > 5) return
    const k = pickAt(ev)
    select(k)
    onPick?.(k)
  }
  function select(k) {
    nodeMat.uniforms.uSel.value = k == null ? -1 : k
    ring.visible = k != null
    if (k != null) ring.position.set(nPos[k * 3], nPos[k * 3 + 1], nPos[k * 3 + 2])
  }
  renderer.domElement.addEventListener('pointermove', onMove)
  renderer.domElement.addEventListener('pointerdown', onDown)
  renderer.domElement.addEventListener('pointerup', onUp)

  /* bloom */
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(W(), H()), 0.85, 0.45, 0.32))
  composer.addPass(new OutputPass())

  const clock = new THREE.Clock()
  let raf = 0, acc = 0, mineAcc = 0
  const tmp = new THREE.Vector3(), t0 = new THREE.Vector3()
  function frame() {
    const dt = Math.min(0.05, clock.getDelta())
    const t = clock.elapsedTime
    cortexMat.uniforms.uTime.value = t
    nodeMat.uniforms.uTime.value = t
    mMat.uniforms.uTime.value = t
    // a planet: it breathes, drifts and turns slowly, keeping its side to us
    brain.scale.setScalar(1 + 0.012 * Math.sin(t * 0.9))
    brain.position.y = 0.04 * Math.sin(t * 0.35)
    brain.rotation.y = 0.5 * Math.sin(t * 0.07)
    brain.rotation.z = 0.04 * Math.sin(t * 0.21)
    controls.update()
    brain.updateMatrixWorld()
    ring.scale.setScalar(0.055 + 0.01 * Math.sin(t * 5))

    for (const h of hubs) {
      const k = 0.75 + 0.25 * Math.sin(t * 1.3 + h.userData.ph)
      h.scale.setScalar(h.userData.s * k)
      h.material.opacity = 0.35 + 0.3 * k
    }
    for (let k = 0; k < PU; k++) {
      const p = pu[k]
      p.t += dt * p.s
      if (p.t > 1) { p.t = 0; p.e = Math.floor(Math.random() * pairs.length) }
      const o = p.e * 6
      puPos[k * 3] = lPos[o] + (lPos[o + 3] - lPos[o]) * p.t
      puPos[k * 3 + 1] = lPos[o + 1] + (lPos[o + 4] - lPos[o + 1]) * p.t
      puPos[k * 3 + 2] = lPos[o + 2] + (lPos[o + 5] - lPos[o + 2]) * p.t
    }
    puGeo.attributes.position.needsUpdate = true

    let dirty = false
    for (let k = 0; k < NC; k++) if (nHit[k] > 0) { nHit[k] = Math.max(0, nHit[k] - dt * 1.2); dirty = true }
    acc += dt * 55
    while (acc > 1) { launch(false); acc-- }
    if (connected) { mineAcc += dt * 9; while (mineAcc > 1) { launch(true); mineAcc-- } }
    let tl = 0
    for (const s of sparks) {
      if (!s.alive) continue
      s.t += dt / s.dur
      if (s.t >= 1) { s.alive = false; nHit[s.node] = s.mine ? 1.6 : 1; dirty = true; continue }
      const u = s.t * s.t * (3 - 2 * s.t)
      tmp.copy(s.from).multiplyScalar((1 - u) * (1 - u)).addScaledVector(s.mid, 2 * (1 - u) * u).addScaledVector(s.to, u * u)
      const u0 = Math.max(0, u - (s.mine ? 0.12 : 0.06))
      t0.copy(s.from).multiplyScalar((1 - u0) * (1 - u0)).addScaledVector(s.mid, 2 * (1 - u0) * u0).addScaledVector(s.to, u0 * u0)
      trailPos.set([t0.x, t0.y, t0.z, tmp.x, tmp.y, tmp.z], tl * 6)
      const c = s.mine ? [0.6, 0.5, 1.0] : [0.95, 0.7, 0.4].map(x => x * u)
      trailCol.set([0, 0, 0, ...c], tl * 6)
      tl++
    }
    trailGeo.setDrawRange(0, tl * 2)
    trailGeo.attributes.position.needsUpdate = true
    trailGeo.attributes.color.needsUpdate = true
    if (dirty) hitAttr.needsUpdate = true
    you.scale.setScalar(connected ? 0.09 + 0.015 * Math.sin(t * 6) : 0.07)
    composer.render()
    raf = requestAnimationFrame(frame)
  }
  frame()

  const onResize = () => {
    camera.aspect = W() / H()
    camera.updateProjectionMatrix()
    camera.position.setLength(Math.max(camera.position.length(), fit()))
    place()
    renderer.setSize(W(), H())
    composer.setSize(W(), H())
  }
  window.addEventListener('resize', onResize)

  return {
    connect(on) { connected = on },
    select,
    dispose() {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('pointermove', onMove)
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('pointerup', onUp)
      renderer.dispose()
      el.removeChild(renderer.domElement)
    },
  }
}
