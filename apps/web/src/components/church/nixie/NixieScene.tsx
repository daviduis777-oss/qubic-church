'use client'

/**
 * Nixie tubes in real 3D (three.js): physical glass with transmission and iridescence that catches a slowly moving
 * light rig, a gold monoline cathode with soft glow and the unlit cathodes behind it, a dark hex-mesh anode, and a
 * blue LED in the base whose hue drifts through violet. One canvas per row of tubes.
 */
import { Environment, Lightformer, Sparkles } from '@react-three/drei'
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

function digitCurves(ch: string): THREE.Curve<THREE.Vector3>[] {
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
function glowTexture(ch: string) {
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
    for (const [blur, a, w] of [[28, 0.4, 7], [12, 0.45, 3.5], [4, 0.6, 1.6]] as const) {
      g.shadowColor = `rgba(255,150,40,${a})`
      g.shadowBlur = blur
      g.strokeStyle = `rgba(255,196,107,${a})`
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
      <pointLight color={GOLD} decay={2} distance={1.6} intensity={1.6} position={[0, 1.2, 0.1]} />
      {/* blue LED in the base */}
      <sprite material={res.ledMat} position={[0, 0.2, 0.05]} scale={[1.15, 0.8, 1]} />
      <sprite material={res.floorMat} position={[0, -0.08, 0.25]} scale={[1.5, 0.3, 1]} />
      <Sparkles color="#d6e4ff" count={14} noise={0.4} opacity={0.9} position={[0, 0.22, 0]} scale={[0.75, 0.22, 0.75]} size={2.2} speed={0.25} />
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
  const g = useRef<THREE.Group>(null)
  const led = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // a slow sway, not a spin: the rims stay on the edges and slide a little, the film colours shift
    if (g.current) g.current.rotation.y = 0.32 * Math.sin(t * 0.22) + 0.12 * Math.sin(t * 0.53)
    // the LED drifts blue -> violet -> blue
    const hue = 0.62 + 0.07 * Math.sin(t * 0.35)
    res.ledColor.setHSL(hue, 0.95, 0.55)
    res.ledMat.color.copy(res.ledColor)
    res.floorMat.color.copy(res.ledColor)
    if (led.current) led.current.color.copy(res.ledColor)
  })
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight color="#4a6bff" decay={2} distance={3} intensity={4} position={[0, 0.2, 0.6]} ref={led} />
      <Environment frames={Infinity} resolution={128}>
        <group ref={g}>
          {/* tall soft strips far left and right: the bright rims down the glass edges */}
          <Lightformer color="#ffffff" form="rect" intensity={4} position={[-7, 1, 1.5]} rotation-y={Math.PI / 2.4} scale={[1.2, 9, 1]} />
          <Lightformer color="#dfe5ff" form="rect" intensity={2.2} position={[7, 1, 1.5]} rotation-y={-Math.PI / 2.4} scale={[0.9, 9, 1]} />
          {/* a broad faint panel in front: the body catches its iridescent film */}
          <Lightformer color="#c9b8ff" form="rect" intensity={0.35} position={[-4.5, 2.5, 5.5]} rotation-y={-0.6} scale={[3, 5, 1]} />
          {/* cold glass light above and a magenta edge, the warm room behind */}
          <Lightformer color="#5a3bff" form="rect" intensity={2.2} position={[3, 5, -2]} rotation-x={Math.PI / 2} scale={[5, 3, 1]} />
          <Lightformer color="#ff4fd8" form="rect" intensity={1.1} position={[-4, 3, -3]} scale={[2, 3, 1]} />
          <Lightformer color="#3b74ff" form="rect" intensity={3} position={[0, -3, 2]} rotation-x={-Math.PI / 2} scale={[6, 3, 1]} />
          <Lightformer color="#ffb44d" form="rect" intensity={1.2} position={[0, 1.2, -6]} scale={[5, 2, 1]} />
        </group>
      </Environment>
    </>
  )
}

/* ---------------- resources and the row ---------------- */

type Res = ReturnType<typeof makeRes>

function makeRes() {
  const ledColor = new THREE.Color('#3b6bff')
  return {
    ledColor,
    wireColor: new THREE.Color(GOLD).multiplyScalar(1.0),
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
    anodeMat: new THREE.MeshStandardMaterial({ color: '#3a3b46', metalness: 0.8, roughness: 0.4, alphaMap: hexTexture(), transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide }),
    ghostMat: new THREE.MeshStandardMaterial({ color: '#2e2a26', metalness: 0.9, roughness: 0.4 }),
    base: new THREE.CylinderGeometry(0.52, 0.5, 0.14, 64),
    baseMat: new THREE.MeshStandardMaterial({ color: '#0e0d12', metalness: 0.6, roughness: 0.5 }),
    ledMat: new THREE.SpriteMaterial({ map: radialTexture([[0, 'rgba(235,242,255,1)'], [0.18, 'rgba(120,160,255,.9)'], [0.5, 'rgba(60,90,255,.35)'], [1, 'rgba(40,60,255,0)']]), color: ledColor, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }),
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
        {chars.map((c, i) => (c === ':' ? <Colon key={i} res={res} x={xs[i]!} /> : <Tube ch={c} key={`${i}-${c}`} res={res} x={xs[i]!} />))}
        </group>
      </Canvas>
    </div>
  )
}
