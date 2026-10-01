'use client'

import { Play, Pause, RotateCcw, SkipForward, Maximize2, Minimize2, Square, Circle, Camera, Grid3X3, Layers, Eye, EyeOff, Gauge, Link2, Check, MoreHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SPEED_OPTIONS, PARTICLE_COLORS } from '../config'

interface ControlBarProps {
  isPlaying: boolean
  speedMultiplier: number
  boundaryMode: 'bounce' | 'toroidal'
  fps: number
  tick: number
  totalParticles: number
  isFullscreen: boolean
  showDensity: boolean
  showGrid: boolean
  highlightType: number | null
  numTypes: number
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onStep: () => void
  onSpeedChange: (speed: number) => void
  onBoundaryToggle: () => void
  onFullscreen: () => void
  onScreenshot: () => void
  onToggleDensity: () => void
  onToggleGrid: () => void
  onHighlightType: (type: number | null) => void
  onCopyLink?: () => void
}

export function ControlBar({
  isPlaying,
  speedMultiplier,
  boundaryMode,
  fps,
  tick,
  totalParticles,
  isFullscreen,
  showDensity,
  showGrid,
  highlightType,
  numTypes,
  onPlay,
  onPause,
  onReset,
  onStep,
  onSpeedChange,
  onBoundaryToggle,
  onFullscreen,
  onScreenshot,
  onToggleDensity,
  onToggleGrid,
  onHighlightType,
  onCopyLink,
}: ControlBarProps) {
  const [linkCopied, setLinkCopied] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  // FPS color (#15 - warning indicator)
  const fpsColor = fps >= 50 ? 'text-emerald-400/50' : fps >= 30 ? 'text-yellow-400/50' : 'text-red-400/70'

  return (
    <>
      <div className="flex items-center gap-1 sm:gap-1.5 p-2 sm:p-2.5 border-b border-white/[0.04] flex-wrap">
        {/* Playback group */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="outline"
            size="sm"
            onClick={isPlaying ? onPause : onPlay}
            className={cn(
              'h-7 px-2 sm:px-3 border-white/[0.08] bg-transparent text-xs',
              isPlaying && 'border-[#D4AF37]/30 text-[#D4AF37]',
            )}
          >
            {isPlaying ? <Pause className="w-3 h-3 sm:mr-1" /> : <Play className="w-3 h-3 sm:mr-1" />}
            <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onStep}
            disabled={isPlaying}
            className="h-7 px-1.5 border-white/[0.08] bg-transparent text-sm"
            title="Step one tick (S)"
          >
            <SkipForward className="w-3 h-3" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="h-7 px-1.5 sm:px-2 border-white/[0.08] bg-transparent text-sm"
            title="Reset (R)"
          >
            <RotateCcw className="w-3 h-3 sm:mr-1" />
            <span className="hidden md:inline">Reset</span>
          </Button>
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-px bg-[#0a0a0a] border border-white/[0.06] p-px rounded-sm">
          <Gauge className="w-3 h-3 text-white/30 mx-1" />
          {SPEED_OPTIONS.map((speed, idx) => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed)}
              className={cn(
                'px-1 sm:px-1.5 py-0.5 text-[11px] sm:text-xs font-mono transition-all',
                speedMultiplier === speed
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] font-bold'
                  : 'text-white/35 hover:text-white/65',
              )}
              title={`${speed}x speed (${idx + 1})`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Visual toggles - DESKTOP */}
        <div className="hidden sm:flex items-center gap-0.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onBoundaryToggle}
            className={cn('h-7 px-1.5 border-white/[0.08] bg-transparent text-xs',
              boundaryMode === 'toroidal' && 'border-purple-500/30 text-purple-400')}
            title={`Boundary: ${boundaryMode} (B)`}
          >
            {boundaryMode === 'bounce' ? <Square className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleDensity}
            className={cn('h-7 px-1.5 border-white/[0.08] bg-transparent text-xs',
              showDensity && 'border-[#D4AF37]/30 text-[#D4AF37]')}
            title="Density heatmap (D)"
          >
            <Layers className="w-3 h-3" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleGrid}
            className={cn('h-7 px-1.5 border-white/[0.08] bg-transparent text-xs',
              showGrid && 'border-[#D4AF37]/30 text-[#D4AF37]')}
            title="Spatial grid (G)"
          >
            <Grid3X3 className="w-3 h-3" />
          </Button>
        </div>

        {/* Type highlight - DESKTOP */}
        <div className="hidden lg:flex items-center gap-0.5 ml-1">
          <button
            onClick={() => onHighlightType(null)}
            className={cn(
              'px-1 py-0.5 text-[11px] font-mono transition-all border',
              highlightType === null
                ? 'border-white/[0.15] text-white/65'
                : 'border-transparent text-white/30 hover:text-white/45',
            )}
            title="Show all types"
          >
            {highlightType === null ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
          </button>
          {Array.from({ length: Math.min(numTypes, 12) }, (_, i) => (
            <button
              key={`type-highlight-${i}`}
              onClick={() => onHighlightType(highlightType === i ? null : i)}
              className={cn(
                'w-3.5 h-3.5 rounded-full transition-all border-2',
                highlightType === i ? 'border-white/60 scale-125' : 'border-transparent hover:border-white/20',
              )}
              style={{ backgroundColor: PARTICLE_COLORS[i] + (highlightType !== null && highlightType !== i ? '40' : 'CC') }}
              title={`Highlight type ${i}`}
            />
          ))}
        </div>

        <div className="flex-1" />

        {/* Mobile: FPS + More button */}
        <div className="flex sm:hidden items-center gap-1">
          <span className={cn('text-[11px] font-mono', fpsColor)}>{fps}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="h-7 px-1.5 border-white/[0.08] bg-transparent text-sm"
          >
            {mobileDrawerOpen ? <X className="w-3 h-3" /> : <MoreHorizontal className="w-3 h-3" />}
          </Button>
        </div>

        {/* Stats - DESKTOP */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] sm:text-xs font-mono">
          <span className={fpsColor}>{fps} FPS</span>
          <span className="text-white/8">|</span>
          <span className="text-white/40">T{tick.toLocaleString()}</span>
          <span className="text-white/8">|</span>
          <span className="text-white/40">{totalParticles}p</span>
          {speedMultiplier > 1 && (
            <>
              <span className="text-white/8">|</span>
              <span className="text-[#D4AF37]/50">{speedMultiplier}x</span>
            </>
          )}
        </div>

        {/* Screenshot - DESKTOP */}
        <Button
          variant="outline"
          size="sm"
          onClick={onScreenshot}
          className="h-7 px-1.5 border-white/[0.08] bg-transparent text-sm hidden sm:flex"
          title="Screenshot (P)"
        >
          <Camera className="w-3 h-3" />
        </Button>

        {/* Copy Link - DESKTOP */}
        {onCopyLink && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onCopyLink()
              setLinkCopied(true)
              setTimeout(() => setLinkCopied(false), 2000)
            }}
            className={cn(
              'h-7 px-1.5 border-white/[0.08] bg-transparent text-sm hidden sm:flex',
              linkCopied && 'border-emerald-500/30 text-emerald-400',
            )}
            title="Copy shareable link"
          >
            {linkCopied ? <Check className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
          </Button>
        )}

        {/* Fullscreen */}
        <Button
          variant="outline"
          size="sm"
          onClick={onFullscreen}
          className="h-7 px-1.5 border-white/[0.08] bg-transparent text-sm hidden sm:flex"
          title="Fullscreen (F)"
        >
          {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
        </Button>
      </div>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="sm:hidden border-b border-white/[0.04] bg-[#080808] p-3 space-y-3">
          {/* Stats row */}
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className={fpsColor}>{fps} FPS</span>
            <span className="text-white/8">|</span>
            <span className="text-white/40">Tick {tick.toLocaleString()}</span>
            <span className="text-white/8">|</span>
            <span className="text-white/40">{totalParticles} particles</span>
          </div>

          {/* Visual toggles */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono text-white/35 uppercase">Visual Overlays</div>
            <div className="flex items-center gap-1 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={onBoundaryToggle}
                className={cn('h-7 px-2 border-white/[0.08] bg-transparent text-xs',
                  boundaryMode === 'toroidal' && 'border-purple-500/30 text-purple-400')}
              >
                {boundaryMode === 'bounce' ? <Square className="w-3 h-3 mr-1" /> : <Circle className="w-3 h-3 mr-1" />}
                {boundaryMode}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onToggleDensity}
                className={cn('h-7 px-2 border-white/[0.08] bg-transparent text-xs',
                  showDensity && 'border-[#D4AF37]/30 text-[#D4AF37]')}
              >
                <Layers className="w-3 h-3 mr-1" />Density
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onToggleGrid}
                className={cn('h-7 px-2 border-white/[0.08] bg-transparent text-xs',
                  showGrid && 'border-[#D4AF37]/30 text-[#D4AF37]')}
              >
                <Grid3X3 className="w-3 h-3 mr-1" />Grid
              </Button>
            </div>
          </div>

          {/* Type highlight */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono text-white/35 uppercase">Type Filter</div>
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => onHighlightType(null)}
                className={cn(
                  'px-2 py-1 text-[11px] font-mono transition-all border rounded-sm',
                  highlightType === null
                    ? 'border-white/[0.15] text-white/65'
                    : 'border-transparent text-white/30',
                )}
              >
                All
              </button>
              {Array.from({ length: Math.min(numTypes, 12) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => onHighlightType(highlightType === i ? null : i)}
                  className={cn(
                    'w-6 h-6 rounded-full transition-all border-2',
                    highlightType === i ? 'border-white/60 scale-110' : 'border-transparent',
                  )}
                  style={{ backgroundColor: PARTICLE_COLORS[i] + (highlightType !== null && highlightType !== i ? '40' : 'CC') }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={onScreenshot}
              className="h-7 px-2 border-white/[0.08] bg-transparent text-xs">
              <Camera className="w-3 h-3 mr-1" />Photo
            </Button>
            {onCopyLink && (
              <Button variant="outline" size="sm"
                onClick={() => { onCopyLink(); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000) }}
                className={cn('h-7 px-2 border-white/[0.08] bg-transparent text-xs',
                  linkCopied && 'border-emerald-500/30 text-emerald-400')}>
                {linkCopied ? <Check className="w-3 h-3 mr-1" /> : <Link2 className="w-3 h-3 mr-1" />}
                {linkCopied ? 'Copied' : 'Share'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onFullscreen}
              className="h-7 px-2 border-white/[0.08] bg-transparent text-xs">
              <Maximize2 className="w-3 h-3 mr-1" />Full
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
