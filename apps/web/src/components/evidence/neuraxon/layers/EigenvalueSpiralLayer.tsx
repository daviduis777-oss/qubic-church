'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line, Text, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { RESEARCH_SCENE_CONFIG } from '../config'
import type { SpectralData, SelectedElement } from '../types'

interface EigenvalueSpiralLayerProps {
  spectral: SpectralData
  onSelect: (element: SelectedElement | null) => void
}

const Y_OFFSET = RESEARCH_SCENE_CONFIG.LAYERS.spiral.yOffset
const R = 0.006
const H = 0.003

export function EigenvalueSpiralLayer({ spectral, onSelect }: EigenvalueSpiralLayerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const dominantRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)

  const eigenvalues = spectral.eigenvalues
  const dom = spectral.dominant

  const evData = useMemo(() =>
    eigenvalues.map((ev, i) => {
      const isDom = Math.abs(ev.angle_deg) > 89 && Math.abs(ev.angle_deg) < 91
      const frac = Math.abs(ev.angle_deg) / 180
      const cr = frac < 0.5 ? 212 - frac * 2 * 153 : 59 + (frac - 0.5) * 2 * 180
      const cg = frac < 0.5 ? 175 - frac * 2 * 45 : 130 - (frac - 0.5) * 2 * 62
      const cb = frac < 0.5 ? 55 + frac * 2 * 191 : 246 - (frac - 0.5) * 2 * 178
      return {
        pos: [ev.real * R, ev.magnitude * H + Y_OFFSET, ev.imag * R] as [number, number, number],
        color: `rgb(${Math.round(cr)},${Math.round(cg)},${Math.round(cb)})`,
        size: isDom ? 0.5 : 0.15,
        isDom,
        ev, i,
      }
    }),
  [eigenvalues])

  // Conjugate pair connections
  const conjugatePairs = useMemo(() => {
    const pairs: [number, number, number][][] = []
    const used = new Set<number>()
    for (let i = 0; i < eigenvalues.length; i++) {
      if (used.has(i)) continue
      const ev = eigenvalues[i]!
      if (Math.abs(ev.imag) < 1) continue
      for (let j = i + 1; j < eigenvalues.length; j++) {
        if (used.has(j)) continue
        const ev2 = eigenvalues[j]!
        if (Math.abs(ev.real - ev2.real) < 1 && Math.abs(ev.imag + ev2.imag) < 1) {
          pairs.push([
            [ev.real * R, ev.magnitude * H + Y_OFFSET, ev.imag * R],
            [ev2.real * R, ev2.magnitude * H + Y_OFFSET, ev2.imag * R],
          ])
          used.add(i)
          used.add(j)
          break
        }
      }
    }
    return pairs
  }, [eigenvalues])

  const spiralPts = useMemo(() => {
    const sorted = [...eigenvalues].sort((a, b) => b.magnitude - a.magnitude)
    return sorted.map((ev) => [ev.real * R, ev.magnitude * H + Y_OFFSET, ev.imag * R] as [number, number, number])
  }, [eigenvalues])

  // Scale invariance rings
  const scaleRings = useMemo(() => {
    if (!spectral.scale_invariance) return []
    return spectral.scale_invariance.map((si) => {
      const radius = Math.log2(si.size) * 0.4
      const pts: [number, number, number][] = []
      for (let a = 0; a <= 64; a++) {
        const angle = (a / 64) * Math.PI * 2
        pts.push([Math.cos(angle) * radius, Y_OFFSET - 1.5, Math.sin(angle) * radius])
      }
      return { pts, size: si.size, angle: si.angle_deg }
    })
  }, [spectral.scale_invariance])

  // Complex plane reference axes
  const axisLength = 10
  const realAxis: [number, number, number][] = [[-axisLength * R * 200, Y_OFFSET, 0], [axisLength * R * 200, Y_OFFSET, 0]]
  const imagAxis: [number, number, number][] = [[0, Y_OFFSET, -axisLength * R * 200], [0, Y_OFFSET, axisLength * R * 200]]

  const domPos: [number, number, number] = [dom.real * R, dom.magnitude * H + Y_OFFSET, dom.imag * R]

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (dominantRef.current) {
      dominantRef.current.scale.setScalar(0.7 + Math.sin(t * 3) * 0.15)
      dominantRef.current.rotation.y = t * 0.5
    }
    if (ringRef.current) {
      ringRef.current.rotation.x = t * 0.8
      ringRef.current.rotation.z = t * 0.3
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.6
      ring2Ref.current.rotation.x = t * 0.2
    }
    if (groupRef.current) groupRef.current.rotation.y = Math.sin(t * 0.08) * 0.05
  })

  return (
    <group ref={groupRef}>
      {/* Complex plane axes */}
      <Line points={realAxis} color="#ffffff" lineWidth={0.5} transparent opacity={0.06} />
      <Line points={imagAxis} color="#ffffff" lineWidth={0.5} transparent opacity={0.06} />

      {/* Axis labels */}
      <Text position={[axisLength * R * 200 + 0.3, Y_OFFSET, 0]} fontSize={0.2} color="#ffffff" fillOpacity={0.15} anchorX="left">Re</Text>
      <Text position={[0, Y_OFFSET, axisLength * R * 200 + 0.3]} fontSize={0.2} color="#ffffff" fillOpacity={0.15} anchorX="left">Im</Text>

      {/* Eigenvalue spheres */}
      {evData.map((d) => (
        <mesh key={`ev-${d.i}`} position={d.pos} scale={d.size}
          onClick={(e) => { e.stopPropagation(); onSelect({ type: 'eigenvalue', index: d.i, data: d.ev }) }}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color={d.color} emissive={d.color} emissiveIntensity={0.4} metalness={0.6} roughness={0.2} />
        </mesh>
      ))}

      {/* Conjugate pair connections */}
      {conjugatePairs.map((pair, i) => (
        <Line key={`conj-${i}`} points={pair} color="#8B5CF6" lineWidth={0.5} transparent opacity={0.12} dashed dashSize={0.1} gapSize={0.1} />
      ))}

      {/* Spiral line */}
      {spiralPts.length > 1 && <Line points={spiralPts} color="#D4AF37" lineWidth={1.5} transparent opacity={0.3} />}

      {/* Scale invariance rings */}
      {scaleRings.map((ring) => (
        <group key={`sring-${ring.size}`}>
          <Line points={ring.pts} color="#D4AF37" lineWidth={0.5} transparent opacity={0.12} />
          <Text position={[ring.pts[0]![0]! + 0.2, Y_OFFSET - 1.5, ring.pts[0]![2]!]} fontSize={0.12} color="#D4AF37" fillOpacity={0.2}>
            {ring.size}x{ring.size}
          </Text>
        </group>
      ))}

      {/* Dominant eigenvalue — main sphere */}
      <mesh ref={dominantRef} position={domPos}>
        <icosahedronGeometry args={[1, 3]} />
        <meshStandardMaterial color="#3B82F6" emissive="#3B82F6" emissiveIntensity={1.0} metalness={0.7} roughness={0.1} transparent opacity={0.9} />
      </mesh>

      {/* Rotating selection rings */}
      <mesh ref={ringRef} position={domPos}>
        <torusGeometry args={[1.8, 0.03, 8, 64]} />
        <meshBasicMaterial color="#3B82F6" transparent opacity={0.4} />
      </mesh>
      <mesh ref={ring2Ref} position={domPos}>
        <torusGeometry args={[2.2, 0.02, 8, 64]} />
        <meshBasicMaterial color="#D4AF37" transparent opacity={0.25} />
      </mesh>

      {/* Dominant glow */}
      <mesh position={domPos}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial color="#3B82F6" transparent opacity={0.06} />
      </mesh>

      {/* Dominant label */}
      <Text position={[domPos[0], domPos[1] + 2, domPos[2]]} fontSize={0.2} color="#3B82F6" fillOpacity={0.7} anchorX="center">
        {`${dom.angle_deg.toFixed(3)}° DOMINANT`}
      </Text>
      <Text position={[domPos[0], domPos[1] + 1.6, domPos[2]]} fontSize={0.14} color="#ffffff" fillOpacity={0.3} anchorX="center">
        {`${dom.dominance_pct}% spectral power`}
      </Text>

      {/* Sparkles */}
      <Sparkles count={40} scale={[14, 8, 14]} position={[0, Y_OFFSET + 3, 0]} size={1.5} speed={0.3} color="#3B82F6" opacity={0.3} />

      {/* Section label */}
      <Text position={[0, Y_OFFSET + 8, 0]} fontSize={0.25} color="#D4AF37" fillOpacity={0.4} anchorX="center">
        EIGENVALUE SPECTRUM
      </Text>
      <Text position={[0, Y_OFFSET + 7.5, 0]} fontSize={0.14} color="#ffffff" fillOpacity={0.2} anchorX="center">
        128 eigenvalues in complex plane
      </Text>

      {/* 2x2 Essence Matrix visualization */}
      {spectral.essence_2x2 && (
        <group position={[6, Y_OFFSET - 3, 0]}>
          <Text position={[0, 1.2, 0]} fontSize={0.16} color="#D4AF37" fillOpacity={0.4} anchorX="center">
            {'2\u00D72 ESSENCE'}
          </Text>
          {spectral.essence_2x2.flatMap((row, ri) =>
            row.map((val, ci) => {
              const x = (ci - 0.5) * 0.5
              const z = (ri - 0.5) * 0.5
              const h = Math.abs(val) * 0.02
              const color = val >= 0 ? '#D4AF37' : '#3B82F6'
              return (
                <group key={`ess-${ri}-${ci}`} position={[x, h / 2, z]}>
                  <mesh>
                    <boxGeometry args={[0.4, Math.max(h, 0.05), 0.4]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} metalness={0.5} roughness={0.3} />
                  </mesh>
                  <Text position={[0, h / 2 + 0.15, 0]} fontSize={0.08} color={color} fillOpacity={0.6} anchorX="center">
                    {val.toFixed(1)}
                  </Text>
                </group>
              )
            })
          )}
        </group>
      )}
    </group>
  )
}
