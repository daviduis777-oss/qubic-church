'use client'

import { useRef, useEffect, useMemo } from 'react'
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

/** The only cell where value === mirror_value */
const SPECIAL_CELL = { row: 22, col: 22 }

export function MatrixTerrainLayer({
  matrix,
  onSelect,
  showXorOverlay = false,
}: MatrixTerrainLayerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const pulseRingRef = useRef<THREE.Mesh>(null)
  const pulseGlowRef = useRef<THREE.Mesh>(null)
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
    const neutralColor = new THREE.Color(
      RESEARCH_SCENE_CONFIG.COLORS.terrainNeutral
    )
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
        const xorVal =
          mirrorR >= 0 && mirrorR < rows && mirrorC >= 0 && mirrorC < cols
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
  useFrame(state => {
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
  })

  // Compute the world-space position for cell [22,22]
  const specialPos = useMemo(() => {
    const x = (SPECIAL_CELL.col / 127) * 20 - 10
    const z = (SPECIAL_CELL.row / 127) * 20 - 10
    // Get the terrain height at this cell
    let maxVal = 1
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = Math.abs(matrix[r]![c]!)
        if (v > maxVal) maxVal = v
      }
    }
    const val =
      rows > SPECIAL_CELL.row && cols > SPECIAL_CELL.col
        ? matrix[SPECIAL_CELL.row]![SPECIAL_CELL.col]!
        : 0
    const y = (val / maxVal) * 3.0
    return [x, y + 0.3, z] as [number, number, number]
  }, [matrix, rows, cols])

  // Border frame corners (terrain spans -10 to +10 in X and Z)
  const borderPoints = useMemo(
    () => [
      [-10, 0.15, -10] as [number, number, number],
      [10, 0.15, -10] as [number, number, number],
      [10, 0.15, 10] as [number, number, number],
      [-10, 0.15, 10] as [number, number, number],
      [-10, 0.15, -10] as [number, number, number],
    ],
    []
  )

  return (
    <group
      position={[0, RESEARCH_SCENE_CONFIG.LAYERS.terrain.yOffset, 0]}
      ref={groupRef}
    >
      {/* === Particle sparkles floating above the terrain === */}
      <Sparkles
        color="#D4AF37"
        count={120}
        opacity={0.2}
        position={[0, 3, 0]}
        scale={[22, 6, 22]}
        size={1.8}
        speed={0.4}
      />
      <Sparkles
        color="#88CCFF"
        count={60}
        opacity={0.12}
        position={[0, 4.5, 0]}
        scale={[18, 4, 18]}
        size={1.2}
        speed={0.25}
      />

      {/* === Glow edge frame at terrain border === */}
      <Line
        color="#3B82F6"
        lineWidth={2}
        opacity={0.35}
        points={borderPoints}
        transparent
      />
      {/* Second brighter inner frame for glow effect */}
      <Line
        color="#60A5FA"
        lineWidth={1}
        opacity={0.15}
        points={[
          [-9.9, 0.2, -9.9],
          [9.9, 0.2, -9.9],
          [9.9, 0.2, 9.9],
          [-9.9, 0.2, 9.9],
          [-9.9, 0.2, -9.9],
        ]}
        transparent
      />

      {/* === Pulsing ring at [22,22], the unique value=mirror_value cell === */}
      <group position={specialPos}>
        {/* Ring */}
        <mesh ref={pulseRingRef} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.04, 16, 32]} />
          <meshBasicMaterial
            color="#FFD93D"
            depthWrite={false}
            opacity={0.5}
            transparent
          />
        </mesh>
        {/* Glow disc underneath */}
        <mesh
          position={[0, -0.05, 0]}
          ref={pulseGlowRef}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[0.7, 32]} />
          <meshBasicMaterial
            color="#FFD93D"
            depthWrite={false}
            opacity={0.15}
            side={THREE.DoubleSide}
            transparent
          />
        </mesh>
        {/* Vertical beam above the ring */}
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.02, 0.06, 3, 8]} />
          <meshBasicMaterial color="#FFD93D" opacity={0.25} transparent />
        </mesh>
        {/* Label */}
        <Text
          anchorX="center"
          anchorY="middle"
          color="#FFD93D"
          fillOpacity={0.6}
          font={undefined}
          fontSize={0.2}
          position={[0, 3.3, 0]}
        >
          [22,22]
        </Text>
        <Text
          anchorX="center"
          anchorY="middle"
          color="white"
          fillOpacity={0.3}
          font={undefined}
          fontSize={0.14}
          position={[0, 3.0, 0]}
        >
          value = mirror
        </Text>
      </group>
    </group>
  )
}
