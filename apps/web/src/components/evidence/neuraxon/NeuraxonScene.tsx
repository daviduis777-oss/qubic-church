'use client'

import { useState, useMemo, Suspense, useCallback, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, PerspectiveCamera, Float, Sparkles } from '@react-three/drei'
import { useQortexData } from './useNeuraxonData'
import { useBitcoinAddresses } from './useBitcoinAddresses'
import { useQubicLive } from './useQubicLive'
import { NeuronNode } from './NeuronNode'
import { SynapseConnection } from './SynapseConnection'
import { QortexControls } from './NeuraxonControls'
import { NeuronDetailPanel } from './NeuronDetailPanel'
import { QortexInfoModal } from './NeuraxonInfoModal'
import { PostProcessingEffects } from './PostProcessingEffects'
import type { QortexNode as QortexNodeType } from './types'
import { Button } from '@/components/ui/button'
import {
  Maximize2,
  Minimize2,
  Camera,
  RotateCcw,
  Info,
  Keyboard,
  Share2,
  AlertTriangle,
  WifiOff,
  Wifi,
  FileWarning,
  RefreshCw,
  Clock,
  Activity,
  Zap,
  Database,
} from 'lucide-react'
import type { QortexError, QortexErrorType } from './useNeuraxonData'

// Camera presets
const CAMERA_PRESETS = {
  front: { position: [0, 0, 15] as [number, number, number], name: 'Front' },
  top: { position: [0, 15, 0] as [number, number, number], name: 'Top' },
  side: { position: [15, 0, 0] as [number, number, number], name: 'Side' },
  iso: { position: [10, 10, 10] as [number, number, number], name: 'Isometric' },
}

function NetworkVisualization({
  currentNodes,
  currentEdges,
  selectedNode,
  highlightedNodes,
  showConnections,
  onNodeClick,
  bitcoinAddressChecker,
}: {
  currentNodes: QortexNodeType[]
  currentEdges: { source: number; target: number; weight: number; type: 'fast' | 'slow' | 'meta' }[]
  selectedNode: QortexNodeType | null
  highlightedNodes: Set<number>
  showConnections: boolean
  onNodeClick: (node: QortexNodeType) => void
  bitcoinAddressChecker?: (nodeId: number) => boolean
}) {
  const nodeMap = useMemo(() => {
    const map = new Map<number, QortexNodeType>()
    currentNodes.forEach((node) => map.set(node.id, node))
    return map
  }, [currentNodes])

  return (
    <group>
      {/* Ambient particles for atmosphere - subtle */}
      <Sparkles
        count={80}
        scale={20}
        size={1.5}
        speed={0.2}
        opacity={0.15}
        color="#F59E0B"
      />

      {/* Connections */}
      {currentEdges.map((edge, i) => {
        const sourceNode = nodeMap.get(edge.source)
        const targetNode = nodeMap.get(edge.target)
        if (!sourceNode || !targetNode) return null

        const isHighlighted =
          selectedNode !== null &&
          (edge.source === selectedNode.id || edge.target === selectedNode.id)

        return (
          <SynapseConnection
            key={`${edge.source}-${edge.target}-${i}`}
            edge={edge}
            sourceNode={sourceNode}
            targetNode={targetNode}
            isHighlighted={isHighlighted}
            showAll={showConnections}
          />
        )
      })}

      {/* Nodes with subtle float animation */}
      {currentNodes.map((node) => (
        <Float
          key={node.id}
          speed={1}
          rotationIntensity={0}
          floatIntensity={0.1}
          floatingRange={[-0.05, 0.05]}
        >
          <NeuronNode
            node={node}
            isSelected={selectedNode?.id === node.id}
            isHighlighted={highlightedNodes.has(node.id)}
            onClick={onNodeClick}
            hasBitcoinAddress={bitcoinAddressChecker ? bitcoinAddressChecker(node.id) : false}
          />
        </Float>
      ))}

      {/* Central core - subtle */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#F59E0B" transparent opacity={0.06} />
      </mesh>
    </group>
  )
}

function LoadingScreen({ progress }: { progress: number }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black">
      <div className="flex flex-col items-center gap-6 max-w-md px-8">
        {/* Neural network animation */}
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 border-2 border-[#D4AF37]/30 animate-ping" />
          <div className="absolute inset-4 border-2 border-[#D4AF37]/30 animate-ping animation-delay-200" />
          <div className="absolute inset-8 border-2 border-gray-500/30 animate-ping animation-delay-400" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#D4AF37] via-gray-600 to-[#D4AF37] animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#D4AF37] via-gray-300 to-[#D4AF37] bg-clip-text text-transparent">
            Qortex Neural Network
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Loading network data...
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full space-y-2">
          <div className="h-2 bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D4AF37] via-gray-400 to-[#D4AF37] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Loading nodes & synapses</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
        </div>

        {/* Stats preview */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-[#D4AF37]">23,765</div>
            <div className="text-xs text-gray-600">Neurons</div>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-400">188,452</div>
            <div className="text-xs text-gray-600">Synapses</div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#D4AF37]">47</div>
            <div className="text-xs text-gray-600">Frames</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Error icons mapping
const ERROR_ICONS: Record<QortexErrorType, React.ReactNode> = {
  NETWORK_ERROR: <WifiOff className="w-12 h-12" />,
  PARSE_ERROR: <FileWarning className="w-12 h-12" />,
  VALIDATION_ERROR: <FileWarning className="w-12 h-12" />,
  TIMEOUT_ERROR: <Clock className="w-12 h-12" />,
  DATA_UNAVAILABLE: <Database className="w-12 h-12" />,
  UNKNOWN_ERROR: <AlertTriangle className="w-12 h-12" />,
}

const ERROR_COLORS: Record<QortexErrorType, string> = {
  NETWORK_ERROR: 'text-[#D4AF37]',
  PARSE_ERROR: 'text-red-400',
  VALIDATION_ERROR: 'text-red-400',
  TIMEOUT_ERROR: 'text-[#D4AF37]',
  DATA_UNAVAILABLE: 'text-white/40',
  UNKNOWN_ERROR: 'text-gray-400',
}

function ErrorScreen({
  error,
  onRetry,
  retryCount,
  maxRetries = 3
}: {
  error: QortexError
  onRetry: () => void
  retryCount: number
  maxRetries?: number
}) {
  const canRetry = error.retryable && retryCount < maxRetries

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black">
      <div className="flex flex-col items-center gap-6 max-w-md px-8 text-center">
        {/* Error icon with animated ring */}
        <div className="relative">
          <div className={`absolute inset-0 border-2 ${ERROR_COLORS[error.type]} opacity-20 animate-ping`} />
          <div className={`w-24 h-24 bg-gray-900 border-2 border-current flex items-center justify-center ${ERROR_COLORS[error.type]}`}>
            {ERROR_ICONS[error.type]}
          </div>
        </div>

        {/* Error message */}
        <div className="space-y-2">
          <h2 className={`text-xl font-bold ${ERROR_COLORS[error.type]}`}>
            {error.message}
          </h2>
          {error.details && (
            <p className="text-sm text-gray-500 max-w-sm">
              {error.details}
            </p>
          )}
        </div>

        {/* Error type badge */}
        <div className="px-3 py-1 bg-white/5 border border-white/[0.04]">
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            {error.type.replace('_', ' ')}
          </span>
        </div>

        {/* Retry section */}
        {canRetry ? (
          <div className="space-y-3">
            <Button
              onClick={onRetry}
              className="gap-2 bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#D4AF37] text-white"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            <p className="text-xs text-gray-600">
              Attempt {retryCount + 1} of {maxRetries}
            </p>
          </div>
        ) : retryCount >= maxRetries ? (
          <div className="space-y-2">
            <p className="text-sm text-red-400">
              Maximum retry attempts reached
            </p>
            <p className="text-xs text-gray-600">
              Please refresh the page or contact support
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-600">
            This error cannot be automatically resolved
          </p>
        )}

        {/* Troubleshooting tips */}
        <div className="pt-4 border-t border-white/[0.04] w-full">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">
            Troubleshooting
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Check your internet connection</li>
            <li>• Try refreshing the page</li>
            <li>• Clear browser cache if issue persists</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function KeyboardShortcutsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 pointer-events-auto">
      <div className="bg-background border border-border p-6 max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        <div className="space-y-3">
          {[
            { key: 'I', action: 'Show info modal' },
            { key: 'Space', action: 'Play / Pause animation' },
            { key: '\u2190', action: 'Previous frame' },
            { key: '\u2192', action: 'Next frame' },
            { key: 'Home', action: 'First frame' },
            { key: 'End', action: 'Last frame' },
            { key: 'F', action: 'Toggle fullscreen' },
            { key: 'S', action: 'Toggle synapses' },
            { key: 'R', action: 'Reset camera' },
            { key: 'Esc', action: 'Close modals / Deselect' },
          ].map(({ key, action }) => (
            <div key={key} className="flex items-center gap-3">
              <kbd className="px-2 py-1 bg-muted text-xs font-mono min-w-[60px] text-center">
                {key}
              </kbd>
              <span className="text-sm text-muted-foreground">{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export interface QortexSceneProps {
  /** Callback when user wants to analyze a seed in Aigarth Processing */
  onAnalyzeInAigarth?: (seed: string, neuronId: number, publicId: string, frame: number) => void
}

export default function QortexScene({ onAnalyzeInAigarth }: QortexSceneProps = {}) {
  const {
    loading,
    error,
    dataUnavailable,
    data,
    currentNodes,
    currentEdges,
    frameIndex,
    setFrameIndex,
    totalFrames,
    searchNode,
    getNodeById,
    getConnectedNodes,
    currentFrame,
    retry,
    retryCount,
  } = useQortexData()

  // Load Bitcoin address mappings
  const { hasAddress } = useBitcoinAddresses()

  // Live Qubic network connection
  const {
    isConnected: qubicConnected,
    epoch: qubicEpoch,
    networkStatus: qubicNetwork,
    refresh: refreshQubic,
  } = useQubicLive()

  // Bitcoin address checker - maps node ID to matrix position if scientifically proven
  // Currently disabled until cryptographic relationship is established
  const checkBitcoinAddress = useCallback((nodeId: number) => {
    // Return false until cryptographic relationship is established
    return false
  }, [])

  const [selectedNode, setSelectedNode] = useState<QortexNodeType | null>(null)
  const [showConnections, setShowConnections] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [cameraPreset, setCameraPreset] = useState<keyof typeof CAMERA_PRESETS>('front')
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<any>(null)
  const [loadProgress, setLoadProgress] = useState(0)
  // Mobile panel toggle: only one panel open at a time on small screens
  const [activeMobilePanel, setActiveMobilePanel] = useState<'info' | 'camera' | 'live' | 'frame' | null>(null)
  const toggleMobilePanel = useCallback((panel: 'info' | 'camera' | 'live' | 'frame') => {
    setActiveMobilePanel((current) => (current === panel ? null : panel))
  }, [])

  // Simulate loading progress
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadProgress((p) => Math.min(p + Math.random() * 15, 95))
      }, 200)
      return () => clearInterval(interval)
    } else {
      setLoadProgress(100)
    }
  }, [loading])

  // Highlighted nodes
  const highlightedNodes = useMemo(() => {
    if (!selectedNode) return new Set<number>()
    const { incoming, outgoing } = getConnectedNodes(selectedNode.id)
    const nodes = new Set<number>()
    incoming.forEach((e) => nodes.add(e.source))
    outgoing.forEach((e) => nodes.add(e.target))
    return nodes
  }, [selectedNode, getConnectedNodes])

  // Handlers
  const handleNodeClick = useCallback((node: QortexNodeType) => {
    setSelectedNode((current) => (current?.id === node.id ? null : node))
  }, [])

  const handleNodeFound = useCallback((node: QortexNodeType) => {
    setSelectedNode(node)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedNode(null)
  }, [])

  // Fullscreen toggle
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
  }, [])

  // Share functionality
  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}?frame=${frameIndex}${selectedNode ? `&node=${selectedNode.id}` : ''}`

    if (navigator.share) {
      await navigator.share({
        title: 'Qortex Neural Network',
        text: `Exploring frame ${frameIndex + 1} of the Qortex visualization with 23,765 neurons`,
        url,
      })
    } else {
      await navigator.clipboard.writeText(url)
    }
  }, [frameIndex, selectedNode])

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key.toLowerCase()) {
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
        case 's':
          e.preventDefault()
          setShowConnections((s) => !s)
          break
        case 'r':
          e.preventDefault()
          resetCamera()
          break
        case 'i':
          e.preventDefault()
          setShowInfoModal((s) => !s)
          break
        case 'escape':
          setSelectedNode(null)
          setShowKeyboardShortcuts(false)
          setShowInfoModal(false)
          break
        case '?':
          setShowKeyboardShortcuts((s) => !s)
          break
        case 'home':
          e.preventDefault()
          setFrameIndex(0)
          break
        case 'end':
          e.preventDefault()
          setFrameIndex(totalFrames - 1)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleFullscreen, resetCamera, setFrameIndex, totalFrames])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  if (loading || loadProgress < 100) {
    return (
      <div
        ref={containerRef}
        className="w-full h-[700px] overflow-hidden border border-border"
      >
        <LoadingScreen progress={loadProgress} />
      </div>
    )
  }

  if (dataUnavailable) {
    return (
      <div
        ref={containerRef}
        className="w-full h-[700px] overflow-hidden border border-white/10 bg-black/20 flex items-center justify-center"
      >
        <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
          <div className="p-3 border border-white/10 bg-white/5">
            <Database className="w-6 h-6 text-white/40" />
          </div>
          <div className="space-y-2">
            <p className="font-mono text-sm text-white/40">Neuraxon Network</p>
            <p className="font-mono text-xs text-white/25">
              Dataset too large for web deployment. Available locally.
            </p>
            <p className="font-mono text-[10px] text-white/15">neuraxon-network.json (19 MB)</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        ref={containerRef}
        className="w-full h-[700px] overflow-hidden border border-border"
      >
        <ErrorScreen
          error={error}
          onRetry={retry}
          retryCount={retryCount}
        />
      </div>
    )
  }

  const currentCameraPosition = CAMERA_PRESETS[cameraPreset].position

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black overflow-hidden border border-border transition-all duration-300 ${
        isFullscreen ? 'h-screen rounded-none' : 'h-[700px]'
      }`}
    >
      {/* 3D Canvas with professional settings */}
      <Canvas
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: 0, // NoToneMapping for accurate colors
          toneMappingExposure: 1.0,
        }}
        dpr={[1, 2]}
        shadows
      >
        <PerspectiveCamera
          makeDefault
          position={currentCameraPosition}
          fov={60}
        />
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={60}
          enablePan
          panSpeed={0.5}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
        />

        {/* Professional Lighting Setup */}
        <ambientLight intensity={0.35} />

        {/* Soft key light */}
        <directionalLight
          position={[10, 10, 10]}
          intensity={0.8}
          color="#ffffff"
        />

        {/* Subtle fill lights with color coding */}
        <pointLight position={[15, 15, 15]} intensity={0.9} color="#FFF8F0" decay={2} distance={40} />
        <pointLight position={[-15, -15, -15]} intensity={0.5} color="#60A5FA" decay={2} distance={40} />
        <pointLight position={[15, -15, 15]} intensity={0.5} color="#FBBF24" decay={2} distance={40} />
        <pointLight position={[-15, 15, -15]} intensity={0.3} color="#A78BFA" decay={2} distance={35} />

        {/* Deep space background - subtle */}
        <Stars
          radius={150}
          depth={80}
          count={2000}
          factor={3}
          saturation={0}
          fade
          speed={0.3}
        />

        {/* Network */}
        <Suspense fallback={null}>
          <NetworkVisualization
            currentNodes={currentNodes}
            currentEdges={currentEdges}
            selectedNode={selectedNode}
            highlightedNodes={highlightedNodes}
            showConnections={showConnections}
            onNodeClick={handleNodeClick}
            bitcoinAddressChecker={checkBitcoinAddress}
          />
        </Suspense>

        {/* Subtle post-processing for professional look */}
        <PostProcessingEffects
          bloomStrength={0.6}
          bloomRadius={0.4}
          bloomThreshold={0.7}
        />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">

        {/* ── MOBILE TOOLBAR (< md) ── */}
        <div className="md:hidden absolute top-0 left-0 right-0 z-20 pointer-events-auto">
          <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md border-b border-white/[0.06] px-2 py-1.5">
            {/* Info toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${activeMobilePanel === 'info' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              onClick={() => toggleMobilePanel('info')}
              title="Info"
            >
              <Info className="w-3.5 h-3.5" />
            </Button>
            {/* Camera toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${activeMobilePanel === 'camera' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              onClick={() => toggleMobilePanel('camera')}
              title="Camera"
            >
              <Camera className="w-3.5 h-3.5" />
            </Button>
            {/* Live status toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${activeMobilePanel === 'live' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              onClick={() => toggleMobilePanel('live')}
              title="Qubic Live"
            >
              {qubicConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            </Button>
            {/* Frame toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${activeMobilePanel === 'frame' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              onClick={() => toggleMobilePanel('frame')}
              title="Frame Range"
            >
              <Database className="w-3.5 h-3.5" />
            </Button>

            <div className="h-4 w-px bg-white/10 mx-0.5" />

            {/* Always-visible actions */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
              onClick={resetCamera}
              title="Reset camera"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
              onClick={handleShare}
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </Button>

            {/* Spacer + frame counter */}
            <div className="flex-1" />
            <span className="text-[9px] text-white/40 font-mono mr-1">
              {frameIndex + 1}/{totalFrames}
            </span>
          </div>

          {/* Mobile dropdown panels */}
          {activeMobilePanel === 'info' && (
            <div className="mx-2 mt-1 bg-black/90 backdrop-blur-md border border-white/[0.06] p-3 max-h-[50vh] overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-gradient-to-br from-[#D4AF37] via-gray-500 to-[#D4AF37]" />
                <div>
                  <div className="text-xs font-semibold text-white">Qortex</div>
                  <div className="text-[9px] text-gray-400">Ternary Neural Network</div>
                </div>
              </div>
              <div className="p-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 mb-2">
                <div className="text-[8px] text-[#D4AF37]/90">
                  <span className="font-bold">Seeds:</span> Real Qubic IDs from Anna Matrix. Network topology is a visualization model.
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-2">
                <div><div className="w-3 h-3 mx-auto bg-[#D4AF37]" /><span className="text-[8px] text-[#D4AF37] font-mono">+1</span></div>
                <div><div className="w-3 h-3 mx-auto bg-gray-500" /><span className="text-[8px] text-gray-400 font-mono">0</span></div>
                <div><div className="w-3 h-3 mx-auto bg-[#D4AF37]" /><span className="text-[8px] text-[#D4AF37] font-mono">-1</span></div>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[8px]">
                <div className="flex justify-between"><span className="text-gray-500">K</span><span className="text-[#D4AF37] font-mono">14</span></div>
                <div className="flex justify-between"><span className="text-gray-500">L</span><span className="text-[#D4AF37] font-mono">8</span></div>
                <div className="flex justify-between"><span className="text-gray-500">N</span><span className="text-[#D4AF37] font-mono">120</span></div>
                <div className="flex justify-between"><span className="text-gray-500">S</span><span className="text-[#D4AF37] font-mono">100</span></div>
              </div>
            </div>
          )}

          {activeMobilePanel === 'camera' && (
            <div className="mx-2 mt-1 bg-black/90 backdrop-blur-md border border-white/[0.06] p-2">
              <div className="grid grid-cols-4 gap-1">
                {Object.entries(CAMERA_PRESETS).map(([key, preset]) => (
                  <Button
                    key={key}
                    variant="ghost"
                    size="sm"
                    className={`h-7 text-[10px] ${
                      cameraPreset === key ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                    onClick={() => { setCameraPreset(key as keyof typeof CAMERA_PRESETS); setActiveMobilePanel(null) }}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {activeMobilePanel === 'live' && (
            <div className="mx-2 mt-1 bg-black/90 backdrop-blur-md border border-white/[0.06] p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {qubicConnected ? <Wifi className="w-3 h-3 text-[#D4AF37]" /> : <WifiOff className="w-3 h-3 text-red-400" />}
                  <span className="text-[9px] text-gray-500 uppercase tracking-wider">Qubic Live</span>
                </div>
                <Button variant="ghost" size="icon" className="h-5 w-5 text-white/50 hover:text-white" onClick={refreshQubic}>
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </div>
              {qubicConnected && qubicEpoch ? (
                <div className="grid grid-cols-3 gap-2 text-[9px]">
                  <div className="text-center"><span className="text-gray-500 block">Epoch</span><span className="text-white font-mono">{qubicEpoch.epoch}</span></div>
                  <div className="text-center"><span className="text-gray-500 block">Tick</span><span className="text-[#D4AF37] font-mono">{qubicEpoch.tick?.toLocaleString() || '-'}</span></div>
                  {qubicNetwork && <div className="text-center"><span className="text-gray-500 block">Health</span><span className="text-[#D4AF37] font-mono capitalize">{qubicNetwork.health}</span></div>}
                </div>
              ) : (
                <div className="text-[9px] text-gray-500 text-center">{qubicConnected === false ? 'Connecting...' : 'Offline'}</div>
              )}
            </div>
          )}

          {activeMobilePanel === 'frame' && currentFrame && (
            <div className="mx-2 mt-1 bg-black/90 backdrop-blur-md border border-white/[0.06] p-2 text-center">
              <div className="text-[9px] text-gray-500 uppercase tracking-wider">Frame Range</div>
              <div className="text-sm font-mono text-white">#{currentFrame.startId} &ndash; #{currentFrame.endId}</div>
              <div className="text-[9px] text-gray-500">512 neurons / frame</div>
            </div>
          )}
        </div>

        {/* ── DESKTOP OVERLAYS (md+) ── */}
        <div className="hidden md:block">
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between">
            {/* Legend */}
            <div className="bg-black/70 backdrop-blur-md border border-white/[0.04] p-4 space-y-3 pointer-events-auto max-w-[220px]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#D4AF37] via-gray-500 to-[#D4AF37]" />
                <div>
                  <div className="text-sm font-semibold text-white">Qortex</div>
                  <div className="text-[10px] text-gray-400">Ternary Neural Network</div>
                </div>
              </div>

              {/* Data Source Info */}
              <div className="p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                <div className="text-[9px] text-[#D4AF37]/90">
                  <span className="font-bold">Seeds:</span> Real Qubic IDs from Anna Matrix. Network topology is a visualization model.
                </div>
              </div>

              {/* Ternary Neuron States */}
              <div className="border-t border-white/[0.04] pt-3 space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Neuron States (Ternary)</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-4 h-4 bg-[#D4AF37] shadow-lg shadow-[#D4AF37]/50" />
                    <span className="text-[10px] text-[#D4AF37] font-mono">+1</span>
                    <span className="text-[8px] text-gray-500">Excited</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-4 h-4 bg-gray-500 shadow-lg shadow-gray-500/50" />
                    <span className="text-[10px] text-gray-400 font-mono">0</span>
                    <span className="text-[8px] text-gray-500">Neutral</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-4 h-4 bg-[#D4AF37] shadow-lg shadow-[#D4AF37]/50" />
                    <span className="text-[10px] text-[#D4AF37] font-mono">-1</span>
                    <span className="text-[8px] text-gray-500">Inhibited</span>
                  </div>
                </div>
              </div>

              {/* Synapse Weights */}
              <div className="border-t border-white/[0.04] pt-3 space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Synapse Strength</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-[#D4AF37]" />
                    <span className="text-[10px] text-gray-400">Fast &gt;70%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-[#D4AF37]" />
                    <span className="text-[10px] text-gray-400">Slow 40-70%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-[#D4AF37]" />
                    <span className="text-[10px] text-gray-400">Meta &lt;40%</span>
                  </div>
                </div>
              </div>

              {/* Algorithm Constants */}
              <div className="border-t border-white/[0.04] pt-3">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-2">Algorithm</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px]">
                  <div className="flex justify-between">
                    <span className="text-gray-500">K (inputs)</span>
                    <span className="text-[#D4AF37] font-mono">14</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">L (outputs)</span>
                    <span className="text-[#D4AF37] font-mono">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">N (ticks)</span>
                    <span className="text-[#D4AF37] font-mono">120</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">S (mutations)</span>
                    <span className="text-[#D4AF37] font-mono">100</span>
                  </div>
                </div>
                <div className="mt-2 text-[8px] text-gray-600 italic">
                  Evolutionary training, not gradient descent
                </div>
              </div>
            </div>

            {/* Top Right Controls */}
            <div className="flex flex-col gap-2 pointer-events-auto">
              {/* Main actions */}
              <div className="flex gap-1 bg-black/70 backdrop-blur-md border border-white/[0.04] p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={resetCamera}
                  title="Reset camera"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={() => setShowInfoModal(true)}
                  title="What is Qortex?"
                >
                  <Info className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={() => setShowKeyboardShortcuts(true)}
                  title="Keyboard shortcuts"
                >
                  <Keyboard className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={handleShare}
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Camera presets */}
              <div className="bg-black/70 backdrop-blur-md border border-white/[0.04] p-1">
                <div className="text-[10px] text-gray-500 px-2 py-1">Camera</div>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(CAMERA_PRESETS).map(([key, preset]) => (
                    <Button
                      key={key}
                      variant="ghost"
                      size="sm"
                      className={`h-7 text-xs ${
                        cameraPreset === key
                          ? 'bg-white/20 text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                      onClick={() => setCameraPreset(key as keyof typeof CAMERA_PRESETS)}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Live Qubic Network Status */}
              <div className="bg-black/70 backdrop-blur-md border border-white/[0.04] p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {qubicConnected ? (
                      <Wifi className="w-3 h-3 text-[#D4AF37]" />
                    ) : (
                      <WifiOff className="w-3 h-3 text-red-400" />
                    )}
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Qubic Live</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-white/50 hover:text-white hover:bg-white/10"
                    onClick={refreshQubic}
                    title="Refresh"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>

                {qubicConnected && qubicEpoch ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Epoch
                      </span>
                      <span className="text-white font-mono">{qubicEpoch.epoch}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Tick
                      </span>
                      <span className="text-[#D4AF37] font-mono">{qubicEpoch.tick?.toLocaleString() || '-'}</span>
                    </div>
                    {qubicNetwork && (
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Health
                        </span>
                        <span className={`font-mono capitalize ${
                          qubicNetwork.health === 'excellent' ? 'text-[#D4AF37]' :
                          qubicNetwork.health === 'good' ? 'text-[#D4AF37]' :
                          qubicNetwork.health === 'fair' ? 'text-[#D4AF37]' : 'text-red-400'
                        }`}>{qubicNetwork.health}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-500 text-center py-1">
                    {qubicConnected === false ? 'Connecting...' : 'Offline'}
                  </div>
                )}
              </div>

              {/* Frame info */}
              {currentFrame && (
                <div className="bg-black/70 backdrop-blur-md border border-white/[0.04] p-3 text-center">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Frame Range</div>
                  <div className="text-sm font-mono text-white">
                    #{currentFrame.startId} &ndash; #{currentFrame.endId}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    512 neurons / frame
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detail Panel (both mobile + desktop) */}
        {selectedNode && (
          <NeuronDetailPanel
            node={selectedNode}
            connections={getConnectedNodes(selectedNode.id)}
            getNodeById={getNodeById}
            onClose={handleCloseDetail}
            onNodeClick={(node) => {
              setFrameIndex(node.frame)
              setSelectedNode(node)
            }}
            onAnalyzeInAigarth={onAnalyzeInAigarth}
          />
        )}

        {/* Controls */}
        <QortexControls
          frameIndex={frameIndex}
          totalFrames={totalFrames}
          onFrameChange={setFrameIndex}
          onSearch={searchNode}
          onNodeFound={handleNodeFound}
          showConnections={showConnections}
          onToggleConnections={() => setShowConnections((s) => !s)}
          metadata={data?.metadata || null}
          playbackSpeed={playbackSpeed}
          onSpeedChange={setPlaybackSpeed}
        />

      </div>

      {/* Watermark */}
      <div className="absolute bottom-20 left-4 text-[10px] text-white/30 pointer-events-none hidden md:block">
        Qortex &bull; Real Qubic Seeds &bull; Network visualization model
      </div>

      {/* Modals - outside pointer-events-none overlay */}
      {showKeyboardShortcuts && (
        <KeyboardShortcutsPanel onClose={() => setShowKeyboardShortcuts(false)} />
      )}
      <QortexInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
    </div>
  )
}
