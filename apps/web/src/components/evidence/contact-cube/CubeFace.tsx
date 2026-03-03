'use client'

import { useRef, useMemo, useEffect, useCallback } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { CubeFaceData, ColorTheme, FaceTransform, AnomalyCell } from './types'
import { CUBE_FACE_SIZE, COLOR_THEMES, DEPTH_SCALE, CELL_SIZE, CUBE_SCALE } from './constants'

interface CubeFaceProps {
  faceData: CubeFaceData
  transform: FaceTransform
  colorTheme: ColorTheme
  opacity?: number
  showDepth?: boolean
  highlightAnomalies?: boolean
  selectedAnomaly?: AnomalyCell | null
  onCellClick?: (row: number, col: number, value: number) => void
  onCellHover?: (row: number, col: number, value: number) => void
}

// Calculate color based on value and theme
function getValueColor(value: number, theme: ColorTheme): THREE.Color {
  const colors = COLOR_THEMES[theme]

  if (value < 0) {
    // Negative: interpolate from zero to negative color
    const intensity = Math.min(Math.abs(value) / 128, 1)
    const color = new THREE.Color(colors.zero)
    color.lerp(new THREE.Color(colors.negative), intensity)
    return color
  } else if (value > 0) {
    // Positive: interpolate from zero to positive color
    const intensity = Math.min(value / 128, 1)
    const color = new THREE.Color(colors.zero)
    color.lerp(new THREE.Color(colors.positive), intensity)
    return color
  }

  return new THREE.Color(colors.zero)
}

// Check if cell is an anomaly
function isAnomalyCell(row: number, col: number, anomalies: AnomalyCell[]): AnomalyCell | undefined {
  return anomalies.find(
    (a) => a.localPos && a.localPos[0] === row && a.localPos[1] === col
  )
}

export function CubeFace({
  faceData,
  transform,
  colorTheme,
  opacity = 1,
  showDepth = true,
  highlightAnomalies = true,
  selectedAnomaly,
  onCellClick,
  onCellHover,
}: CubeFaceProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const totalCells = CUBE_FACE_SIZE * CUBE_FACE_SIZE

  // Create geometry and material
  const cellGeometry = useMemo(() => {
    // Slightly smaller than cell size to create gaps
    const size = CELL_SIZE * 0.95
    return new THREE.BoxGeometry(size, size, size * 0.5)
  }, [])

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      transparent: opacity < 1,
      opacity,
      roughness: 0.7,
      metalness: 0.2,
    })
  }, [opacity])

  // Dummy object for matrix calculations
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colorArray = useMemo(() => new Float32Array(totalCells * 3), [totalCells])

  // Update instances when data changes
  useEffect(() => {
    if (!meshRef.current || !faceData.cells) return

    const mesh = meshRef.current
    let instanceIndex = 0

    // Center offset
    const halfSize = (CUBE_FACE_SIZE * CELL_SIZE) / 2

    for (let row = 0; row < CUBE_FACE_SIZE; row++) {
      const rowData = faceData.cells[row]
      if (!rowData) continue

      for (let col = 0; col < CUBE_FACE_SIZE; col++) {
        const value = rowData[col] ?? 0

        // Position within face
        const x = col * CELL_SIZE - halfSize + CELL_SIZE / 2
        const y = -(row * CELL_SIZE - halfSize + CELL_SIZE / 2) // Flip Y

        // Z-depth based on XOR value
        const z = showDepth ? (value / 127) * DEPTH_SCALE * 0.5 : 0

        dummy.position.set(x, y, z)
        dummy.updateMatrix()
        mesh.setMatrixAt(instanceIndex, dummy.matrix)

        // Color
        const anomaly = highlightAnomalies ? isAnomalyCell(row, col, faceData.anomalies) : undefined
        let color: THREE.Color

        if (anomaly) {
          // Highlight anomalies
          if (anomaly.special) {
            color = new THREE.Color('#FFD700') // Gold for special [22,22]
          } else if (selectedAnomaly?.pos[0] === anomaly.pos[0] && selectedAnomaly?.pos[1] === anomaly.pos[1]) {
            color = new THREE.Color('#00FFFF') // Cyan for selected
          } else {
            color = new THREE.Color('#FF6B6B') // Red for anomalies
          }
        } else {
          color = getValueColor(value, colorTheme)
        }

        colorArray[instanceIndex * 3] = color.r
        colorArray[instanceIndex * 3 + 1] = color.g
        colorArray[instanceIndex * 3 + 2] = color.b

        instanceIndex++
      }
    }

    mesh.instanceMatrix.needsUpdate = true

    // Apply instance colors
    mesh.geometry.setAttribute('color', new THREE.InstancedBufferAttribute(colorArray, 3))
    mesh.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      transparent: opacity < 1,
      opacity,
      roughness: 0.7,
      metalness: 0.2,
    })
  }, [faceData, colorTheme, showDepth, highlightAnomalies, selectedAnomaly, opacity, dummy, colorArray])

  // Animate position and rotation
  useFrame(() => {
    if (!meshRef.current) return

    // Apply transform from parent
    meshRef.current.position.set(...transform.position)
    meshRef.current.rotation.set(...transform.rotation)
  })

  // Handle pointer events using ThreeEvent
  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!onCellHover || !meshRef.current) return

    // Stop propagation to prevent other handlers
    event.stopPropagation()

    // Get instanceId from the intersection
    const instanceId = event.instanceId
    if (instanceId === undefined) return

    const row = Math.floor(instanceId / CUBE_FACE_SIZE)
    const col = instanceId % CUBE_FACE_SIZE

    const globalRow = faceData.rowRange[0] + row
    const globalCol = faceData.colRange[0] + col
    const value = faceData.cells[row]?.[col] ?? 0

    onCellHover(globalRow, globalCol, value)
  }, [onCellHover, faceData.rowRange, faceData.colRange, faceData.cells])

  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    if (!onCellClick || !meshRef.current) return

    // Stop propagation to prevent other handlers
    event.stopPropagation()

    const instanceId = event.instanceId
    if (instanceId === undefined) return

    const row = Math.floor(instanceId / CUBE_FACE_SIZE)
    const col = instanceId % CUBE_FACE_SIZE

    const globalRow = faceData.rowRange[0] + row
    const globalCol = faceData.colRange[0] + col
    const value = faceData.cells[row]?.[col] ?? 0

    onCellClick(globalRow, globalCol, value)
  }, [onCellClick, faceData.rowRange, faceData.colRange, faceData.cells])

  // Handle pointer leave
  const handlePointerOut = useCallback(() => {
    // This will be handled by parent via onPointerMissed on Canvas
  }, [])

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[cellGeometry, material, totalCells]}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        castShadow
        receiveShadow
        frustumCulled={false}
      />
    </group>
  )
}

// Outline for cube face edges
export function CubeFaceOutline({
  transform,
  color = '#ffffff',
  opacity = 0.3,
}: {
  transform: FaceTransform
  color?: string
  opacity?: number
}) {
  const lineRef = useRef<THREE.LineSegments>(null)

  const geometry = useMemo(() => {
    const halfSize = CUBE_SCALE / 2
    const points = [
      // Bottom edges
      new THREE.Vector3(-halfSize, -halfSize, 0),
      new THREE.Vector3(halfSize, -halfSize, 0),
      new THREE.Vector3(halfSize, -halfSize, 0),
      new THREE.Vector3(halfSize, halfSize, 0),
      new THREE.Vector3(halfSize, halfSize, 0),
      new THREE.Vector3(-halfSize, halfSize, 0),
      new THREE.Vector3(-halfSize, halfSize, 0),
      new THREE.Vector3(-halfSize, -halfSize, 0),
    ]

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    return geometry
  }, [])

  useFrame(() => {
    if (!lineRef.current) return
    lineRef.current.position.set(...transform.position)
    lineRef.current.rotation.set(...transform.rotation)
  })

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </lineSegments>
  )
}
