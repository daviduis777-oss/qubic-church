'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Search,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Gauge,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import type { QortexNode, QortexMetadata } from './types'

interface QortexControlsProps {
  frameIndex: number
  totalFrames: number
  onFrameChange: (index: number) => void
  onSearch: (query: string) => QortexNode | null
  onNodeFound: (node: QortexNode) => void
  showConnections: boolean
  onToggleConnections: () => void
  metadata: QortexMetadata | null
  playbackSpeed: number
  onSpeedChange: (speed: number) => void
}

const SPEED_OPTIONS = [0.5, 1, 1.5, 2, 3]

export function QortexControls({
  frameIndex,
  totalFrames,
  onFrameChange,
  onSearch,
  onNodeFound,
  showConnections,
  onToggleConnections,
  metadata,
  playbackSpeed,
  onSpeedChange,
}: QortexControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showSpeedOptions, setShowSpeedOptions] = useState(false)

  // Auto-play frames with speed control
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      onFrameChange((frameIndex + 1) % totalFrames)
    }, 2000 / playbackSpeed)

    return () => clearInterval(interval)
  }, [isPlaying, frameIndex, totalFrames, onFrameChange, playbackSpeed])

  // Handle search
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return

    const node = onSearch(searchQuery)
    if (node) {
      setSearchError(null)
      onNodeFound(node)
      onFrameChange(node.frame)
    } else {
      setSearchError('Node not found')
    }
  }, [searchQuery, onSearch, onNodeFound, onFrameChange])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          setIsPlaying((p) => !p)
          break
        case 'ArrowLeft':
          onFrameChange(Math.max(0, frameIndex - 1))
          break
        case 'ArrowRight':
          onFrameChange(Math.min(totalFrames - 1, frameIndex + 1))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [frameIndex, totalFrames, onFrameChange])

  // Collapsed mobile view
  if (isCollapsed) {
    return (
      <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full flex items-center justify-center gap-2 bg-black/80 backdrop-blur-md border border-white/[0.04] p-3 text-white/70 hover:text-white transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
          <span className="text-sm">Show Controls</span>
          <span className="text-xs text-white/50 ml-2">
            Frame {frameIndex + 1}/{totalFrames}
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 pointer-events-auto">
      {/* Statistics bar - hidden on mobile */}
      {metadata && (
        <div className="hidden md:flex items-center justify-center gap-4 lg:gap-6 text-[10px] lg:text-xs text-white/60">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-gradient-to-r from-[#D4AF37] to-[#D4AF37]" />
            <span className="text-white/80 font-medium">{metadata.totalNodes.toLocaleString()}</span>
            <span>neurons</span>
          </span>
          <span className="hidden lg:flex items-center gap-1.5">
            <span className="w-3 h-px bg-gradient-to-r from-[#D4AF37] via-[#D4AF37] to-[#D4AF37]" />
            <span className="text-white/80 font-medium">{metadata.totalEdges.toLocaleString()}</span>
            <span>synapses</span>
          </span>
          <span className="flex items-center gap-1.5" title="Positive state (+1)">
            <span className="w-2 h-2 bg-[#D4AF37]/50" />
            <span className="text-[#D4AF37] font-mono">{metadata.stateDistribution.positive}</span>
            <span className="text-white/40 hidden lg:inline">+1</span>
          </span>
          <span className="flex items-center gap-1.5" title="Neutral state (0)">
            <span className="w-2 h-2 bg-gray-500/50" />
            <span className="text-gray-400 font-mono">{metadata.stateDistribution.zero}</span>
            <span className="text-white/40 hidden lg:inline">0</span>
          </span>
          <span className="flex items-center gap-1.5" title="Negative state (-1)">
            <span className="w-2 h-2 bg-[#D4AF37]/50" />
            <span className="text-[#D4AF37] font-mono">{metadata.stateDistribution.negative}</span>
            <span className="text-white/40 hidden lg:inline">-1</span>
          </span>
        </div>
      )}

      {/* Main controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 bg-black/80 backdrop-blur-md border border-white/[0.04] p-2 sm:p-3">
        {/* Mobile collapse button */}
        <button
          onClick={() => setIsCollapsed(true)}
          className="sm:hidden absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 text-white/50 text-xs"
        >
          <ChevronDown className="w-3 h-3" />
          Hide
        </button>

        {/* Search - full width on mobile */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              placeholder="ID or seed..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSearchError(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={`w-full sm:w-40 lg:w-48 pl-8 h-8 text-sm bg-white/5 border-white/[0.04] text-white placeholder:text-white/40 ${
                searchError ? 'border-red-500/50' : ''
              }`}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSearch}
            className="shrink-0 h-8 px-3 text-white/70 hover:text-white hover:bg-white/10"
          >
            Find
          </Button>
        </div>

        <div className="hidden sm:block h-6 w-px bg-white/10" />

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => onFrameChange(0)}
            title="First frame (Home)"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => onFrameChange(Math.max(0, frameIndex - 1))}
            title="Previous frame"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white hover:bg-white/20 border border-white/[0.04]"
            onClick={() => setIsPlaying((p) => !p)}
            title="Play/Pause (Space)"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => onFrameChange(Math.min(totalFrames - 1, frameIndex + 1))}
            title="Next frame"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => onFrameChange(totalFrames - 1)}
            title="Last frame (End)"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        <div className="hidden sm:block h-6 w-px bg-white/10" />

        {/* Speed control */}
        <div className="relative hidden sm:block">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => setShowSpeedOptions((s) => !s)}
          >
            <Gauge className="w-4 h-4" />
            <span className="text-xs">{playbackSpeed}x</span>
          </Button>

          {showSpeedOptions && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowSpeedOptions(false)}
              />
              <div className="absolute bottom-full left-0 mb-2 bg-[#050505] border border-white/[0.04] p-1 z-20">
                {SPEED_OPTIONS.map((speed) => (
                  <button
                    key={speed}
                    className={`block w-full px-3 py-1.5 text-xs text-left transition-colors ${
                      playbackSpeed === speed
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                    onClick={() => {
                      onSpeedChange(speed)
                      setShowSpeedOptions(false)
                    }}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="hidden lg:block h-6 w-px bg-white/10" />

        {/* Frame slider */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <span className="text-xs text-white/60 whitespace-nowrap shrink-0">
            <span className="hidden sm:inline">Frame </span>
            <span className="font-mono text-white/90">{frameIndex + 1}</span>
            <span className="text-white/40">/{totalFrames}</span>
          </span>
          <div className="flex-1 min-w-[100px]">
            <Slider
              value={[frameIndex]}
              min={0}
              max={totalFrames - 1}
              step={1}
              onValueChange={([value]) => value !== undefined && onFrameChange(value)}
              className="cursor-pointer"
            />
          </div>
        </div>

        <div className="hidden sm:block h-6 w-px bg-white/10" />

        {/* Toggle synapses */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleConnections}
          className={`h-8 gap-2 shrink-0 ${
            showConnections
              ? 'bg-white/20 text-white'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
          title="Toggle synapses (S)"
        >
          {showConnections ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
          <span className="hidden sm:inline text-xs">Synapses</span>
        </Button>
      </div>
    </div>
  )
}
