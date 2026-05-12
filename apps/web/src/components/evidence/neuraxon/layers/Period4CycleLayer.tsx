'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Line } from '@react-three/drei'
import * as THREE from 'three'
import { RESEARCH_SCENE_CONFIG } from '../config'
import type { SpectralData, SelectedElement } from '../types'

interface Period4CycleLayerProps {
  spectral: SpectralData
  onSelect: (element: SelectedElement | null) => void
}

const Y = RESEARCH_SCENE_CONFIG.LAYERS.cycle.yOffset
const RAD = 3
const COOP_COLOR = RESEARCH_SCENE_CONFIG.COLORS.coopPhase
const REST_COLOR = RESEARCH_SCENE_CONFIG.COLORS.restPhase

/** Individual animated capsule that pulses when active */
function PhaseCapsule({ phase, index, totalPhases, position, onSelect }: {
  phase: { label: string; energy: number; behavior: string; color: string }
  index: number
  totalPhases: number
  position: [number, number, number]
  onSelect: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const active = Math.floor((state.clock.elapsedTime * 0.5) % totalPhases)
    const isActive = active === index
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = isActive ? 0.8 : 0.2
      const targetScale = isActive ? 1.3 : 1.0
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
    }
    if (glowRef.current) {
      const gMat = glowRef.current.material as THREE.MeshBasicMaterial
      gMat.opacity = isActive ? 0.15 : 0.0
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef} onClick={(e) => { e.stopPropagation(); onSelect() }}>
        <capsuleGeometry args={[0.4, 0.8, 8, 16]} />
        <meshStandardMaterial color={phase.color} emissive={phase.color} emissiveIntensity={0.3} metalness={0.5} roughness={0.2} transparent opacity={0.85} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.9, 12, 12]} />
        <meshBasicMaterial color={phase.color} transparent opacity={0} depthWrite={false} />
      </mesh>
      <Text position={[0, 1.2, 0]} fontSize={0.3} color={phase.color} anchorX="center" anchorY="middle">
        {phase.label}
      </Text>
      <Text position={[0, -0.9, 0]} fontSize={0.2} color="white" anchorX="center" anchorY="middle" fillOpacity={0.4}>
        {phase.energy > 0 ? '+' : ''}{phase.energy}
      </Text>
    </group>
  )
}

export function Period4CycleLayer({ spectral, onSelect }: Period4CycleLayerProps) {
  const groupRef = useRef<THREE.Group>(null)

  const phases = useMemo(() => {
    const energies = spectral.period4?.energies ?? [42, -50, -38, 56]
    const behaviors = spectral.period4?.behaviors ?? ['COOP', 'COOP', 'REST', 'REST']
    return energies.map((energy, i) => ({
      label: behaviors[i] ?? 'UNKNOWN',
      energy,
      behavior: behaviors[i] === 'COOP' ? 'Cooperate' : 'Rest',
      color: behaviors[i] === 'COOP' ? COOP_COLOR : REST_COLOR,
    }))
  }, [spectral.period4])

  const arrowPoints = useMemo(() => {
    const pts: [number, number, number][] = []
    for (let i = 0; i <= phases.length; i++) {
      const angle = ((i % phases.length) / phases.length) * Math.PI * 2
      pts.push([Math.cos(angle) * (RAD - 0.5), Y, Math.sin(angle) * (RAD - 0.5)])
    }
    return pts
  }, [phases.length])

  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.15
  })

  return (
    <group ref={groupRef}>
      {/* Animated phase capsules */}
      {phases.map((phase, i) => {
        const angle = (i / phases.length) * Math.PI * 2
        const pos: [number, number, number] = [Math.cos(angle) * RAD, Y, Math.sin(angle) * RAD]
        return (
          <PhaseCapsule
            key={`p4-${i}`}
            phase={phase}
            index={i}
            totalPhases={phases.length}
            position={pos}
            onSelect={() => onSelect({ type: 'period4-phase', phase: i, behavior: phase.behavior, energy: phase.energy })}
          />
        )
      })}

      <Line points={arrowPoints} color="#D4AF37" lineWidth={1} transparent opacity={0.2} />

      <mesh position={[0, Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RAD, 0.02, 8, 64]} />
        <meshBasicMaterial color="#D4AF37" transparent opacity={0.15} />
      </mesh>

      <Text position={[0, Y + 2.5, 0]} fontSize={0.25} color="#D4AF37" anchorX="center" anchorY="middle" fillOpacity={0.5}>
        PERIOD-4 CYCLE
      </Text>
      <Text position={[0, Y + 2.0, 0]} fontSize={0.15} color="white" anchorX="center" anchorY="middle" fillOpacity={0.25}>
        {`from T(v) = sign(M\u00B7v) \u00B7 100K + 32K exhaustive samples`}
      </Text>
      <Text position={[0, Y - 2.5, 0]} fontSize={0.12} color="#D4AF37" anchorX="center" anchorY="middle" fillOpacity={0.3}>
        {`trace=${spectral.matrix_stats?.trace ?? '?'} · zeros=${spectral.matrix_stats?.zeros ?? '?'} · radius=${spectral.matrix_stats?.spectral_radius?.toFixed(1) ?? '?'}`}
      </Text>
      <Text position={[0, Y - 3.0, 0]} fontSize={0.14} color={COOP_COLOR} anchorX="center" anchorY="middle" fillOpacity={0.4}>
        33.0% ± 0.1% cooperation (5 seeds × 1M ticks)
      </Text>
    </group>
  )
}
