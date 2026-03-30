'use client'

import { useMemo, useRef, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Float, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { RESEARCH_SCENE_CONFIG } from '../config'
import type { BridgeData, BridgeNode, SelectedElement } from '../types'

interface BridgeNetworkLayerProps {
  bridges: BridgeData
  onSelect: (element: SelectedElement | null) => void
}

const Y_OFFSET = RESEARCH_SCENE_CONFIG.LAYERS.bridges.yOffset
const SCALE = 1.5

// ---------------------------------------------------------------------------
// Sub-component: animated pulsing glow ring for special nodes
// ---------------------------------------------------------------------------
function GlowRing({ color, radius }: { color: string; radius: number }) {
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = Math.sin(state.clock.elapsedTime * 3) * 0.4 + 0.6
      mat.opacity = Math.sin(state.clock.elapsedTime * 2.5) * 0.15 + 0.45
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.8
    }
  })

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, radius * 0.12, 16, 48]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        transparent
        opacity={0.45}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// ---------------------------------------------------------------------------
// Sub-component: hover tooltip (a small billboard label that appears on hover)
// ---------------------------------------------------------------------------
function HoverTooltip({ node, yOffset }: { node: BridgeNode; yOffset: number }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle bob animation
      groupRef.current.position.y = yOffset + Math.sin(state.clock.elapsedTime * 4) * 0.05
    }
  })

  const label = node.special || node.name
  const subLabel = node.ternary_category

  return (
    <group ref={groupRef} position={[0, yOffset, 0]}>
      {/* Background pill */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[Math.max(label.length * 0.12, 1.0), 0.35]} />
        <meshBasicMaterial color="#0a0a0a" transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <Text
        position={[0, 0.02, 0]}
        fontSize={0.14}
        color="#D4AF37"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.95}
      >
        {label}
      </Text>
      {subLabel && (
        <Text
          position={[0, -0.2, 0]}
          fontSize={0.08}
          color="#9CA3AF"
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.7}
        >
          {subLabel}
        </Text>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function BridgeNetworkLayer({ bridges, onSelect }: BridgeNetworkLayerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  // Compute node positions, colors, sizes
  const nodePositions = useMemo(() => {
    return bridges.nodes.map((node) => ({
      pos: [
        node.position[0] * SCALE,
        node.position[1] * SCALE + Y_OFFSET,
        node.position[2] * SCALE,
      ] as [number, number, number],
      color: node.special ? '#D4AF37' : node.color,
      size: (node.special ? node.size * 1.8 : node.size) * 0.4,
      node,
    }))
  }, [bridges.nodes])

  // Centroid of all nodes for the hub sphere
  const centroid = useMemo((): [number, number, number] => {
    if (nodePositions.length === 0) return [0, Y_OFFSET, 0]
    let sx = 0
    let sy = 0
    let sz = 0
    for (const np of nodePositions) {
      sx += np.pos[0]
      sy += np.pos[1]
      sz += np.pos[2]
    }
    const n = nodePositions.length
    return [sx / n, sy / n, sz / n]
  }, [nodePositions])

  // Connection line data (unchanged logic)
  const nodeMap = useMemo(() => {
    const map = new Map<number, (typeof bridges.nodes)[0]>()
    for (const node of bridges.nodes) map.set(node.id, node)
    return map
  }, [bridges.nodes])

  const columnMap = useMemo(() => {
    const map = new Map<number, (typeof bridges.nodes)[0]>()
    for (const node of bridges.nodes) {
      if (node.metadata.column !== undefined) map.set(node.metadata.column, node)
    }
    return map
  }, [bridges.nodes])

  const lineData = useMemo(() => {
    const positions: number[] = []
    const colors: number[] = []

    for (const conn of bridges.connections) {
      const sourceNode = nodeMap.get(conn.source_id)
      if (!sourceNode) continue
      const targetNode = columnMap.get(conn.to_column)
      if (!targetNode) continue

      positions.push(
        sourceNode.position[0] * SCALE, sourceNode.position[1] * SCALE + Y_OFFSET, sourceNode.position[2] * SCALE,
        targetNode.position[0] * SCALE, targetNode.position[1] * SCALE + Y_OFFSET, targetNode.position[2] * SCALE,
      )
      const c = new THREE.Color(conn.type === 'symmetry' ? '#60A5FA' : '#D4AF37')
      colors.push(c.r, c.g, c.b, c.r, c.g, c.b)
    }
    return {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
      count: positions.length / 3,
    }
  }, [bridges, nodeMap, columnMap])

  // Pointer handlers
  const handlePointerOver = useCallback((id: number) => {
    setHoveredId(id)
    document.body.style.cursor = 'pointer'
  }, [])

  const handlePointerOut = useCallback(() => {
    setHoveredId(null)
    document.body.style.cursor = 'auto'
  }, [])

  // Slightly faster rotation + hub pulse
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05 + Math.sin(state.clock.elapsedTime * 0.2) * 0.15
    }
  })

  return (
    <group ref={groupRef}>
      {/* Sparkle particles floating around the network */}
      <Sparkles
        count={100}
        scale={[14, 10, 14]}
        position={[0, Y_OFFSET, 0]}
        size={1.2}
        speed={0.4}
        color="#D4AF37"
        opacity={0.5}
      />

      {/* Central hub indicator */}
      <CentralHub position={centroid} />

      {/* Individual node meshes */}
      {nodePositions.map((np) => {
        const isSpecial = !!np.node.special
        const isHovered = hoveredId === np.node.id
        const nodeScale = isHovered ? np.size * 1.6 : np.size

        const nodeContent = (
          <group key={`bnode-${np.node.id}`} position={np.pos}>
            {/* The node mesh */}
            <mesh
              scale={nodeScale}
              onClick={(e) => {
                e.stopPropagation()
                onSelect({ type: 'bridge-node', node: np.node })
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                handlePointerOver(np.node.id)
              }}
              onPointerOut={handlePointerOut}
            >
              <icosahedronGeometry args={[1, 1]} />
              <meshStandardMaterial
                color={np.color}
                emissive={np.color}
                emissiveIntensity={isHovered ? 0.7 : 0.3}
                metalness={0.5}
                roughness={0.3}
              />
            </mesh>

            {/* Glow ring for special nodes */}
            {isSpecial && <GlowRing color={np.color} radius={np.size * 2.2} />}

            {/* Permanent label for special nodes */}
            {isSpecial && (
              <Text
                position={[0, np.size * 2.0, 0]}
                fontSize={0.18}
                color="#D4AF37"
                anchorX="center"
                anchorY="middle"
                fillOpacity={0.8}
              >
                {np.node.special}
              </Text>
            )}

            {/* Hover tooltip */}
            {isHovered && <HoverTooltip node={np.node} yOffset={np.size * (isSpecial ? 2.8 : 1.8)} />}
          </group>
        )

        // Wrap special nodes in Float for gentle bobbing
        if (isSpecial) {
          return (
            <Float key={`bfloat-${np.node.id}`} speed={2} floatIntensity={0.5} rotationIntensity={0.1}>
              {nodeContent}
            </Float>
          )
        }

        return nodeContent
      })}

      {/* Connection lines (unchanged) */}
      {lineData.count > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[lineData.positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[lineData.colors, 3]} />
          </bufferGeometry>
          <lineBasicMaterial vertexColors transparent opacity={0.35} />
        </lineSegments>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Sub-component: Central hub — a pulsing transparent sphere at the centroid
// ---------------------------------------------------------------------------
function CentralHub({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const innerRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.opacity = Math.sin(t * 1.5) * 0.06 + 0.12
      meshRef.current.scale.setScalar(1 + Math.sin(t * 1.2) * 0.05)
    }
    if (innerRef.current) {
      const mat = innerRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = Math.sin(t * 2) * 0.3 + 0.5
      innerRef.current.rotation.y = t * 0.3
      innerRef.current.rotation.x = t * 0.15
    }
  })

  return (
    <group position={position}>
      {/* Outer transparent sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshStandardMaterial
          color="#D4AF37"
          emissive="#D4AF37"
          emissiveIntensity={0.15}
          transparent
          opacity={0.12}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Inner wireframe icosahedron */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[0.6, 1]} />
        <meshStandardMaterial
          color="#60A5FA"
          emissive="#60A5FA"
          emissiveIntensity={0.5}
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>
      {/* Hub label */}
      <Text
        position={[0, -3.0, 0]}
        fontSize={0.18}
        color="#60A5FA"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.35}
      >
        BRIDGE HUB
      </Text>
    </group>
  )
}
