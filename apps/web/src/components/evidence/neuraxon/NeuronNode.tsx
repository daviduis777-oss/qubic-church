'use client'

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { QortexNode } from './types'

interface NeuronNodeProps {
  node: QortexNode
  isSelected: boolean
  isHighlighted: boolean
  onClick: (node: QortexNode) => void
  hasBitcoinAddress?: boolean
}

// Color mapping for states - using more vibrant colors
const STATE_COLORS = {
  '-1': new THREE.Color('#3B82F6'), // Blue for negative
  '0': new THREE.Color('#6B7280'), // Gray for zero
  '1': new THREE.Color('#F59E0B'), // Orange/Gold for positive
}

const STATE_GLOW_COLORS = {
  '-1': '#60A5FA', // Lighter blue for glow
  '0': '#9CA3AF', // Lighter gray for glow
  '1': '#FBBF24', // Lighter orange for glow
}

// Size mapping for types
const TYPE_SIZES = {
  input: 0.28,
  hidden: 0.16,
  output: 0.28,
}

// Geometry detail based on type
const TYPE_DETAIL = {
  input: 2,
  hidden: 1,
  output: 2,
}

export function NeuronNode({ node, isSelected, isHighlighted, onClick, hasBitcoinAddress = false }: NeuronNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const outerRingRef = useRef<THREE.Mesh>(null)
  const bitcoinIndicatorRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  const baseColor = STATE_COLORS[String(node.state) as keyof typeof STATE_COLORS]
  const glowColor = STATE_GLOW_COLORS[String(node.state) as keyof typeof STATE_GLOW_COLORS]
  const baseSize = TYPE_SIZES[node.type]
  const detail = TYPE_DETAIL[node.type]

  // Professional material with subtle reflectivity
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: baseColor,
      emissiveIntensity: 0.25,
      metalness: 0.6,
      roughness: 0.25,
      envMapIntensity: 0.5,
    })
  }, [baseColor])

  // Animate hover and selection with smoother transitions
  useFrame((state) => {
    if (!meshRef.current) return

    const time = state.clock.elapsedTime

    // Scale animation
    const targetScale = hovered || isSelected ? 1.6 : isHighlighted ? 1.4 : 1
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.12
    )

    // Emissive intensity based on state - subtle for professional look
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    const targetEmissive = isSelected ? 0.6 : hovered ? 0.4 : isHighlighted ? 0.3 : 0.25
    mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetEmissive, 0.1)

    // Pulse animation for selected nodes
    if (isSelected && meshRef.current) {
      const pulse = Math.sin(time * 4) * 0.08 + 1
      meshRef.current.scale.multiplyScalar(pulse)
    }

    // Glow pulse - subtle and professional
    if (glowRef.current) {
      const glowMat = glowRef.current.material as THREE.MeshBasicMaterial
      const glowPulse = isSelected
        ? Math.sin(time * 3) * 0.08 + 0.2
        : hovered
          ? 0.15
          : isHighlighted
            ? 0.1
            : 0.05
      glowMat.opacity = glowPulse

      // Scale glow slightly larger
      const glowScale = isSelected ? 2.0 : hovered ? 1.8 : 1.6
      glowRef.current.scale.lerp(
        new THREE.Vector3(glowScale, glowScale, glowScale),
        0.1
      )
    }

    // Rotating selection ring
    if (ringRef.current && isSelected) {
      ringRef.current.rotation.z = time * 1.5
      ringRef.current.rotation.x = Math.sin(time * 0.5) * 0.3
    }

    // Outer ring rotation (opposite direction)
    if (outerRingRef.current && isSelected) {
      outerRingRef.current.rotation.z = -time * 1
      outerRingRef.current.rotation.y = Math.cos(time * 0.7) * 0.2
    }

    // Bitcoin indicator animation - subtle pulse
    if (bitcoinIndicatorRef.current && hasBitcoinAddress) {
      bitcoinIndicatorRef.current.rotation.y = time * 2
      const indicatorMat = bitcoinIndicatorRef.current.material as THREE.MeshBasicMaterial
      indicatorMat.opacity = Math.sin(time * 3) * 0.1 + 0.4
    }
  })

  return (
    <group position={node.position}>
      {/* Outer glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[baseSize * 1.5, 16, 16]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={0.05}
          depthWrite={false}
        />
      </mesh>

      {/* Main neuron body */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onClick(node)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
        material={material}
      >
        {node.type === 'hidden' ? (
          <sphereGeometry args={[baseSize, 24, 24]} />
        ) : (
          <icosahedronGeometry args={[baseSize, detail]} />
        )}
      </mesh>

      {/* Inner core for depth effect */}
      <mesh scale={0.6}>
        <sphereGeometry args={[baseSize, 16, 16]} />
        <meshBasicMaterial
          color="white"
          transparent
          opacity={isSelected ? 0.2 : hovered ? 0.12 : 0.06}
        />
      </mesh>

      {/* Selection rings - subtle double ring effect */}
      {isSelected && (
        <>
          {/* Inner ring */}
          <mesh ref={ringRef}>
            <ringGeometry args={[baseSize * 1.8, baseSize * 2, 48]} />
            <meshBasicMaterial
              color={glowColor}
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Outer ring */}
          <mesh ref={outerRingRef}>
            <ringGeometry args={[baseSize * 2.5, baseSize * 2.8, 48]} />
            <meshBasicMaterial
              color={glowColor}
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Selection point light - subtle */}
          <pointLight
            color={glowColor}
            intensity={1.2}
            distance={3}
            decay={2}
          />
        </>
      )}

      {/* Highlighted ring */}
      {isHighlighted && !isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[baseSize * 1.5, baseSize * 1.7, 32]} />
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Bitcoin Address Indicator - small rotating ring */}
      {hasBitcoinAddress && (
        <mesh ref={bitcoinIndicatorRef} rotation={[Math.PI / 2, 0, 0]} position={[0, baseSize * 1.2, 0]}>
          <ringGeometry args={[baseSize * 0.4, baseSize * 0.5, 24]} />
          <meshBasicMaterial
            color="#F59E0B"
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Hover tooltip - enhanced */}
      {hovered && !isSelected && (
        <Html center style={{ pointerEvents: 'none' }}>
          <div className="bg-[#050505] backdrop-blur-md border border-white/[0.04] px-4 py-3 shadow-2xl whitespace-nowrap transform -translate-x-1/2">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 shadow-lg"
                style={{
                  backgroundColor: glowColor,
                  boxShadow: `0 0 8px ${glowColor}`
                }}
              />
              <span className="text-sm font-semibold text-white">
                Neuron #{node.id}
              </span>
            </div>

            {/* ID Preview */}
            <div className="text-xs font-mono text-gray-400 mb-2 tracking-tight">
              {node.realId.slice(0, 24)}...
            </div>

            {/* State and Type */}
            <div className="flex items-center gap-3 text-[10px]">
              <span className="px-2 py-0.5 bg-white/10 text-gray-300">
                {node.type}
              </span>
              <span className="text-gray-500">
                State: <span className="text-white font-medium">
                  {node.state > 0 ? '+1' : node.state < 0 ? '-1' : '0'}
                </span>
              </span>
            </div>

            {/* Click hint */}
            <div className="mt-2 pt-2 border-t border-white/[0.04] text-[10px] text-gray-500 text-center">
              Click to explore
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}
