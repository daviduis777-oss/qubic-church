'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import type { QortexEdge, QortexNode } from './types'

interface SynapseConnectionProps {
  edge: QortexEdge
  sourceNode: QortexNode
  targetNode: QortexNode
  isHighlighted: boolean
  showAll: boolean
}

// Color mapping for connection types with gradients
const TYPE_COLORS = {
  fast: { main: '#22C55E', glow: '#4ADE80' }, // Green
  slow: { main: '#EAB308', glow: '#FDE047' }, // Yellow
  meta: { main: '#8B5CF6', glow: '#A78BFA' }, // Purple
}

export function SynapseConnection({
  edge,
  sourceNode,
  targetNode,
  isHighlighted,
  showAll,
}: SynapseConnectionProps) {
  const lineRef = useRef<any>(null)
  const flowRef = useRef<THREE.Points>(null)

  // Calculate line points with smoother curve
  const { points, flowPositions, flowGeometry } = useMemo(() => {
    const start = new THREE.Vector3(...sourceNode.position)
    const end = new THREE.Vector3(...targetNode.position)

    // Create curve for smoother lines
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)

    // Add slight curve based on weight
    const direction = new THREE.Vector3().subVectors(end, start)
    const offset = new THREE.Vector3()
      .crossVectors(direction, new THREE.Vector3(0, 1, 0))
      .normalize()
      .multiplyScalar(edge.weight * 0.8)

    // Add some vertical offset too for visual depth
    offset.y += edge.weight * 0.3
    mid.add(offset)

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
    const curvePoints = curve.getPoints(32)

    // Create flow particles along the curve
    const flowCount = 8
    const flowPos = new Float32Array(flowCount * 3)
    for (let i = 0; i < flowCount; i++) {
      const t = i / flowCount
      const point = curve.getPoint(t)
      flowPos[i * 3] = point.x
      flowPos[i * 3 + 1] = point.y
      flowPos[i * 3 + 2] = point.z
    }

    const flowGeo = new THREE.BufferGeometry()
    flowGeo.setAttribute('position', new THREE.BufferAttribute(flowPos, 3))

    return {
      points: curvePoints,
      flowPositions: flowPos,
      flowGeometry: flowGeo,
      curve
    }
  }, [sourceNode.position, targetNode.position, edge.weight])

  const colors = TYPE_COLORS[edge.type]
  const baseOpacity = isHighlighted ? 0.95 : showAll ? 0.2 : 0.35
  const lineWidth = isHighlighted ? 2.5 : showAll ? 0.8 : 1.2

  // Animate flow particles
  useFrame((state) => {
    if (flowRef.current && isHighlighted) {
      const positions = flowRef.current.geometry.attributes.position
      if (positions) {
        const time = state.clock.elapsedTime * 0.3 // Slower flow speed

        for (let i = 0; i < positions.count; i++) {
          // Calculate position along curve with animated offset
          const baseT = i / positions.count
          const animatedT = (baseT + time) % 1

          // Interpolate position along curve using simple lerp
          const start = new THREE.Vector3(...sourceNode.position)
          const end = new THREE.Vector3(...targetNode.position)
          const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)

          // Bezier interpolation
          const t = animatedT
          const t1 = 1 - t
          const x = t1 * t1 * start.x + 2 * t1 * t * mid.x + t * t * end.x
          const y = t1 * t1 * start.y + 2 * t1 * t * mid.y + t * t * end.y
          const z = t1 * t1 * start.z + 2 * t1 * t * mid.z + t * t * end.z

          positions.setXYZ(i, x, y, z)
        }
        positions.needsUpdate = true
      }
    }

    // Pulse line opacity when highlighted
    if (lineRef.current && isHighlighted) {
      const pulse = Math.sin(state.clock.elapsedTime * 4) * 0.15 + 0.85
      lineRef.current.material.opacity = pulse
    }
  })

  // Don't render if not visible
  if (!showAll && !isHighlighted) return null

  return (
    <group>
      {/* Main synapse line */}
      <Line
        ref={lineRef}
        points={points}
        color={colors.main}
        lineWidth={lineWidth}
        transparent
        opacity={baseOpacity}
        // Add glow effect for highlighted synapses
        {...(isHighlighted && {
          // Outer glow layer
        })}
      />

      {/* Glow line for highlighted connections */}
      {isHighlighted && (
        <Line
          points={points}
          color={colors.glow}
          lineWidth={lineWidth * 2}
          transparent
          opacity={0.15}
        />
      )}

      {/* Flow particles for highlighted connections */}
      {isHighlighted && (
        <points ref={flowRef} geometry={flowGeometry}>
          <pointsMaterial
            color={colors.glow}
            size={0.08}
            transparent
            opacity={0.9}
            sizeAttenuation
            depthWrite={false}
          />
        </points>
      )}

      {/* Connection weight indicator at midpoint */}
      {isHighlighted && (
        <mesh position={points[Math.floor(points.length / 2)]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial
            color={colors.main}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  )
}
