'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import * as THREE from 'three'
import type { AnomalyCell } from './types'
import { MATRIX_SIZE, CUBE_SCALE, ANOMALY_COLORS, SPECIAL_POSITIONS } from './constants'

// Extend THREE.Line to React Three Fiber
extend({ Line_: THREE.Line })

interface RegistrationMarkersProps {
  anomalies: AnomalyCell[]
  selectedAnomaly: AnomalyCell | null
  onSelect: (anomaly: AnomalyCell | null) => void
  visible?: boolean
}

// Convert matrix position to 3D cube position
function matrixToWorldPosition(row: number, col: number): [number, number, number] {
  // Map 0-127 to -CUBE_SCALE/2 to +CUBE_SCALE/2
  const scale = CUBE_SCALE / MATRIX_SIZE
  const x = (col - MATRIX_SIZE / 2) * scale
  const y = -(row - MATRIX_SIZE / 2) * scale
  const z = CUBE_SCALE / 2 + 0.5 // Slightly above the front face

  return [x, y, z]
}

// Single anomaly marker
function AnomalyMarker({
  anomaly,
  isSelected,
  onSelect,
}: {
  anomaly: AnomalyCell
  isSelected: boolean
  onSelect: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  // Determine marker color
  const color = useMemo(() => {
    if (isSelected) return ANOMALY_COLORS.highlight
    if (anomaly.special) return ANOMALY_COLORS.special
    return ANOMALY_COLORS.normal
  }, [isSelected, anomaly.special])

  // Position
  const position = useMemo(() => matrixToWorldPosition(anomaly.pos[0], anomaly.pos[1]), [anomaly.pos])

  // Animation
  useFrame(({ clock }) => {
    if (!meshRef.current || !glowRef.current) return

    const time = clock.getElapsedTime()

    // Pulse effect
    const pulse = 1 + Math.sin(time * 3) * 0.2
    const scale = isSelected ? 1.5 : anomaly.special ? 1.2 : 0.8

    meshRef.current.scale.setScalar(scale * pulse)
    glowRef.current.scale.setScalar(scale * pulse * 1.5)

    // Glow opacity animation
    const material = glowRef.current.material as THREE.MeshBasicMaterial
    material.opacity = 0.3 + Math.sin(time * 2) * 0.1
  })

  return (
    <group position={position}>
      {/* Main sphere */}
      <mesh ref={meshRef} onClick={onSelect}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Glow effect */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>

      {/* Connection line to mirror position */}
      {isSelected && (
        <MirrorLine
          from={position}
          to={matrixToWorldPosition(anomaly.mirrorPos[0], anomaly.mirrorPos[1])}
          color={color}
        />
      )}
    </group>
  )
}

// Line connecting anomaly to its mirror - using primitive
function MirrorLine({
  from,
  to,
  color,
}: {
  from: [number, number, number]
  to: [number, number, number]
  color: string
}) {
  const lineRef = useRef<THREE.Line>(null)

  // Create geometry and material
  const { geometry, material } = useMemo(() => {
    const points = [
      new THREE.Vector3(...from),
      new THREE.Vector3(...to),
    ]
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    const mat = new THREE.LineDashedMaterial({
      color,
      dashSize: 0.2,
      gapSize: 0.1,
      opacity: 0.5,
      transparent: true,
    })
    return { geometry: geo, material: mat }
  }, [from, to, color])

  // Create line object
  const lineObject = useMemo(() => {
    const line = new THREE.Line(geometry, material)
    line.computeLineDistances() // Required for dashed lines
    return line
  }, [geometry, material])

  return <primitive ref={lineRef} object={lineObject} />
}

// Special marker for position [22,22]
function SpecialPositionMarker() {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)

  const position = useMemo(() =>
    matrixToWorldPosition(SPECIAL_POSITIONS.primer.row, SPECIAL_POSITIONS.primer.col),
    []
  )

  useFrame(({ clock }) => {
    if (!meshRef.current || !ringRef.current) return

    const time = clock.getElapsedTime()

    // Rotating ring
    ringRef.current.rotation.z = time * 0.5
    ringRef.current.rotation.x = Math.sin(time * 0.3) * 0.2

    // Pulse
    const pulse = 1 + Math.sin(time * 2) * 0.15
    meshRef.current.scale.setScalar(pulse)
  })

  return (
    <group position={position}>
      {/* Central sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial
          color={ANOMALY_COLORS.special}
          emissive={ANOMALY_COLORS.special}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Rotating ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.4, 0.03, 16, 32]} />
        <meshBasicMaterial color={ANOMALY_COLORS.special} />
      </mesh>

      {/* Label placeholder */}
      <PositionLabel
        text="[22,22] = 100"
        position={[0, 0.6, 0]}
      />
    </group>
  )
}

// Floating text label (simple sprite placeholder)
function PositionLabel({
  text,
  position,
}: {
  text: string
  position: [number, number, number]
}) {
  return (
    <group position={position}>
      <sprite scale={[1.5, 0.3, 1]}>
        <spriteMaterial
          color="#FFD700"
          opacity={0.8}
          transparent
        />
      </sprite>
    </group>
  )
}

// Main component
export function RegistrationMarkers({
  anomalies,
  selectedAnomaly,
  onSelect,
  visible = true,
}: RegistrationMarkersProps) {
  if (!visible || anomalies.length === 0) return null

  return (
    <group>
      {/* Regular anomaly markers */}
      {anomalies.map((anomaly) => (
        <AnomalyMarker
          key={`anomaly-${anomaly.pos[0]}-${anomaly.pos[1]}`}
          anomaly={anomaly}
          isSelected={
            selectedAnomaly?.pos[0] === anomaly.pos[0] &&
            selectedAnomaly?.pos[1] === anomaly.pos[1]
          }
          onSelect={() => onSelect(anomaly)}
        />
      ))}

      {/* Special marker for [22,22] */}
      <SpecialPositionMarker />

      {/* Mirror axis indicator */}
      <MirrorAxisIndicator />
    </group>
  )
}

// Visual indicator of the mirror axis
function MirrorAxisIndicator() {
  const lineRef = useRef<THREE.Line>(null)

  // Create line object
  const lineObject = useMemo(() => {
    const points = [
      new THREE.Vector3(-CUBE_SCALE, -CUBE_SCALE, CUBE_SCALE / 2 + 0.3),
      new THREE.Vector3(CUBE_SCALE, CUBE_SCALE, CUBE_SCALE / 2 + 0.3),
    ]
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
      color: '#ff6b6b',
      transparent: true,
      opacity: 0.3,
    })
    return new THREE.Line(geometry, material)
  }, [])

  useFrame(({ clock }) => {
    if (!lineRef.current) return
    const material = lineRef.current.material as THREE.LineBasicMaterial
    material.opacity = 0.2 + Math.sin(clock.getElapsedTime()) * 0.1
  })

  return <primitive ref={lineRef} object={lineObject} />
}
