'use client'

/**
 * Nixie tubes in real 3D (three.js): physical glass with transmission and iridescence that catches a slowly moving
 * light rig, a gold monoline cathode with soft glow and the unlit cathodes behind it, a dark hex-mesh anode, and a
 * blue LED in the base whose hue drifts through violet. One canvas per row of tubes.
 */
import { Environment, Lightformer } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { DIGITS } from './digits'

const GOLD = '#FFC46B'
const GOLD_HOT = '#FFE3B0'
const TUBE_H = 2.55 // world units, base to pip
const SPACING = 1.12
const COLON = 0.42
const VIEW_H = 3.05

/* ---------------- shared resources ---------------- */

// a ticking clock asks for the same ten digits over and over: build each once and keep it
const curveCache = new Map<string, THREE.Curve<THREE.Vector3>[]>()
const glowCache = new Map<string, THREE.Texture>()
function digitCurves(ch: string): THREE.Curve<THREE.Vector3>[] {
  let v = curveCache.get(ch)
  if (!v) curveCache.set(ch, (v = buildCurves(ch)))
  return v
}
function glowTexture(ch: string) {
  let v = glowCache.get(ch)
  if (!v) glowCache.set(ch, (v = buildGlow(ch)))
  return v
}
function buildCurves(ch: string): THREE.Curve<THREE.Vector3>[] {
  const d = DIGITS[ch]
  if (!d) return []
  const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`)
  const s = 1.3 / 100
  const out: THREE.Curve<THREE.Vector3>[] = []
  for (const p of data.paths) {
    for (const sp of p.subPaths) {
      const pts = sp.getPoints(48).map(v => new THREE.Vector3((v.x - 30) * s, 1.2 + (50 - v.y) * s, 0))
      if (pts.length > 1) out.push(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2))
    }
  }
  return out
}

/** The glow around a lit cathode, drawn once into a texture: soft gold falloff following the wire. */
function buildGlow(ch: string) {
  const d = DIGITS[ch]
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 384
  const g = c.getContext('2d')!
  if (d) {
    const p = new Path2D(d)
    g.translate(128 - 30 * 2.6, 192 - 50 * 2.6)
    g.scale(2.6, 2.6)
    g.lineCap = 'round'
    g.lineJoin = 'round'
    // the same light as the BPP-9000 number: 0 0 4px #ffd08a, 0 0 14px #FFC46B, 0 0 40px amber .7, 0 0 90px amber .35
    for (const [blur, a, w, col] of [[40, 0.35, 8, '232,145,46'], [16, 0.5, 4, '255,196,107'], [5, 0.7, 1.8, '255,208,138']] as const) {
      g.shadowColor = `rgba(${col},${a})`
      g.shadowBlur = blur
      g.strokeStyle = `rgba(${col},${a})`
      g.lineWidth = w
      g.stroke(p)
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function radialTexture(stops: [number, string][]) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  for (const [o, col] of stops) r.addColorStop(o, col)
  g.fillStyle = r
  g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Vertical haze: brightest at the bottom, a wide soft column fading out by mid-tube. */
function hazeTexture() {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 256
  const g = c.getContext('2d')!
  const v = g.createLinearGradient(0, 256, 0, 0)
  v.addColorStop(0, 'rgba(255,255,255,.55)')
  v.addColorStop(0.25, 'rgba(255,255,255,.22)')
  v.addColorStop(0.6, 'rgba(255,255,255,.06)')
  v.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = v
  g.fillRect(0, 0, 128, 256)
  // soften the sides
  g.globalCompositeOperation = 'destination-in'
  const hgrad = g.createLinearGradient(0, 0, 128, 0)
  hgrad.addColorStop(0, 'rgba(0,0,0,0)')
  hgrad.addColorStop(0.5, 'rgba(0,0,0,1)')
  hgrad.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = hgrad
  g.fillRect(0, 0, 128, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/**
 * The glass lit from inside by the base LED. Light travels in the glass wall and leaks out where the wall is seen
 * edge-on, so: fresnel (grazing) x height falloff from the base, with a slow travelling ripple so it breathes.
 */
function catchMaterial(color: THREE.Color) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: color.clone() }, uTime: { value: 0 } },
    vertexShader: `
      varying vec3 vN; varying vec3 vV; varying float vY;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz);
        vY = position.y;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uTime;
      varying vec3 vN; varying vec3 vV; varying float vY;
      void main() {
        float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
        float rim = pow(f, 2.2);
        float h = exp(-vY * 1.55) * 1.25 + 0.05;
        float ripple = 0.9 + 0.1 * sin(vY * 7.0 - uTime * 0.8);
        vec3 c = mix(uColor, vec3(0.80, 0.86, 1.0), smoothstep(0.55, 1.0, rim) * 0.35);
        float a = rim * h * ripple;
        a += exp(-vY * 7.0) * 0.35; // the glass foot, right at the LED
        gl_FragColor = vec4(c * a * 1.6, 1.0);
      }`,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  })
}

/**
 * The anode mesh, lit by hand instead of by lamps (a point light would put hot specks on the glass):
 * violet from the LED below, fading up into dark steel, with a warm touch where the digit glows.
 */
function anodeMaterial(color: THREE.Color) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: color.clone() }, uMap: { value: hexTexture() } },
    vertexShader: `
      varying vec2 vUv; varying float vY; varying float vFront;
      void main() {
        vUv = uv; vY = position.y;
        vec3 n = normalize(mat3(modelMatrix) * normal);
        vFront = n.z;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 uColor; uniform sampler2D uMap;
      varying vec2 vUv; varying float vY; varying float vFront;
      void main() {
        float m = texture2D(uMap, vUv * vec2(15.0, 12.0)).r;
        if (m < 0.2) discard;
        float y = vY + 0.775;                       // 0 at the bottom of the mesh
        vec3 steel = vec3(0.2, 0.19, 0.26);
        vec3 c = steel + uColor * (exp(-y * 1.5) * 1.5 + 0.12);
        c += vec3(1.0, 0.72, 0.35) * 0.22 * exp(-pow((y - 0.85) * 1.6, 2.0)) * max(vFront, 0.0) ;
        float a = m * (vFront < 0.0 ? 0.55 : 0.9);  // the far side of the cylinder dimmer
        gl_FragColor = vec4(c * a, a);
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
}

function hexTexture() {
  const c = document.createElement('canvas')
  c.width = 120
  c.height = 104
  const g = c.getContext('2d')!
  g.fillStyle = '#000'
  g.fillRect(0, 0, 120, 104)
  g.strokeStyle = '#fff'
  g.lineWidth = 2.2
  const R = 17
  const hex = (cx: number, cy: number) => {
    g.beginPath()
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i
      const x = cx + R * Math.cos(a)
      const y = cy + R * Math.sin(a)
      if (i) g.lineTo(x, y)
      else g.moveTo(x, y)
    }
    g.closePath()
    g.stroke()
  }
  for (const [x, y] of [[0, 0], [60, 0], [120, 0], [30, 52], [90, 52], [0, 104], [60, 104], [120, 104]] as const) hex(x, y)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(15, 12)
  return t
}

function glassGeometry() {
  const pts: THREE.Vector2[] = [new THREE.Vector2(0, 0.0), new THREE.Vector2(0.49, 0.0), new THREE.Vector2(0.5, 0.03)]
  pts.push(new THREE.Vector2(0.5, 1.95))
  for (let i = 1; i <= 16; i++) {
    const a = (i / 16) * (Math.PI / 2)
    pts.push(new THREE.Vector2(0.5 * Math.cos(a), 1.95 + 0.5 * Math.sin(a) * 0.92))
  }
  pts.push(new THREE.Vector2(0.06, 2.42), new THREE.Vector2(0.035, 2.53), new THREE.Vector2(0.0, 2.55))
  return new THREE.LatheGeometry(pts, 128, Math.PI)
}

/* ---------------- one tube ---------------- */

function Tube({ ch, x, res }: { ch: string; x: number; res: Res }) {
  const curves = useMemo(() => digitCurves(ch), [ch])
  const ghosts = useMemo(
    () =>
      ['0', '8', '3', '6']
        .filter(g => g !== ch)
        .slice(0, 3)
        .map((g, i) => ({ curves: digitCurves(g), z: -0.05 - i * 0.045 })),
    [ch],
  )
  const glow = useMemo(() => glowTexture(ch), [ch])
  const wire = useRef<THREE.MeshBasicMaterial>(null)
  const seed = useMemo(() => Math.random() * 10, [])
  useFrame(({ clock }) => {
    // a living filament: a slow breath with a faint flicker
    const t = clock.elapsedTime + seed
    const k = 1 + 0.05 * Math.sin(t * 1.7) + 0.025 * Math.sin(t * 13.1)
    if (wire.current) wire.current.color.copy(res.wireColor).multiplyScalar(k)
  })
  return (
    <group position={[x, 0, 0]}>
      {/* base: a dark ceramic socket */}
      <mesh geometry={res.base} material={res.baseMat} position={[0, -0.07, 0]} />
      {/* anode mesh */}
      <mesh geometry={res.anode} material={res.anodeMat} position={[0, 1.15, 0]} />
      {/* unlit cathodes */}
      {ghosts.map((gh, i) => (
        <group key={i} position={[0, 0, gh.z]}>
          {gh.curves.map((c, j) => (
            <mesh key={j} material={res.ghostMat}>
              <tubeGeometry args={[c, 120, 0.011, 6, false]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* the lit cathode: wire + glow */}
      <sprite material-blending={THREE.AdditiveBlending} material-depthWrite={false} material-map={glow} material-opacity={0.8} material-transparent position={[0, 1.2, 0.02]} scale={[1.33, 2.0, 1]} />
      {curves.map((c, j) => (
        <mesh key={j}>
          <tubeGeometry args={[c, 160, 0.02, 8, false]} />
          <meshBasicMaterial color={res.wireColor} ref={j === 0 ? wire : undefined} toneMapped={false} />
        </mesh>
      ))}
      {/* blue LED in the base */}
      <sprite material={res.hazeMat} position={[0, 0.55, 0.02]} scale={[1.05, 1.6, 1]} />
      <sprite material={res.ledMat} position={[0, 0.16, 0.05]} scale={[0.95, 0.5, 1]} />
      {/* the inside of the glass catching the base light: violet rising up the walls, strongest at the grazing edges */}
      <mesh geometry={res.glass} material={res.catchMat} renderOrder={3} scale={[0.985, 1, 0.985]} />
      <sprite material={res.floorMat} position={[0, -0.08, 0.25]} scale={[1.5, 0.3, 1]} />
      {/* the glass */}
      <mesh geometry={res.glass} material={res.glassBackMat} renderOrder={1} />
      <mesh geometry={res.glass} material={res.glassMat} renderOrder={2} />
    </group>
  )
}

function Colon({ x, res }: { x: number; res: Res }) {
  return (
    <group position={[x, 0, 0]}>
      {[0.8, 1.45].map(y => (
        <group key={y} position={[0, y, 0]}>
          <mesh material={res.dotMat}>
            <sphereGeometry args={[0.045, 16, 16]} />
          </mesh>
          <sprite material={res.dotGlow} scale={[0.42, 0.42, 1]} />
        </group>
      ))}
    </group>
  )
}

/* ---------------- light rig: what the glass reflects ---------------- */

function Rig({ res }: { res: Res }) {
  useFrame(({ clock, scene }) => {
    const t = clock.elapsedTime
    // a slow sway, not a spin: the rims stay on the edges and slide a little, the film colours shift.
    // The room is drawn into the environment map once; only its rotation moves, which costs nothing per frame.
    scene.environmentRotation.y = 0.32 * Math.sin(t * 0.22) + 0.12 * Math.sin(t * 0.53)
    // the LED drifts blue-violet -> violet -> a touch of magenta and back, as in the references; never cyan
    const hue = 0.655 + 0.028 * Math.sin(t * 0.31) + 0.008 * Math.sin(t * 0.9)
    res.ledColor.setHSL(hue, 0.95, 0.55)
    res.ledMat.color.copy(res.ledColor)
    res.hazeMat.color.copy(res.ledColor)
    res.floorMat.color.copy(res.ledColor)
    res.catchMat.uniforms.uColor!.value.copy(res.ledColor)
    res.catchMat.uniforms.uTime!.value = t
    res.anodeMat.uniforms.uColor!.value.copy(res.ledColor)
  })
  return (
    <>
      <ambientLight intensity={0.15} />
      <Environment frames={1} resolution={256}>
        <group>
          {/* tall soft strips far left and right: the bright rims down the glass edges */}
          <Lightformer color="#ffffff" form="rect" intensity={4} position={[-7, 1, 1.5]} rotation-y={Math.PI / 2.4} scale={[1.2, 9, 1]} />
          <Lightformer color="#dfe5ff" form="rect" intensity={2.2} position={[7, 1, 1.5]} rotation-y={-Math.PI / 2.4} scale={[0.9, 9, 1]} />
          {/* a broad faint panel in front: the body catches its iridescent film */}
          <Lightformer color="#c9b8ff" form="rect" intensity={0.35} position={[-4.5, 2.5, 5.5]} rotation-y={-0.6} scale={[3, 5, 1]} />
          {/* cold glass light above and a magenta edge, the warm room behind */}
          <Lightformer color="#4a4cff" form="rect" intensity={2.2} position={[3, 5, -2]} rotation-x={Math.PI / 2} scale={[5, 3, 1]} />
          <Lightformer color="#a24cff" form="rect" intensity={0.7} position={[-4, 3, -3]} scale={[2, 3, 1]} />
          <Lightformer color="#3d5cff" form="rect" intensity={3} position={[0, -3, 2]} rotation-x={-Math.PI / 2} scale={[6, 3, 1]} />
          <Lightformer color="#ffb44d" form="rect" intensity={1.2} position={[0, 1.2, -6]} scale={[5, 2, 1]} />
        </group>
      </Environment>
    </>
  )
}

/* ---------------- resources and the row ---------------- */

type Res = ReturnType<typeof makeRes>

function makeRes() {
  const ledColor = new THREE.Color('#3a5cff')
  return {
    ledColor,
    wireColor: new THREE.Color(GOLD_HOT),
    glass: glassGeometry(),
    // glass on a dark page: only what it reflects shows, added on top (fresnel rims, iridescent films, the rig)
    glassMat: new THREE.MeshPhysicalMaterial({
      color: '#000000',
      metalness: 0,
      roughness: 0.04,
      iridescence: 1,
      iridescenceIOR: 1.32,
      iridescenceThicknessRange: [180, 820],
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 3.2,
      specularIntensity: 1,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    }),
    // the far wall of the glass, seen through the near one: weaker, it carries the warm room behind
    glassBackMat: new THREE.MeshPhysicalMaterial({
      color: '#000000',
      roughness: 0.08,
      iridescence: 0.6,
      iridescenceThicknessRange: [180, 820],
      envMapIntensity: 0.9,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    }),
    anode: new THREE.CylinderGeometry(0.4, 0.4, 1.55, 64, 1, true, Math.PI),
    anodeMat: anodeMaterial(ledColor),
    ghostMat: new THREE.MeshStandardMaterial({ color: '#2e2a26', emissive: '#2a221d', metalness: 0.9, roughness: 0.4 }),
    base: new THREE.CylinderGeometry(0.52, 0.5, 0.14, 64),
    baseMat: new THREE.MeshStandardMaterial({ color: '#0e0d12', metalness: 0.6, roughness: 0.5 }),
    ledMat: new THREE.SpriteMaterial({ map: radialTexture([[0, 'rgba(255,255,255,1)'], [0.12, 'rgba(215,226,255,.95)'], [0.4, 'rgba(130,155,255,.45)'], [1, 'rgba(90,120,255,0)']]), color: ledColor, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }),
    // a tall soft haze: the light filling the glass volume, fading upwards
    hazeMat: new THREE.SpriteMaterial({ map: hazeTexture(), color: ledColor, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.9 }),
    catchMat: catchMaterial(ledColor),
    floorMat: new THREE.SpriteMaterial({ map: radialTexture([[0, 'rgba(120,150,255,.8)'], [0.5, 'rgba(70,90,255,.25)'], [1, 'rgba(40,60,255,0)']]), color: ledColor, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 }),
    dotMat: new THREE.MeshBasicMaterial({ color: new THREE.Color(GOLD_HOT).multiplyScalar(1.5), toneMapped: false }),
    dotGlow: new THREE.SpriteMaterial({ map: radialTexture([[0, 'rgba(255,214,150,.9)'], [0.35, 'rgba(255,170,70,.35)'], [1, 'rgba(255,150,50,0)']]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }),
  }
}

export default function NixieScene({ text, h }: { text: string; h: number }) {
  const res = useMemo(makeRes, [])
  const chars = [...text]
  const widths = chars.map(c => (c === ':' ? COLON : SPACING))
  const total = widths.reduce((a, b) => a + b, 0)
  let acc = -total / 2
  const xs = widths.map(w => {
    const x = acc + w / 2
    acc += w
    return x
  })
  const wPx = Math.round((total / VIEW_H) * h)
  const fov = 14
  const dist = VIEW_H / 2 / Math.tan(((fov / 2) * Math.PI) / 180)
  return (
    <div style={{ width: wPx, height: h }}>
      <Canvas
        camera={{ fov, position: [0, 0, dist], near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05, powerPreference: 'high-performance' }}
        style={{ width: wPx, height: h }}
      >
        <Rig res={res} />
        <group position-y={-TUBE_H / 2 + 0.12}>
        {chars.map((c, i) => (c === ':' ? <Colon key={i} res={res} x={xs[i]!} /> : <Tube ch={c} key={i} res={res} x={xs[i]!} />))}
        </group>
      </Canvas>
    </div>
  )
}
