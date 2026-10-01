'use client'

import { useState, useMemo, Suspense, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  Stars,
  PerspectiveCamera,
  Float,
  Sparkles,
} from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { AigarthNeuronBatch } from './AigarthNeuron'
import { AigarthSynapseNetwork } from './AigarthSynapse'
import type {
  TernaryState,
  ProcessingResult,
  AnimationState,
} from '@/lib/aigarth/types'
import { Button } from '@/components/ui/button'
import { Maximize2, Minimize2, RotateCcw, Eye, EyeOff } from 'lucide-react'

// Camera presets
const CAMERA_PRESETS = {
  front: { position: [0, 0, 6] as [number, number, number], name: 'Front' },
  top: { position: [0, 6, 0] as [number, number, number], name: 'Top' },
  iso: { position: [4, 4, 4] as [number, number, number], name: 'Iso' },
}

interface AigarthSceneProps {
  states: TernaryState[]
  isProcessing: boolean
  tick: number
  energy: number
  numInputs?: number
  numOutputs?: number
  numNeighbors?: number
  result?: ProcessingResult | null
}

// Generate circular positions for neurons
function generateCircularPositions(
  count: number,
  numInputs: number,
  radiusOuter: number = 2.5,
  radiusInner: number = 1.8
): [number, number, number][] {
  const positions: [number, number, number][] = []

  for (let i = 0; i < count; i++) {
    const isInput = i < numInputs
    const radius = isInput ? radiusOuter : radiusInner

    // Calculate angle - distribute evenly in respective half
    let angle: number
    if (isInput) {
      // Input neurons (0-63) on outer ring
      angle = (i / numInputs) * Math.PI * 2 - Math.PI / 2
    } else {
      // Output neurons (64-127) on inner ring
      angle =
        ((i - numInputs) / (count - numInputs)) * Math.PI * 2 - Math.PI / 2
    }

    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    const y = 0 // Flat layout

    positions.push([x, y, z])
  }

  return positions
}

function NeuralCircle({
  states,
  positions,
  numInputs,
  numNeighbors,
  isProcessing,
  showSynapses,
  selectedNeuron,
  onNeuronClick,
}: {
  states: TernaryState[]
  positions: [number, number, number][]
  numInputs: number
  numNeighbors: number
  isProcessing: boolean
  showSynapses: boolean
  selectedNeuron: number | null
  onNeuronClick: (index: number) => void
}) {
  return (
    <group>
      {/* Ambient particles */}
      <Sparkles
        color="#D4AF37"
        count={50}
        opacity={0.2}
        scale={8}
        size={1}
        speed={0.3}
      />

      {/* Synapses */}
      <AigarthSynapseNetwork
        highlightedNeuron={selectedNeuron}
        numInputs={numInputs}
        numNeighbors={numNeighbors}
        positions={positions}
        showAll={showSynapses}
        states={states}
      />

      {/* Neurons */}
      <AigarthNeuronBatch
        isProcessing={isProcessing}
        numInputs={numInputs}
        onNeuronClick={onNeuronClick}
        positions={positions}
        selectedIndex={selectedNeuron}
        states={states}
      />

      {/* Central energy indicator */}
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial color="#D4AF37" opacity={0.1} transparent />
      </mesh>

      {/* Ring indicators */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.4, 2.6, 64]} />
        <meshBasicMaterial color="#D4AF37" opacity={0.1} side={2} transparent />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.7, 1.9, 64]} />
        <meshBasicMaterial
          color="#D4AF37"
          opacity={0.06}
          side={2}
          transparent
        />
      </mesh>
    </group>
  )
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshBasicMaterial color="#D4AF37" wireframe />
    </mesh>
  )
}

export function AigarthScene({
  states,
  isProcessing,
  tick,
  energy,
  numInputs = 64,
  numOutputs = 64,
  numNeighbors = 8,
}: AigarthSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<any>(null)

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSynapses, setShowSynapses] = useState(false)
  const [selectedNeuron, setSelectedNeuron] = useState<number | null>(null)
  const [cameraPreset, setCameraPreset] =
    useState<keyof typeof CAMERA_PRESETS>('front')

  const population = numInputs + numOutputs

  // Generate default states if empty
  const displayStates = useMemo(() => {
    if (states.length === 0) {
      return new Array(population).fill(0) as TernaryState[]
    }
    return states
  }, [states, population])

  // Generate positions
  const positions = useMemo(() => {
    return generateCircularPositions(population, numInputs)
  }, [population, numInputs])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Reset camera
  const resetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
    setCameraPreset('front')
    setSelectedNeuron(null)
  }, [])

  // Handle neuron click
  const handleNeuronClick = useCallback((index: number) => {
    setSelectedNeuron(current => (current === index ? null : index))
  }, [])

  const currentCameraPosition = CAMERA_PRESETS[cameraPreset].position

  return (
    <div
      className={`relative w-full bg-black overflow-hidden border border-border transition-all duration-300 ${
        isFullscreen ? 'h-screen' : 'h-[400px]'
      }`}
      ref={containerRef}
    >
      {/* 3D Canvas */}
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: 0,
          toneMappingExposure: 1.0,
        }}
      >
        <PerspectiveCamera
          fov={50}
          makeDefault
          position={currentCameraPosition}
        />
        <OrbitControls
          dampingFactor={0.05}
          enableDamping
          enablePan
          maxDistance={15}
          minDistance={2}
          panSpeed={0.5}
          ref={controlsRef}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
        />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          color="#ffffff"
          intensity={0.8}
          position={[5, 5, 5]}
        />
        <pointLight
          color="#D4AF37"
          decay={2}
          intensity={0.6}
          position={[5, 5, 5]}
        />
        <pointLight
          color="#D4AF37"
          decay={2}
          intensity={0.4}
          position={[-5, -5, -5]}
        />

        {/* Background stars */}
        <Stars
          count={1000}
          depth={50}
          factor={2}
          fade
          radius={50}
          saturation={0}
          speed={0.5}
        />

        {/* Neural network */}
        <Suspense fallback={<LoadingFallback />}>
          <Float floatIntensity={0.05} rotationIntensity={0} speed={1}>
            <NeuralCircle
              isProcessing={isProcessing}
              numInputs={numInputs}
              numNeighbors={numNeighbors}
              onNeuronClick={handleNeuronClick}
              positions={positions}
              selectedNeuron={selectedNeuron}
              showSynapses={showSynapses}
              states={displayStates}
            />
          </Float>
        </Suspense>

        {/* Post-processing */}
        <EffectComposer>
          <Bloom
            intensity={0.5}
            luminanceSmoothing={0.9}
            luminanceThreshold={0.6}
            radius={0.4}
          />
        </EffectComposer>
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Left - Status */}
        <div className="absolute top-3 left-3">
          <div className="bg-black/70 backdrop-blur-md border border-border px-3 py-2 pointer-events-auto">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 ${
                    isProcessing ? 'bg-gold animate-pulse' : 'bg-zinc-500'
                  }`}
                />
                <span className="text-zinc-400">
                  {isProcessing ? `Tick ${tick}` : 'Ready'}
                </span>
              </div>
              <div className="text-zinc-600">|</div>
              <div
                className={`font-mono ${energy > 0 ? 'text-gold' : energy < 0 ? 'text-red-400' : 'text-zinc-400'}`}
              >
                E: {energy > 0 ? '+' : ''}
                {energy}
              </div>
            </div>
          </div>
        </div>

        {/* Top Right - Controls */}
        <div className="absolute top-3 right-3 flex gap-2 pointer-events-auto">
          <div className="bg-black/70 backdrop-blur-md border border-border p-1 flex gap-1">
            <Button
              className="h-7 w-7 text-white/70 hover:text-gold hover:bg-gold/10"
              onClick={() => setShowSynapses(s => !s)}
              size="icon"
              title={showSynapses ? 'Hide synapses' : 'Show synapses'}
              variant="ghost"
            >
              {showSynapses ? (
                <EyeOff className="w-3 h-3" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
            </Button>
            <Button
              className="h-7 w-7 text-white/70 hover:text-gold hover:bg-gold/10"
              onClick={resetCamera}
              size="icon"
              title="Reset camera"
              variant="ghost"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
            <Button
              className="h-7 w-7 text-white/70 hover:text-gold hover:bg-gold/10"
              onClick={toggleFullscreen}
              size="icon"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              variant="ghost"
            >
              {isFullscreen ? (
                <Minimize2 className="w-3 h-3" />
              ) : (
                <Maximize2 className="w-3 h-3" />
              )}
            </Button>
          </div>

          {/* Camera presets */}
          <div className="bg-black/70 backdrop-blur-md border border-border p-1 flex gap-1">
            {Object.entries(CAMERA_PRESETS).map(([key, preset]) => (
              <Button
                className={`h-7 px-2 text-xs ${
                  cameraPreset === key
                    ? 'bg-gold/20 text-gold'
                    : 'text-white/70 hover:text-gold hover:bg-gold/10'
                }`}
                key={key}
                onClick={() =>
                  setCameraPreset(key as keyof typeof CAMERA_PRESETS)
                }
                size="sm"
                variant="ghost"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Bottom - Legend */}
        <div className="absolute bottom-3 left-3">
          <div className="bg-black/70 backdrop-blur-md border border-border px-3 py-2 pointer-events-auto">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gold" />
                <span className="text-zinc-400">Input (0-63)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gold/50" />
                <span className="text-zinc-400">Output (64-127)</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-1 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gold" />
                <span className="text-zinc-400">+1</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-zinc-500" />
                <span className="text-zinc-400">0</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500" />
                <span className="text-zinc-400">-1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected neuron info */}
        {selectedNeuron !== null && (
          <div className="absolute bottom-3 right-3">
            <div className="bg-black/70 backdrop-blur-md border border-border px-3 py-2 pointer-events-auto">
              <div className="text-xs">
                <div className="text-zinc-400">Neuron #{selectedNeuron}</div>
                <div className="font-mono text-white">
                  State: {displayStates[selectedNeuron]}
                </div>
                <div className="text-zinc-500">
                  {selectedNeuron < numInputs ? 'Input' : 'Output'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-1">
          <div
            className="h-full bg-gradient-to-r from-gold to-gold/50 transition-all duration-100"
            style={{ width: `${Math.min((tick / 1000) * 100, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}
