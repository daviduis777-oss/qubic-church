// @ts-nocheck: a hand-tuned three.js scene, kept as plain JS while its look is still being worked out
'use client'
// The brain: 16,384 mosaic tiles, one per cell of the Anna Matrix, laid on a procedural cerebrum; a cloud of
// miners around it; sparks from miners into the brain. Plain three.js so it ports to a client component as is.
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

/* ---------------- noise ---------------- */
function hash3(x, y, z) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453
  return s - Math.floor(s)
}
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z)
  const xf = x - xi, yf = y - yi, zf = z - zi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf)
  let r = 0
  for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) for (let dz = 0; dz < 2; dz++) {
    const h = hash3(xi + dx, yi + dy, zi + dz)
    r += h * (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w)
  }
  return r
}
/** folds: domain-warped ridged noise, 1 on a gyrus crest, 0 in a sulcus; long, worm-like ridges */
function folds(x, y, z) {
  const wx = x + 0.35 * (vnoise(x * 2.1 + 7, y * 2.1, z * 2.1) - 0.5)
  const wy = y + 0.35 * (vnoise(x * 2.1, y * 2.1 + 3, z * 2.1) - 0.5)
  const wz = z + 0.35 * (vnoise(x * 2.1, y * 2.1, z * 2.1 + 11) - 0.5)
  let a = 0, f = 7.0, amp = 1, tot = 0
  for (let o = 0; o < 2; o++) {
    const n = vnoise(wx * f, wy * f, wz * f)
    a += Math.pow(1 - Math.abs(n * 2 - 1), 2.2) * amp
    tot += amp
    f *= 2.1
    amp *= 0.35
  }
  return a / tot
}

/* ---------------- the cerebrum's surface ---------------- */
/** radius of the brain along a unit direction (x lateral, y up, z front) */
function radius(x, y, z) {
  // a side view of a brain: long front to back, highest a little behind the middle, flat underneath
  const a = 0.68, b = 0.66, c = 1.0
  const yy = y - 0.06 * z - 0.05 * Math.max(0, -z) // crown sits behind the middle
  let r = 1 / Math.sqrt((x / a) ** 2 + (yy / b) ** 2 + (z / c) ** 2)
  // a flatter base
  if (y < 0) r *= 1 - 0.3 * smooth(0, 1, -y) ** 1.2
  // temporal lobes: full and low at the sides, from the middle forward
  r *= 1 + 0.13 * Math.exp(-(((y + 0.34) / 0.2) ** 2)) * smooth(0.2, 0.75, Math.abs(x)) * smooth(-0.55, 0.0, z) * smooth(0.95, 0.5, z)
  // the frontal lobe: full and high at the front
  r *= 1 + 0.06 * Math.exp(-(((z - 0.55) / 0.3) ** 2)) * smooth(-0.1, 0.4, y)
  // a rounder frontal pole, a fuller occipital one
  r *= 1 - 0.05 * Math.max(0, z) ** 3 + 0.03 * Math.max(0, -z) ** 2
  // the lateral (Sylvian) fissure: a soft groove on each side, rising towards the back
  const gy = -0.1 - 0.3 * z
  const lat = Math.exp(-(((y - gy) / 0.05) ** 2)) * smooth(0.3, 0.6, Math.abs(x)) * smooth(-0.5, -0.15, z) * smooth(0.8, 0.5, z)
  r *= 1 - 0.11 * lat
  // the longitudinal fissure along the top of the midline
  const mid = Math.exp(-((x * r) ** 2) / 0.0022) * smooth(-0.3, 0.2, y)
  r *= 1 - 0.12 * mid
  return r
}
function smooth(a, b, t) {
  const k = Math.min(1, Math.max(0, (t - a) / (b - a)))
  return k * k * (3 - 2 * k)
}

/**
 * The cerebrum as Anna's grid: her 128 rows run from the base to the crown as latitude, her 128 columns run round
 * the brain as longitude, so the matrix wraps the brain in order, cell by cell. Returns per cell the centre, the
 * normal, the east tangent, its size on the surface and the fold depth there.
 */
function cerebrum() {
  const R = 128, C = 128, n = R * C
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), east = new Float32Array(n * 3), size = new Float32Array(n * 2), dep = new Float32Array(n)
  const lat0 = -Math.PI / 2 + 0.22, lat1 = Math.PI / 2 - 0.06
  const at = (lat, lon, out) => {
    const dx = Math.cos(lat) * Math.sin(lon), dy = Math.sin(lat), dz = Math.cos(lat) * Math.cos(lon)
    const r = radius(dx, dy, dz)
    const f = folds(dx * r, dy * r, dz * r)
    out.set(dx * r, dy * r, dz * r)
    return f
  }
  const p = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), tE = new THREE.Vector3(), tN = new THREE.Vector3(), nn = new THREE.Vector3()
  const dLat = (lat1 - lat0) / R, dLon = (Math.PI * 2) / C
  for (let r = 0; r < R; r++) {
    // Anna's row 0 at the crown, row 127 at the base
    const lat = lat1 - (r + 0.5) * dLat
    for (let c = 0; c < C; c++) {
      const lon = (c + 0.5) * dLon
      const i = r * C + c
      const f = at(lat, lon, p)
      at(lat, lon + dLon * 0.5, a); at(lat, lon - dLon * 0.5, b); tE.subVectors(a, b)
      at(lat + dLat * 0.5, lon, a); at(lat - dLat * 0.5, lon, b); tN.subVectors(a, b)
      nn.crossVectors(tE, tN).normalize()
      if (nn.dot(p) < 0) nn.negate()
      // a breath of relief: crests a little out, sulci a little in, along the smooth normal
      p.addScaledVector(nn, -smooth(0.6, 0.9, f) * 0.035)
      pos.set([p.x, p.y, p.z], i * 3)
      nor.set([nn.x, nn.y, nn.z], i * 3)
      east.set([tE.x, tE.y, tE.z], i * 3)
      size.set([tE.length(), tN.length()], i * 2)
      // the ridges of the noise are thin lines: they are the sulci, dark; the broad rest is gyri
      dep[i] = 0.12 + 0.88 * (1 - smooth(0.68, 0.86, f)) * (0.75 + 0.25 * (1 - f))
    }
  }
  return { pos, nor, east, size, dep }
}

/* ---------------- colours from Anna ---------------- */
function annaColour(v) {
  if (v === 0) return [1, 0.95, 0.85]
  const k = Math.min(1, Math.abs(v) / 128)
  const mix = (a, b) => a + (b - a) * k
  return v < 0 ? [mix(0.05, 0.22), mix(0.10, 0.40), mix(0.42, 1.0)] : [mix(0.48, 1.0), mix(0.18, 0.66), mix(0.02, 0.22)]
}

/* ---------------- the scene ---------------- */
export function mountBrain(el, { matrix, miners = 2400, you = true }) {
  const W = () => el.clientWidth || window.innerWidth, H = () => el.clientHeight || window.innerHeight
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
  renderer.setSize(W(), H())
  renderer.setClearColor(0x020204, 1)
  el.appendChild(renderer.domElement)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(36, W() / H(), 0.05, 100)
  camera.position.set(2.6, 1.05, 2.95)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.enablePan = false
  controls.minDistance = 2.6
  controls.maxDistance = 9
  controls.autoRotate = false
  controls.autoRotateSpeed = 0.18

  const N = 128 * 128
  const brain = new THREE.Group()
  brain.rotation.y = -1.25
  scene.add(brain)

  /* tiles: hexagons laid on the surface, coloured by Anna, lit by travelling waves */
  const { pos, nor, east, size, dep } = cerebrum()
  const hex = new THREE.PlaneGeometry(1, 1)
  const colour = new Float32Array(N * 3), phase = new Float32Array(N), deep = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    const v = matrix[Math.floor(i / 128)][i % 128]
    const [r, g, b] = annaColour(v)
    colour.set([r, g, b], i * 3)
    phase[i] = Math.random()
    deep[i] = dep[i]
  }
  hex.setAttribute('aColour', new THREE.InstancedBufferAttribute(colour, 3))
  hex.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1))
  hex.setAttribute('aDeep', new THREE.InstancedBufferAttribute(deep, 1))
  const hits = new Float32Array(N)
  const hitAttr = new THREE.InstancedBufferAttribute(hits, 1)
  hitAttr.setUsage(THREE.DynamicDrawUsage)
  hex.setAttribute('aHit', hitAttr)
  const tileMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      attribute vec3 aColour; attribute float aPhase; attribute float aDeep; attribute float aHit;
      varying vec3 vColour; varying float vGlow; varying vec2 vUv; varying float vRim;
      uniform float uTime;
      void main() {
        vUv = uv;
        vec3 cl = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        vec3 nl = normalize(mat3(instanceMatrix) * vec3(0.0, 0.0, 1.0));
        // the surface breathes: slow swells roll across it like a sea under a moon
        float swell = sin(dot(cl, vec3(0.2, 0.7, 1.0)) * 3.2 - uTime * 0.9) * 0.55 + sin(dot(cl, vec3(-1.0, 0.3, 0.4)) * 4.1 + uTime * 0.7) * 0.45;
        vec3 lp = (instanceMatrix * vec4(position, 1.0)).xyz + nl * (swell * 0.014 + aHit * 0.03);
        vec4 wp = modelMatrix * vec4(lp, 1.0);
        vec3 c = (modelMatrix * vec4(cl, 1.0)).xyz;
        // travelling waves of activity along the gyri
        float w1 = sin(dot(c, vec3(0.0, 0.35, 1.0)) * 6.0 - uTime * 1.3);
        float w2 = sin(dot(c, vec3(1.0, 0.6, -0.2)) * 8.0 - uTime * 1.9 + aPhase * 6.28);
        float wave = smoothstep(0.7, 1.0, w1) * 0.8 + smoothstep(0.86, 1.0, w2) * 0.6;
        float flick = step(0.9972, fract(sin(floor(uTime * 5.0 + aPhase * 97.0) * 12.9898 + aPhase * 78.2) * 43758.5));
        vGlow = 0.02 + 0.46 * aDeep * aDeep + wave * (0.1 + 0.8 * aDeep) + flick * 1.5 + aHit * 2.6 + max(swell, 0.0) * 0.12 * aDeep;
        vColour = mix(aColour, vec3(1.0, 0.92, 0.75), clamp(aHit, 0.0, 1.0) * 0.6);
        vec3 n = normalize(mat3(modelMatrix) * nl);
        vec3 v = normalize(cameraPosition - c);
        vRim = 1.0 - max(dot(n, v), 0.0);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      varying vec3 vColour; varying float vGlow; varying vec2 vUv; varying float vRim;
      void main() {
        // a square tile with a dark grout line and a slight bevel: a piece of the puzzle
        vec2 p = abs(vUv * 2.0 - 1.0);
        float e = max(p.x, p.y);
        float tile = 1.0 - smoothstep(0.84, 0.94, e);
        float bevel = 0.82 + 0.18 * (1.0 - e);
        vec3 col = vColour * vGlow * bevel * tile;
        col += vec3(0.30, 0.42, 1.0) * pow(vRim, 3.0) * 0.14 * tile;
        if (tile < 0.02) discard;
        gl_FragColor = vec4(col, 1.0);
      }`,
    side: THREE.DoubleSide,
  })
  const tiles = new THREE.InstancedMesh(hex, tileMat, N)
  const m = new THREE.Matrix4(), qq = new THREE.Quaternion(), z = new THREE.Vector3(0, 0, 1), nn = new THREE.Vector3(), pp = new THREE.Vector3(), sc = new THREE.Vector3()
  const xA = new THREE.Vector3(), yA = new THREE.Vector3(), basis = new THREE.Matrix4()
  for (let i = 0; i < N; i++) {
    nn.set(nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2])
    xA.set(east[i * 3], east[i * 3 + 1], east[i * 3 + 2]).normalize()
    yA.crossVectors(nn, xA).normalize()
    xA.crossVectors(yA, nn).normalize()
    basis.makeBasis(xA, yA, nn)
    qq.setFromRotationMatrix(basis)
    pp.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2])
    sc.set(size[i * 2] * 1.04, size[i * 2 + 1] * 1.04, 1)
    m.compose(pp, qq, sc)
    tiles.setMatrixAt(i, m)
  }
  brain.add(tiles)

  /* the dark body under the tiles, so the grout reads as depth */
  const bodyGeo = new THREE.SphereGeometry(1, 128, 96)
  const bp = bodyGeo.attributes.position
  for (let k = 0; k < bp.count; k++) {
    pp.set(bp.getX(k), bp.getY(k), bp.getZ(k)).normalize()
    const r = radius(pp.x, pp.y, pp.z)
    pp.multiplyScalar(r * 0.975)
    bp.setXYZ(k, pp.x, pp.y, pp.z)
  }
  bodyGeo.computeVertexNormals()
  const body = new THREE.Mesh(bodyGeo, new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(normalMatrix*normal); vP = (modelMatrix*vec4(position,1.)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vP,1.); }`,
    fragmentShader: `varying vec3 vN; varying vec3 vP; uniform float uTime; void main(){ float r = pow(1.0-abs(dot(normalize(vN), vec3(0.,0.,1.))), 2.0); gl_FragColor = vec4(vec3(0.012,0.014,0.03) + vec3(0.06,0.09,0.22)*r*(0.7+0.3*sin(uTime*0.8)), 1.); }`,
  }))
  brain.add(body)

  /* the cerebellum: a smaller grid of finer tiles under the occipital lobe, in fine horizontal folds */
  const CR = 48, CC = 96, CB = CR * CC
  const cbHex = new THREE.PlaneGeometry(1, 1)
  const cbCol = new Float32Array(CB * 3), cbPh = new Float32Array(CB), cbDeep = new Float32Array(CB), cbHit = new Float32Array(CB)
  const cbMesh = new THREE.InstancedMesh(cbHex, tileMat, CB)
  const cbAt = (la, lo, out) => out.set(Math.cos(la) * Math.sin(lo) * 0.42, Math.sin(la) * 0.2 - 0.44, Math.cos(la) * Math.cos(lo) * 0.27 - 0.6)
  const ca = new THREE.Vector3(), cb2 = new THREE.Vector3(), cE = new THREE.Vector3(), cN = new THREE.Vector3()
  for (let r = 0; r < CR; r++) {
    const la = Math.PI / 2 - 0.15 - ((r + 0.5) / CR) * (Math.PI - 0.5)
    for (let c = 0; c < CC; c++) {
      const lo = ((c + 0.5) / CC) * Math.PI * 2
      const k = r * CC + c
      cbAt(la, lo, pp)
      cbAt(la, lo + Math.PI / CC, ca); cbAt(la, lo - Math.PI / CC, cb2); cE.subVectors(ca, cb2)
      cbAt(la + 0.5 * (Math.PI - 0.5) / CR, lo, ca); cbAt(la - 0.5 * (Math.PI - 0.5) / CR, lo, cb2); cN.subVectors(ca, cb2)
      nn.crossVectors(cE, cN).normalize()
      if (nn.dot(new THREE.Vector3().copy(pp).sub(new THREE.Vector3(0, -0.44, -0.6))) < 0) nn.negate()
      xA.copy(cE).normalize(); yA.crossVectors(nn, xA).normalize(); xA.crossVectors(yA, nn).normalize()
      basis.makeBasis(xA, yA, nn); qq.setFromRotationMatrix(basis)
      sc.set(cE.length() * 1.05, cN.length() * 1.05, 1)
      m.compose(pp, qq, sc)
      cbMesh.setMatrixAt(k, m)
      cbCol.set([0.14, 0.18, 0.5], k * 3)
      cbPh[k] = Math.random()
      cbDeep[k] = 0.35 + 0.5 * Math.abs(Math.sin(la * 22))
    }
  }
  cbHex.setAttribute('aColour', new THREE.InstancedBufferAttribute(cbCol, 3))
  cbHex.setAttribute('aPhase', new THREE.InstancedBufferAttribute(cbPh, 1))
  cbHex.setAttribute('aDeep', new THREE.InstancedBufferAttribute(cbDeep, 1))
  cbHex.setAttribute('aHit', new THREE.InstancedBufferAttribute(cbHit, 1))
  brain.add(cbMesh)

  /* the atmosphere: a thin blue-violet halo round the planet */
  const atmo = new THREE.Mesh(bodyGeo.clone().scale(1.05, 1.05, 1.04), new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 wp = modelMatrix*vec4(position,1.); vN = normalize(mat3(modelMatrix)*normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `varying vec3 vN; varying vec3 vV; uniform float uTime; void main(){ float f = pow(clamp(1.0 - abs(dot(vN, vV)), 0.0, 1.0), 6.0); vec3 c = mix(vec3(0.25,0.35,1.0), vec3(0.55,0.35,1.0), 0.5+0.5*sin(uTime*0.3)); gl_FragColor = vec4(c * f * 0.45, f); }`,
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }))
  brain.add(atmo)

  /* the core: a soft electric glow inside */
  const core = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), color: 0x6f7dff, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending,
  }))
  core.scale.set(2.2, 1.7, 1)
  brain.add(core)

  /* miners: a chaotic cloud around the brain */
  const M = miners
  const mPos = new Float32Array(M * 3), mSeed = new Float32Array(M), mSize = new Float32Array(M)
  for (let k = 0; k < M; k++) {
    const u = Math.random() * Math.PI * 2, v = Math.acos(2 * Math.random() - 1)
    const r = 2.0 + Math.pow(Math.random(), 0.7) * 2.8
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
      void main(){ vec3 p = position;
        p += 0.06*vec3(sin(uTime*0.3+aSeed*40.), cos(uTime*0.25+aSeed*31.), sin(uTime*0.2+aSeed*17.));
        vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
        vA = 0.45 + 0.55*pow(0.5+0.5*sin(uTime*(0.6+aSeed)+aSeed*20.), 3.);
        gl_PointSize = aSize * uPx * (14.0 / -mv.z); }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5,0.0,d); gl_FragColor = vec4(vec3(1.0,0.82,0.55)*a*vA*0.7, a*vA); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
  scene.add(new THREE.Points(mGeo, mMat))

  /* far stars: the sky behind the miners */
  const FS = 2500, fs = new Float32Array(FS * 3)
  for (let k = 0; k < FS; k++) {
    const u = Math.random() * Math.PI * 2, v = Math.acos(2 * Math.random() - 1), r = 18 + Math.random() * 20
    fs.set([Math.sin(v) * Math.cos(u) * r, Math.cos(v) * r, Math.sin(v) * Math.sin(u) * r], k * 3)
  }
  const fsGeo = new THREE.BufferGeometry()
  fsGeo.setAttribute('position', new THREE.BufferAttribute(fs, 3))
  scene.add(new THREE.Points(fsGeo, new THREE.PointsMaterial({ color: 0x8890b8, size: 1.1, sizeAttenuation: false, transparent: true, opacity: 0.55, depthWrite: false })))

  /* you: one miner, violet, a little closer */
  const youPos = new THREE.Vector3(2.15, 0.55, 1.35)
  const youMesh = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xb9a6ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
  youMesh.scale.set(0.32, 0.32, 1)
  youMesh.position.copy(youPos)
  youMesh.visible = you
  scene.add(youMesh)

  /* sparks: from miners into the brain; each one lights the tile it lands on */
  const S = 420
  const sPos = new Float32Array(S * 3), sCol = new Float32Array(S * 3)
  const sparks = Array.from({ length: S }, () => ({ alive: false, t: 0, dur: 1, from: new THREE.Vector3(), to: new THREE.Vector3(), mid: new THREE.Vector3(), tile: 0, mine: false }))
  const sGeo = new THREE.BufferGeometry()
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3))
  sGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3))
  const sMat = new THREE.PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, map: glowTexture() })
  const sPoints = new THREE.Points(sGeo, sMat)
  scene.add(sPoints)
  // trails for your sparks
  const T = 24
  const trailGeo = new THREE.BufferGeometry()
  const trailPos = new Float32Array(S * 2 * 3)
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3))
  trailGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(S * 2 * 3), 3))
  const trail = new THREE.LineSegments(trailGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }))
  scene.add(trail)

  const world = new THREE.Vector3()
  const tileWorld = i => world.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]).applyMatrix4(brain.matrixWorld)
  let connected = false
  function launch(mine) {
    const s = sparks.find(x => !x.alive)
    if (!s) return
    s.alive = true
    s.t = 0
    s.mine = mine
    s.dur = mine ? 0.9 + Math.random() * 0.4 : 1.4 + Math.random() * 1.6
    s.tile = Math.floor(Math.random() * N)
    if (mine) s.from.copy(youPos)
    else {
      const k = Math.floor(Math.random() * M)
      s.from.set(mPos[k * 3], mPos[k * 3 + 1], mPos[k * 3 + 2])
    }
    s.to.copy(tileWorld(s.tile))
    s.mid.copy(s.from).add(s.to).multiplyScalar(0.5).add(new THREE.Vector3((Math.random() - 0.5) * 0.8, 0.4 + Math.random() * 0.5, (Math.random() - 0.5) * 0.8))
  }

  /* lightning: short arcs between nearby tiles */
  const A = 10, arcSeg = 10
  const arcPos = new Float32Array(A * arcSeg * 2 * 3)
  const arcGeo = new THREE.BufferGeometry()
  arcGeo.setAttribute('position', new THREE.BufferAttribute(arcPos, 3))
  const arcs = new THREE.LineSegments(arcGeo, new THREE.LineBasicMaterial({ color: 0xaab8ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }))
  brain.add(arcs)
  const arcLife = new Float32Array(A)
  function newArc(a) {
    const i = Math.floor(Math.random() * N)
    const p0 = new THREE.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2])
    // a point a short way along the surface
    const j = Math.min(N - 1, Math.max(0, i + Math.floor((Math.random() - 0.5) * 900)))
    const p1 = new THREE.Vector3(pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2])
    if (p0.distanceTo(p1) > 0.5) p1.lerpVectors(p0, p1, 0.5 / p0.distanceTo(p1))
    let prev = p0.clone().multiplyScalar(1.02)
    for (let k = 1; k <= arcSeg; k++) {
      const t = k / arcSeg
      const q = p0.clone().lerp(p1, t)
      q.multiplyScalar(1.02 + Math.sin(t * Math.PI) * 0.05)
      if (k < arcSeg) q.add(new THREE.Vector3((Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.04))
      const o = (a * arcSeg + k - 1) * 6
      arcPos.set([prev.x, prev.y, prev.z, q.x, q.y, q.z], o)
      prev = q
    }
    arcLife[a] = 0.08 + Math.random() * 0.14
  }
  for (let a = 0; a < A; a++) arcLife[a] = -Math.random() * 2

  /* bloom */
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(W(), H()), 0.9, 0.32, 0.5)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())

  const clock = new THREE.Clock()
  let raf = 0, launchAcc = 0, mineAcc = 0
  function frame() {
    const dt = Math.min(0.05, clock.getDelta())
    const t = clock.elapsedTime
    tileMat.uniforms.uTime.value = t
    body.material.uniforms.uTime.value = t
    mMat.uniforms.uTime.value = t
    core.material.opacity = 0.06 + 0.03 * Math.sin(t * 1.3)
    atmo.material.uniforms.uTime.value = t
    // a planet: it breathes, drifts and slowly turns on its own axis
    const br = 1 + 0.012 * Math.sin(t * 0.9)
    brain.scale.setScalar(br)
    brain.position.y = 0.04 * Math.sin(t * 0.35)
    // it turns slowly, but keeps its side to us: the shape a brain is known by
    brain.rotation.y = -1.25 + 0.55 * Math.sin(t * 0.07)
    brain.rotation.z = 0.05 * Math.sin(t * 0.21)
    controls.update()
    brain.updateMatrixWorld()

    // hits fade
    let dirty = false
    for (let i = 0; i < N; i++) if (hits[i] > 0) { hits[i] = Math.max(0, hits[i] - dt * 1.4); dirty = true }

    // launch sparks: the network's pace, and yours when connected
    launchAcc += dt * 110
    while (launchAcc > 1) { launch(false); launchAcc-- }
    if (connected) { mineAcc += dt * 9; while (mineAcc > 1) { launch(true); mineAcc-- } }

    let n = 0, tl = 0
    const tmp = new THREE.Vector3()
    for (const s of sparks) {
      if (!s.alive) continue
      s.t += dt / s.dur
      if (s.t >= 1) {
        s.alive = false
        hits[s.tile] = s.mine ? 1.6 : 1
        dirty = true
        continue
      }
      const u = s.t * s.t * (3 - 2 * s.t)
      // quadratic bezier
      tmp.copy(s.from).multiplyScalar((1 - u) * (1 - u)).addScaledVector(s.mid, 2 * (1 - u) * u).addScaledVector(s.to, u * u)
      sPos.set([tmp.x, tmp.y, tmp.z], n * 3)
      if (s.mine) sCol.set([0.75, 0.66, 1.0], n * 3)
      else sCol.set([1.0, 0.78, 0.45].map(c => c * (0.35 + 0.65 * u)), n * 3)
      n++
      {
        const u0 = Math.max(0, u - (s.mine ? 0.12 : 0.06))
        const t0 = new THREE.Vector3().copy(s.from).multiplyScalar((1 - u0) * (1 - u0)).addScaledVector(s.mid, 2 * (1 - u0) * u0).addScaledVector(s.to, u0 * u0)
        trailPos.set([t0.x, t0.y, t0.z, tmp.x, tmp.y, tmp.z], tl * 6)
        const tc = trailGeo.attributes.color.array
        const k = s.mine ? [0.55, 0.45, 1.0] : [0.9, 0.62, 0.3].map(c => c * u)
        tc.set([0, 0, 0, ...k], tl * 6)
        tl++
      }
    }
    sGeo.setDrawRange(0, n)
    sGeo.attributes.position.needsUpdate = true
    sGeo.attributes.color.needsUpdate = true
    trailGeo.setDrawRange(0, tl * 2)
    trailGeo.attributes.position.needsUpdate = true
    trailGeo.attributes.color.needsUpdate = true
    if (dirty) hitAttr.needsUpdate = true

    // arcs
    let arcDirty = false
    for (let a = 0; a < A; a++) {
      arcLife[a] -= dt
      if (arcLife[a] < -0.6 - Math.random() * 1.5) { newArc(a); arcDirty = true }
    }
    // hide dead arcs by collapsing them
    for (let a = 0; a < A; a++) if (arcLife[a] <= 0) { arcPos.fill(0, a * arcSeg * 6, (a + 1) * arcSeg * 6); arcDirty = true }
    if (arcDirty) arcGeo.attributes.position.needsUpdate = true

    youMesh.scale.setScalar(connected ? 0.09 + 0.015 * Math.sin(t * 6) : 0.07)
    composer.render()
    raf = requestAnimationFrame(frame)
  }
  frame()

  const onResize = () => {
    camera.aspect = W() / H()
    camera.updateProjectionMatrix()
    renderer.setSize(W(), H())
    composer.setSize(W(), H())
  }
  window.addEventListener('resize', onResize)

  return {
    connect(on) { connected = on },
    dispose() {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      el.removeChild(renderer.domElement)
    },
  }
}

let glowTex = null
function glowTexture() {
  if (glowTex) return glowTex
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  gr.addColorStop(0, 'rgba(255,255,255,1)')
  gr.addColorStop(0.25, 'rgba(255,255,255,0.45)')
  gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr
  g.fillRect(0, 0, 128, 128)
  glowTex = new THREE.CanvasTexture(c)
  return glowTex
}
