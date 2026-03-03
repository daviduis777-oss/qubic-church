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
        <div className="w-8 h-8 bg-gradient-to-br from-[#D4AF37] via-[#D4AF37] to-[#D4AF37] flex items-center justify-center">
          <Box className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Contact Cube</div>
          <div className="text-[10px] text-gray-400">Point Symmetry Analysis</div>
        </div>
      </div>

      {/* Matrix Stats */}
      {stats && (
        <div className="border-t border-white/[0.04] pt-3">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-2">
            Matrix Stats
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-lg font-bold text-[#D4AF37] font-mono">
                {(stats.totalCells / 1000).toFixed(1)}k
              </div>
              <div className="text-[8px] text-gray-500">Cells</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[#D4AF37] font-mono">
                {stats.symmetryPercentage.toFixed(1)}%
              </div>
              <div className="text-[8px] text-gray-500">Symmetric</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[#D4AF37] font-mono">{stats.anomalyCells}</div>
              <div className="text-[8px] text-gray-500">Anomalies</div>
            </div>
          </div>
        </div>
      )}

      {/* Color Scale */}
      <div className="border-t border-white/[0.04] pt-3">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-2">
          Value Scale
        </div>
        <div
          className="h-3"
          style={{
            background: `linear-gradient(to right, ${theme.negative}, ${theme.zero}, ${theme.positive})`,
          }}
        />
        <div className="flex justify-between mt-1 text-[9px] text-gray-500 font-mono">
          <span>-128</span>
          <span>0</span>
          <span>+127</span>
        </div>
      </div>

      {/* Markers Legend */}
      <div className="border-t border-white/[0.04] pt-3">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-2">
          Markers
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#D4AF37] shadow-lg shadow-[#D4AF37]/50" />
            <span className="text-[10px] text-gray-400">
              Special <span className="text-[#D4AF37] font-mono">[22,22]</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 shadow-lg shadow-red-500/50" />
            <span className="text-[10px] text-gray-400">
              Anomaly <span className="text-red-400 font-mono">(68)</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#D4AF37] shadow-lg shadow-[#D4AF37]/50" />
            <span className="text-[10px] text-gray-400">Symmetric cells</span>
          </div>
        </div>
      </div>

      {/* Symmetry Formula (collapsible) */}
      <div className="border-t border-white/[0.04] pt-3">
        <button
          onClick={() => setShowFormula(!showFormula)}
          className="w-full flex items-center justify-between text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
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
          <div className="mt-2 p-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20">
            <code className="text-[#D4AF37] text-[10px] font-mono block">
              M[r,c] + M[127-r,127-c] = 0
            </code>
            <p className="text-[8px] text-gray-500 mt-1">
              Point symmetry around matrix center
            </p>
          </div>
        )}
      </div>

      {/* Keyboard hint */}
      <div className="border-t border-white/[0.04] pt-2">
        <div className="text-[9px] text-gray-600 text-center">
          Press <kbd className="px-1 py-0.5 bg-white/10 text-gray-400">?</kbd> for shortcuts
        </div>
      </div>
    </div>
  )
}
