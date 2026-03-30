'use client'

import { useState } from 'react'
import { Eye, EyeOff, Camera, Maximize2, Minimize2, ChevronDown, ChevronUp, Layers, Database } from 'lucide-react'
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
  bridges: 'Network',
  spiral: 'Trend',
  cycle: 'Rotate',
  addresses: 'Pin',
  messages: 'MessageSquare',
}

const LAYER_TOOLTIPS: Record<LayerName, string> = {
  terrain: '128x128 Anna Matrix as a 3D height-field colored by value polarity',
  anomalies: '68 symmetry-breaking cells that deviate from point symmetry',
  bridges: 'Bitcoin-Qubic bridge address mappings and XOR pairings',
  spiral: 'Complex eigenvalue distribution and 90.456-degree dominant angle',
  cycle: 'Period-4 attractor cycle: COOP-COOP-REST-REST behavioral pattern',
  addresses: '30 special Bitcoin addresses found at exact matrix coordinates',
  messages: 'Encoded text messages discovered in the matrix values',
}

const CAMERA_SHORTCUTS: Record<ResearchCameraPreset, string> = {
  overview: 'O',
  matrix: 'M',
  bridges: 'B',
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

  const layers = Object.entries(RESEARCH_SCENE_CONFIG.LAYERS) as [LayerName, typeof RESEARCH_SCENE_CONFIG.LAYERS[LayerName]][]
  const presets = Object.entries(RESEARCH_SCENE_CONFIG.CAMERA_PRESETS) as [ResearchCameraPreset, typeof RESEARCH_SCENE_CONFIG.CAMERA_PRESETS[ResearchCameraPreset]][]

  return (
    <>
      {/* Desktop panel */}
      <div className="absolute top-3 left-3 hidden md:block pointer-events-auto">
        <div className="bg-black/70 backdrop-blur-sm border border-white/[0.08] w-[220px]">
          {/* Header */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between p-2.5 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#D4AF37]/50" />
              <span className="text-xs font-mono text-[#D4AF37]/70 uppercase tracking-wider">Research Layers</span>
            </div>
            {isOpen ? <ChevronUp className="w-3 h-3 text-white/30" /> : <ChevronDown className="w-3 h-3 text-white/30" />}
          </button>

          {isOpen && (
            <div className="p-2.5 pt-0 space-y-3">
              {/* Layer toggles */}
              <div className="space-y-1">
                {layers.map(([key, layer], idx) => {
                  const isVisible = visibleLayers.has(key)
                  const isLoaded = key === 'terrain' ? loadedSources.includes('matrix')
                    : key === 'anomalies' ? loadedSources.includes('anomalies')
                    : key === 'bridges' ? loadedSources.includes('bridges')
                    : key === 'spiral' || key === 'cycle' ? loadedSources.includes('spectral')
                    : key === 'addresses' ? loadedSources.includes('addresses')
                    : key === 'messages' ? true
                    : false

                  return (
                    <button
                      key={key}
                      onClick={() => onToggleLayer(key)}
                      disabled={!isLoaded}
                      title={LAYER_TOOLTIPS[key]}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 transition-colors text-left',
                        isVisible && isLoaded ? 'bg-white/[0.04] text-white/70' : 'text-white/30',
                        !isLoaded && 'opacity-30 cursor-not-allowed',
                        isLoaded && 'hover:bg-white/[0.03]',
                      )}
                    >
                      {isVisible ? <Eye className="w-3 h-3 shrink-0" /> : <EyeOff className="w-3 h-3 shrink-0" />}
                      <span className="text-xs font-mono flex-1">{layer.label}</span>
                      <kbd className="shrink-0 px-1 py-0.5 text-[9px] font-mono text-white/20 bg-white/[0.04] border border-white/[0.06] rounded-sm leading-none">
                        {idx + 1}
                      </kbd>
                      {!isLoaded && <span className="text-[10px] text-white/20">loading</span>}
                    </button>
                  )
                })}
              </div>

              {/* Show/Hide all */}
              <div className="flex gap-1 px-2 mt-1">
                <button
                  onClick={onShowAll}
                  className="flex-1 px-2 py-1 text-[10px] font-mono text-white/30 border border-white/[0.06] hover:text-white/50 hover:bg-white/[0.03] transition-colors"
                >
                  Show All
                </button>
                <button
                  onClick={onHideAll}
                  className="flex-1 px-2 py-1 text-[10px] font-mono text-white/30 border border-white/[0.06] hover:text-white/50 hover:bg-white/[0.03] transition-colors"
                >
                  Hide All
                </button>
              </div>

              {/* Camera presets */}
              <div>
                <div className="text-[10px] font-mono text-white/25 uppercase mb-1 px-2">Camera</div>
                <div className="flex flex-wrap gap-1 px-1">
                  {presets.map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => onCameraPreset(key)}
                      title={`Press "${CAMERA_SHORTCUTS[key]}" for ${preset.label} view`}
                      className={cn(
                        'px-2 py-1 text-[10px] font-mono border transition-colors flex items-center gap-1',
                        cameraPreset === key
                          ? 'bg-[#D4AF37]/15 text-[#D4AF37]/70 border-[#D4AF37]/25'
                          : 'text-white/30 border-white/[0.06] hover:text-white/50',
                      )}
                    >
                      {preset.label}
                      <kbd className="text-[8px] opacity-40">{CAMERA_SHORTCUTS[key]}</kbd>
                    </button>
                  ))}
                </div>
              </div>

              {/* Data sources status */}
              <div className="border-t border-white/[0.06] pt-2">
                <div className="flex items-center gap-1.5 px-2">
                  <Database className="w-3 h-3 text-white/20" />
                  <span className="text-[10px] font-mono text-white/25">
                    {loadedSources.length}/5 data sources
                  </span>
                </div>
                <div className="flex gap-1 mt-1 px-2">
                  {['matrix', 'spectral', 'anomalies', 'bridges', 'addresses'].map((src) => (
                    <div
                      key={src}
                      className={cn(
                        'w-2 h-2 rounded-full',
                        loadedSources.includes(src) ? 'bg-emerald-400/60' : 'bg-white/10',
                      )}
                      title={`${src}: ${loadedSources.includes(src) ? 'loaded' : 'pending'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={onFullscreen}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-mono text-white/30 border border-white/[0.06] hover:text-white/50 transition-colors"
                >
                  {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                  {isFullscreen ? 'Exit' : 'Fullscreen'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom bar — compact icon grid */}
      <div className="absolute bottom-0 left-0 right-0 md:hidden pointer-events-auto">
        <div className="bg-black/85 backdrop-blur-sm border-t border-white/[0.08] px-2 py-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[3px]">
              {layers.map(([key], idx) => {
                const isVisible = visibleLayers.has(key)
                return (
                  <button
                    key={key}
                    onClick={() => onToggleLayer(key)}
                    className={cn(
                      'w-7 h-7 text-[10px] font-mono font-bold border flex items-center justify-center',
                      isVisible
                        ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/25'
                        : 'text-white/20 border-white/[0.04]',
                    )}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
            <button
              onClick={onFullscreen}
              className="w-7 h-7 text-white/30 border border-white/[0.06] flex items-center justify-center"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
