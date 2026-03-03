'use client'

import { Suspense, useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei'
import { FoldingAnimation, AxisHelper } from './FoldingAnimation'
import { RegistrationMarkers } from './RegistrationMarkers'
import { OverlayComparison } from './OverlayComparison'
import { ContactCubeControls } from './ContactCubeControls'
import { ContactCubeInfoPanel } from './ContactCubeInfoPanel'
import { ContactCubeLegend } from './ContactCubeLegend'
import { ContactCubeControlBar } from './ContactCubeControlBar'
import { ContactCubeInfoModal, KeyboardShortcutsModal } from './ContactCubeInfoModal'
import { useContactCubeData } from './hooks/useContactCubeData'
import { useFoldingAnimation } from './hooks/useFoldingAnimation'
import type { ColorTheme, AnomalyCell, CubeFaceId, ViewMode, FaceTransform } from './types'
import { CAMERA_PRESETS } from './constants'

interface ContactCubeSceneProps {
  className?: string
  defaultTheme?: ColorTheme
  showControls?: boolean
  showInfoPanel?: boolean
}

// Loading placeholder
function LoadingCube() {
  return (
    <mesh rotation={[0.5, 0.5, 0]}>
      <boxGeometry args={[3, 3, 3]} />
      <meshStandardMaterial color="#333333" wireframe />
    </mesh>
  )
}

// Error display
function ErrorDisplay({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
      <div className="text-center p-6 bg-neutral-900 border border-red-500/30">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  )
}

// Scene receives animation state as props
interface SceneProps {
  colorTheme: ColorTheme
  showDepth: boolean
  highlightAnomalies: boolean
  showRegistrationMarks: boolean
  selectedAnomaly: AnomalyCell | null
  setSelectedAnomaly: (cell: AnomalyCell | null) => void
  autoRotate: boolean
  viewMode: ViewMode
  overlayPair: [CubeFaceId, CubeFaceId] | null
  getFaceTransform: (faceId: CubeFaceId) => FaceTransform
  progress: number
  hoveredCell: { row: number; col: number; value: number } | null
  setHoveredCell: (cell: { row: number; col: number; value: number } | null) => void
}

function Scene({
  colorTheme,
  showDepth,
  highlightAnomalies,
  showRegistrationMarks,
  selectedAnomaly,
  setSelectedAnomaly,
  autoRotate,
  viewMode,
  overlayPair,
  getFaceTransform,
  progress,
  hoveredCell,
  setHoveredCell,
}: SceneProps) {
  const { faces, anomalies, loading } = useContactCubeData()

  const handleCellClick = useCallback(
    (row: number, col: number, value: number, faceId: CubeFaceId) => {
      const anomaly = anomalies.find((a) => a.pos[0] === row && a.pos[1] === col)
      if (anomaly) {
        setSelectedAnomaly(anomaly)
      }
    },
    [anomalies, setSelectedAnomaly]
  )

  const handleCellHover = useCallback(
    (row: number, col: number, value: number, faceId: CubeFaceId) => {
      setHoveredCell({ row, col, value })
    },
    [setHoveredCell]
  )

  if (loading || !faces) {
    return <LoadingCube />
  }

  return (
    <>
      <FoldingAnimation
        faces={faces}
        colorTheme={colorTheme}
        getFaceTransform={getFaceTransform}
        progress={progress}
        showDepth={showDepth}
        highlightAnomalies={highlightAnomalies}
        selectedAnomaly={selectedAnomaly}
        autoRotate={autoRotate && viewMode === 'cube' && progress > 0.9}
        showOutlines={true}
        onCellClick={handleCellClick}
        onCellHover={handleCellHover}
      />

      {showRegistrationMarks && progress > 0.8 && (
        <RegistrationMarkers
          anomalies={anomalies}
          selectedAnomaly={selectedAnomaly}
          onSelect={setSelectedAnomaly}
          visible={true}
        />
      )}

      {viewMode === 'overlay' && overlayPair && faces && progress > 0.9 && (
        <OverlayComparison
          face1={faces[overlayPair[0]]}
          face2={faces[overlayPair[1]]}
          colorTheme={colorTheme}
        />
      )}

      <AxisHelper visible={false} />
    </>
  )
}

export function ContactCubeScene({
  className = '',
  defaultTheme = 'matrix',
  showControls = true,
  showInfoPanel = true,
}: ContactCubeSceneProps) {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<any>(null)

  // State
  const [colorTheme, setColorTheme] = useState<ColorTheme>(defaultTheme)
  const [showDepth, setShowDepth] = useState(true)
  const [highlightAnomalies, setHighlightAnomalies] = useState(true)
  const [showRegistrationMarks, setShowRegistrationMarks] = useState(true)
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyCell | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [cameraPreset, setCameraPreset] = useState<keyof typeof CAMERA_PRESETS>('default')
  const [overlayPair, setOverlayPair] = useState<[CubeFaceId, CubeFaceId] | null>(null)
  const [hoveredCell, setHoveredCell] = useState<{
    row: number
    col: number
    value: number
  } | null>(null)

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Modal states
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)

  // Animation hook
  const {
    viewMode,
    setViewMode,
    startFolding,
    startUnfolding,
    resetAnimation,
    progress,
    isAnimating,
    foldingState,
    getFaceTransform,
  } = useFoldingAnimation()

  // Data state
  const { loading, error, retry, stats, faces } = useContactCubeData()

  // Camera settings
  const cameraSettings = useMemo(() => CAMERA_PRESETS[cameraPreset], [cameraPreset])

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Reset camera
  const resetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
    setCameraPreset('default')
  }, [])

  // Share functionality
  const handleShare = useCallback(async () => {
    const params = new URLSearchParams()
    params.set('view', viewMode)
    params.set('theme', colorTheme)
    if (selectedAnomaly) {
      params.set('cell', `${selectedAnomaly.pos[0]},${selectedAnomaly.pos[1]}`)
    }
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`

    if (navigator.share) {
      await navigator.share({
        title: 'Contact Cube - Anna Matrix Visualization',
        text: 'Explore the 99.59% point-symmetric Anna Matrix folded into a 3D cube',
        url,
      })
    } else {
      await navigator.clipboard.writeText(url)
    }
  }, [viewMode, colorTheme, selectedAnomaly])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key.toLowerCase()) {
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'r':
          e.preventDefault()
          resetCamera()
          break
        case 'i':
          e.preventDefault()
          setShowInfoModal((s) => !s)
          break
        case '?':
          e.preventDefault()
          setShowKeyboardShortcuts((s) => !s)
          break
        case 'd':
          e.preventDefault()
          setShowDepth((s) => !s)
          break
        case 'a':
          e.preventDefault()
          setHighlightAnomalies((s) => !s)
          break
        case 'm':
          e.preventDefault()
          setShowRegistrationMarks((s) => !s)
          break
        case ' ':
          e.preventDefault()
          if (progress < 0.5) {
            startFolding()
          } else {
            startUnfolding()
          }
          break
        case '1':
          setCameraPreset('default')
          break
        case '2':
          setCameraPreset('top')
          break
        case '3':
          setCameraPreset('front')
          break
        case '4':
          setCameraPreset('side')
          break
        case '5':
          setCameraPreset('isometric')
          break
        case 'escape':
          setShowInfoModal(false)
          setShowKeyboardShortcuts(false)
          setSelectedAnomaly(null)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleFullscreen, resetCamera, startFolding, startUnfolding, progress])

  // Handle view mode change
  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode)
      if (mode === 'overlay' && !overlayPair) {
        setOverlayPair(['front', 'back'])
      }
    },
    [setViewMode, overlayPair]
  )

  // Handle overlay pair selection
  const handleOverlayPairChange = useCallback(
    (pair: [CubeFaceId, CubeFaceId]) => {
      setOverlayPair(pair)
      if (viewMode !== 'overlay') {
        setViewMode('overlay')
      }
    },
    [viewMode, setViewMode]
  )

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[700px] bg-black overflow-hidden ${className}`}
    >
      {/* Canvas */}
      <Canvas
        shadows
        dpr={[1, 2]}
        style={{ cursor: hoveredCell ? 'pointer' : 'grab' }}
        onPointerMissed={() => setHoveredCell(null)}
      >
        <PerspectiveCamera makeDefault position={cameraSettings.position} fov={cameraSettings.fov} />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.4} color="#6366f1" />
        <pointLight position={[10, -10, 10]} intensity={0.3} color="#06b6d4" />

        {/* Environment */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />

        {/* Controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={false}
          minDistance={8}
          maxDistance={60}
          enableDamping={true}
          dampingFactor={0.05}
        />

        {/* Scene content */}
        <Suspense fallback={<LoadingCube />}>
          {faces && (
            <Scene
              colorTheme={colorTheme}
              showDepth={showDepth}
              highlightAnomalies={highlightAnomalies}
              showRegistrationMarks={showRegistrationMarks}
              selectedAnomaly={selectedAnomaly}
              setSelectedAnomaly={setSelectedAnomaly}
              autoRotate={autoRotate}
              viewMode={viewMode}
              overlayPair={overlayPair}
              getFaceTransform={getFaceTransform}
              progress={progress}
              hoveredCell={hoveredCell}
              setHoveredCell={setHoveredCell}
            />
          )}
        </Suspense>
      </Canvas>

      {/* Error overlay */}
      {error && <ErrorDisplay error={error.message} onRetry={retry} />}

      {/* Minimal top-right controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={resetCamera}
          className="px-3 py-1.5 bg-black/70 hover:bg-[#050505] border border-neutral-700 text-xs text-neutral-300 transition-colors"
          title="Reset camera (R)"
        >
          Reset View
        </button>
        <button
          onClick={toggleFullscreen}
          className="px-3 py-1.5 bg-black/70 hover:bg-[#050505] border border-neutral-700 text-xs text-neutral-300 transition-colors"
          title="Fullscreen (F)"
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>

      {/* Controls panel (Bottom-Left) */}
      {showControls && (
        <ContactCubeControls
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          colorTheme={colorTheme}
          onThemeChange={setColorTheme}
          showDepth={showDepth}
          onShowDepthChange={setShowDepth}
          highlightAnomalies={highlightAnomalies}
          onHighlightAnomaliesChange={setHighlightAnomalies}
          showRegistrationMarks={showRegistrationMarks}
          onShowRegistrationMarksChange={setShowRegistrationMarks}
          autoRotate={autoRotate}
          onAutoRotateChange={setAutoRotate}
          cameraPreset={cameraPreset}
          onCameraPresetChange={setCameraPreset}
          onFold={startFolding}
          onUnfold={startUnfolding}
          onReset={resetAnimation}
          progress={progress}
          isAnimating={isAnimating}
          overlayPair={overlayPair}
          onOverlayPairChange={handleOverlayPairChange}
        />
      )}

      {/* Info panel (Right side) */}
      {showInfoPanel && (
        <ContactCubeInfoPanel
          selectedAnomaly={selectedAnomaly}
          stats={stats}
          viewMode={viewMode}
          progress={progress}
          onCloseAnomaly={() => setSelectedAnomaly(null)}
        />
      )}

      {/* Cell tooltip on hover */}
      {hoveredCell && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-[#050505] px-3 py-1.5 border border-neutral-700 text-xs font-mono text-neutral-300">
            [{hoveredCell.row}, {hoveredCell.col}] = {hoveredCell.value}
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="flex items-center gap-3 text-neutral-400 text-sm">
            <div className="w-5 h-5 border-2 border-neutral-500 border-t-transparent animate-spin" />
            Loading matrix...
          </div>
        </div>
      )}

      {/* Progress indicator during animation */}
      {isAnimating && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-black/80 px-3 py-1.5 border border-neutral-700">
            <div className="flex items-center gap-2">
              <div className="w-24 h-1 bg-neutral-700 overflow-hidden">
                <div
                  className="h-full bg-neutral-400 transition-all duration-100"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <span className="text-neutral-400 text-xs font-mono">
                {Math.round(progress * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ContactCubeInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
      <KeyboardShortcutsModal
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />
    </div>
  )
}

export default ContactCubeScene
