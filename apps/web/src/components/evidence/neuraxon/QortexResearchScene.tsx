'use client'

import { useState, useCallback, useRef, useEffect, Suspense } from 'react'
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
import { BridgeNetworkLayer } from './layers/BridgeNetworkLayer'
import { EigenvalueSpiralLayer } from './layers/EigenvalueSpiralLayer'
import { AnomalyMarkersLayer } from './layers/AnomalyMarkersLayer'
import { Period4CycleLayer } from './layers/Period4CycleLayer'
import { AddressArchaeologyLayer } from './layers/AddressArchaeologyLayer'
import { EncodedMessagesLayer } from './layers/EncodedMessagesLayer'
import { ResearchControlPanel } from './panels/ResearchControlPanel'
import { FindingDetailPanel } from './panels/FindingDetailPanel'
import { ResearchInfoModal } from './panels/ResearchInfoModal'

export default function QortexResearchScene() {
  const data = useResearchData()
  const [visibleLayers, setVisibleLayers] = useState<Set<LayerName>>(
    new Set(Object.keys(RESEARCH_SCENE_CONFIG.LAYERS) as LayerName[]),
  )
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [cameraPreset, setCameraPreset] = useState<ResearchCameraPreset>('overview')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [autoTour, setAutoTour] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleLayer = useCallback((layer: LayerName) => {
    setVisibleLayers((prev) => {
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
    setVisibleLayers(new Set(Object.keys(RESEARCH_SCENE_CONFIG.LAYERS) as LayerName[]))
  }, [])

  const handleHideAll = useCallback(() => {
    setVisibleLayers(new Set())
  }, [])

  // Auto-tour: cycle camera presets every 6 seconds
  const TOUR_ORDER: ResearchCameraPreset[] = ['overview', 'matrix', 'bridges', 'spiral', 'cycle']
  useEffect(() => {
    if (!autoTour) return
    const interval = setInterval(() => {
      setCameraPreset((prev) => TOUR_ORDER[(TOUR_ORDER.indexOf(prev) + 1) % TOUR_ORDER.length]!)
    }, 6000)
    return () => clearInterval(interval)
  }, [autoTour])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      switch (e.key.toLowerCase()) {
        case 'f': handleFullscreen(); break
        case 'i': setShowInfoModal(v => !v); break
        case 't': setAutoTour(v => !v); break
        case 'escape': setShowInfoModal(false); setSelectedElement(null); setAutoTour(false); break
        case '1': toggleLayer('terrain'); break
        case '2': toggleLayer('anomalies'); break
        case '3': toggleLayer('bridges'); break
        case '4': toggleLayer('spiral'); break
        case '5': toggleLayer('cycle'); break
        case '6': toggleLayer('addresses'); break
        case '7': toggleLayer('messages'); break
        case 'o': setCameraPreset('overview'); setAutoTour(false); break
        case 'm': setCameraPreset('matrix'); setAutoTour(false); break
        case 'b': setCameraPreset('bridges'); setAutoTour(false); break
        case 's': setCameraPreset('spiral'); setAutoTour(false); break
        case 'c': setCameraPreset('cycle'); setAutoTour(false); break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleFullscreen, toggleLayer])

  // Loading state
  if (data.loading && !data.ready) {
    return (
      <div className="w-full h-[500px] sm:h-[600px] lg:h-[700px] bg-[#050505] flex items-center justify-center border border-white/[0.04]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-2 border-[#D4AF37]/30" />
            <div className="absolute inset-0 w-16 h-16 border-2 border-[#D4AF37] border-t-transparent animate-spin" />
          </div>
          <div className="text-center">
            <div className="text-sm text-white/50 font-mono">Loading Research Data...</div>
            <div className="text-xs text-white/25 font-mono mt-1">
              {data.loadedSources.length}/5 sources
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state (no matrix loaded)
  if (!data.ready) {
    return (
      <div className="w-full h-[500px] sm:h-[600px] lg:h-[700px] bg-[#050505] flex items-center justify-center border border-white/[0.04]">
        <div className="flex flex-col items-center gap-3 text-center px-4">
          <AlertTriangle className="w-8 h-8 text-red-400/50" />
          <div className="text-sm text-white/50 font-mono">Failed to load research data</div>
          <div className="text-xs text-white/25 font-mono">
            Failed: {data.failedSources.join(', ') || 'unknown'}
          </div>
        </div>
      </div>
    )
  }

  const preset = RESEARCH_SCENE_CONFIG.CAMERA_PRESETS[cameraPreset]

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={(e) => {
        // Prevent arrow keys from switching browser tabs/Radix tabs when canvas is focused
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.stopPropagation()
        }
      }}
      className={cn(
        'relative w-full bg-[#050505] border border-white/[0.04] overflow-hidden outline-none focus:ring-1 focus:ring-[#D4AF37]/20',
        isFullscreen ? 'h-screen' : 'h-[500px] sm:h-[600px] lg:h-[700px]',
      )}
      onClick={(e) => {
        // Auto-focus canvas on click so keyboard works
        (e.currentTarget as HTMLDivElement).focus()
      }}
    >
      {/* 3D Canvas */}
      <Canvas dpr={[1, 1.5]} gl={{ antialias: true, alpha: false }} shadows={false}>
        <PerspectiveCamera
          makeDefault
          fov={55}
          near={0.1}
          far={500}
          position={preset.position as unknown as [number, number, number]}
        />
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.6}
          zoomSpeed={1.0}
          panSpeed={0.6}
          minDistance={3}
          maxDistance={120}
          target={preset.target as unknown as [number, number, number]}
          enablePan
          keyPanSpeed={15}
          keys={{
            LEFT: 'ArrowLeft',
            UP: 'ArrowUp',
            RIGHT: 'ArrowRight',
            BOTTOM: 'ArrowDown',
          }}
          listenToKeyEvents={typeof document !== 'undefined' ? (document as unknown as HTMLElement) : undefined}
        />

        {/* Atmosphere */}
        <Stars radius={120} depth={60} count={1500} factor={3} saturation={0} fade speed={0.3} />
        {/* <fog attach="fog" args={['#050505', 60, 120]} /> */}

        {/* Lighting */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 20, 10]} intensity={0.6} color="#FFF8F0" />
        <pointLight position={[-8, 15, -8]} intensity={0.4} color="#60A5FA" />
        <pointLight position={[8, 25, 8]} intensity={0.3} color="#D4AF37" />
        <pointLight position={[0, 40, -5]} intensity={0.3} color="#A78BFA" />

        {/* Layers */}
        {visibleLayers.has('terrain') && data.matrix && (
          <MatrixTerrainLayer matrix={data.matrix} onSelect={handleSelect} showXorOverlay={visibleLayers.has('anomalies')} />
        )}
        {visibleLayers.has('anomalies') && data.anomalies && (
          <AnomalyMarkersLayer anomalies={data.anomalies} onSelect={handleSelect} />
        )}
        {visibleLayers.has('bridges') && data.bridges && (
          <BridgeNetworkLayer bridges={data.bridges} onSelect={handleSelect} />
        )}
        {visibleLayers.has('spiral') && data.spectral && (
          <EigenvalueSpiralLayer spectral={data.spectral} onSelect={handleSelect} />
        )}
        {visibleLayers.has('cycle') && data.spectral && (
          <Period4CycleLayer spectral={data.spectral} onSelect={handleSelect} />
        )}
        {visibleLayers.has('addresses') && data.addresses && (
          <AddressArchaeologyLayer addresses={data.addresses} onSelect={handleSelect} />
        )}
        {visibleLayers.has('messages') && (
          <EncodedMessagesLayer onSelect={handleSelect} />
        )}

        {/* Post-processing */}
        <EffectComposer>
          <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.4} intensity={0.5} />
          <Vignette offset={0.3} darkness={0.7} />
        </EffectComposer>
      </Canvas>

      {/* UI Overlay */}
      <ResearchControlPanel
        visibleLayers={visibleLayers}
        onToggleLayer={toggleLayer}
        onShowAll={handleShowAll}
        onHideAll={handleHideAll}
        cameraPreset={cameraPreset}
        onCameraPreset={setCameraPreset}
        loadedSources={data.loadedSources}
        onFullscreen={handleFullscreen}
        isFullscreen={isFullscreen}
      />

      {/* Detail Panel */}
      {selectedElement && (
        <FindingDetailPanel
          element={selectedElement}
          onClose={() => setSelectedElement(null)}
        />
      )}

      {/* Info modal */}
      <ResearchInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />

      {/* Desktop: bottom-left status bar */}
      <div className="absolute bottom-2 left-2 hidden md:flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-[#D4AF37]/40" />
          <span className="text-[11px] font-mono text-white/25 whitespace-nowrap">
            {data.loadedSources.length}/5 · WebGL
          </span>
          {data.loading && <Loader2 className="w-3 h-3 text-white/20 animate-spin" />}
        </div>
        <button
          onClick={() => setAutoTour(v => !v)}
          className={cn(
            'px-2 py-1 text-[10px] font-mono border transition-colors',
            autoTour
              ? 'text-emerald-400/70 border-emerald-400/30 bg-emerald-400/10'
              : 'text-white/40 border-white/[0.08] hover:text-white/60',
          )}
        >
          {autoTour ? 'Touring...' : 'Tour (T)'}
        </button>
        <button
          onClick={() => setShowInfoModal(true)}
          className="px-2 py-1 text-[10px] font-mono text-[#D4AF37]/50 border border-[#D4AF37]/20 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]/70 transition-colors"
        >
          ? Info
        </button>
      </div>

      {/* Mobile: top-right compact buttons */}
      <div className="absolute top-2 right-2 flex items-center gap-1 md:hidden pointer-events-auto">
        <button
          onClick={() => setAutoTour(v => !v)}
          className={cn(
            'w-7 h-7 text-[9px] font-mono border flex items-center justify-center',
            autoTour
              ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
              : 'text-white/30 border-white/[0.06]',
          )}
        >
          {autoTour ? '||' : 'T'}
        </button>
        <button
          onClick={() => setShowInfoModal(true)}
          className="w-7 h-7 text-[9px] font-mono text-[#D4AF37]/50 border border-[#D4AF37]/20 flex items-center justify-center"
        >
          ?
        </button>
      </div>
    </div>
  )
}
