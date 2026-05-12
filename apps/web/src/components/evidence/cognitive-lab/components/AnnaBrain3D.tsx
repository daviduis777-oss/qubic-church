'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, PerspectiveCamera, Sparkles, Html } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { Play, Pause, Activity } from 'lucide-react'
import { signWeights } from '@/lib/ait'
import { mulberry32 } from '../evolution/rng'
import { cn } from '@/lib/utils'

export interface AnnaBrain3DProps {
  annaMatrix: Int8Array
  /** Live-evolved best matrix from current worker run; updates per generation. */
  evolvedMatrix?: Int8Array | null
  /** Current generation number (for HUD). */
  generation?: number
  /** Whether evolution is actively running (auto-switches HUD into "live" mode). */
  isEvolutionRunning?: boolean
  className?: string
}

const N_NEURONS = 128
const N_INPUTS = 64
const SPHERE_RADIUS = 5

// Color palette
const COLOR_NEG = new THREE.Color('#3B82F6')   // blue: activation -1
const COLOR_REST = new THREE.Color('#1f2937')  // dark slate: 0
const COLOR_POS = new THREE.Color('#FBBF24')   // gold: +1
const COLOR_INPUT_REST = new THREE.Color('#475569') // slate for inputs at rest

interface NeuronLayout {
  position: THREE.Vector3
  type: 'input' | 'output'
  index: number
  globalIdx: number
}

/**
 * Fibonacci sphere with 128 points. First 64 placed in lower hemisphere (z<0)
 * = input neurons. Last 64 in upper hemisphere = output neurons. This gives
 * an organic asymmetric brain-like layout where synapses cut through the volume.
 */
function computeLayout(): NeuronLayout[] {
  const layout: NeuronLayout[] = []
  const phi = Math.PI * (3 - Math.sqrt(5)) // golden angle
  // Bottom hemisphere = input (i = 0..63 → y from -1 to 0)
  for (let i = 0; i < N_INPUTS; i++) {
    const t = i / N_INPUTS
    const y = -1 + t * 0.95 // -1 .. -0.05
    const r = Math.sqrt(1 - y * y)
    const theta = phi * i
    layout.push({
      position: new THREE.Vector3(r * Math.cos(theta) * SPHERE_RADIUS, y * SPHERE_RADIUS, r * Math.sin(theta) * SPHERE_RADIUS),
      type: 'input',
      index: i,
      globalIdx: i,
    })
  }
  // Top hemisphere = output (i = 64..127 → y from 0.05 to 1)
  for (let i = 0; i < N_INPUTS; i++) {
    const t = i / N_INPUTS
    const y = 0.05 + t * 0.95
    const r = Math.sqrt(1 - y * y)
    const theta = phi * (i + N_INPUTS) + 1.7
    layout.push({
      position: new THREE.Vector3(r * Math.cos(theta) * SPHERE_RADIUS, y * SPHERE_RADIUS, r * Math.sin(theta) * SPHERE_RADIUS),
      type: 'output',
      index: i,
      globalIdx: N_INPUTS + i,
    })
  }
  return layout
}

interface EdgeData {
  src: number
  dst: number
  sign: number
  magnitude: number
}

function computeTopEdges(matrix: Int8Array, k: number): EdgeData[] {
  const edges: EdgeData[] = []
  for (let r = 0; r < N_NEURONS; r++) {
    for (let c = 0; c < N_NEURONS; c++) {
      const v = matrix[r * N_NEURONS + c]!
      if (v === 0) continue
      edges.push({ src: c, dst: r, sign: v > 0 ? 1 : -1, magnitude: Math.abs(v) })
    }
  }
  edges.sort((a, b) => b.magnitude - a.magnitude)
  return edges.slice(0, k)
}

/** Manual AIT step on int8 sign-only matrix. Returns the next state vector. */
function aitStep(W: Int8Array, state: Int8Array, input: Int8Array): Int8Array {
  const next = new Int8Array(N_NEURONS)
  for (let i = 0; i < N_NEURONS; i++) {
    let dot = 0
    const rowBase = i * N_NEURONS
    for (let j = 0; j < N_NEURONS; j++) dot += W[rowBase + j]! * state[j]!
    next[i] = dot > 0 ? 1 : dot < 0 ? -1 : 0
  }
  // Input clamp
  for (let i = 0; i < N_INPUTS; i++) next[i] = input[i]!
  return next
}

/** Run full AIT to convergence (or 20 ticks max), recording every intermediate state. */
function aitTrajectory(W: Int8Array, input: Int8Array): Int8Array[] {
  const trajectory: Int8Array[] = []
  let state: Int8Array = new Int8Array(N_NEURONS)
  for (let i = 0; i < N_INPUTS; i++) state[i] = input[i]!
  trajectory.push(new Int8Array(state))
  for (let t = 0; t < 20; t++) {
    const next: Int8Array = aitStep(W, state, input)
    trajectory.push(new Int8Array(next))
    let allOutNonzero = true
    let unchanged = true
    for (let i = 0; i < N_NEURONS; i++) {
      if (next[i] !== state[i]) unchanged = false
      if (i >= N_INPUTS && next[i] === 0) allOutNonzero = false
    }
    state = next
    if (allOutNonzero || unchanged) break
  }
  return trajectory
}

export function AnnaBrain3D({
  annaMatrix,
  evolvedMatrix,
  generation = 0,
  isEvolutionRunning = false,
  className,
}: AnnaBrain3DProps) {
  const [running, setRunning] = useState(true)
  const [mode, setMode] = useState<'anna' | 'evolved'>('anna')
  const [tickInfo, setTickInfo] = useState({ tick: 0, totalTicks: 0, cycle: 0 })

  // Auto-switch to evolved mode the first time evolvedMatrix arrives during a run
  useEffect(() => {
    if (isEvolutionRunning && evolvedMatrix && mode === 'anna') {
      setMode('evolved')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEvolutionRunning, evolvedMatrix])

  const matrix = mode === 'evolved' && evolvedMatrix ? evolvedMatrix : annaMatrix
  const matrixLabel =
    mode === 'evolved' && evolvedMatrix
      ? `evolved · gen ${generation}`
      : 'Anna · reference'

  const layout = useMemo(() => computeLayout(), [])
  const signedW = useMemo(() => signWeights(matrix), [matrix])
  const edges = useMemo(() => computeTopEdges(matrix, 1200), [matrix])

  return (
    <div className={cn('relative w-full', className)} style={{ height: 560 }}>
      {/* HUD top-left */}
      <div className="absolute top-3 left-4 z-10 pointer-events-none">
        <div className={cn(
          'text-[10px] uppercase tracking-[0.2em] font-mono',
          mode === 'evolved' ? 'text-emerald-400/85' : 'text-[#D4AF37]/85',
        )}>
          {mode === 'evolved' ? 'Evolved Matrix · Live Inference' : 'Anna Brain · Live Inference'}
        </div>
        <div className="text-[10px] text-white/45 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
          <span>{N_NEURONS} neurons</span>
          <span>·</span>
          <span>{edges.length} synapses</span>
          <span>·</span>
          <span className={mode === 'evolved' ? 'text-emerald-400' : 'text-[#D4AF37]'}>
            {matrixLabel}
          </span>
          {isEvolutionRunning && mode === 'evolved' && (
            <span className="text-emerald-300/80 ml-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              live morphing
            </span>
          )}
        </div>
        <div className="text-[10px] text-cyan-300/80 font-mono mt-1 flex items-center gap-1">
          <Activity className="w-3 h-3" />
          tick {tickInfo.tick} / {tickInfo.totalTicks} · thought #{tickInfo.cycle}
        </div>
      </div>

      {/* HUD top-right */}
      <div className="absolute top-3 right-4 z-10 flex gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="flex items-center gap-1 px-2.5 py-1 bg-black/60 backdrop-blur-sm border border-white/15 hover:bg-white/5 text-[10px] text-white/85 font-mono"
        >
          {running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          {running ? 'pause' : 'play'}
        </button>
        {/* Mode toggle: Anna ↔ Evolved */}
        <div className="flex bg-black/60 backdrop-blur-sm border border-white/15">
          <button
            type="button"
            onClick={() => setMode('anna')}
            className={cn(
              'px-2.5 py-1 text-[10px] font-mono transition-colors',
              mode === 'anna'
                ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                : 'text-white/55 hover:text-white/85',
            )}
          >
            Anna
          </button>
          <button
            type="button"
            onClick={() => setMode('evolved')}
            disabled={!evolvedMatrix}
            className={cn(
              'px-2.5 py-1 text-[10px] font-mono transition-colors border-l border-white/15',
              mode === 'evolved' && evolvedMatrix
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'text-white/40 hover:text-white/70',
              !evolvedMatrix && 'opacity-50 cursor-not-allowed',
            )}
          >
            Evolved {evolvedMatrix ? `· gen ${generation}` : '(run first)'}
          </button>
        </div>
      </div>

      <Canvas
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        dpr={[1, 2]}
        style={{ background: '#020203' }}
      >
        <PerspectiveCamera makeDefault position={[11, 5, 11]} fov={48} />
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          autoRotate
          autoRotateSpeed={0.45}
          minDistance={8}
          maxDistance={28}
        />
        <ambientLight intensity={0.22} />
        <pointLight position={[12, 12, 12]} intensity={0.8} color="#D4AF37" />
        <pointLight position={[-12, -8, -12]} intensity={0.55} color="#3B82F6" />

        <Suspense fallback={null}>
          <Stars radius={140} depth={70} count={3500} factor={3.5} saturation={0.15} fade speed={0.18} />
          <Sparkles count={150} scale={22} size={1.6} speed={0.3} opacity={0.22} color="#D4AF37" />

          <BrainCore layout={layout} edges={edges} signedW={signedW} running={running} onTickInfo={setTickInfo} />

          <EffectComposer>
            <Bloom intensity={1.4} luminanceThreshold={0.25} luminanceSmoothing={0.7} mipmapBlur />
            <Vignette eskil={false} offset={0.2} darkness={0.78} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* Bottom legend */}
      <div className="absolute bottom-3 left-4 right-4 z-10 pointer-events-none flex justify-between items-end text-[10px] font-mono">
        <div className="flex flex-col gap-0.5">
          <div className="flex gap-3 text-white/65">
            <span><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1 align-middle" /> activation −1</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-slate-500 mr-1 align-middle" /> resting</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1 align-middle" /> activation +1</span>
          </div>
          <div className="text-white/40 text-[9px]">
            input neurons fill bottom hemisphere · output neurons fill top
          </div>
        </div>
        <div className="text-[#D4AF37]/65 text-right">
          <div>Anna processes 64 random bits per &quot;thought&quot;</div>
          <div className="text-white/40">~3-5 ticks · ~12s real-time per cycle</div>
        </div>
      </div>
    </div>
  )
}

interface BrainCoreProps {
  layout: NeuronLayout[]
  edges: EdgeData[]
  signedW: Int8Array
  running: boolean
  onTickInfo: (info: { tick: number; totalTicks: number; cycle: number }) => void
}

const TICK_DURATION_S = 0.9 // seconds between AIT ticks (longer = visitor sees the change)
const REST_AFTER_TRAJ_S = 1.6 // pause after trajectory completes before sampling new input

function BrainCore({ layout, edges, signedW, running, onTickInfo }: BrainCoreProps) {
  // Real AIT trajectory
  const trajectoryRef = useRef<Int8Array[]>([])
  const trajectoryIdxRef = useRef(0)
  const tickClockRef = useRef(0)
  const cycleCountRef = useRef(0)
  const restingRef = useRef(false)
  const restClockRef = useRef(0)
  const rngRef = useRef<() => number>(mulberry32(Date.now() & 0xffff))

  // Smooth current/target state
  const stateRef = useRef<Float32Array>(new Float32Array(N_NEURONS))
  const targetStateRef = useRef<Int8Array>(new Int8Array(N_NEURONS))

  const sampleNewInput = (): void => {
    const u = new Int8Array(N_INPUTS)
    for (let i = 0; i < N_INPUTS; i++) u[i] = rngRef.current() < 0.5 ? -1 : 1
    trajectoryRef.current = aitTrajectory(signedW, u)
    trajectoryIdxRef.current = 0
    targetStateRef.current = trajectoryRef.current[0]!
    cycleCountRef.current++
    tickClockRef.current = 0
    restingRef.current = false
  }

  // Initialize once per signedW change
  useEffect(() => {
    cycleCountRef.current = 0
    sampleNewInput()
    onTickInfo({ tick: 0, totalTicks: trajectoryRef.current.length - 1, cycle: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedW])

  useFrame((_, dt) => {
    if (!running) return

    if (restingRef.current) {
      restClockRef.current += dt
      if (restClockRef.current >= REST_AFTER_TRAJ_S) {
        restingRef.current = false
        restClockRef.current = 0
        sampleNewInput()
        onTickInfo({
          tick: 0,
          totalTicks: trajectoryRef.current.length - 1,
          cycle: cycleCountRef.current,
        })
      }
    } else {
      tickClockRef.current += dt
      if (tickClockRef.current >= TICK_DURATION_S) {
        tickClockRef.current = 0
        if (trajectoryIdxRef.current < trajectoryRef.current.length - 1) {
          trajectoryIdxRef.current++
          targetStateRef.current = trajectoryRef.current[trajectoryIdxRef.current]!
          onTickInfo({
            tick: trajectoryIdxRef.current,
            totalTicks: trajectoryRef.current.length - 1,
            cycle: cycleCountRef.current,
          })
        } else {
          restingRef.current = true
          restClockRef.current = 0
        }
      }
    }

    // Smooth-lerp current state toward target
    const cur = stateRef.current
    const target = targetStateRef.current
    const speed = Math.min(1, dt * 6)
    for (let i = 0; i < N_NEURONS; i++) {
      cur[i] = (cur[i] ?? 0) + ((target[i] ?? 0) - (cur[i] ?? 0)) * speed
    }
  })

  return (
    <group>
      <Synapses edges={edges} layout={layout} stateRef={stateRef} />
      {layout.map((l) => (
        <Neuron key={`${l.type}-${l.index}`} layout={l} stateRef={stateRef} />
      ))}
    </group>
  )
}

function Neuron({
  layout,
  stateRef,
}: {
  layout: NeuronLayout
  stateRef: React.MutableRefObject<Float32Array>
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const haloMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const tmpColor = useMemo(() => new THREE.Color(), [])
  const tmpScale = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    const mat = matRef.current
    const mesh = meshRef.current
    const halo = haloRef.current
    const haloMat = haloMatRef.current
    if (!mat || !mesh) return
    const v = stateRef.current[layout.globalIdx] ?? 0
    const absV = Math.abs(v)
    const isInput = layout.type === 'input'

    // Color blend
    if (v > 0.05) {
      tmpColor.copy(COLOR_REST).lerp(COLOR_POS, Math.min(1, absV))
    } else if (v < -0.05) {
      tmpColor.copy(COLOR_REST).lerp(COLOR_NEG, Math.min(1, absV))
    } else {
      tmpColor.copy(isInput ? COLOR_INPUT_REST : COLOR_REST)
    }

    mat.color.copy(tmpColor)
    mat.emissive.copy(tmpColor)
    mat.emissiveIntensity = 0.4 + absV * 2.4

    // Pulse size with activation
    const targetScale = 1 + absV * 0.55
    tmpScale.set(targetScale, targetScale, targetScale)
    mesh.scale.lerp(tmpScale, 0.18)

    // Halo
    if (halo && haloMat) {
      const haloScale = 1.5 + absV * 1.8
      halo.scale.set(haloScale, haloScale, haloScale)
      haloMat.opacity = 0.04 + absV * 0.18
      haloMat.color.copy(tmpColor)
    }
  })

  const baseSize = layout.type === 'input' ? 0.20 : 0.18

  return (
    <group position={layout.position.toArray()}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[baseSize, 18, 18]} />
        <meshStandardMaterial
          ref={matRef}
          color={COLOR_REST}
          emissive={COLOR_REST}
          emissiveIntensity={0.4}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>
      <mesh ref={haloRef}>
        <sphereGeometry args={[baseSize, 16, 16]} />
        <meshBasicMaterial ref={haloMatRef} color={COLOR_REST} transparent opacity={0.06} depthWrite={false} />
      </mesh>
    </group>
  )
}

function Synapses({
  edges,
  layout,
  stateRef,
}: {
  edges: EdgeData[]
  layout: NeuronLayout[]
  stateRef: React.MutableRefObject<Float32Array>
}) {
  const lineRef = useRef<THREE.LineSegments>(null)

  const { geometry } = useMemo(() => {
    const positions = new Float32Array(edges.length * 6)
    const colors = new Float32Array(edges.length * 6)
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i]!
      const src = layout[e.src]!.position
      const dst = layout[e.dst]!.position
      positions[i * 6] = src.x; positions[i * 6 + 1] = src.y; positions[i * 6 + 2] = src.z
      positions[i * 6 + 3] = dst.x; positions[i * 6 + 4] = dst.y; positions[i * 6 + 5] = dst.z
      // Base color: faint warm grey, more visible than before
      const base = 0.10
      colors[i * 6] = base; colors[i * 6 + 1] = base; colors[i * 6 + 2] = base * 1.3
      colors[i * 6 + 3] = base; colors[i * 6 + 4] = base; colors[i * 6 + 5] = base * 1.3
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return { geometry: geo }
  }, [edges, layout])

  useFrame(() => {
    const line = lineRef.current
    if (!line) return
    const colorAttr = line.geometry.getAttribute('color') as THREE.BufferAttribute
    const arr = colorAttr.array as Float32Array
    const state = stateRef.current
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i]!
      const srcAct = state[e.src] ?? 0
      const dstAct = state[e.dst] ?? 0
      // Synapse "fires" when src activation × sign(W) is strong (signal flowing) AND
      // dst is responding to it. Use product to detect coherent flow.
      const signedFlow = srcAct * e.sign
      const intensity = Math.abs(signedFlow) * (Math.abs(dstAct) * 0.5 + 0.5) * (e.magnitude / 96)
      const baseR = 0.10, baseG = 0.10, baseB = 0.13
      let r = baseR, g = baseG, b = baseB
      if (signedFlow > 0.1) {
        // gold flow (positive matched signal)
        const k = Math.min(1, intensity * 1.4)
        r = baseR + k * 0.95
        g = baseG + k * 0.65
        b = baseB + k * 0.10
      } else if (signedFlow < -0.1) {
        // blue flow (negative matched signal)
        const k = Math.min(1, intensity * 1.4)
        r = baseR + k * 0.10
        g = baseG + k * 0.45
        b = baseB + k * 0.95
      }
      // Slight per-synapse boost for closer-to-receiving
      arr[i * 6] = r; arr[i * 6 + 1] = g; arr[i * 6 + 2] = b
      // Receiving end slightly brighter
      const dstK = Math.min(1, Math.abs(dstAct) * 0.5)
      arr[i * 6 + 3] = r + dstK * 0.15
      arr[i * 6 + 4] = g + dstK * 0.15
      arr[i * 6 + 5] = b + dstK * 0.15
    }
    colorAttr.needsUpdate = true
  })

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial vertexColors transparent opacity={0.85} />
    </lineSegments>
  )
}
