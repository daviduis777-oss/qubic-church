'use client'

import { useState, useCallback, useRef, useEffect, } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { Loader2, Zap, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useResearchData } from './useResearchData'
import { RESEARCH_SCENE_CONFIG } from './config'
import type { ResearchCameraPreset } from './config'
import type { LayerName, SelectedElement } from './types'
import { MatrixTerrainLayer } from './layers/MatrixTerrainLayer'
import { EigenvalueSpiralLayer } from './layers/EigenvalueSpiralLayer'
import { AnomalyMarkersLayer } from './layers/AnomalyMarkersLayer'
import { Period4CycleLayer } from './layers/Period4CycleLayer'
import { ResearchControlPanel } from './panels/ResearchControlPanel'
import { FindingDetailPanel } from './panels/FindingDetailPanel'
import { ResearchInfoModal } from './panels/ResearchInfoModal'

const TOUR_ORDER: ResearchCameraPreset[] = [
  'overview',
  'matrix',
  'spiral',
  'cycle',
]

export default function QortexResearchScene() {
  const data = useResearchData()
  const [visibleLayers, setVisibleLayers] = useState<Set<LayerName>>(
    new Set(Object.keys(RESEARCH_SCENE_CONFIG.LAYERS) as LayerName[])
  )
  const [selectedElement, setSelectedElement] =
    useState<SelectedElement | null>(null)
  const [cameraPreset, setCameraPreset] =
    useState<ResearchCameraPreset>('overview')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [autoTour, setAutoTour] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleLayer = useCallback((layer: LayerName) => {
    setVisibleLayers(prev => {
      const next = new Set(prev)
      if (next.has(layer)) next.delete(layer)
      else next.add(layer)
      return next
    })
  }, [])

  const handleSelect = useCallback((element: SelectedElement | null) => {
    setSelectedElement(element)
  }, [])

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const handleShowAll = useCallback(() => {
    setVisibleLayers(
      new Set(Object.keys(RESEARCH_SCENE_CONFIG.LAYERS) as LayerName[])
    )
  }, [])

  const handleHideAll = useCallback(() => {
    setVisibleLayers(new Set())
  }, [])

  // Auto-tour: cycle camera presets every 6 seconds
  useEffect(() => {
    if (!autoTour) return
    const interval = setInterval(() => {
      setCameraPreset(
        prev => TOUR_ORDER[(TOUR_ORDER.indexOf(prev) + 1) % TOUR_ORDER.length]!
      )
    }, 6000)
    return () => clearInterval(interval)
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
          handleFullscreen()
          break
        case 'i':
          setShowInfoModal(v => !v)
          break
        case 't':
          setAutoTour(v => !v)
          break
        case 'escape':
          setShowInfoModal(false)
          setSelectedElement(null)
          setAutoTour(false)
          break
        case '1':
          toggleLayer('terrain')
          break
        case '2':
          toggleLayer('anomalies')
          break
        case '3':
          toggleLayer('spiral')
          break
        case '4':
          toggleLayer('cycle')
          break
        case 'o':
          setCameraPreset('overview')
          setAutoTour(false)
          break
        case 'm':
          setCameraPreset('matrix')
          setAutoTour(false)
          break
        case 's':
          setCameraPreset('spiral')
          setAutoTour(false)
          break
        case 'c':
          setCameraPreset('cycle')
          setAutoTour(false)
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleFullscreen, toggleLayer])

  // Loading state
  if (data.loading && !data.ready) {
    return (
      <div className="w-full h-[500px] sm:h-[600px] lg:h-[700px] bg-card flex items-center justify-center border border-border">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-2 border-gold/30" />
            <div className="absolute inset-0 w-16 h-16 border-2 border-gold border-t-transparent animate-spin" />
          </div>
          <div className="text-center">
            <div className="text-sm text-white/50 font-mono">
              Loading Research Data...
            </div>
            <div className="text-xs text-muted-foreground font-mono mt-1">
              {data.loadedSources.length}/3 sources
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state (no matrix loaded)
  if (!data.ready) {
    return (
      <div className="w-full h-[500px] sm:h-[600px] lg:h-[700px] bg-card flex items-center justify-center border border-border">
        <div className="flex flex-col items-center gap-3 text-center px-4">
          <AlertTriangle className="w-8 h-8 text-red-400/50" />
          <div className="text-sm text-white/50 font-mono">
            Failed to load research data
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            Failed: {data.failedSources.join(', ') || 'unknown'}
          </div>
        </div>
      </div>
    )
  }

  const preset = RESEARCH_SCENE_CONFIG.CAMERA_PRESETS[cameraPreset]

  return (
    <div
      className={cn(
        'relative w-full bg-card border border-border overflow-hidden outline-none focus:ring-1 focus:ring-gold/20',
        isFullscreen ? 'h-screen' : 'h-[500px] sm:h-[600px] lg:h-[700px]'
      )}
      onClick={e => {
        // Auto-focus canvas on click so keyboard works
        ;(e.currentTarget as HTMLDivElement).focus()
      }}
      onKeyDown={e => {
        // Prevent arrow keys from switching browser tabs/Radix tabs when canvas is focused
        if (
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
        ) {
          e.stopPropagation()
        }
      }}
      ref={containerRef}
      tabIndex={0}
    >
      {/* 3D Canvas */}
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
        shadows={false}
      >
        <PerspectiveCamera
          far={500}
          fov={55}
          makeDefault
          near={0.1}
          position={preset.position as unknown as [number, number, number]}
        />
        <OrbitControls
          dampingFactor={0.08}
          enableDamping
          enablePan
          keyPanSpeed={15}
          keys={{
            LEFT: 'ArrowLeft',
            UP: 'ArrowUp',
            RIGHT: 'ArrowRight',
            BOTTOM: 'ArrowDown',
          }}
          listenToKeyEvents={
            typeof document !== 'undefined'
              ? (document as unknown as HTMLElement)
              : undefined
          }
          maxDistance={120}
          minDistance={3}
          panSpeed={0.6}
          rotateSpeed={0.6}
          target={preset.target as unknown as [number, number, number]}
          zoomSpeed={1.0}
        />

        {/* Atmosphere */}
        <Stars
          count={1500}
          depth={60}
          factor={3}
          fade
          radius={120}
          saturation={0}
          speed={0.3}
        />
        {/* <fog attach="fog" args={['#050505', 60, 120]} /> */}

        {/* Lighting */}
        <ambientLight intensity={0.8} />
        <directionalLight
          color="#FFF8F0"
          intensity={0.6}
          position={[10, 20, 10]}
        />
        <pointLight color="#60A5FA" intensity={0.4} position={[-8, 15, -8]} />
        <pointLight color="#D4AF37" intensity={0.3} position={[8, 25, 8]} />
        <pointLight color="#A78BFA" intensity={0.3} position={[0, 40, -5]} />

        {/* Layers */}
        {visibleLayers.has('terrain') && data.matrix && (
          <MatrixTerrainLayer
            matrix={data.matrix}
            onSelect={handleSelect}
            showXorOverlay={visibleLayers.has('anomalies')}
          />
        )}
        {visibleLayers.has('anomalies') && data.anomalies && (
          <AnomalyMarkersLayer
            anomalies={data.anomalies}
            onSelect={handleSelect}
          />
        )}
        {visibleLayers.has('spiral') && data.spectral && (
          <EigenvalueSpiralLayer
            onSelect={handleSelect}
            spectral={data.spectral}
          />
        )}
        {visibleLayers.has('cycle') && data.spectral && (
          <Period4CycleLayer onSelect={handleSelect} spectral={data.spectral} />
        )}

        {/* Post-processing */}
        <EffectComposer>
          <Bloom
            intensity={0.5}
            luminanceSmoothing={0.4}
            luminanceThreshold={0.6}
          />
          <Vignette darkness={0.7} offset={0.3} />
        </EffectComposer>
      </Canvas>

      {/* UI Overlay */}
      <ResearchControlPanel
        cameraPreset={cameraPreset}
        isFullscreen={isFullscreen}
        loadedSources={data.loadedSources}
        onCameraPreset={setCameraPreset}
        onFullscreen={handleFullscreen}
        onHideAll={handleHideAll}
        onShowAll={handleShowAll}
        onToggleLayer={toggleLayer}
        visibleLayers={visibleLayers}
      />

      {/* Detail Panel */}
      {selectedElement && (
        <FindingDetailPanel
          element={selectedElement}
          onClose={() => setSelectedElement(null)}
        />
      )}

      {/* Info modal */}
      <ResearchInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />

      {/* Desktop: bottom-left status bar */}
      <div className="absolute bottom-2 left-2 hidden md:flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-gold/80" />
          <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
            {data.loadedSources.length}/3 · WebGL
          </span>
          {data.loading && (
            <Loader2 className="w-3 h-3 text-muted-foreground/70 animate-spin" />
          )}
        </div>
        <button
          className={cn(
            'px-2 py-1 text-xs font-mono border transition-colors',
            autoTour
              ? 'text-emerald-400/70 border-emerald-400/30 bg-emerald-400/10'
              : 'text-muted-foreground border-border hover:text-white/60'
          )}
          onClick={() => setAutoTour(v => !v)}
          type="button"
        >
          {autoTour ? 'Touring...' : 'Tour (T)'}
        </button>
        <button
          className="px-2 py-1 text-xs font-mono text-gold/80 border border-gold/20 hover:bg-gold/10 hover:text-gold/70 transition-colors"
          onClick={() => setShowInfoModal(true)}
          type="button"
        >
          ? Info
        </button>
      </div>

      {/* Mobile: top-right compact buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1 md:hidden pointer-events-auto">
        <button
          className={cn(
            'w-7 h-7 text-xs font-mono border flex items-center justify-center',
            autoTour
              ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
              : 'text-muted-foreground border-border'
          )}
          onClick={() => setAutoTour(v => !v)}
          type="button"
        >
          {autoTour ? '||' : 'T'}
        </button>
        <button
          className="w-7 h-7 text-xs font-mono text-gold/80 border border-gold/20 flex items-center justify-center"
          onClick={() => setShowInfoModal(true)}
          type="button"
        >
          ?
        </button>
      </div>
    </div>
  )
}
