'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CubeFaceData, ColorTheme } from './types'
import { CUBE_FACE_SIZE, COLOR_THEMES, DEPTH_SCALE, CELL_SIZE, CUBE_SCALE } from './constants'

interface OverlayComparisonProps {
  face1: CubeFaceData
  face2: CubeFaceData
  colorTheme: ColorTheme
  showDifference?: boolean
  animate?: boolean
}

// Calculate the difference between two values
function calculateDifference(value1: number, value2: number): {
  difference: number
  isMatch: boolean
  matchType: 'exact' | 'symmetric' | 'anomaly'
} {
  const difference = Math.abs(value1 - value2)
  const isSymmetric = value1 + value2 === 0
  const isExact = value1 === value2

  return {
    difference,
    isMatch: isExact || isSymmetric,
    matchType: isExact ? 'exact' : isSymmetric ? 'symmetric' : 'anomaly',
  }
}

// Get color based on match type
function getMatchColor(matchType: 'exact' | 'symmetric' | 'anomaly', theme: ColorTheme): THREE.Color {
  switch (matchType) {
    case 'exact':
      return new THREE.Color('#22C55E') // Green - exact match
    case 'symmetric':
      return new THREE.Color('#3B82F6') // Blue - symmetric (a + b = 0)
    case 'anomaly':
      return new THREE.Color('#EF4444') // Red - anomaly
  }
}

export function OverlayComparison({
  face1,
  face2,
  colorTheme,
  showDifference = true,
  animate = true,
}: OverlayComparisonProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const [animationProgress, setAnimationProgress] = useState(0)

  const totalCells = CUBE_FACE_SIZE * CUBE_FACE_SIZE

  // Geometry and material
  const cellGeometry = useMemo(() => {
    const size = CELL_SIZE * 0.9
    return new THREE.BoxGeometry(size, size, size * 0.3)
  }, [])

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0.8,
      roughness: 0.5,
      metalness: 0.3,
    })
  }, [])

  // Dummy for matrix calculations
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colorArray = useMemo(() => new Float32Array(totalCells * 3), [totalCells])

  // Animation effect
  useEffect(() => {
    if (!animate) {
      setAnimationProgress(1)
      return
    }

    let frame: number
    const startTime = Date.now()
    const duration = 1500

    const animateProgress = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimationProgress(eased)

      if (progress < 1) {
        frame = requestAnimationFrame(animateProgress)
      }
    }

    frame = requestAnimationFrame(animateProgress)
    return () => cancelAnimationFrame(frame)
  }, [animate])

  // Update instances
  useEffect(() => {
    if (!meshRef.current || !face1.cells || !face2.cells) return

    const mesh = meshRef.current
    let instanceIndex = 0

    const halfSize = (CUBE_FACE_SIZE * CELL_SIZE) / 2

    // Statistics
    let exactMatches = 0
    let symmetricMatches = 0
    let anomalies = 0

    for (let row = 0; row < CUBE_FACE_SIZE; row++) {
      const row1Data = face1.cells[row]
      const row2Data = face2.cells[row]
      if (!row1Data || !row2Data) continue

      for (let col = 0; col < CUBE_FACE_SIZE; col++) {
        const value1 = row1Data[col] ?? 0
        // For opposing face, we compare mirrored positions
        const mirrorRow = CUBE_FACE_SIZE - 1 - row
        const mirrorCol = CUBE_FACE_SIZE - 1 - col
        const value2 = face2.cells[mirrorRow]?.[mirrorCol] ?? 0

        const { difference, matchType } = calculateDifference(value1, value2)

        // Position
        const x = col * CELL_SIZE - halfSize + CELL_SIZE / 2
        const y = -(row * CELL_SIZE - halfSize + CELL_SIZE / 2)

        // Z based on difference (scaled by animation)
        const z = showDifference
          ? (difference / 256) * DEPTH_SCALE * animationProgress
          : 0

        dummy.position.set(x, y, z)
        dummy.updateMatrix()
        mesh.setMatrixAt(instanceIndex, dummy.matrix)

        // Color based on match type
        const color = getMatchColor(matchType, colorTheme)
        colorArray[instanceIndex * 3] = color.r
        colorArray[instanceIndex * 3 + 1] = color.g
        colorArray[instanceIndex * 3 + 2] = color.b

        // Count statistics
        if (matchType === 'exact') exactMatches++
        else if (matchType === 'symmetric') symmetricMatches++
        else anomalies++

        instanceIndex++
      }
    }

    mesh.instanceMatrix.needsUpdate = true
    mesh.geometry.setAttribute('color', new THREE.InstancedBufferAttribute(colorArray, 3))

    // Update material to use vertex colors
    mesh.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      roughness: 0.5,
      metalness: 0.3,
    })
  }, [face1, face2, colorTheme, showDifference, animationProgress, dummy, colorArray])

  // Gentle rotation
  useFrame(({ clock }) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.2) * 0.1
  })

  return (
    <group position={[0, 0, 0]}>
      <instancedMesh
        ref={meshRef}
        args={[cellGeometry, material, totalCells]}
        castShadow
        receiveShadow
      />

      {/* Legend */}
      <OverlayLegend position={[-CUBE_SCALE - 2, 0, 0]} />
    </group>
  )
}

// Legend explaining the color coding
function OverlayLegend({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Exact match indicator */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color="#22C55E" />
      </mesh>

      {/* Symmetric match indicator */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color="#3B82F6" />
      </mesh>

      {/* Anomaly indicator */}
      <mesh position={[0, -1, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color="#EF4444" />
      </mesh>
    </group>
  )
}

// Primer display (TRUE/FALSE grid like in Contact movie)
export function PrimerDisplay({
  face1,
  face2,
  position,
}: {
  face1: CubeFaceData
  face2: CubeFaceData
  position: [number, number, number]
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  // Simplified 8x8 primer grid
  const gridSize = 8
  const totalCells = gridSize * gridSize

  const geometry = useMemo(() => new THREE.CircleGeometry(0.15, 16), [])
  const material = useMemo(() => new THREE.MeshBasicMaterial(), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    if (!meshRef.current) return

    const mesh = meshRef.current
    const cellSpacing = 0.4

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const index = row * gridSize + col

        // Sample from face data
        const sampleRow = Math.floor((row / gridSize) * CUBE_FACE_SIZE)
        const sampleCol = Math.floor((col / gridSize) * CUBE_FACE_SIZE)

        const value1 = face1.cells[sampleRow]?.[sampleCol] ?? 0
        const mirrorRow = CUBE_FACE_SIZE - 1 - sampleRow
        const mirrorCol = CUBE_FACE_SIZE - 1 - sampleCol
        const value2 = face2.cells[mirrorRow]?.[mirrorCol] ?? 0

        const { isMatch } = calculateDifference(value1, value2)

        // Position in grid
        const x = col * cellSpacing - (gridSize * cellSpacing) / 2
        const y = -row * cellSpacing + (gridSize * cellSpacing) / 2

        dummy.position.set(x, y, 0)
        dummy.updateMatrix()
        mesh.setMatrixAt(index, dummy.matrix)

        // Color: filled = TRUE, empty outline = FALSE
        const colorAttr = mesh.geometry.getAttribute('color') as THREE.BufferAttribute
        if (colorAttr) {
          const color = isMatch ? new THREE.Color('#22C55E') : new THREE.Color('#333333')
          colorAttr.setXYZ(index, color.r, color.g, color.b)
        }
      }
    }

    mesh.instanceMatrix.needsUpdate = true
  }, [face1, face2, dummy])

  return (
    <group position={position}>
      <instancedMesh ref={meshRef} args={[geometry, material, totalCells]} />

      {/* Title */}
      <mesh position={[0, 2, 0]}>
        <planeGeometry args={[3, 0.5]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.5} />
      </mesh>
    </group>
  )
}
