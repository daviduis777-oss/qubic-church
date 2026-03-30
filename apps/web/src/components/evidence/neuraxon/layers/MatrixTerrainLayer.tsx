'use client'

import { useRef, useEffect, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line, Text, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { RESEARCH_SCENE_CONFIG } from '../config'
import type { SelectedElement } from '../types'

interface MatrixTerrainLayerProps {
  matrix: number[][]
  onSelect: (element: SelectedElement | null) => void
  showXorOverlay?: boolean
}

/** Row stratification labels */
const ROW_LABELS = [
  { row: 21, label: 'INPUT', color: '#22C55E' },
  { row: 68, label: 'TRANSFORM', color: '#F59E0B' },
  { row: 96, label: 'OUTPUT', color: '#EF4444' },
] as const

/** The only cell where value === mirror_value */
const SPECIAL_CELL = { row: 22, col: 22 }

/** Fibonacci indices on the diagonal */
const FIBONACCI_INDICES = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89]

/** Prime indices on the diagonal (primes <= 127) */
const PRIME_INDICES = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47,
  53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127,
]

/** M[99,99] = 42 — "The Answer" */
const ANSWER_CELL = { row: 99, col: 99 }

/** Convert matrix [row,col] to terrain XZ coordinates */
function cellToTerrain(row: number, col: number): [number, number] {
  return [((col / 127) * 20) - 10, ((row / 127) * 20) - 10]
}

export function MatrixTerrainLayer({ matrix, onSelect, showXorOverlay = false }: MatrixTerrainLayerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const pulseRingRef = useRef<THREE.Mesh>(null)
  const pulseGlowRef = useRef<THREE.Mesh>(null)
  const answerSphereRef = useRef<THREE.Mesh>(null)
  const answerBeamRef = useRef<THREE.Mesh>(null)
  const rows = matrix.length
  const cols = matrix[0]?.length ?? 0

  // Build the terrain mesh + wireframe overlay imperatively and add to group
  useEffect(() => {
    const group = groupRef.current
    if (!group) return

    // Remove old meshes if re-rendering
    const existingTerrain = group.getObjectByName('terrain-mesh')
    if (existingTerrain) group.remove(existingTerrain)
    const existingWire = group.getObjectByName('terrain-wireframe')
    if (existingWire) group.remove(existingWire)

    // --- Terrain mesh ---
    const geo = new THREE.PlaneGeometry(20, 20, cols - 1, rows - 1)
    geo.rotateX(-Math.PI / 2)

    const pos = geo.attributes.position as THREE.BufferAttribute
    const colorArr = new Float32Array(pos.count * 3)
    let maxVal = 1

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = Math.abs(matrix[r]![c]!)
        if (v > maxVal) maxVal = v
      }
    }

    const negColor = new THREE.Color(RESEARCH_SCENE_CONFIG.COLORS.terrainNeg)
    const neutralColor = new THREE.Color(RESEARCH_SCENE_CONFIG.COLORS.terrainNeutral)
    const posColor = new THREE.Color(RESEARCH_SCENE_CONFIG.COLORS.terrainPos)
    const tmpColor = new THREE.Color()

    for (let i = 0; i < pos.count; i++) {
      const c = i % cols
      const r = Math.floor(i / cols)
      const val = r < rows && c < cols ? matrix[r]![c]! : 0
      const norm = val / maxVal

      pos.setY(i, norm * 3.0)

      if (norm > 0) tmpColor.lerpColors(neutralColor, posColor, norm)
      else if (norm < 0) tmpColor.lerpColors(neutralColor, negColor, -norm)
      else tmpColor.copy(neutralColor)

      if (r === 21) tmpColor.lerp(new THREE.Color('#22C55E'), 0.4)
      else if (r === 68) tmpColor.lerp(new THREE.Color('#F59E0B'), 0.4)
      else if (r === 96) tmpColor.lerp(new THREE.Color('#EF4444'), 0.4)

      colorArr[i * 3] = tmpColor.r
      colorArr[i * 3 + 1] = tmpColor.g
      colorArr[i * 3 + 2] = tmpColor.b
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3))
    pos.needsUpdate = true
    geo.computeVertexNormals()

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      metalness: 0.3,
      roughness: 0.4,
      emissive: new THREE.Color('#556677'),
      emissiveIntensity: 0.5,
      side: THREE.DoubleSide,
    })

    const mesh = new THREE.Mesh(geo, mat)
    mesh.name = 'terrain-mesh'
    group.add(mesh)

    // --- Wireframe overlay (separate geometry instance) ---
    const wireGeo = new THREE.PlaneGeometry(20, 20, cols - 1, rows - 1)
    wireGeo.rotateX(-Math.PI / 2)
    const wirePos = wireGeo.attributes.position as THREE.BufferAttribute
    // Copy Y positions from terrain
    for (let i = 0; i < wirePos.count; i++) {
      wirePos.setY(i, pos.getY(i))
    }
    wirePos.needsUpdate = true

    const wireMat = new THREE.MeshBasicMaterial({
      color: '#88CCFF',
      wireframe: true,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
    })

    const wireMesh = new THREE.Mesh(wireGeo, wireMat)
    wireMesh.name = 'terrain-wireframe'
    wireMesh.position.y = 0.02
    group.add(wireMesh)

    // --- XOR Heatmap Overlay ---
    const xorGeo = new THREE.PlaneGeometry(20, 20, cols - 1, rows - 1)
    xorGeo.rotateX(-Math.PI / 2)
    const xorPos = xorGeo.attributes.position as THREE.BufferAttribute
    const xorColors = new Float32Array(xorPos.count * 3)
    const magenta = new THREE.Color('#EC4899')

    for (let i = 0; i < xorPos.count; i++) {
      xorPos.setY(i, pos.getY(i))
      const c = i % cols
      const r = Math.floor(i / cols)
      if (r < rows && c < cols) {
        const mirrorR = 127 - r
        const mirrorC = 127 - c
        const xorVal = mirrorR >= 0 && mirrorR < rows && mirrorC >= 0 && mirrorC < cols
          ? matrix[r]![c]! ^ matrix[mirrorR]![mirrorC]!
          : 0
        const intensity = xorVal !== 0 ? Math.min(Math.abs(xorVal) / 255, 1) : 0
        xorColors[i * 3] = magenta.r * intensity
        xorColors[i * 3 + 1] = magenta.g * intensity
        xorColors[i * 3 + 2] = magenta.b * intensity
      }
    }
    xorPos.needsUpdate = true
    xorGeo.setAttribute('color', new THREE.BufferAttribute(xorColors, 3))

    const xorMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    })
    const xorMesh = new THREE.Mesh(xorGeo, xorMat)
    xorMesh.name = 'xor-overlay'
    xorMesh.position.y = 0.05
    xorMesh.visible = showXorOverlay
    group.add(xorMesh)

    return () => {
      group.remove(mesh)
      group.remove(wireMesh)
      group.remove(xorMesh)
      geo.dispose()
      mat.dispose()
      wireGeo.dispose()
      wireMat.dispose()
      xorGeo.dispose()
      xorMat.dispose()
    }
  }, [matrix, rows, cols, showXorOverlay])

  // Breathing animation + pulsing ring
  useFrame((state) => {
    const t = state.clock.elapsedTime

    // Breathing: gentle Y-scale oscillation on the whole group
    if (groupRef.current) {
      const breathe = 1.0 + Math.sin(t * 0.6) * 0.035
      groupRef.current.scale.y = breathe
    }

    // Pulsing ring at [22,22]
    if (pulseRingRef.current) {
      const pulse = 0.8 + Math.sin(t * 2.5) * 0.4
      pulseRingRef.current.scale.set(pulse, pulse, pulse)
      const ringMat = pulseRingRef.current.material as THREE.MeshBasicMaterial
      ringMat.opacity = 0.3 + Math.sin(t * 2.5) * 0.25
    }

    // Glow disc under the ring
    if (pulseGlowRef.current) {
      const glowPulse = 1.0 + Math.sin(t * 1.8) * 0.3
      pulseGlowRef.current.scale.set(glowPulse, glowPulse, glowPulse)
      const glowMat = pulseGlowRef.current.material as THREE.MeshBasicMaterial
      glowMat.opacity = 0.12 + Math.sin(t * 1.8) * 0.08
    }

    // Pulsing golden sphere at M[99,99] = 42
    if (answerSphereRef.current) {
      const aPulse = 0.85 + Math.sin(t * 2.0) * 0.25
      answerSphereRef.current.scale.set(aPulse, aPulse, aPulse)
      const aMat = answerSphereRef.current.material as THREE.MeshBasicMaterial
      aMat.opacity = 0.5 + Math.sin(t * 2.0) * 0.3
    }

    // Subtle vertical beam oscillation above M[99,99]
    if (answerBeamRef.current) {
      const bOp = 0.15 + Math.sin(t * 1.5) * 0.1
      const bMat = answerBeamRef.current.material as THREE.MeshBasicMaterial
      bMat.opacity = bOp
    }
  })

  // Compute the world-space position for cell [22,22]
  const specialPos = useMemo(() => {
    const x = ((SPECIAL_CELL.col / 127) * 20) - 10
    const z = ((SPECIAL_CELL.row / 127) * 20) - 10
    // Get the terrain height at this cell
    let maxVal = 1
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = Math.abs(matrix[r]![c]!)
        if (v > maxVal) maxVal = v
      }
    }
    const val = rows > SPECIAL_CELL.row && cols > SPECIAL_CELL.col
      ? matrix[SPECIAL_CELL.row]![SPECIAL_CELL.col]! : 0
    const y = (val / maxVal) * 3.0
    return [x, y + 0.3, z] as [number, number, number]
  }, [matrix, rows, cols])

  // Helper: compute maxVal once for terrain height lookups
  const maxVal = useMemo(() => {
    let mv = 1
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = Math.abs(matrix[r]![c]!)
        if (v > mv) mv = v
      }
    }
    return mv
  }, [matrix, rows, cols])

  // Get terrain Y for a given cell
  const getTerrainY = useCallback((row: number, col: number) => {
    if (row >= rows || col >= cols) return 0
    return (matrix[row]![col]! / maxVal) * 3.0
  }, [matrix, maxVal, rows, cols])

  // Fibonacci diagonal line points
  const fibonacciPoints = useMemo(() => {
    // Deduplicate consecutive identical indices (e.g. [1,1])
    const seen = new Set<number>()
    const unique: number[] = []
    for (const idx of FIBONACCI_INDICES) {
      if (!seen.has(idx)) {
        seen.add(idx)
        unique.push(idx)
      }
    }
    return unique.map(idx => {
      const [x, z] = cellToTerrain(idx, idx)
      const y = getTerrainY(idx, idx) + 0.25
      return [x, y, z] as [number, number, number]
    })
  }, [getTerrainY])

  // Prime diagonal line points
  const primePoints = useMemo(() => {
    return PRIME_INDICES.map(idx => {
      const [x, z] = cellToTerrain(idx, idx)
      const y = getTerrainY(idx, idx) + 0.2
      return [x, y, z] as [number, number, number]
    })
  }, [getTerrainY])

  // M[99,99] = 42 "The Answer" position
  const answerPos = useMemo(() => {
    const [x, z] = cellToTerrain(ANSWER_CELL.row, ANSWER_CELL.col)
    const y = getTerrainY(ANSWER_CELL.row, ANSWER_CELL.col)
    return [x, y + 0.4, z] as [number, number, number]
  }, [getTerrainY])

  // Border frame corners (terrain spans -10 to +10 in X and Z)
  const borderPoints = useMemo(() => [
    [-10, 0.15, -10] as [number, number, number],
    [10, 0.15, -10] as [number, number, number],
    [10, 0.15, 10] as [number, number, number],
    [-10, 0.15, 10] as [number, number, number],
    [-10, 0.15, -10] as [number, number, number],
  ], [])

  return (
    <group ref={groupRef} position={[0, RESEARCH_SCENE_CONFIG.LAYERS.terrain.yOffset, 0]}>

      {/* === Particle sparkles floating above the terrain === */}
      <Sparkles
        count={120}
        scale={[22, 6, 22]}
        position={[0, 3, 0]}
        size={1.8}
        speed={0.4}
        opacity={0.2}
        color="#D4AF37"
      />
      <Sparkles
        count={60}
        scale={[18, 4, 18]}
        position={[0, 4.5, 0]}
        size={1.2}
        speed={0.25}
        opacity={0.12}
        color="#88CCFF"
      />

      {/* === Glow edge frame at terrain border === */}
      <Line
        points={borderPoints}
        color="#3B82F6"
        lineWidth={2}
        transparent
        opacity={0.35}
      />
      {/* Second brighter inner frame for glow effect */}
      <Line
        points={[
          [-9.9, 0.2, -9.9],
          [9.9, 0.2, -9.9],
          [9.9, 0.2, 9.9],
          [-9.9, 0.2, 9.9],
          [-9.9, 0.2, -9.9],
        ]}
        color="#60A5FA"
        lineWidth={1}
        transparent
        opacity={0.15}
      />

      {/* === Row stratification markers + labels === */}
      {ROW_LABELS.map(({ row, label, color }) => {
        const z = ((row / 127) * 20) - 10
        return (
          <group key={`row-label-${row}`}>
            {/* Marker bar */}
            <mesh position={[-11, 0.5, z]}>
              <boxGeometry args={[0.6, 0.06, 0.06]} />
              <meshBasicMaterial color={color} />
            </mesh>
            {/* Glow line across the terrain at this row */}
            <Line
              points={[
                [-10, 0.12, z],
                [10, 0.12, z],
              ]}
              color={color}
              lineWidth={1}
              transparent
              opacity={0.1}
            />
            {/* Label text */}
            <Text
              position={[-12.5, 0.6, z]}
              fontSize={0.35}
              color={color}
              anchorX="center"
              anchorY="middle"
              fillOpacity={0.7}
              font={undefined}
            >
              {label}
            </Text>
            {/* Row number */}
            <Text
              position={[-12.5, 0.2, z]}
              fontSize={0.18}
              color="white"
              anchorX="center"
              anchorY="middle"
              fillOpacity={0.3}
              font={undefined}
            >
              {`Row ${row}`}
            </Text>
          </group>
        )
      })}

      {/* === Pulsing ring at [22,22] — the unique value=mirror_value cell === */}
      <group position={specialPos}>
        {/* Ring */}
        <mesh ref={pulseRingRef} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.04, 16, 32]} />
          <meshBasicMaterial
            color="#FFD93D"
            transparent
            opacity={0.5}
            depthWrite={false}
          />
        </mesh>
        {/* Glow disc underneath */}
        <mesh ref={pulseGlowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
          <circleGeometry args={[0.7, 32]} />
          <meshBasicMaterial
            color="#FFD93D"
            transparent
            opacity={0.15}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Vertical beam above the ring */}
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.02, 0.06, 3, 8]} />
          <meshBasicMaterial color="#FFD93D" transparent opacity={0.25} />
        </mesh>
        {/* Label */}
        <Text
          position={[0, 3.3, 0]}
          fontSize={0.2}
          color="#FFD93D"
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.6}
          font={undefined}
        >
          [22,22]
        </Text>
        <Text
          position={[0, 3.0, 0]}
          fontSize={0.14}
          color="white"
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.3}
          font={undefined}
        >
          value = mirror
        </Text>
      </group>

      {/* === Mathematical Markers === */}

      {/* Fibonacci Diagonal — golden line through Fibonacci-indexed diagonal cells */}
      {fibonacciPoints.length > 1 && (
        <group>
          <Line
            points={fibonacciPoints}
            color="#D4AF37"
            lineWidth={2}
            transparent
            opacity={0.4}
          />
          <Text
            position={[fibonacciPoints[0]![0] - 0.8, fibonacciPoints[0]![1] + 0.6, fibonacciPoints[0]![2] - 0.3]}
            fontSize={0.2}
            color="#D4AF37"
            anchorX="center"
            anchorY="middle"
            fillOpacity={0.5}
            font={undefined}
          >
            {'Fibonacci (sum=1)'}
          </Text>
        </group>
      )}

      {/* Prime Diagonal — blue line through prime-indexed diagonal cells */}
      {primePoints.length > 1 && (
        <group>
          <Line
            points={primePoints}
            color="#3B82F6"
            lineWidth={1.5}
            transparent
            opacity={0.3}
          />
          <Text
            position={[
              primePoints[primePoints.length - 1]![0] + 0.8,
              primePoints[primePoints.length - 1]![1] + 0.6,
              primePoints[primePoints.length - 1]![2] + 0.3,
            ]}
            fontSize={0.2}
            color="#3B82F6"
            anchorX="center"
            anchorY="middle"
            fillOpacity={0.5}
            font={undefined}
          >
            {'Primes (sum=121=11\u00B2)'}
          </Text>
        </group>
      )}

      {/* M[99,99] = 42 "The Answer" — pulsing golden sphere + vertical beam */}
      <group position={answerPos}>
        {/* Pulsing golden sphere */}
        <mesh ref={answerSphereRef}>
          <sphereGeometry args={[0.25, 24, 24]} />
          <meshBasicMaterial
            color="#D4AF37"
            transparent
            opacity={0.6}
            depthWrite={false}
          />
        </mesh>
        {/* Outer glow sphere */}
        <mesh>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshBasicMaterial
            color="#D4AF37"
            transparent
            opacity={0.1}
            depthWrite={false}
          />
        </mesh>
        {/* Vertical beam above */}
        <mesh ref={answerBeamRef} position={[0, 2.0, 0]}>
          <cylinderGeometry args={[0.015, 0.04, 4, 8]} />
          <meshBasicMaterial color="#D4AF37" transparent opacity={0.2} />
        </mesh>
        {/* "42" label */}
        <Text
          position={[0, 4.3, 0]}
          fontSize={0.35}
          color="#D4AF37"
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.7}
          font={undefined}
        >
          42
        </Text>
        {/* Subtitle */}
        <Text
          position={[0, 3.9, 0]}
          fontSize={0.15}
          color="white"
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.35}
          font={undefined}
        >
          M[99,99] — The Answer
        </Text>
      </group>

      {/* Column Sum = 42 indicator row along near edge */}
      <Text position={[0, 0.4, 10.5]} fontSize={0.18} color="#D4AF37" fillOpacity={0.35} anchorX="center">
        ALL 128 COLUMN SUMS = 42
      </Text>
      {Array.from({ length: 16 }, (_, i) => {
        const x = ((i * 8) / 127) * 20 - 10
        return (
          <mesh key={`colsum-${i}`} position={[x, 0.1, 10.2]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshBasicMaterial color="#D4AF37" transparent opacity={0.4} />
          </mesh>
        )
      })}
    </group>
  )
}
