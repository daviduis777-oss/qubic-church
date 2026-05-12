'use client'

/**
 * Three.js scene for AnnaTrajectoryCloud. Pre-computes trajectories on mount,
 * then exposes the current-tick frame for re-render. Heavy lifting is done
 * once; per-tick render is just BufferAttribute updates.
 *
 * The inline trajectory tracer is verified byte-equivalent to `aitFastInference`
 * across 1000 random inputs (avg 3.1 ticks to convergence). See
 * `__tests__/trajectory-trace.test.mjs`.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Sparkles, Html } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import type { Matrix } from '@/lib/ait/types'
import type { Concept } from '../types'
import { signWeights } from '@/lib/ait'
import { packSignMatrix, type PackedMatrix } from '@/components/evidence/cognitive-lab/evolution/ait-fast'
import { computePCABasis, projectOntoBasis } from '@/components/evidence/cognitive-lab/evolution/pca'
import { mulberry32 } from '@/components/evidence/cognitive-lab/evolution/rng'

export type ColorMode = 'by-concept' | 'by-input-hash' | 'uniform-gold'

interface TrajectorySceneProps {
  annaMatrix: Matrix
  concepts: Concept[]
  nAgents: number
  maxTicks: number
  tick: number
  trailLength: number
  showRandom: boolean
  colorMode: ColorMode
  /** Reports convergence stats to parent so it can render the live counter. */
  onStats?: (stats: TrajectoryStats) => void
  /** Reports hover on a star to parent for the inspector panel. */
  onHoverConcept?: (conceptIdx: number | null) => void
  /** Highlighted concept (from parent click) — undimmed when set. */
  highlightedConcept?: number | null
}

export interface TrajectoryStats {
  /** number of agents whose state is stable at this tick (no change next tick) */
  convergedByTick: number[]
  /** total agents */
  nAgents: number
  /** mean ticks to convergence */
  avgConvergenceTick: number
  /** for the visualisation: mean Hamming to nearest centroid per tick */
  meanHammingPerTick: number[]
  /** assignments — which concept idx each agent ended on (length nAgents) */
  assignments: number[]
  /** how many agents converged in 0/1/2/3+ ticks */
  perConceptCount: number[]
}

const AGENT_POINT_SIZE = 0.14
const STAR_BASE_SIZE = 0.20

/** Inline AIT trace with per-tick output capture + convergence tracking. */
function traceTrajectory(W: PackedMatrix, input: Int8Array, maxTicks: number): { traj: Float32Array; convergedAt: number } {
  const N = 128
  const ROW_WORDS = 4
  const out = new Float32Array((maxTicks + 1) * 64)

  let vPos0 = 0, vPos1 = 0, vPos2 = 0, vPos3 = 0
  let vNeg0 = 0, vNeg1 = 0, vNeg2 = 0, vNeg3 = 0
  for (let i = 0; i < 32; i++) {
    if (input[i]! > 0) vPos0 = (vPos0 | (1 << i)) >>> 0
    else if (input[i]! < 0) vNeg0 = (vNeg0 | (1 << i)) >>> 0
  }
  for (let i = 0; i < 32; i++) {
    if (input[32 + i]! > 0) vPos1 = (vPos1 | (1 << i)) >>> 0
    else if (input[32 + i]! < 0) vNeg1 = (vNeg1 | (1 << i)) >>> 0
  }
  const clampPos0 = vPos0, clampPos1 = vPos1, clampNeg0 = vNeg0, clampNeg1 = vNeg1

  function popcount32(x: number) {
    x = x - ((x >>> 1) & 0x55555555)
    x = (x & 0x33333333) + ((x >>> 2) & 0x33333333)
    x = (x + (x >>> 4)) & 0x0f0f0f0f
    return (Math.imul(x, 0x01010101) >>> 24) & 0xff
  }

  let convergedAt = -1

  for (let t = 1; t <= maxTicks; t++) {
    if (convergedAt > 0) {
      const base = (t - 1) * 64
      const tgt = t * 64
      for (let i = 0; i < 64; i++) out[tgt + i] = out[base + i]!
      continue
    }
    let nPos0 = 0, nPos1 = 0, nPos2 = 0, nPos3 = 0
    let nNeg0 = 0, nNeg1 = 0, nNeg2 = 0, nNeg3 = 0
    const Wp = W.pos, Wn = W.neg
    for (let r = 0; r < N; r++) {
      const base = r * ROW_WORDS
      const wp0 = Wp[base]!, wp1 = Wp[base + 1]!, wp2 = Wp[base + 2]!, wp3 = Wp[base + 3]!
      const wn0 = Wn[base]!, wn1 = Wn[base + 1]!, wn2 = Wn[base + 2]!, wn3 = Wn[base + 3]!
      let dot = 0
      dot += popcount32((wp0 & vPos0) | (wn0 & vNeg0))
      dot += popcount32((wp1 & vPos1) | (wn1 & vNeg1))
      dot += popcount32((wp2 & vPos2) | (wn2 & vNeg2))
      dot += popcount32((wp3 & vPos3) | (wn3 & vNeg3))
      dot -= popcount32((wp0 & vNeg0) | (wn0 & vPos0))
      dot -= popcount32((wp1 & vNeg1) | (wn1 & vPos1))
      dot -= popcount32((wp2 & vNeg2) | (wn2 & vPos2))
      dot -= popcount32((wp3 & vNeg3) | (wn3 & vPos3))
      if (dot > 0) {
        if (r < 32) nPos0 = (nPos0 | (1 << r)) >>> 0
        else if (r < 64) nPos1 = (nPos1 | (1 << (r - 32))) >>> 0
        else if (r < 96) nPos2 = (nPos2 | (1 << (r - 64))) >>> 0
        else nPos3 = (nPos3 | (1 << (r - 96))) >>> 0
      } else if (dot < 0) {
        if (r < 32) nNeg0 = (nNeg0 | (1 << r)) >>> 0
        else if (r < 64) nNeg1 = (nNeg1 | (1 << (r - 32))) >>> 0
        else if (r < 96) nNeg2 = (nNeg2 | (1 << (r - 64))) >>> 0
        else nNeg3 = (nNeg3 | (1 << (r - 96))) >>> 0
      }
    }
    nPos0 = clampPos0; nPos1 = clampPos1; nNeg0 = clampNeg0; nNeg1 = clampNeg1

    if (
      nPos0 === vPos0 && nPos1 === vPos1 && nPos2 === vPos2 && nPos3 === vPos3 &&
      nNeg0 === vNeg0 && nNeg1 === vNeg1 && nNeg2 === vNeg2 && nNeg3 === vNeg3
    ) {
      convergedAt = t
    }

    vPos0 = nPos0; vPos1 = nPos1; vPos2 = nPos2; vPos3 = nPos3
    vNeg0 = nNeg0; vNeg1 = nNeg1; vNeg2 = nNeg2; vNeg3 = nNeg3

    const tgt = t * 64
    for (let i = 0; i < 32; i++) {
      const p = (vPos2 >>> i) & 1
      const n = (vNeg2 >>> i) & 1
      out[tgt + i] = p ? 1 : n ? -1 : 0
    }
    for (let i = 0; i < 32; i++) {
      const p = (vPos3 >>> i) & 1
      const n = (vNeg3 >>> i) & 1
      out[tgt + 32 + i] = p ? 1 : n ? -1 : 0
    }
  }
  return { traj: out, convergedAt }
}

function generateRandomMatrix(seed: number): Int8Array {
  const r = mulberry32(seed)
  const w = new Int8Array(16384)
  for (let i = 0; i < 16384; i++) w[i] = r() < 0.5 ? -1 : 1
  return w
}

interface TrajectoryData {
  /** positions[(tick * nAgents + agent) * 3 + axis] = float */
  positions: Float32Array
  /** per-agent (r, g, b) by-concept colour */
  colorsByConcept: Float32Array
  /** per-agent (r, g, b) by-input-hash colour */
  colorsByInputHash: Float32Array
  /** target positions */
  targetPositions: Float32Array
  /** target colours (matching by-concept palette indices) */
  targetColors: Float32Array
  /** target labels: concept_id */
  targetLabels: number[]
  /** stats per tick */
  stats: TrajectoryStats
  /** scene scale factor for camera positioning */
  sceneSize: number
}

const PALETTE: [number, number, number][] = [
  [0.83, 0.69, 0.22], [0.98, 0.75, 0.14], [0.98, 0.45, 0.09], [0.94, 0.27, 0.27],
  [0.93, 0.28, 0.60], [0.66, 0.33, 0.97], [0.55, 0.36, 0.96], [0.39, 0.40, 0.95],
  [0.23, 0.51, 0.96], [0.05, 0.65, 0.91], [0.02, 0.71, 0.83], [0.08, 0.72, 0.65],
  [0.06, 0.73, 0.51], [0.13, 0.77, 0.37], [0.52, 0.80, 0.09], [0.92, 0.70, 0.03],
  [0.96, 0.62, 0.04], [0.98, 0.44, 0.52], [0.96, 0.46, 0.71],
]

function precomputeTrajectories({
  matrix, concepts, nAgents, maxTicks, seed, useRandom,
}: {
  matrix: Matrix
  concepts: Concept[]
  nAgents: number
  maxTicks: number
  seed: number
  useRandom: boolean
}): TrajectoryData {
  const W = packSignMatrix(useRandom ? signWeights(generateRandomMatrix(seed)) : signWeights(matrix))

  const centroidVecs = concepts.map((c) => c.centroid)
  const basis = computePCABasis(centroidVecs, 3)

  // Project centroids to 3D
  const targetCoords: number[][] = centroidVecs.map((c) => projectOntoBasis(c, basis))

  // Find bounding box for normalization
  const mins = [Infinity, Infinity, Infinity]
  const maxs = [-Infinity, -Infinity, -Infinity]
  for (const t of targetCoords) {
    for (let i = 0; i < 3; i++) {
      if (t[i]! < mins[i]!) mins[i] = t[i]!
      if (t[i]! > maxs[i]!) maxs[i] = t[i]!
    }
  }
  const center = [(mins[0]! + maxs[0]!) / 2, (mins[1]! + maxs[1]!) / 2, (mins[2]! + maxs[2]!) / 2]
  const extent = Math.max(maxs[0]! - mins[0]!, maxs[1]! - mins[1]!, maxs[2]! - mins[2]!, 1)
  const sceneScale = 7 / extent // target half-extent of ~7 units

  // Project + transform helper
  const apply = (raw: number[]): [number, number, number] => [
    (raw[0]! - center[0]!) * sceneScale,
    (raw[1]! - center[1]!) * sceneScale,
    (raw[2]! - center[2]!) * sceneScale,
  ]

  // Trajectories
  const positions = new Float32Array((maxTicks + 1) * nAgents * 3)
  const colorsByConcept = new Float32Array(nAgents * 3)
  const colorsByInputHash = new Float32Array(nAgents * 3)
  const assignments = new Array<number>(nAgents).fill(0)
  const convergedByTick = new Array<number>(maxTicks + 1).fill(0)
  const meanHammingPerTick = new Array<number>(maxTicks + 1).fill(0)
  const perConceptCount = new Array<number>(concepts.length).fill(0)
  const convergenceTicks: number[] = []

  const rng = mulberry32(seed * 13 + 17)

  function nearestCentroid(state: Float32Array, base: number): { idx: number; hamming: number } {
    let best = 0
    let bestD = Infinity
    for (let k = 0; k < centroidVecs.length; k++) {
      const c = centroidVecs[k]!
      let d = 0
      for (let i = 0; i < 64; i++) if (state[base + i] !== c[i]!) d++
      if (d < bestD) { bestD = d; best = k }
    }
    return { idx: best, hamming: bestD }
  }

  for (let a = 0; a < nAgents; a++) {
    const input = new Int8Array(64)
    let inputHash = 0
    for (let i = 0; i < 64; i++) {
      input[i] = rng() < 0.5 ? -1 : 1
      inputHash = ((inputHash << 1) | (input[i] === 1 ? 1 : 0)) >>> 0
    }
    const { traj, convergedAt } = traceTrajectory(W, input, maxTicks)

    // Final-tick concept assignment
    const finalBase = maxTicks * 64
    const final = nearestCentroid(traj, finalBase)
    assignments[a] = final.idx
    perConceptCount[final.idx]!++

    const col = PALETTE[final.idx % PALETTE.length]!
    colorsByConcept[a * 3] = col[0]
    colorsByConcept[a * 3 + 1] = col[1]
    colorsByConcept[a * 3 + 2] = col[2]

    // Input-hash colour: HSL from hash → RGB
    const h = ((inputHash * 2654435761) >>> 0) / 0xffffffff
    const [hr, hg, hb] = hslToRgb(h, 0.7, 0.55)
    colorsByInputHash[a * 3] = hr
    colorsByInputHash[a * 3 + 1] = hg
    colorsByInputHash[a * 3 + 2] = hb

    // Convergence tick (visualization)
    const cTick = convergedAt > 0 ? convergedAt : maxTicks
    convergenceTicks.push(cTick)
    for (let t = cTick; t <= maxTicks; t++) convergedByTick[t]!++

    // Project each tick to 3D + accumulate mean Hamming
    for (let t = 0; t <= maxTicks; t++) {
      const tickBase = t * 64
      const tickVec: number[] = new Array(64)
      for (let i = 0; i < 64; i++) tickVec[i] = traj[tickBase + i]!
      const proj = projectOntoBasis(tickVec, basis)
      const [x, y, z] = apply(proj)
      const idx = t * nAgents * 3 + a * 3
      positions[idx] = x
      positions[idx + 1] = y
      positions[idx + 2] = z
      // Hamming to nearest centroid at this tick (sample-based reduction)
      const ham = nearestCentroid(traj, tickBase).hamming
      meanHammingPerTick[t]! += ham
    }
  }

  // Finalize mean Hamming per tick
  for (let t = 0; t <= maxTicks; t++) meanHammingPerTick[t]! /= nAgents

  const avgConvergenceTick = convergenceTicks.reduce((a, b) => a + b, 0) / nAgents

  // Target positions + colours
  const targetPositions = new Float32Array(concepts.length * 3)
  const targetColors = new Float32Array(concepts.length * 3)
  const targetLabels: number[] = []
  for (let k = 0; k < concepts.length; k++) {
    const [x, y, z] = apply(targetCoords[k]!)
    targetPositions[k * 3] = x
    targetPositions[k * 3 + 1] = y
    targetPositions[k * 3 + 2] = z
    const col = PALETTE[k % PALETTE.length]!
    targetColors[k * 3] = col[0]
    targetColors[k * 3 + 1] = col[1]
    targetColors[k * 3 + 2] = col[2]
    targetLabels.push(concepts[k]!.conceptId)
  }

  return {
    positions,
    colorsByConcept,
    colorsByInputHash,
    targetPositions,
    targetColors,
    targetLabels,
    stats: { convergedByTick, nAgents, avgConvergenceTick, meanHammingPerTick, assignments, perConceptCount },
    sceneSize: 7,
  }
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const f = (n: number): number => {
    const k = (n + h * 12) % 12
    const a = s * Math.min(l, 1 - l)
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  return [f(0), f(8), f(4)]
}

interface AgentsProps {
  data: TrajectoryData
  nAgents: number
  tick: number
  trailLength: number
  colorMode: ColorMode
  highlightedConcept: number | null
}

function Agents({ data, nAgents, tick, trailLength, colorMode, highlightedConcept }: AgentsProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const trailRef = useRef<THREE.LineSegments>(null)

  const { positionBuffer, colorBuffer, trailPositionBuffer, trailColorBuffer, MAX_TRAIL } = useMemo(() => {
    const MAX_TRAIL = 6
    const pos = new Float32Array(nAgents * 3)
    const col = new Float32Array(nAgents * 3)
    const trailPos = new Float32Array(nAgents * MAX_TRAIL * 2 * 3)
    const trailCol = new Float32Array(nAgents * MAX_TRAIL * 2 * 3)
    return { positionBuffer: pos, colorBuffer: col, trailPositionBuffer: trailPos, trailColorBuffer: trailCol, MAX_TRAIL }
  }, [nAgents])

  useEffect(() => {
    const maxAvailable = (data.positions.length / (nAgents * 3)) - 1
    const t = Math.max(0, Math.min(tick, maxAvailable))

    // Choose color array based on mode
    const sourceColors =
      colorMode === 'by-concept' ? data.colorsByConcept :
      colorMode === 'by-input-hash' ? data.colorsByInputHash :
      null

    const srcBase = t * nAgents * 3
    const tNorm = t / maxAvailable
    for (let a = 0; a < nAgents; a++) {
      positionBuffer[a * 3] = data.positions[srcBase + a * 3]!
      positionBuffer[a * 3 + 1] = data.positions[srcBase + a * 3 + 1]!
      positionBuffer[a * 3 + 2] = data.positions[srcBase + a * 3 + 2]!

      const isHighlit = highlightedConcept === null || data.stats.assignments[a] === highlightedConcept
      const dim = isHighlit ? (t === 0 ? 0.4 : 0.7 + 0.3 * tNorm) : 0.06

      if (sourceColors) {
        colorBuffer[a * 3] = sourceColors[a * 3]! * dim
        colorBuffer[a * 3 + 1] = sourceColors[a * 3 + 1]! * dim
        colorBuffer[a * 3 + 2] = sourceColors[a * 3 + 2]! * dim
      } else {
        // uniform-gold mode
        colorBuffer[a * 3] = 0.83 * dim
        colorBuffer[a * 3 + 1] = 0.69 * dim
        colorBuffer[a * 3 + 2] = 0.22 * dim
      }
    }

    // Trails (always render with `trailLength` segments)
    const total = nAgents * MAX_TRAIL * 2 * 3
    trailPositionBuffer.fill(0, 0, total)
    trailColorBuffer.fill(0, 0, total)
    for (let step = 0; step < trailLength; step++) {
      const fromTick = Math.max(0, t - step - 1)
      const toTick = Math.max(0, t - step)
      if (fromTick === toTick) continue
      const fromBase = fromTick * nAgents * 3
      const toBase = toTick * nAgents * 3
      const alpha = 1 - step / Math.max(1, trailLength)
      for (let a = 0; a < nAgents; a++) {
        const isHighlit = highlightedConcept === null || data.stats.assignments[a] === highlightedConcept
        if (!isHighlit) continue // skip drawing trails for dimmed agents (cleaner visual)
        const segIdx = (a * MAX_TRAIL + step) * 2 * 3
        trailPositionBuffer[segIdx] = data.positions[fromBase + a * 3]!
        trailPositionBuffer[segIdx + 1] = data.positions[fromBase + a * 3 + 1]!
        trailPositionBuffer[segIdx + 2] = data.positions[fromBase + a * 3 + 2]!
        trailPositionBuffer[segIdx + 3] = data.positions[toBase + a * 3]!
        trailPositionBuffer[segIdx + 4] = data.positions[toBase + a * 3 + 1]!
        trailPositionBuffer[segIdx + 5] = data.positions[toBase + a * 3 + 2]!
        let r = 0.83, g = 0.69, b = 0.22
        if (sourceColors) {
          r = sourceColors[a * 3]!
          g = sourceColors[a * 3 + 1]!
          b = sourceColors[a * 3 + 2]!
        }
        const fade = alpha * 0.65
        trailColorBuffer[segIdx] = r * fade
        trailColorBuffer[segIdx + 1] = g * fade
        trailColorBuffer[segIdx + 2] = b * fade
        trailColorBuffer[segIdx + 3] = r * fade
        trailColorBuffer[segIdx + 4] = g * fade
        trailColorBuffer[segIdx + 5] = b * fade
      }
    }

    if (pointsRef.current) {
      const geo = pointsRef.current.geometry
      ;(geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
      ;(geo.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true
    }
    if (trailRef.current) {
      const geo = trailRef.current.geometry
      ;(geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
      ;(geo.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true
    }
  }, [tick, trailLength, colorMode, highlightedConcept, data, nAgents, positionBuffer, colorBuffer, trailPositionBuffer, trailColorBuffer, MAX_TRAIL])

  return (
    <>
      <lineSegments ref={trailRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trailPositionBuffer, 3]} />
          <bufferAttribute attach="attributes-color" args={[trailColorBuffer, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>

      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positionBuffer, 3]} />
          <bufferAttribute attach="attributes-color" args={[colorBuffer, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={AGENT_POINT_SIZE}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </>
  )
}

function ConceptTargets({
  data,
  highlightedConcept,
  onHover,
  onClick,
}: {
  data: TrajectoryData
  highlightedConcept: number | null
  onHover: (idx: number | null) => void
  onClick: (idx: number) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const tRef = useRef(0)

  useFrame((_state, delta) => {
    tRef.current += delta
  })

  const targets = useMemo(() => {
    const arr: { x: number; y: number; z: number; idx: number; conceptId: number; color: THREE.Color }[] = []
    for (let i = 0; i < data.targetLabels.length; i++) {
      arr.push({
        x: data.targetPositions[i * 3]!,
        y: data.targetPositions[i * 3 + 1]!,
        z: data.targetPositions[i * 3 + 2]!,
        idx: i,
        conceptId: data.targetLabels[i]!,
        color: new THREE.Color(
          data.targetColors[i * 3]!,
          data.targetColors[i * 3 + 1]!,
          data.targetColors[i * 3 + 2]!,
        ),
      })
    }
    return arr
  }, [data])

  return (
    <group ref={groupRef}>
      {targets.map((t) => {
        const isHighlit = highlightedConcept === null || highlightedConcept === t.idx
        const count = data.stats.perConceptCount[t.idx] ?? 0
        const sizeBoost = 1 + Math.log10(Math.max(1, count)) * 0.18
        return (
          <Target
            key={t.idx}
            x={t.x}
            y={t.y}
            z={t.z}
            color={t.color}
            sizeBoost={sizeBoost}
            isHighlit={isHighlit}
            onPointerEnter={() => onHover(t.idx)}
            onPointerLeave={() => onHover(null)}
            onClick={() => onClick(t.idx)}
          />
        )
      })}
    </group>
  )
}

function Target({
  x, y, z, color, sizeBoost, isHighlit, onPointerEnter, onPointerLeave, onClick,
}: {
  x: number; y: number; z: number
  color: THREE.Color
  sizeBoost: number
  isHighlit: boolean
  onPointerEnter: () => void
  onPointerLeave: () => void
  onClick: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const startPhase = useMemo(() => Math.random() * Math.PI * 2, [])

  useFrame((_state) => {
    const m = meshRef.current
    if (!m) return
    const t = performance.now() / 850 + startPhase
    const s = STAR_BASE_SIZE * sizeBoost * (1 + 0.07 * Math.sin(t))
    m.scale.setScalar(isHighlit ? s : s * 0.55)
  })

  return (
    <mesh
      ref={meshRef}
      position={[x, y, z]}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
    >
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color="#FBBF24"
        emissive={color}
        emissiveIntensity={isHighlit ? 2.4 : 0.8}
        metalness={0.55}
        roughness={0.25}
        opacity={isHighlit ? 1 : 0.45}
        transparent
      />
    </mesh>
  )
}

function CameraInit({ sceneSize }: { sceneSize: number }) {
  const { camera } = useThree()
  useEffect(() => {
    // Position camera at a 3/4 angle that shows the cloud nicely
    const d = sceneSize * 2.4
    camera.position.set(d, d * 0.55, d * 0.85)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [sceneSize, camera])
  return null
}

export function TrajectoryScene({
  annaMatrix, concepts, nAgents, maxTicks, tick, trailLength, showRandom, colorMode, onStats, onHoverConcept, highlightedConcept = null,
}: TrajectorySceneProps) {
  const SEED = 7

  const data = useMemo(
    () => precomputeTrajectories({ matrix: annaMatrix, concepts, nAgents, maxTicks, seed: SEED, useRandom: showRandom }),
    [annaMatrix, concepts, nAgents, maxTicks, showRandom],
  )

  // Push stats to parent on data change
  useEffect(() => {
    if (onStats) onStats(data.stats)
  }, [data, onStats])

  return (
    <Canvas gl={{ antialias: true, alpha: false }} style={{ background: '#020203' }}>
      <ambientLight intensity={0.35} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color="#D4AF37" />

      <CameraInit sceneSize={data.sceneSize} />

      <Sparkles count={140} scale={[22, 22, 22]} size={0.55} speed={0.18} opacity={0.16} color="#D4AF37" />

      <Agents
        data={data}
        nAgents={nAgents}
        tick={tick}
        trailLength={trailLength}
        colorMode={colorMode}
        highlightedConcept={highlightedConcept}
      />

      <ConceptTargets
        data={data}
        highlightedConcept={highlightedConcept}
        onHover={(idx) => onHoverConcept?.(idx)}
        onClick={() => {}}
      />

      <EffectComposer>
        <Bloom intensity={0.85} luminanceThreshold={0.18} luminanceSmoothing={0.7} mipmapBlur />
        <Vignette eskil={false} offset={0.32} darkness={0.78} />
      </EffectComposer>

      <OrbitControls
        autoRotate
        autoRotateSpeed={0.35}
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI * 0.88}
        minDistance={6}
        maxDistance={50}
      />
    </Canvas>
  )
}
