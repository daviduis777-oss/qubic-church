'use client'

import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, PerspectiveCamera, Html } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { cn } from '@/lib/utils'

export interface Evolution3DSceneProps {
  /** Float32Array length popSize × 3: [fitness, distanceToAnna, antipodalPct] for each matrix. */
  perMatrix: Float32Array | null
  generation: number
  totalGenerations: number
  annaBaseline: number
  annaAntipodal: number
  className?: string
}

/**
 * 3D evolution scene with Anna as a central glowing icosahedron, 64 matrix
 * particles orbiting at radii proportional to their sign-Hamming distance from
 * Anna, particle color/size scaled by fitness rank, all wrapped in Bloom + Vignette
 * postprocessing for the "alive AI" look.
 *
 * Camera autorotates slowly; user can grab to orbit manually.
 */
export function Evolution3DScene({
  perMatrix,
  generation,
  totalGenerations,
  annaBaseline,
  annaAntipodal,
  className,
}: Evolution3DSceneProps) {
  return (
    <div className={cn('relative w-full', className)} style={{ height: 460 }}>
      {/* Generation overlay */}
      <div className="absolute top-2 left-3 z-10 pointer-events-none">
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]/80 font-mono">
          Live AI Evolution
        </div>
        <div className="text-[10px] text-white/45 font-mono mt-0.5">
          gen <span className="text-[#D4AF37]">{generation}</span> / {totalGenerations}
        </div>
      </div>
      <div className="absolute top-2 right-3 z-10 pointer-events-none text-[10px] text-white/40 font-mono">
        drag to orbit · scroll to zoom
      </div>

      <Canvas
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        dpr={[1, 2]}
        style={{ background: '#020203' }}
      >
        <PerspectiveCamera makeDefault position={[0, 4, 14]} fov={50} />
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          autoRotate
          autoRotateSpeed={0.4}
          minDistance={6}
          maxDistance={28}
        />

        <ambientLight intensity={0.18} />
        <pointLight position={[10, 10, 10]} intensity={0.9} color="#D4AF37" />
        <pointLight position={[-10, -5, -10]} intensity={0.5} color="#4f46e5" />

        <Suspense fallback={null}>
          <Stars radius={80} depth={50} count={2000} factor={3} saturation={0.2} fade speed={0.3} />

          <AnnaCenter annaAntipodal={annaAntipodal} annaBaseline={annaBaseline} />
          <ReferenceAxes annaBaseline={annaBaseline} annaAntipodal={annaAntipodal} />

          <Population
            perMatrix={perMatrix}
            annaBaseline={annaBaseline}
            annaAntipodal={annaAntipodal}
          />

          <EffectComposer>
            <Bloom
              intensity={1.1}
              luminanceThreshold={0.35}
              luminanceSmoothing={0.6}
              mipmapBlur
            />
            <Vignette eskil={false} offset={0.18} darkness={0.78} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      <div className="absolute bottom-2 left-3 right-3 z-10 pointer-events-none flex justify-between items-end text-[10px] font-mono">
        <div className="flex gap-3 text-white/55">
          <span><span className="inline-block w-2 h-2 rounded-full bg-[#D4AF37] mr-1 align-middle" /> top fitness</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1 align-middle" /> upper</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-white/45 mr-1 align-middle" /> mid</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1 align-middle" /> bottom</span>
        </div>
        <div className="text-[#D4AF37]/70">Anna · gold beacon at center</div>
      </div>
    </div>
  )
}

function AnnaCenter({
  annaAntipodal: _annaAntipodal,
  annaBaseline: _annaBaseline,
}: {
  annaAntipodal: number
  annaBaseline: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const innerRef = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += dt * 0.25
      meshRef.current.rotation.x += dt * 0.08
    }
    if (innerRef.current) {
      const t = performance.now() * 0.001
      const s = 1 + 0.06 * Math.sin(t * 1.4)
      innerRef.current.scale.setScalar(s)
    }
  })
  return (
    <group position={[0, 0, 0]}>
      {/* outer wire icosahedron */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshStandardMaterial
          color="#D4AF37"
          emissive="#D4AF37"
          emissiveIntensity={1.4}
          wireframe
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* inner solid core (pulses) */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[0.7, 2]} />
        <meshStandardMaterial
          color="#fff8d6"
          emissive="#D4AF37"
          emissiveIntensity={2.2}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>
      {/* halo sphere for bloom-pickup */}
      <mesh>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial color="#D4AF37" transparent opacity={0.04} />
      </mesh>
      {/* Anna label sprite */}
      <Html position={[0, 2.4, 0]} center zIndexRange={[100, 0]} distanceFactor={10}>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#D4AF37] whitespace-nowrap pointer-events-none">
          ANNA
        </div>
      </Html>
    </group>
  )
}

function ReferenceAxes({
  annaBaseline: _annaBaseline,
  annaAntipodal: _annaAntipodal,
}: {
  annaBaseline: number
  annaAntipodal: number
}) {
  // Faint axis cross to give the camera a frame of reference
  const len = 8
  return (
    <group>
      <mesh position={[len / 2, 0, 0]}>
        <boxGeometry args={[len, 0.01, 0.01]} />
        <meshBasicMaterial color="#444" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, len / 2, 0]}>
        <boxGeometry args={[0.01, len, 0.01]} />
        <meshBasicMaterial color="#444" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, 0, len / 2]}>
        <boxGeometry args={[0.01, 0.01, len]} />
        <meshBasicMaterial color="#444" transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

interface PopulationProps {
  perMatrix: Float32Array | null
  annaBaseline: number
  annaAntipodal: number
}

function Population({ perMatrix, annaBaseline, annaAntipodal }: PopulationProps) {
  const groupRef = useRef<THREE.Group>(null)
  const positionsRef = useRef<Float32Array | null>(null)
  const targetPosRef = useRef<Float32Array | null>(null)

  // When new perMatrix arrives, compute target positions; smoothly interpolate
  const targetPositions = useMemo(() => {
    if (!perMatrix) return null
    const stride = 3
    const n = perMatrix.length / stride
    const positions = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const fitness = perMatrix[i * stride]!
      const distance = perMatrix[i * stride + 1]!
      const antipodal = perMatrix[i * stride + 2]!
      // Position relative to Anna: x=fitness offset, y=antipodal offset, z=distance offset
      const x = (fitness - annaBaseline) * 30
      const y = (antipodal - annaAntipodal) * 12
      const z = (distance - 0.0) * 18 - 9 // anna at z = -9 ish; particles at distance 50% land at z = 0
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
    }
    return positions
  }, [perMatrix, annaBaseline, annaAntipodal])

  // Set up shared meshes
  useFrame((_, dt) => {
    if (!groupRef.current || !targetPositions) return
    const n = targetPositions.length / 3

    // Initialize current positions if shapes mismatch
    if (!positionsRef.current || positionsRef.current.length !== targetPositions.length) {
      positionsRef.current = new Float32Array(targetPositions)
    }
    targetPosRef.current = targetPositions
    const cur = positionsRef.current

    // Interpolate towards target with ease (for smooth motion between worker updates)
    const speed = Math.min(1, dt * 5)
    for (let i = 0; i < n * 3; i++) {
      cur[i] = (cur[i] ?? 0) + ((targetPositions[i] ?? 0) - (cur[i] ?? 0)) * speed
    }

    // Apply to group's children
    const children = groupRef.current.children
    for (let i = 0; i < Math.min(n, children.length); i++) {
      const c = children[i]
      if (c) {
        c.position.x = cur[i * 3]!
        c.position.y = cur[i * 3 + 1]!
        c.position.z = cur[i * 3 + 2]!
      }
    }
  })

  if (!perMatrix) {
    return null
  }

  const stride = 3
  const n = perMatrix.length / stride

  // Sort by fitness rank for color
  const fitnesses = new Float32Array(n)
  for (let i = 0; i < n; i++) fitnesses[i] = perMatrix[i * stride]!
  const indices = [...Array(n).keys()].sort((a, b) => fitnesses[b]! - fitnesses[a]!)
  const rankOf = new Int32Array(n)
  indices.forEach((idx, rank) => { rankOf[idx] = rank })

  const topK = Math.max(1, Math.floor(n * 0.15))

  return (
    <group ref={groupRef}>
      {Array.from({ length: n }).map((_, i) => {
        const rank = rankOf[i]!
        const t = rank / Math.max(1, n - 1)
        let color: string
        let emissive: string
        let emissiveIntensity = 0.8
        let radius = 0.18
        if (rank < topK) {
          color = '#fff2b8'
          emissive = '#D4AF37'
          emissiveIntensity = 2.4
          radius = 0.32
        } else if (t < 0.4) {
          color = '#fb923c'
          emissive = '#fb923c'
          emissiveIntensity = 1.4
          radius = 0.24
        } else if (t < 0.75) {
          color = '#cbd5e1'
          emissive = '#94a3b8'
          emissiveIntensity = 0.6
          radius = 0.18
        } else {
          color = '#9c2932'
          emissive = '#9c2932'
          emissiveIntensity = 0.9
          radius = 0.18
        }
        return (
          <mesh key={i} position={[0, 0, 0]}>
            <sphereGeometry args={[radius, 16, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
              roughness={0.25}
              metalness={0.4}
            />
          </mesh>
        )
      })}
    </group>
  )
}
