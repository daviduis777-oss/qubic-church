'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Line, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import type { InterestingAddress, SelectedElement } from '../types'

interface AddressArchaeologyLayerProps {
  addresses: InterestingAddress[]
  onSelect: (element: SelectedElement | null) => void
}

const METHOD_COLORS: Record<string, string> = {
  step7: '#3B82F6',
  step13: '#22C55E',
  step27: '#8B5CF6',
  diagonal: '#F59E0B',
  col: '#EF4444',
  row: '#EC4899',
}

function getMethodColor(method: string): string {
  return METHOD_COLORS[method] ?? '#9CA3AF'
}

function AddressMarker({
  addr,
  onSelect,
}: {
  addr: InterestingAddress
  onSelect: (element: SelectedElement | null) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const color = getMethodColor(addr.method)
  const size = 0.2 + (addr.xor / 33) * 0.3
  const x = ((addr.position[1] / 127) * 20) - 10
  const z = ((addr.position[0] / 127) * 20) - 10
  const y = 1.5
  const truncated = addr.address.slice(0, 8) + '...' + addr.address.slice(-4)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 1.5
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.8) * 0.2
    }
  })

  return (
    <group>
      {/* Vertical pin line from terrain to marker */}
      <Line
        points={[
          [x, 0, z],
          [x, y, z],
        ]}
        color={color}
        lineWidth={1}
        transparent
        opacity={0.3}
      />

      {/* Octahedron marker */}
      <mesh
        ref={meshRef}
        position={[x, y, z]}
        scale={size}
        onClick={(e) => {
          e.stopPropagation()
          onSelect({ type: 'address', address: addr })
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>

      {/* Address label */}
      <Text
        position={[x, y + size * 0.5 + 0.3, z]}
        fontSize={0.15}
        color={color}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.7}
      >
        {truncated}
      </Text>
    </group>
  )
}

export function AddressArchaeologyLayer({ addresses, onSelect }: AddressArchaeologyLayerProps) {
  // Count by method
  const methodCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const addr of addresses) {
      counts[addr.method] = (counts[addr.method] ?? 0) + 1
    }
    return counts
  }, [addresses])

  return (
    <group>
      {/* Section title */}
      <Text position={[0, 3.5, -11]} fontSize={0.2} color="#22C55E" fillOpacity={0.4} anchorX="center">
        BITCOIN ADDRESS ARCHAEOLOGY
      </Text>
      <Text position={[0, 3.0, -11]} fontSize={0.12} color="white" fillOpacity={0.2} anchorX="center">
        {`${addresses.length} special addresses · 46x enrichment over random`}
      </Text>

      {/* Method legend */}
      {Object.entries(METHOD_COLORS).map(([method, color], i) => {
        const count = methodCounts[method] ?? 0
        if (count === 0) return null
        return (
          <Text key={`legend-${method}`} position={[-12, 2.5 - i * 0.3, -10]} fontSize={0.1} color={color} fillOpacity={0.5} anchorX="left">
            {`● ${method} (${count})`}
          </Text>
        )
      })}

      {/* Atmospheric sparkles */}
      <Sparkles count={25} scale={[22, 4, 22]} position={[0, 1.5, 0]} size={0.8} speed={0.3} color="#22C55E" opacity={0.3} />

      {/* Individual address markers */}
      {addresses.map((addr) => (
        <AddressMarker key={`addr-${addr.id}`} addr={addr} onSelect={onSelect} />
      ))}
    </group>
  )
}
