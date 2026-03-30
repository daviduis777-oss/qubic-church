'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line, Text, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { RESEARCH_SCENE_CONFIG } from '../config'
import type { AnomalyData, SelectedElement } from '../types'

interface AnomalyMarkersLayerProps {
  anomalies: AnomalyData
  onSelect: (element: SelectedElement | null) => void
}

function getAnomalyColor(col: number): string {
  if (col === 22 || col === 105) return RESEARCH_SCENE_CONFIG.COLORS.anomalyCol22
  if (col === 97 || col === 30) return RESEARCH_SCENE_CONFIG.COLORS.anomalyCol97
  return RESEARCH_SCENE_CONFIG.COLORS.anomalySpecial
}

/** Individual animated beam with pulsing opacity */
function AnomalyBeam({ position, radius, height, color, isSpecial, onClick }: {
  position: [number, number, number]
  radius: number
  height: number
  color: string
  isSpecial: boolean
  onClick?: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const offset = useMemo(() => Math.random() * Math.PI * 2, [])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    const mat = meshRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = (isSpecial ? 0.5 : 0.35) + Math.sin(t * 2 + offset) * 0.2
    meshRef.current.scale.y = 1.0 + Math.sin(t * 1.5 + offset) * 0.1
  })

  return (
    <mesh ref={meshRef} position={position} onClick={onClick}>
      <cylinderGeometry args={[radius, radius, height, isSpecial ? 12 : 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} />
    </mesh>
  )
}

export function AnomalyMarkersLayer({ anomalies, onSelect }: AnomalyMarkersLayerProps) {
  const beamData = useMemo(() => {
    return anomalies.anomalies.map((pair) => ({
      pair,
      x1: ((pair.pos[1] / 127) * 20) - 10,
      z1: ((pair.pos[0] / 127) * 20) - 10,
      x2: ((pair.mirrorPos[1] / 127) * 20) - 10,
      z2: ((pair.mirrorPos[0] / 127) * 20) - 10,
      color: getAnomalyColor(pair.pos[1]),
      isSpecial: pair.pos[0] === 22 && pair.pos[1] === 22,
    }))
  }, [anomalies])

  // Stats from anomaly data
  const statsText = `${anomalies.statistics.anomalyCells} cells · ${anomalies.statistics.anomalyPairs} pairs · ${anomalies.metadata.symmetryPercentage}% symmetric`

  return (
    <group position={[0, RESEARCH_SCENE_CONFIG.LAYERS.anomalies.yOffset, 0]}>
      {/* Section title */}
      <Text position={[0, 8, -11]} fontSize={0.2} color="#D4AF37" fillOpacity={0.35} anchorX="center">
        SYMMETRY BREAKS
      </Text>
      <Text position={[0, 7.5, -11]} fontSize={0.12} color="white" fillOpacity={0.2} anchorX="center">
        {statsText}
      </Text>

      {/* Key column labels */}
      {anomalies.keyColumns.slice(0, 4).map((kc) => {
        const x = ((kc.column / 127) * 20) - 10
        return (
          <Text key={`kcol-${kc.column}`} position={[x, 7, -10.5]} fontSize={0.12} color={getAnomalyColor(kc.column)} fillOpacity={0.4} anchorX="center">
            {`Col ${kc.column} (${kc.count})`}
          </Text>
        )
      })}

      {/* Sparkles around anomaly zone */}
      <Sparkles count={30} scale={[22, 6, 22]} position={[0, 4, 0]} size={1} speed={0.5} color="#EC4899" opacity={0.15} />

      {beamData.map((beam) => (
        <group key={`anomaly-${beam.pair.pos[0]}-${beam.pair.pos[1]}`}>
          {/* Primary beam (animated) */}
          <AnomalyBeam
            position={[beam.x1, 3, beam.z1]}
            radius={beam.isSpecial ? 0.12 : 0.06}
            height={6}
            color={beam.color}
            isSpecial={beam.isSpecial}
            onClick={(e?: any) => {
              e?.stopPropagation?.()
              onSelect({ type: 'anomaly', pair: beam.pair })
            }}
          />

          {/* Mirror beam (animated) */}
          <AnomalyBeam
            position={[beam.x2, 2.5, beam.z2]}
            radius={0.04}
            height={5}
            color={beam.color}
            isSpecial={false}
          />

          {/* Arc connection */}
          <Line
            points={[
              [beam.x1, 4, beam.z1],
              [(beam.x1 + beam.x2) / 2, 7, (beam.z1 + beam.z2) / 2],
              [beam.x2, 4, beam.z2],
            ]}
            color={beam.color}
            lineWidth={1}
            transparent
            opacity={0.15}
          />

          {/* Value labels on special beam */}
          {beam.isSpecial && (
            <>
              <Text position={[beam.x1, 6.5, beam.z1]} fontSize={0.15} color={beam.color} fillOpacity={0.7} anchorX="center">
                {`[${beam.pair.pos[0]},${beam.pair.pos[1]}]=${beam.pair.value}`}
              </Text>
              <Text position={[beam.x1, 6.0, beam.z1]} fontSize={0.1} color="white" fillOpacity={0.3} anchorX="center">
                value = mirror (unique!)
              </Text>
            </>
          )}
        </group>
      ))}
    </group>
  )
}
