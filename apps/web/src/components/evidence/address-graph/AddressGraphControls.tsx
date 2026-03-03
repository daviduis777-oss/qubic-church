'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Search,
  GitBranch,
  Eye,
  EyeOff,
  ChevronDown,
  Minus,
  Plus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import type { AddressGraphControlsProps, AddressNode } from './types'
import { SPEED_OPTIONS } from './constants'

// =============================================================================
// ADDRESS GRAPH CONTROLS
// =============================================================================

export function AddressGraphControls({
  currentBlock,
  totalBlocks,
  isPlaying,
  playbackSpeed,
  showEdges,
  visibleNodes,
  totalNodes,
  onBlockChange,
  onPlayToggle,
  onSpeedChange,
  onEdgesToggle,
  onSearch,
  onNodeFound,
}: AddressGraphControlsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchError, setSearchError] = useState<string | null>(null)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const speedMenuRef = useRef<HTMLDivElement>(null)

  // Close speed menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) {
        setShowSpeedMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search handler
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return

    const found = onSearch(searchQuery)
    if (found) {
      onNodeFound(found)
      setSearchError(null)
      setSearchQuery('')
    } else {
      setSearchError('No matching address found')
      setTimeout(() => setSearchError(null), 3000)
    }
  }, [searchQuery, onSearch, onNodeFound])

  // Keyboard handler for search
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      setSearchQuery('')
      searchInputRef.current?.blur()
    }
  }

  // Block navigation
  const handleBlockStep = (delta: number) => {
    const newBlock = Math.max(0, Math.min(totalBlocks, currentBlock + delta))
    onBlockChange(newBlock)
  }

  const progress = totalBlocks > 0 ? (currentBlock / totalBlocks) * 100 : 0

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent pt-8 pb-4 px-4">
      <div className="max-w-6xl mx-auto space-y-3">
        {/* Timeline slider */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500 w-16 text-right">
            Block {currentBlock.toLocaleString()}
          </span>
          <div className="flex-1 relative">
            <Slider
              value={[currentBlock]}
              min={0}
              max={totalBlocks}
              step={1}
              onValueChange={(v) => v[0] !== undefined && onBlockChange(v[0])}
              className="cursor-pointer"
            />
            {/* Progress indicator - dynamic based on actual block range */}
            <div className="absolute -top-5 left-0 right-0 flex justify-between text-[10px] text-gray-600">
              <span>Block 0</span>
              <span>Block {Math.floor(totalBlocks * 0.25).toLocaleString()}</span>
              <span>Block {Math.floor(totalBlocks * 0.5).toLocaleString()}</span>
              <span>Block {Math.floor(totalBlocks * 0.75).toLocaleString()}</span>
              <span>Block {totalBlocks.toLocaleString()}</span>
            </div>
          </div>
          <span className="text-xs text-gray-500 w-16">
            {totalBlocks.toLocaleString()}
          </span>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          {/* Left: Playback controls */}
          <div className="flex items-center gap-2">
            {/* Jump to start */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onBlockChange(0)}
              className="h-8 w-8 text-gray-400 hover:text-white"
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            {/* Step backward */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleBlockStep(-1000)}
              className="h-8 w-8 text-gray-400 hover:text-white"
            >
              <Minus className="w-4 h-4" />
            </Button>

            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onPlayToggle}
              className={`h-10 w-10 ${
                isPlaying
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>

            {/* Step forward */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleBlockStep(1000)}
              className="h-8 w-8 text-gray-400 hover:text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>

            {/* Jump to end */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onBlockChange(totalBlocks)}
              className="h-8 w-8 text-gray-400 hover:text-white"
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            {/* Speed selector */}
            <div className="relative" ref={speedMenuRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="h-8 px-2 text-gray-400 hover:text-white gap-1"
              >
                <span className="text-xs font-mono">{playbackSpeed}x</span>
                <ChevronDown className="w-3 h-3" />
              </Button>

              {showSpeedMenu && (
                <div className="absolute bottom-full left-0 mb-2 py-1 bg-gray-900 border border-white/[0.04] shadow-xl min-w-[80px]">
                  {SPEED_OPTIONS.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => {
                        onSpeedChange(speed)
                        setShowSpeedMenu(false)
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs hover:bg-white/10 transition-colors ${
                        speed === playbackSpeed ? 'text-[#D4AF37]' : 'text-gray-400'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search address, pubkey, or seed..."
                className={`w-full h-9 pl-10 pr-10 bg-white/5 border text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-colors ${
                  searchError
                    ? 'border-red-500/50 focus:ring-red-500/50'
                    : 'border-white/[0.04] focus:ring-[#D4AF37]/50'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/10"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
              )}

              {/* Search error tooltip */}
              {searchError && (
                <div className="absolute left-0 right-0 -bottom-8 text-center">
                  <span className="text-xs text-red-400">{searchError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: View controls */}
          <div className="flex items-center gap-3">
            {/* Node count */}
            <div className="text-xs text-gray-500">
              <span className="text-white font-medium">{visibleNodes.toLocaleString()}</span>
              <span> / {totalNodes.toLocaleString()} nodes</span>
            </div>

            {/* Edges toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdgesToggle}
              className={`h-8 px-3 gap-2 ${
                showEdges
                  ? 'text-[#D4AF37] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              {showEdges ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="text-xs">Edges</span>
            </Button>

            {/* View mode indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5">
              <GitBranch className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-xs text-gray-400">Force Layout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
