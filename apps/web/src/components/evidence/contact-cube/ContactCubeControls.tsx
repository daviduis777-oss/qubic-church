'use client'

import { useState } from 'react'
import {
  Box,
  Layers,
  RotateCcw,
  Play,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  Eye,
  EyeOff,
  Camera,
  Palette,
  Maximize,
  Info,
  Navigation,
} from 'lucide-react'
import type { ViewMode, ColorTheme, CubeFaceId } from './types'
import { CAMERA_PRESETS, FACE_PAIRS, COLOR_THEMES } from './constants'

interface ContactCubeControlsProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  colorTheme: ColorTheme
  onThemeChange: (theme: ColorTheme) => void
  showDepth: boolean
  onShowDepthChange: (show: boolean) => void
  highlightAnomalies: boolean
  onHighlightAnomaliesChange: (highlight: boolean) => void
  showRegistrationMarks: boolean
  onShowRegistrationMarksChange: (show: boolean) => void
  autoRotate: boolean
  onAutoRotateChange: (rotate: boolean) => void
  cameraPreset: keyof typeof CAMERA_PRESETS
  onCameraPresetChange: (preset: keyof typeof CAMERA_PRESETS) => void
  onFold: () => void
  onUnfold: () => void
  onReset: () => void
  progress: number
  isAnimating: boolean
  overlayPair: [CubeFaceId, CubeFaceId] | null
  onOverlayPairChange: (pair: [CubeFaceId, CubeFaceId]) => void
  onFullscreen?: () => void
  onShowInfo?: () => void
  autoTour?: boolean
  onAutoTourChange?: (tour: boolean) => void
}

const VIEW_MODES: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'flat', label: 'Flat', icon: <Grid3X3 className="w-3 h-3" /> },
  { id: 'cube', label: 'Cube', icon: <Box className="w-3 h-3" /> },
  { id: 'overlay', label: 'Overlay', icon: <Layers className="w-3 h-3" /> },
]

const PRESET_LABELS: Record<string, string> = {
  default: 'Default',
  top: 'Top',
  front: 'Front',
  side: 'Side',
  isometric: 'Iso',
}

const THEME_LABELS: Record<ColorTheme, { label: string; swatch: string }> = {
  default: { label: 'Default', swatch: 'bg-gradient-to-r from-blue-500 via-gray-500 to-amber-500' },
  fire: { label: 'Fire', swatch: 'bg-gradient-to-r from-blue-900 via-red-600 to-yellow-300' },
  ice: { label: 'Ice', swatch: 'bg-gradient-to-r from-blue-800 via-cyan-500 to-white' },
  matrix: { label: 'Matrix', swatch: 'bg-gradient-to-r from-black via-green-800 to-green-400' },
  scientific: { label: 'Science', swatch: 'bg-gradient-to-r from-purple-600 via-white to-red-500' },
}

export function ContactCubeControls({
  viewMode,
  onViewModeChange,
  colorTheme,
  onThemeChange,
  showDepth,
  onShowDepthChange,
  highlightAnomalies,
  onHighlightAnomaliesChange,
  showRegistrationMarks,
  onShowRegistrationMarksChange,
  autoRotate,
  onAutoRotateChange,
  cameraPreset,
  onCameraPresetChange,
  onFold,
  onUnfold,
  onReset,
  progress,
  isAnimating,
  overlayPair,
  onOverlayPairChange,
  onFullscreen,
  onShowInfo,
  autoTour,
  onAutoTourChange,
}: ContactCubeControlsProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <>
      {/* ── Desktop Panel (md+) ── */}
      <div className="absolute top-3 left-3 z-10 hidden md:block pointer-events-auto">
        <div className="bg-black/70 backdrop-blur-sm border border-white/[0.08] w-[220px] overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-2.5 py-2 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Box className="w-3.5 h-3.5 text-[#D4AF37]/50" />
              <span className="text-xs font-mono text-[#D4AF37]/70 uppercase tracking-wider">Controls</span>
            </div>
            {isOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-white/30" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-white/30" />
            )}
          </button>

          {isOpen && (
            <div className="px-2.5 pb-2.5 space-y-2.5 border-t border-white/[0.06]">
              {/* View Mode */}
              <div className="pt-2.5">
                <div className="text-xs font-mono text-white/25 uppercase tracking-wider mb-1.5">View</div>
                <div className="flex gap-1">
                  {VIEW_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => onViewModeChange(mode.id)}
                      className={`flex-1 px-1.5 py-1.5 text-xs flex items-center justify-center gap-1 transition-colors ${
                        viewMode === mode.id
                          ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30'
                          : 'bg-white/[0.02] text-white/40 border border-white/[0.04] hover:text-white/60'
                      }`}
                    >
                      {mode.icon}
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fold/Unfold */}
              <div className="flex gap-1">
                <button
                  onClick={progress < 0.5 ? onFold : onUnfold}
                  disabled={isAnimating}
                  className={`flex-1 px-2 py-1.5 text-xs flex items-center justify-center gap-1.5 transition-colors ${
                    isAnimating
                      ? 'bg-white/[0.02] text-white/20 cursor-not-allowed border border-white/[0.04]'
                      : 'bg-[#D4AF37]/10 text-[#D4AF37]/80 hover:text-[#D4AF37] border border-[#D4AF37]/20'
                  }`}
                >
                  <Play className="w-3 h-3" />
                  {progress < 0.5 ? 'Fold' : 'Unfold'}
                </button>
                <button
                  onClick={onReset}
                  className="px-2 py-1.5 text-xs flex items-center justify-center bg-white/[0.02] text-white/30 hover:text-white/60 transition-colors border border-white/[0.04]"
                  title="Reset"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>

              {/* Camera Presets */}
              <div>
                <div className="text-xs font-mono text-white/25 uppercase tracking-wider mb-1.5">Camera</div>
                <div className="flex gap-1">
                  {(Object.keys(CAMERA_PRESETS) as (keyof typeof CAMERA_PRESETS)[]).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => onCameraPresetChange(preset)}
                      className={`flex-1 px-1 py-1 text-xs font-mono transition-colors ${
                        cameraPreset === preset
                          ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30'
                          : 'bg-white/[0.02] text-white/30 border border-white/[0.04] hover:text-white/50'
                      }`}
                    >
                      {PRESET_LABELS[preset]}
                    </button>
                  ))}
                </div>
                {/* Auto-tour */}
                {onAutoTourChange && (
                  <button
                    onClick={() => onAutoTourChange(!autoTour)}
                    className={`w-full mt-1 px-2 py-1 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors ${
                      autoTour
                        ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30'
                        : 'bg-white/[0.02] text-white/30 border border-white/[0.04] hover:text-white/50'
                    }`}
                  >
                    <Navigation className="w-3 h-3" />
                    {autoTour ? 'Touring...' : 'Auto Tour'}
                    <kbd className="ml-auto px-1 py-0.5 bg-white/[0.04] text-[10px] text-white/20">T</kbd>
                  </button>
                )}
              </div>

              {/* Color Theme */}
              <div>
                <div className="text-xs font-mono text-white/25 uppercase tracking-wider mb-1.5">Theme</div>
                <div className="grid grid-cols-5 gap-1">
                  {(Object.keys(THEME_LABELS) as ColorTheme[]).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => onThemeChange(theme)}
                      className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${
                        colorTheme === theme
                          ? 'border border-[#D4AF37]/30'
                          : 'border border-transparent hover:border-white/[0.08]'
                      }`}
                      title={THEME_LABELS[theme].label}
                    >
                      <div className={`w-full h-1.5 ${THEME_LABELS[theme].swatch}`} />
                      <span className="text-[10px] text-white/25">{THEME_LABELS[theme].label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Overlay Pair Selection */}
              {viewMode === 'overlay' && (
                <div>
                  <div className="text-xs font-mono text-white/25 uppercase tracking-wider mb-1.5">Compare</div>
                  <div className="flex flex-col gap-1">
                    {FACE_PAIRS.map((pair) => (
                      <button
                        key={`${pair[0]}-${pair[1]}`}
                        onClick={() => onOverlayPairChange(pair)}
                        className={`px-2 py-1 text-xs font-mono text-left transition-colors ${
                          overlayPair?.[0] === pair[0] && overlayPair?.[1] === pair[1]
                            ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30'
                            : 'bg-white/[0.02] text-white/30 border border-white/[0.04] hover:text-white/50'
                        }`}
                      >
                        {pair[0]} ↔ {pair[1]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Toggles */}
              <div className="border-t border-white/[0.06] pt-2 space-y-1">
                <div className="text-xs font-mono text-white/25 uppercase tracking-wider mb-1.5">Display</div>
                {[
                  { label: 'Anomalies', checked: highlightAnomalies, onChange: onHighlightAnomaliesChange },
                  { label: 'Markers', checked: showRegistrationMarks, onChange: onShowRegistrationMarksChange },
                  { label: '3D Depth', checked: showDepth, onChange: onShowDepthChange },
                  { label: 'Auto-Rotate', checked: autoRotate, onChange: onAutoRotateChange },
                ].map(({ label, checked, onChange }) => (
                  <button
                    key={label}
                    onClick={() => onChange(!checked)}
                    className="w-full flex items-center gap-2 px-1 py-0.5 text-xs text-white/40 hover:text-white/60 transition-colors"
                  >
                    {checked ? (
                      <Eye className="w-3 h-3 text-[#D4AF37]/60" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-white/20" />
                    )}
                    {label}
                  </button>
                ))}
              </div>

              {/* Data status */}
              <div className="border-t border-white/[0.06] pt-2 flex items-center gap-1.5">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                </div>
                <span className="text-xs font-mono text-white/20">2/2 sources · WebGL</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Bottom Bar (<md) ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 md:hidden pointer-events-auto">
        <div className="bg-black/80 backdrop-blur-sm border-t border-white/[0.08] px-2 py-1.5">
          <div className="flex items-center justify-between gap-1">
            {/* Fold/Unfold */}
            <button
              onClick={progress < 0.5 ? onFold : onUnfold}
              disabled={isAnimating}
              className="h-7 px-3 text-xs font-mono bg-[#D4AF37]/10 text-[#D4AF37]/80 border border-[#D4AF37]/20 disabled:opacity-30"
            >
              {progress < 0.5 ? 'Fold' : 'Unfold'}
            </button>

            {/* View modes */}
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => onViewModeChange(mode.id)}
                className={`h-7 w-7 flex items-center justify-center ${
                  viewMode === mode.id
                    ? 'text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30'
                    : 'text-white/30 border border-white/[0.04]'
                }`}
                title={mode.label}
              >
                {mode.icon}
              </button>
            ))}

            {/* Theme cycle */}
            <button
              onClick={() => {
                const themes: ColorTheme[] = ['default', 'fire', 'ice', 'matrix', 'scientific']
                const idx = themes.indexOf(colorTheme)
                onThemeChange(themes[(idx + 1) % themes.length]!)
              }}
              className="h-7 w-7 flex items-center justify-center text-white/30 border border-white/[0.04]"
              title="Cycle theme"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {/* Camera cycle */}
            <button
              onClick={() => {
                const presets = Object.keys(CAMERA_PRESETS) as (keyof typeof CAMERA_PRESETS)[]
                const idx = presets.indexOf(cameraPreset)
                onCameraPresetChange(presets[(idx + 1) % presets.length]!)
              }}
              className="h-7 w-7 flex items-center justify-center text-white/30 border border-white/[0.04]"
              title="Cycle camera"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>

            {/* Info */}
            {onShowInfo && (
              <button
                onClick={onShowInfo}
                className="h-7 w-7 flex items-center justify-center text-white/30 border border-white/[0.04]"
                title="Info"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Fullscreen */}
            {onFullscreen && (
              <button
                onClick={onFullscreen}
                className="h-7 w-7 flex items-center justify-center text-white/30 border border-white/[0.04]"
                title="Fullscreen"
              >
                <Maximize className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
