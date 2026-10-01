'use client'

import {
  Suspense,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { FoldingAnimation, AxisHelper } from './FoldingAnimation'
import { RegistrationMarkers } from './RegistrationMarkers'
import { OverlayComparison } from './OverlayComparison'
import { ContactCubeControls } from './ContactCubeControls'
import { ContactCubeInfoPanel } from './ContactCubeInfoPanel'
// ContactCubeLegend exists but is not rendered, column pair info is in the Info modal
import {
  ContactCubeInfoModal,
  KeyboardShortcutsModal,
} from './ContactCubeInfoModal'
import { useContactCubeData } from './hooks/useContactCubeData'
import { useFoldingAnimation } from './hooks/useFoldingAnimation'
import type {
  ColorTheme,
  AnomalyCell,
  CubeFaceId,
  ViewMode,
  FaceTransform,
} from './types'
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
function ErrorDisplay({
  error,
  onRetry,
}: {
  error: string
  onRetry: () => void
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
      <div className="text-center p-6 bg-neutral-900 border border-red-500/30">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
          onClick={onRetry}
          type="button"
        >
          Retry
        </button>
      </div>
    </div>
  )
}

// Smooth camera transitions, only active during preset change, then releases for free orbit
function SmoothCameraPreset({
  controlsRef,
  targetPosition,
  targetFov,
}: {
  controlsRef: React.RefObject<any>
  targetPosition: [number, number, number]
  targetFov: number
}) {
  const { camera } = useThree()
  const target = useMemo(
    () => new THREE.Vector3(...targetPosition),
    [targetPosition]
  )
  const isTransitioning = useRef(false)

  // Start transition when target changes
  useEffect(() => {
    isTransitioning.current = true
  }, [targetPosition, targetFov])

  useFrame(() => {
    if (!controlsRef.current || !isTransitioning.current) return

    const pos = controlsRef.current.object.position as THREE.Vector3
    const dist = pos.distanceTo(target)

    // Stop transitioning once close enough, free orbit resumes
    if (dist < 0.1) {
      isTransitioning.current = false
      return
    }

    // Lerp camera position through OrbitControls
    pos.lerp(target, 0.06)
    controlsRef.current.update()

    // Smooth FOV
    if (camera instanceof THREE.PerspectiveCamera) {
      const fovDelta = targetFov - camera.fov
      if (Math.abs(fovDelta) > 0.1) {
        camera.fov += fovDelta * 0.06
        camera.updateProjectionMatrix()
      }
    }
  })

  return null
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
  setHoveredCell: (
    cell: { row: number; col: number; value: number } | null
  ) => void
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
      const anomaly = anomalies.find(a => a.pos[0] === row && a.pos[1] === col)
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
        autoRotate={autoRotate && viewMode === 'cube' && progress > 0.9}
        colorTheme={colorTheme}
        faces={faces}
        getFaceTransform={getFaceTransform}
        highlightAnomalies={highlightAnomalies}
        onCellClick={handleCellClick}
        onCellHover={handleCellHover}
        progress={progress}
        selectedAnomaly={selectedAnomaly}
        showDepth={showDepth}
        showOutlines={true}
      />

      {showRegistrationMarks && progress > 0.8 && (
        <RegistrationMarkers
          anomalies={anomalies}
          onSelect={setSelectedAnomaly}
          selectedAnomaly={selectedAnomaly}
          visible={true}
        />
      )}

      {viewMode === 'overlay' && overlayPair && faces && progress > 0.9 && (
        <OverlayComparison
          colorTheme={colorTheme}
          face1={faces[overlayPair[0]]}
          face2={faces[overlayPair[1]]}
        />
      )}

      <AxisHelper visible={false} />
    </>
  )
}

// Auto-tour preset order
const TOUR_ORDER: (keyof typeof CAMERA_PRESETS)[] = [
  'default',
  'front',
  'top',
  'side',
  'isometric',
]

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
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyCell | null>(
    null
  )
  const [autoRotate, setAutoRotate] = useState(true)
  const [cameraPreset, setCameraPreset] =
    useState<keyof typeof CAMERA_PRESETS>('default')
  const [overlayPair, setOverlayPair] = useState<
    [CubeFaceId, CubeFaceId] | null
  >(null)
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

  // Auto-tour state
  const [autoTour, setAutoTour] = useState(false)

  // Desktop check for post-processing (bloom is too heavy on mobile)
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    setIsDesktop(window.innerWidth >= 768)
    const handleResize = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

  // Camera settings (smooth transitions via CameraController)
  const cameraSettings = useMemo(
    () => CAMERA_PRESETS[cameraPreset],
    [cameraPreset]
  )

  // Auto-tour: cycle camera presets every 6 seconds
  useEffect(() => {
    if (!autoTour) return
    const interval = setInterval(() => {
      setCameraPreset(prev => {
        const idx = TOUR_ORDER.indexOf(prev)
        return TOUR_ORDER[(idx + 1) % TOUR_ORDER.length]!
      })
    }, 6000)
    return () => clearInterval(interval)
  }, [autoTour])

  // Auto-fold on tour start if flat
  useEffect(() => {
    if (autoTour && progress < 0.5) {
      startFolding()
    }
  }, [autoTour, progress, startFolding])

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
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Reset camera
  const resetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
    setCameraPreset('default')
  }, [])

  // Kill auto-tour on user orbit interaction
  const handleOrbitStart = useCallback(() => {
    if (autoTour) setAutoTour(false)
  }, [autoTour])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return

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
          setShowInfoModal(s => !s)
          break
        case '?':
          e.preventDefault()
          setShowKeyboardShortcuts(s => !s)
          break
        case 'd':
          e.preventDefault()
          setShowDepth(s => !s)
          break
        case 'a':
          e.preventDefault()
          setHighlightAnomalies(s => !s)
          break
        case 'm':
          e.preventDefault()
          setShowRegistrationMarks(s => !s)
          break
        case 't':
          e.preventDefault()
          setAutoTour(s => !s)
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
          setAutoTour(false)
          break
        case '2':
          setCameraPreset('top')
          setAutoTour(false)
          break
        case '3':
          setCameraPreset('front')
          setAutoTour(false)
          break
        case '4':
          setCameraPreset('side')
          setAutoTour(false)
          break
        case '5':
          setCameraPreset('isometric')
          setAutoTour(false)
          break
        case 'escape':
          setShowInfoModal(false)
          setShowKeyboardShortcuts(false)
          setSelectedAnomaly(null)
          setAutoTour(false)
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
      className={`relative w-full bg-black overflow-hidden ${isFullscreen ? 'h-screen' : 'h-[500px] sm:h-[600px] lg:h-[700px]'} ${className}`}
      onClick={e => (e.currentTarget as HTMLDivElement).focus()}
      ref={containerRef}
      tabIndex={0}
    >
      {/* Canvas */}
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
        onPointerMissed={() => setHoveredCell(null)}
        style={{ cursor: hoveredCell ? 'pointer' : 'grab' }}
      >
        <PerspectiveCamera
          fov={cameraSettings.fov}
          makeDefault
          position={cameraSettings.position}
        />
        <SmoothCameraPreset
          controlsRef={controlsRef}
          targetFov={cameraSettings.fov}
          targetPosition={cameraSettings.position}
        />

        {/* Lighting, Gold/Black aesthetic */}
        <ambientLight intensity={0.35} />
        <directionalLight intensity={1.0} position={[10, 10, 5]} />
        <pointLight
          color="#D4AF37"
          intensity={0.3}
          position={[-10, -10, -10]}
        />
        <pointLight color="#D4AF37" intensity={0.2} position={[10, -10, 10]} />
        <pointLight color="#ffffff" intensity={0.15} position={[0, 10, 0]} />

        {/* Environment */}
        <Stars
          count={1500}
          depth={80}
          factor={3}
          fade
          radius={120}
          saturation={0}
          speed={0.5}
        />

        {/* Controls */}
        <OrbitControls
          autoRotate={false}
          dampingFactor={0.05}
          enableDamping={true}
          enablePan={true}
          enableRotate={true}
          enableZoom={true}
          maxDistance={60}
          minDistance={8}
          onStart={handleOrbitStart}
          ref={controlsRef}
        />

        {/* Post-processing, desktop only for performance */}
        {isDesktop && (
          <EffectComposer>
            <Bloom
              intensity={0.5}
              luminanceSmoothing={0.4}
              luminanceThreshold={0.6}
            />
            <Vignette darkness={0.7} offset={0.3} />
          </EffectComposer>
        )}

        {/* Scene content */}
        <Suspense fallback={<LoadingCube />}>
          {faces && (
            <Scene
              autoRotate={autoRotate}
              colorTheme={colorTheme}
              getFaceTransform={getFaceTransform}
              highlightAnomalies={highlightAnomalies}
              hoveredCell={hoveredCell}
              overlayPair={overlayPair}
              progress={progress}
              selectedAnomaly={selectedAnomaly}
              setHoveredCell={setHoveredCell}
              setSelectedAnomaly={setSelectedAnomaly}
              showDepth={showDepth}
              showRegistrationMarks={showRegistrationMarks}
              viewMode={viewMode}
            />
          )}
        </Suspense>
      </Canvas>

      {/* Error overlay */}
      {error && <ErrorDisplay error={error.message} onRetry={retry} />}

      {/* Controls panel, desktop (top-left) + mobile (bottom bar) */}
      {showControls && (
        <ContactCubeControls
          autoRotate={autoRotate}
          autoTour={autoTour}
          cameraPreset={cameraPreset}
          colorTheme={colorTheme}
          highlightAnomalies={highlightAnomalies}
          isAnimating={isAnimating}
          onAutoRotateChange={setAutoRotate}
          onAutoTourChange={setAutoTour}
          onCameraPresetChange={preset => {
            setCameraPreset(preset)
            setAutoTour(false)
          }}
          onFold={startFolding}
          onFullscreen={toggleFullscreen}
          onHighlightAnomaliesChange={setHighlightAnomalies}
          onOverlayPairChange={handleOverlayPairChange}
          onReset={resetAnimation}
          onShowDepthChange={setShowDepth}
          onShowInfo={() => setShowInfoModal(true)}
          onShowRegistrationMarksChange={setShowRegistrationMarks}
          onThemeChange={setColorTheme}
          onUnfold={startUnfolding}
          onViewModeChange={handleViewModeChange}
          overlayPair={overlayPair}
          progress={progress}
          showDepth={showDepth}
          showRegistrationMarks={showRegistrationMarks}
          viewMode={viewMode}
        />
      )}

      {/* Info panel (Right side) */}
      {showInfoPanel && (
        <ContactCubeInfoPanel
          onCloseAnomaly={() => setSelectedAnomaly(null)}
          progress={progress}
          selectedAnomaly={selectedAnomaly}
          stats={stats}
          viewMode={viewMode}
        />
      )}

      {/* Overlay stats when comparing faces */}
      {viewMode === 'overlay' && overlayPair && progress > 0.9 && (
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-sm border border-border px-3 py-2 space-y-1">
            <div className="text-xs font-mono text-gold/80 uppercase tracking-wider">
              Overlay: {overlayPair[0]} ↔ {overlayPair[1]}
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#3B82F6]" />
                <span className="text-[#3B82F6]">Symmetric</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#22C55E]" />
                <span className="text-[#22C55E]">Exact</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#EF4444]" />
                <span className="text-[#EF4444]">Anomaly</span>
              </span>
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              M[r][c] + M[127-r][127-c] = -1
            </div>
          </div>
        </div>
      )}

      {/* Cell tooltip on hover */}
      {hoveredCell && (
        <div className="absolute bottom-12 md:bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-black/90 px-3 py-1.5 border border-gold/20 text-xs font-mono text-gold/80">
            [{hoveredCell.row}, {hoveredCell.col}] = {hoveredCell.value}
            <span className="text-muted-foreground ml-2">
              mirror: [{127 - hoveredCell.row}, {127 - hoveredCell.col}]
            </span>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-gold/30" />
              <div className="absolute inset-0 w-12 h-12 border-2 border-gold border-t-transparent animate-spin" />
            </div>
            <span className="text-sm text-muted-foreground font-mono">
              Loading matrix...
            </span>
          </div>
        </div>
      )}

      {/* Progress indicator during animation, gold themed */}
      {isAnimating && (
        <div className="absolute bottom-16 md:bottom-4 right-4 z-10">
          <div className="bg-black/80 backdrop-blur-sm px-3 py-2 border border-gold/20">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gold/80 uppercase">
                {foldingState.phase === 'folding' ? 'Folding' : 'Unfolding'}
              </span>
              <div className="w-20 h-1 bg-gold/20 overflow-hidden">
                <div
                  className="h-full bg-gold transition-all duration-100"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <span className="text-gold/80 text-xs font-mono">
                {Math.round(progress * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ContactCubeInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
      <KeyboardShortcutsModal
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />
    </div>
  )
}

export default ContactCubeScene
