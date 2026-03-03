'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { createNoise2D } from 'simplex-noise'
import type { Mesh, PlaneGeometry } from 'three'

interface WireframeLandscapeProps {
  speed?: number
  amplitude?: number
  frequency?: number
  color?: string
  opacity?: number
  segments?: number
}

export function WireframeLandscape({
  speed = 0.15,
  amplitude = 2.5,
  frequency = 0.08,
  color = '#ffffff',
  opacity = 0.12,
  segments = 60,
}: WireframeLandscapeProps) {
  const meshRef = useRef<Mesh>(null)
  const noise2D = useMemo(() => createNoise2D(), [])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const geometry = meshRef.current.geometry as PlaneGeometry
    const positions = geometry.attributes.position!
    const time = clock.getElapsedTime() * speed

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const z =
        noise2D(x * frequency + time, y * frequency) * amplitude +
        noise2D(x * frequency * 2 + time * 0.5, y * frequency * 2) *
          amplitude *
          0.3
      positions.setZ(i, z)
    }
    positions.needsUpdate = true
  })

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2.5, 0, 0]}
      position={[0, -3, -5]}
    >
      <planeGeometry args={[50, 35, segments, segments]} />
      <meshBasicMaterial
        wireframe
        color={color}
        transparent
        opacity={opacity}
      />
    </mesh>
  )
}
