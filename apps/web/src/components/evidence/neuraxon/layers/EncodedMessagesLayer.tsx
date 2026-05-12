'use client'

/**
 * Encoded Messages Layer — REWRITTEN 2026-05-11 after independent audit.
 *
 * The previous version rendered 4 "validated messages with Monte Carlo p < 0.05"
 * but only ONE (K-e-y) actually decodes correctly. Three others (GAME, CFB, RISE)
 * either decode to gibberish or have post-hoc transforms that don't reproduce the
 * claimed text. (Internal audit verified the falsifications.)
 *
 * This layer now renders:
 *   1. The VERIFIED K-e-y landmark (the only one that survives audit).
 *   2. A FALSIFICATION CALLOUT listing the three claims that did not survive,
 *      so we don't pretend the prior overclaims didn't exist.
 *
 * Monte Carlo p-value re-derived: probability of finding the K-e-y ASCII triple
 * at SOME diagonal-3 window of a random matrix using the same |abs|-as-ASCII
 * transform ≈ 0.05 (2 000 trials). Cited as such in the rendered card.
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Line } from '@react-three/drei'
import * as THREE from 'three'
import type { SelectedElement } from '../types'

interface EncodedMessagesLayerProps {
  onSelect: (element: SelectedElement | null) => void
}

interface VerifiedMessage {
  text: string
  /** Bracketed display showing exact ASCII values found at the positions. */
  displayDecoded: string
  /** What transform was applied. */
  method: string
  /** [row, col] of each cell. */
  positions: ReadonlyArray<readonly [number, number]>
  /** Raw cell values at the positions (signed int8). */
  rawCells: ReadonlyArray<number>
  /** Decoded ASCII codes after the transform. */
  decodedValues: ReadonlyArray<number>
  /** Empirical Monte Carlo p-value (2 000 trials, any-position match in random matrix). */
  pValueMC: number
  color: string
  /** What source citation backs this. */
  source: string
}

interface FalsifiedClaim {
  text: string
  method: string
  positions: ReadonlyArray<readonly [number, number]>
  /** What the cells ACTUALLY decode to under the claimed transform. */
  actualDecoded: string
}

const VERIFIED: ReadonlyArray<VerifiedMessage> = [
  {
    text: 'K-e-y',
    displayDecoded: 'K(75) e(101) y(121)',
    method: '|cell| as ASCII (signs: −, +, −)',
    positions: [[8, 74], [9, 75], [10, 76]],
    rawCells: [-75, 101, -121],
    decodedValues: [75, 101, 121],
    pValueMC: 0.050,
    color: '#22C55E',
    source: 'Phase E e15_numbertheory — verified Phase N V2',
  },
]

const FALSIFIED: ReadonlyArray<FalsifiedClaim> = [
  { text: 'GAME', method: 'XOR-127',  positions: [[8, 71], [8, 72], [8, 73], [8, 74]], actualDecoded: '"-k#4" (45/107/35/52, NOT GAME)' },
  { text: 'CFB',  method: '|abs|',    positions: [[11, 9], [11, 10], [11, 11]],        actualDecoded: '"DGC" (68/71/67, NOT CFB)' },
  { text: 'RISE', method: 'Mod-26',   positions: [[0, 17], [0, 18], [0, 19], [0, 20]],  actualDecoded: '"KLYI" or "JKXH" (10/11/24/8 mod 26, NOT RISE)' },
]

/** Matrix [row, col] → terrain world coordinates */
function toWorld(row: number, col: number): [number, number, number] {
  return [
    ((col / 127) * 20) - 10,
    2.0,
    ((row / 127) * 20) - 10,
  ]
}

function VerifiedMessageGroup({
  msg,
  onSelect,
}: {
  msg: VerifiedMessage
  onSelect: (element: SelectedElement | null) => void
}) {
  const glowRef = useRef<THREE.Mesh>(null)
  const baseIntensity = 0.5

  useFrame((state) => {
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = baseIntensity + Math.sin(state.clock.elapsedTime * 2) * 0.12
    }
  })

  const firstPos = toWorld(msg.positions[0]![0], msg.positions[0]![1])

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
      <mesh
        ref={glowRef}
        position={[firstPos[0] + 0.5, firstPos[1] + 0.7, firstPos[2]]}
        onClick={(e) => {
          e.stopPropagation()
          onSelect({
            type: 'message',
            text: msg.text,
            method: msg.method,
            positions: msg.positions as unknown as number[][],
            pValue: msg.pValueMC,
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
        <planeGeometry args={[msg.text.length * 0.25 + 0.4, 0.4]} />
        <meshStandardMaterial
          color={msg.color}
          emissive={msg.color}
          emissiveIntensity={baseIntensity}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <Text
        position={[firstPos[0] + 0.5, firstPos[1] + 0.7, firstPos[2] + 0.01]}
        fontSize={0.24}
        color={msg.color}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.95}
        fontWeight="bold"
      >
        {msg.text}
      </Text>

      <Text
        position={[firstPos[0] + 0.5, firstPos[1] + 0.4, firstPos[2] + 0.01]}
        fontSize={0.085}
        color={msg.color}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.45}
      >
        {`${msg.method} · MC p=${msg.pValueMC.toFixed(3)}`}
      </Text>

      <Line
        points={rectCorners}
        color={msg.color}
        lineWidth={1.5}
        transparent
        opacity={0.5}
      />

      {msg.positions.map((pos, i) => (
        <mesh key={`msg-pos-${msg.text}-${i}`} position={toWorld(pos[0], pos[1])}>
          <octahedronGeometry args={[0.09, 0]} />
          <meshStandardMaterial
            color={msg.color}
            emissive={msg.color}
            emissiveIntensity={0.35}
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  )
}

function FalsifiedMarker({ claim }: { claim: FalsifiedClaim }) {
  const firstPos = toWorld(claim.positions[0]![0], claim.positions[0]![1])
  // Render as a dim rose-coloured X-marker at the first position
  const rows = claim.positions.map((p) => p[0])
  const cols = claim.positions.map((p) => p[1])
  const minRow = Math.min(...rows)
  const maxRow = Math.max(...rows)
  const minCol = Math.min(...cols)
  const maxCol = Math.max(...cols)
  const rectCorners: [number, number, number][] = [
    [((minCol / 127) * 20) - 10 - 0.2, 1.95, ((minRow / 127) * 20) - 10 - 0.2],
    [((maxCol / 127) * 20) - 10 + 0.2, 1.95, ((minRow / 127) * 20) - 10 - 0.2],
    [((maxCol / 127) * 20) - 10 + 0.2, 1.95, ((maxRow / 127) * 20) - 10 + 0.2],
    [((minCol / 127) * 20) - 10 - 0.2, 1.95, ((maxRow / 127) * 20) - 10 + 0.2],
    [((minCol / 127) * 20) - 10 - 0.2, 1.95, ((minRow / 127) * 20) - 10 - 0.2],
  ]
  return (
    <group>
      <Line points={rectCorners} color="#9c2932" lineWidth={1} dashed dashSize={0.2} gapSize={0.1} opacity={0.55} transparent />
      <Text
        position={[firstPos[0] + 0.3, firstPos[1] + 0.45, firstPos[2] + 0.01]}
        fontSize={0.11}
        color="#9c2932"
        anchorX="left"
        anchorY="middle"
        fillOpacity={0.5}
      >
        {`✗ "${claim.text}" via ${claim.method}`}
      </Text>
      <Text
        position={[firstPos[0] + 0.3, firstPos[1] + 0.32, firstPos[2] + 0.01]}
        fontSize={0.06}
        color="#9c2932"
        anchorX="left"
        anchorY="middle"
        fillOpacity={0.4}
      >
        {claim.actualDecoded}
      </Text>
    </group>
  )
}

export function EncodedMessagesLayer({ onSelect }: EncodedMessagesLayerProps) {
  return (
    <group>
      {/* Section title */}
      <Text position={[8, 3.3, -11]} fontSize={0.18} color="#22C55E" fillOpacity={0.55} anchorX="center">
        ENCODED MESSAGES
      </Text>
      <Text position={[8, 3.0, -11]} fontSize={0.09} color="white" fillOpacity={0.3} anchorX="center">
        {`${VERIFIED.length} verified · ${FALSIFIED.length} falsified`}
      </Text>
      <Text position={[8, 2.82, -11]} fontSize={0.07} color="white" fillOpacity={0.2} anchorX="center">
        Empirical Monte Carlo p-value (2 000 random-matrix trials)
      </Text>

      {VERIFIED.map((msg) => (
        <VerifiedMessageGroup key={`v-${msg.text}`} msg={msg} onSelect={onSelect} />
      ))}

      {FALSIFIED.map((claim) => (
        <FalsifiedMarker key={`f-${claim.text}`} claim={claim} />
      ))}
    </group>
  )
}
