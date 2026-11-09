'use client'

import { useState } from 'react'
import { Box, ChevronDown, ChevronRight, Sigma } from 'lucide-react'
import type { ColorTheme } from './types'
import { COLOR_THEMES } from './constants'

interface ContactCubeLegendProps {
  stats: {
    totalCells: number
    symmetricCells: number
    anomalyCells: number
    symmetryPercentage: number
  } | null
  colorTheme: ColorTheme
  className?: string
}

export function ContactCubeLegend({ stats, colorTheme, className = '' }: ContactCubeLegendProps) {
  const [showFormula, setShowFormula] = useState(false)
  const theme = COLOR_THEMES[colorTheme]

  return (
    <div
      className={`bg-black/70 backdrop-blur-md border border-white/[0.04] p-4 space-y-3 max-w-[220px] ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-[#FFC46B] via-[#FFC46B] to-[#FFC46B] flex items-center justify-center">
          <Box className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Contact Cube</div>
          <div className="text-xs text-gray-400">Point Symmetry Analysis</div>
        </div>
      </div>

      {/* Matrix Stats */}
      {stats && (
        <div className="border-t border-white/[0.04] pt-3">
          <div className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">
            Matrix Stats
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-lg font-bold text-[#FFC46B] font-mono">
                {(stats.totalCells / 1000).toFixed(1)}k
              </div>
              <div className="text-[10px] text-gray-500">Cells</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[#FFC46B] font-mono">
                {stats.symmetryPercentage.toFixed(1)}%
              </div>
              <div className="text-[10px] text-gray-500">Symmetric</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[#FFC46B] font-mono">{stats.anomalyCells}</div>
              <div className="text-[10px] text-gray-500">Anomalies</div>
            </div>
          </div>
        </div>
      )}

      {/* Color Scale */}
      <div className="border-t border-white/[0.04] pt-3">
        <div className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">
          Value Scale
        </div>
        <div
          className="h-3"
          style={{
            background: `linear-gradient(to right, ${theme.negative}, ${theme.zero}, ${theme.positive})`,
          }}
        />
        <div className="flex justify-between mt-1 text-xs text-gray-500 font-mono">
          <span>-128</span>
          <span>0</span>
          <span>+127</span>
        </div>
      </div>

      {/* Markers Legend */}
      <div className="border-t border-white/[0.04] pt-3">
        <div className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-2">
          Markers
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#FFC46B] shadow-lg shadow-[#FFC46B]/50" />
            <span className="text-xs text-gray-400">
              <span className="text-[#FFC46B] font-mono">(22,22)</span> likely entry error
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1 mb-0.5">Anomaly Columns</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#FFC46B] shadow-lg shadow-[#FFC46B]/50" />
            <span className="text-xs text-gray-400 font-mono">22+105 <span className="text-gray-500">(13)</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#06B6D4] shadow-lg shadow-[#06B6D4]/50" />
            <span className="text-xs text-gray-400 font-mono">97+30 <span className="text-gray-500">(18)</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/50" />
            <span className="text-xs text-gray-400 font-mono">41+86 <span className="text-gray-500">(2)</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#10B981] shadow-lg shadow-[#10B981]/50" />
            <span className="text-xs text-gray-400 font-mono">127+0 <span className="text-gray-500">(1)</span></span>
          </div>
        </div>
      </div>

      {/* Symmetry Formula (collapsible) */}
      <div className="border-t border-white/[0.04] pt-3">
        <button
          onClick={() => setShowFormula(!showFormula)}
          className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <span className="flex items-center gap-1 uppercase tracking-wider font-medium">
            <Sigma className="w-3 h-3" />
            Symmetry Formula
          </span>
          {showFormula ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
        {showFormula && (
          <div className="mt-2 p-2 bg-[#FFC46B]/10 border border-[#FFC46B]/20">
            <code className="text-[#FFC46B] text-xs font-mono block">
              M[r,c] + M[127-r,127-c] = -1
            </code>
            <p className="text-[10px] text-gray-500 mt-1">
              Two's Complement identity (99.58%)
            </p>
          </div>
        )}
      </div>

      {/* Keyboard hint */}
      <div className="border-t border-white/[0.04] pt-2">
        <div className="text-xs text-gray-600 text-center">
          Press <kbd className="px-1 py-0.5 bg-white/10 text-gray-400">?</kbd> for shortcuts
        </div>
      </div>
    </div>
  )
}
