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
} from 'lucide-react'
import type { ViewMode, ColorTheme, CubeFaceId } from './types'
import { CAMERA_PRESETS, FACE_PAIRS } from './constants'

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
}

const VIEW_MODES: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'flat', label: 'Flat', icon: <Grid3X3 className="w-3.5 h-3.5" /> },
  { id: 'cube', label: 'Cube', icon: <Box className="w-3.5 h-3.5" /> },
  { id: 'overlay', label: 'Overlay', icon: <Layers className="w-3.5 h-3.5" /> },
]

export function ContactCubeControls({
  viewMode,
  onViewModeChange,
  highlightAnomalies,
  onHighlightAnomaliesChange,
  showRegistrationMarks,
  onShowRegistrationMarksChange,
  onFold,
  onUnfold,
  onReset,
  progress,
  isAnimating,
  overlayPair,
  onOverlayPairChange,
}: ContactCubeControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="absolute bottom-4 left-4 z-10">
      <div className="bg-[#050505] border border-neutral-700 overflow-hidden min-w-[200px]">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-neutral-800 transition-colors"
        >
          <span className="text-neutral-300 font-medium text-sm">Controls</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-neutral-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-500" />
          )}
        </button>

        {isExpanded && (
          <div className="px-3 pb-3 space-y-3 border-t border-neutral-800">
            {/* View Mode */}
            <div className="pt-3">
              <div className="flex gap-1">
                {VIEW_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => onViewModeChange(mode.id)}
                    className={`flex-1 px-2 py-1.5 text-xs flex items-center justify-center gap-1 transition-colors ${
                      viewMode === mode.id
                        ? 'bg-neutral-700 text-white'
                        : 'bg-neutral-800/50 text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {mode.icon}
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fold/Unfold */}
            <div className="flex gap-2">
              <button
                onClick={progress < 0.5 ? onFold : onUnfold}
                disabled={isAnimating}
                className={`flex-1 px-3 py-2 text-xs flex items-center justify-center gap-1.5 transition-colors ${
                  isAnimating
                    ? 'bg-neutral-800/30 text-neutral-600 cursor-not-allowed'
                    : 'bg-neutral-700 text-white hover:bg-neutral-600'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                {progress < 0.5 ? 'Fold' : 'Unfold'}
              </button>
              <button
                onClick={onReset}
                className="px-3 py-2 text-xs flex items-center justify-center bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                title="Reset"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Overlay Pair Selection */}
            {viewMode === 'overlay' && (
              <div className="space-y-1.5">
                <span className="text-xs text-neutral-500">Compare Faces</span>
                <div className="flex flex-col gap-1">
                  {FACE_PAIRS.map((pair) => (
                    <button
                      key={`${pair[0]}-${pair[1]}`}
                      onClick={() => onOverlayPairChange(pair)}
                      className={`px-2 py-1.5 text-xs text-left transition-colors ${
                        overlayPair?.[0] === pair[0] && overlayPair?.[1] === pair[1]
                          ? 'bg-neutral-700 text-white'
                          : 'bg-neutral-800/50 text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {pair[0]} ↔ {pair[1]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Toggles */}
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer hover:text-neutral-300">
                <input
                  type="checkbox"
                  checked={highlightAnomalies}
                  onChange={(e) => onHighlightAnomaliesChange(e.target.checked)}
                  className="border-neutral-600 bg-neutral-800 text-neutral-500"
                />
                Show anomalies
              </label>
              <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer hover:text-neutral-300">
                <input
                  type="checkbox"
                  checked={showRegistrationMarks}
                  onChange={(e) => onShowRegistrationMarksChange(e.target.checked)}
                  className="border-neutral-600 bg-neutral-800 text-neutral-500"
                />
                Registration marks
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
