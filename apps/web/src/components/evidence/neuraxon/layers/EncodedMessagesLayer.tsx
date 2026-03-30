'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Line } from '@react-three/drei'
import * as THREE from 'three'
import type { SelectedElement } from '../types'

interface EncodedMessagesLayerProps {
  onSelect: (element: SelectedElement | null) => void
}

const ENCODED_MESSAGES = [
  { text: 'GAME', method: 'XOR-127', positions: [[8,71], [8,72], [8,73], [8,74]], pValue: 0.001, color: '#D4AF37' },
  { text: 'CFB', method: 'Row 11', positions: [[11,9], [11,10], [11,11]], pValue: 0.01, color: '#EF4444' },
  { text: 'KEY', method: 'Direct', positions: [[8,74], [9,75], [10,76]], pValue: 0.005, color: '#22C55E' },
  { text: 'RISE', method: 'Mod-26', positions: [[0,17], [0,18], [0,19], [0,20]], pValue: 0.034, color: '#3B82F6' },
] as const

/** Convert matrix [row, col] to terrain world coordinates */
function toWorld(row: number, col: number): [number, number, number] {
  return [
    ((col / 127) * 20) - 10,
    2.0,
    ((row / 127) * 20) - 10,
  ]
}

function MessageGroup({
  msg,
  onSelect,
}: {
  msg: typeof ENCODED_MESSAGES[number]
  onSelect: (element: SelectedElement | null) => void
}) {
  const glowRef = useRef<THREE.Mesh>(null)
  const glowIntensity = Math.min(1 / msg.pValue / 1000, 1.0) * 0.6 + 0.2

  useFrame((state) => {
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = glowIntensity + Math.sin(state.clock.elapsedTime * 2) * 0.15
    }
  })

  const firstPos = toWorld(msg.positions[0][0], msg.positions[0][1])

  // Compute bounding rectangle for the line outline
  const rows = msg.positions.map((p) => p[0])
  const cols = msg.positions.map((p) => p[1])
  const minRow = Math.min(...rows)
  const maxRow = Math.max(...rows)
  const minCol = Math.min(...cols)
  const maxCol = Math.max(...cols)
  const pad = 0.2
  const rectCorners: [number, number, number][] = [
    [((minCol / 127) * 20) - 10 - pad, 2.0, ((minRow / 127) * 20) - 10 - pad],
    [((maxCol / 127) * 20) - 10 + pad, 2.0, ((minRow / 127) * 20) - 10 - pad],
    [((maxCol / 127) * 20) - 10 + pad, 2.0, ((maxRow / 127) * 20) - 10 + pad],
    [((minCol / 127) * 20) - 10 - pad, 2.0, ((maxRow / 127) * 20) - 10 + pad],
    [((minCol / 127) * 20) - 10 - pad, 2.0, ((minRow / 127) * 20) - 10 - pad],
  ]

  return (
    <group>
      {/* Glow backing mesh behind the text */}
      <mesh
        ref={glowRef}
        position={[firstPos[0], firstPos[1] + 0.6, firstPos[2]]}
        onClick={(e) => {
          e.stopPropagation()
          onSelect({
            type: 'message',
            text: msg.text,
            method: msg.method,
            positions: msg.positions as unknown as number[][],
            pValue: msg.pValue,
          })
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        <planeGeometry args={[msg.text.length * 0.28 + 0.3, 0.4]} />
        <meshStandardMaterial
          color={msg.color}
          emissive={msg.color}
          emissiveIntensity={glowIntensity}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Message text label */}
      <Text
        position={[firstPos[0], firstPos[1] + 0.6, firstPos[2] + 0.01]}
        fontSize={0.25}
        color={msg.color}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.9}
        fontWeight="bold"
      >
        {msg.text}
      </Text>

      {/* Method sub-label */}
      <Text
        position={[firstPos[0], firstPos[1] + 0.3, firstPos[2] + 0.01]}
        fontSize={0.1}
        color={msg.color}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.4}
      >
        {msg.method} (p={msg.pValue})
      </Text>

      {/* Rectangle outline around all positions */}
      <Line
        points={rectCorners}
        color={msg.color}
        lineWidth={1.5}
        transparent
        opacity={0.4}
      />

      {/* Small diamond marker at each position */}
      {msg.positions.map((pos, i) => {
        const w = toWorld(pos[0], pos[1])
        return (
          <mesh key={`msg-pos-${msg.text}-${i}`} position={w}>
            <octahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial
              color={msg.color}
              emissive={msg.color}
              emissiveIntensity={0.3}
              metalness={0.5}
              roughness={0.3}
            />
          </mesh>
        )
      })}
    </group>
  )
}

export function EncodedMessagesLayer({ onSelect }: EncodedMessagesLayerProps) {
  return (
    <group>
      {/* Section title */}
      <Text position={[8, 3, -11]} fontSize={0.18} color="#EC4899" fillOpacity={0.35} anchorX="center">
        ENCODED MESSAGES
      </Text>
      <Text position={[8, 2.6, -11]} fontSize={0.1} color="white" fillOpacity={0.2} anchorX="center">
        {`${ENCODED_MESSAGES.length} validated messages · Monte Carlo p < 0.05`}
      </Text>

      {ENCODED_MESSAGES.map((msg) => (
        <MessageGroup
          key={`msg-${msg.text}`}
          msg={msg}
          onSelect={onSelect}
        />
      ))}
    </group>
  )
}
