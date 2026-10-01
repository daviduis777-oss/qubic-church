'use client'

import { useState } from 'react'
import {
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Layers,
  Database,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { RESEARCH_SCENE_CONFIG } from '../config'
import type { ResearchCameraPreset } from '../config'
import type { LayerName } from '../types'

interface ResearchControlPanelProps {
  visibleLayers: Set<LayerName>
  onToggleLayer: (layer: LayerName) => void
  onShowAll?: () => void
  onHideAll?: () => void
  cameraPreset: ResearchCameraPreset
  onCameraPreset: (preset: ResearchCameraPreset) => void
  loadedSources: string[]
  onFullscreen: () => void
  isFullscreen: boolean
}

const LAYER_ICONS: Record<LayerName, string> = {
  terrain: 'Grid',
  anomalies: 'Alert',
  spiral: 'Trend',
  cycle: 'Rotate',
}

const LAYER_TOOLTIPS: Record<LayerName, string> = {
  terrain: '128x128 Anna Matrix as a 3D height-field colored by value polarity',
  anomalies: '68 symmetry-breaking cells that deviate from point symmetry',
  spiral: 'Complex eigenvalue distribution and 90.456-degree dominant angle',
  cycle: 'Period-4 cycles of the direct iteration sign(M·v)',
}

const CAMERA_SHORTCUTS: Record<ResearchCameraPreset, string> = {
  overview: 'O',
  matrix: 'M',
  spiral: 'S',
  cycle: 'C',
}

export function ResearchControlPanel({
  visibleLayers,
  onToggleLayer,
  onShowAll,
  onHideAll,
  cameraPreset,
  onCameraPreset,
  loadedSources,
  onFullscreen,
  isFullscreen,
}: ResearchControlPanelProps) {
  const [isOpen, setIsOpen] = useState(true)

  const layers = Object.entries(RESEARCH_SCENE_CONFIG.LAYERS) as [
    LayerName,
    (typeof RESEARCH_SCENE_CONFIG.LAYERS)[LayerName],
  ][]
  const presets = Object.entries(RESEARCH_SCENE_CONFIG.CAMERA_PRESETS) as [
    ResearchCameraPreset,
    (typeof RESEARCH_SCENE_CONFIG.CAMERA_PRESETS)[ResearchCameraPreset],
  ][]

  return (
    <>
      {/* Desktop panel */}
      <div className="absolute top-3 left-3 hidden md:block pointer-events-auto">
        <div className="bg-black/70 backdrop-blur-sm border border-border w-[220px]">
          {/* Header */}
          <button
            className="w-full flex items-center justify-between p-2.5 hover:bg-white/[0.02] transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            type="button"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-gold/80" />
              <span className="text-xs font-mono text-gold/70 uppercase tracking-wider">
                Research Layers
              </span>
            </div>
            {isOpen ? (
              <ChevronUp className="w-3 h-3 text-muted-foreground/70" />
            ) : (
              <ChevronDown className="w-3 h-3 text-muted-foreground/70" />
            )}
          </button>

          {isOpen && (
            <div className="p-2.5 pt-0 space-y-3">
              {/* Layer toggles */}
              <div className="space-y-1">
                {layers.map(([key, layer], idx) => {
                  const isVisible = visibleLayers.has(key)
                  const isLoaded =
                    key === 'terrain'
                      ? loadedSources.includes('matrix')
                      : key === 'anomalies'
                        ? loadedSources.includes('anomalies')
                        : key === 'spiral' || key === 'cycle'
                          ? loadedSources.includes('spectral')
                          : false

                  return (
                    <button
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 transition-colors text-left',
                        isVisible && isLoaded
                          ? 'bg-white/[0.04] text-white/70'
                          : 'text-muted-foreground',
                        !isLoaded && 'opacity-30 cursor-not-allowed',
                        isLoaded && 'hover:bg-white/[0.03]'
                      )}
                      disabled={!isLoaded}
                      key={key}
                      onClick={() => onToggleLayer(key)}
                      title={LAYER_TOOLTIPS[key]}
                      type="button"
                    >
                      {isVisible ? (
                        <Eye className="w-3 h-3 shrink-0" />
                      ) : (
                        <EyeOff className="w-3 h-3 shrink-0" />
                      )}
                      <span className="text-xs font-mono flex-1">
                        {layer.label}
                      </span>
                      <kbd className="shrink-0 px-1 py-0.5 text-xs font-mono text-muted-foreground bg-white/[0.04] border border-border rounded-sm leading-none">
                        {idx + 1}
                      </kbd>
                      {!isLoaded && (
                        <span className="text-xs text-muted-foreground">
                          loading
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Show/Hide all */}
              <div className="flex gap-1 px-2 mt-1">
                <button
                  className="flex-1 px-2 py-1 text-xs font-mono text-muted-foreground border border-border hover:text-white/50 hover:bg-white/[0.03] transition-colors"
                  onClick={onShowAll}
                  type="button"
                >
                  Show All
                </button>
                <button
                  className="flex-1 px-2 py-1 text-xs font-mono text-muted-foreground border border-border hover:text-white/50 hover:bg-white/[0.03] transition-colors"
                  onClick={onHideAll}
                  type="button"
                >
                  Hide All
                </button>
              </div>

              {/* Camera presets */}
              <div>
                <div className="text-xs font-mono text-muted-foreground uppercase mb-1 px-2">
                  Camera
                </div>
                <div className="flex flex-wrap gap-1 px-1">
                  {presets.map(([key, preset]) => (
                    <button
                      className={cn(
                        'px-2 py-1 text-xs font-mono border transition-colors flex items-center gap-1',
                        cameraPreset === key
                          ? 'bg-gold/15 text-gold/70 border-gold/25'
                          : 'text-muted-foreground border-border hover:text-white/50'
                      )}
                      key={key}
                      onClick={() => onCameraPreset(key)}
                      title={`Press "${CAMERA_SHORTCUTS[key]}" for ${preset.label} view`}
                      type="button"
                    >
                      {preset.label}
                      <kbd className="text-xs text-muted-foreground">
                        {CAMERA_SHORTCUTS[key]}
                      </kbd>
                    </button>
                  ))}
                </div>
              </div>

              {/* Data sources status */}
              <div className="border-t border-border pt-2">
                <div className="flex items-center gap-1.5 px-2">
                  <Database className="w-3 h-3 text-muted-foreground/70" />
                  <span className="text-xs font-mono text-muted-foreground">
                    {loadedSources.length}/3 data sources
                  </span>
                </div>
                <div className="flex gap-1 mt-1 px-2">
                  {['matrix', 'spectral', 'anomalies'].map(src => (
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        loadedSources.includes(src)
                          ? 'bg-emerald-400/60'
                          : 'bg-white/10'
                      )}
                      key={src}
                      title={`${src}: ${loadedSources.includes(src) ? 'loaded' : 'pending'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-mono text-muted-foreground border border-border hover:text-white/50 transition-colors"
                  onClick={onFullscreen}
                  type="button"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-3 h-3" />
                  ) : (
                    <Maximize2 className="w-3 h-3" />
                  )}
                  {isFullscreen ? 'Exit' : 'Fullscreen'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom bar, compact icon grid */}
      <div className="absolute bottom-0 left-0 right-0 md:hidden pointer-events-auto">
        <div className="bg-black/85 backdrop-blur-sm border-t border-border px-2 py-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[3px]">
              {layers.map(([key], idx) => {
                const isVisible = visibleLayers.has(key)
                return (
                  <button
                    className={cn(
                      'w-7 h-7 text-xs font-mono font-bold border flex items-center justify-center',
                      isVisible
                        ? 'bg-gold/15 text-gold border-gold/25'
                        : 'text-muted-foreground border-border'
                    )}
                    key={key}
                    onClick={() => onToggleLayer(key)}
                    type="button"
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
            <button
              className="w-7 h-7 text-muted-foreground border border-border flex items-center justify-center"
              onClick={onFullscreen}
              type="button"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
