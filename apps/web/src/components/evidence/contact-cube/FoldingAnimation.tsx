'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CubeFace, CubeFaceOutline } from './CubeFace'
import type { CubeFaceId, CubeFaceData, ColorTheme, AnomalyCell, FaceTransform } from './types'
import { ANIMATION_TIMINGS } from './constants'

interface FoldingAnimationProps {
  faces: Record<CubeFaceId, CubeFaceData>
  colorTheme: ColorTheme
  getFaceTransform: (faceId: CubeFaceId) => FaceTransform
  progress: number
  showDepth?: boolean
  highlightAnomalies?: boolean
  selectedAnomaly?: AnomalyCell | null
  autoRotate?: boolean
  showOutlines?: boolean
  onCellClick?: (row: number, col: number, value: number, faceId: CubeFaceId) => void
  onCellHover?: (row: number, col: number, value: number, faceId: CubeFaceId) => void
}

const ALL_FACE_IDS: CubeFaceId[] = ['front', 'back', 'left', 'right', 'top', 'bottom']

export function FoldingAnimation({
  faces,
  colorTheme,
  getFaceTransform,
  progress,
  showDepth = true,
  highlightAnomalies = true,
  selectedAnomaly,
  autoRotate = false,
  showOutlines = false,
  onCellClick,
  onCellHover,
}: FoldingAnimationProps) {
  const groupRef = useRef<THREE.Group>(null)
  const rotationRef = useRef({ y: 0 })

  // Auto-rotate when cube is fully folded
  useFrame((_, delta) => {
    if (!groupRef.current || !autoRotate) return

    // Only rotate when cube is formed (progress > 0.9)
    if (progress > 0.9) {
      rotationRef.current.y += ANIMATION_TIMINGS.rotationSpeed * delta * 60
      groupRef.current.rotation.y = rotationRef.current.y
    } else {
      // Reset rotation when unfolding
      rotationRef.current.y = 0
      groupRef.current.rotation.y = 0
    }
  })

  // Calculate opacity based on fold progress for smooth transitions
  const getOpacity = (faceId: CubeFaceId): number => {
    // All faces fully opaque
    return 1
  }

  return (
    <group ref={groupRef}>
      {ALL_FACE_IDS.map((faceId) => {
        const faceData = faces[faceId]
        if (!faceData) return null

        const transform = getFaceTransform(faceId)
        const opacity = getOpacity(faceId)

        return (
          <group key={faceId}>
            <CubeFace
              faceData={faceData}
              transform={transform}
              colorTheme={colorTheme}
              opacity={opacity}
              showDepth={showDepth}
              highlightAnomalies={highlightAnomalies}
              selectedAnomaly={selectedAnomaly}
              onCellClick={onCellClick ? (row, col, value) => onCellClick(row, col, value, faceId) : undefined}
              onCellHover={onCellHover ? (row, col, value) => onCellHover(row, col, value, faceId) : undefined}
            />
            {showOutlines && (
              <CubeFaceOutline
                transform={transform}
                color={progress > 0.9 ? '#00ffff' : '#ffffff'}
                opacity={0.2 + progress * 0.3}
              />
            )}
          </group>
        )
      })}
    </group>
  )
}

// Progress indicator for animation
export function FoldingProgressIndicator({
  progress,
  isAnimating,
}: {
  progress: number
  isAnimating: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (!meshRef.current) return

    // Pulse when animating
    if (isAnimating) {
      const scale = 1 + Math.sin(Date.now() * 0.01) * 0.1
      meshRef.current.scale.setScalar(scale)
    } else {
      meshRef.current.scale.setScalar(1)
    }
  })

  return (
    <mesh ref={meshRef} position={[0, -8, 0]}>
      <torusGeometry args={[2, 0.1, 8, 32, progress * Math.PI * 2]} />
      <meshBasicMaterial color={isAnimating ? '#00ffff' : '#666666'} />
    </mesh>
  )
}

// Axis helper for debugging
export function AxisHelper({ visible = true }: { visible?: boolean }) {
  if (!visible) return null

  return (
    <group>
      {/* X axis - Red */}
      <mesh position={[5, 0, 0]}>
        <boxGeometry args={[10, 0.1, 0.1]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      {/* Y axis - Green */}
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[0.1, 10, 0.1]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>
      {/* Z axis - Blue */}
      <mesh position={[0, 0, 5]}>
        <boxGeometry args={[0.1, 0.1, 10]} />
        <meshBasicMaterial color="#0000ff" />
      </mesh>
    </group>
  )
}
