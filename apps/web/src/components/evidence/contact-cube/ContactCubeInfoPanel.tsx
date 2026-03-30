'use client'

import {
  X,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Sigma,
} from 'lucide-react'
import type { AnomalyCell, ViewMode } from './types'

interface ContactCubeInfoPanelProps {
  selectedAnomaly: AnomalyCell | null
  stats: {
    totalCells: number
    symmetricCells: number
    anomalyCells: number
    symmetryPercentage: number
  } | null
  viewMode: ViewMode
  progress: number
  onCloseAnomaly: () => void
}

// Mathematical proof component
function MathProof({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/20 border border-[#D4AF37]/20 p-3">
      <div className="text-[#D4AF37] text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
        <Sigma className="w-3 h-3" />
        {title}
      </div>
      <div className="font-mono text-xs text-[#D4AF37] leading-relaxed">{children}</div>
    </div>
  )
}

export function ContactCubeInfoPanel({
  selectedAnomaly,
  stats,
  viewMode,
  progress,
  onCloseAnomaly,
}: ContactCubeInfoPanelProps) {
  return (
    <>
      {/* Selected Anomaly Detail Panel - Bottom Right */}
      {selectedAnomaly && (
        <div className="absolute bottom-4 right-4 z-10 w-80">
          <div className="bg-[#050505] backdrop-blur-xl border border-[#D4AF37]/30 shadow-2xl shadow-[#D4AF37]/10 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-[#D4AF37]/20 to-red-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-[#D4AF37] font-semibold text-sm">Anomaly Cell</span>
                {selectedAnomaly.special && (
                  <span className="px-2 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] text-xs border border-[#D4AF37]/30">
                    SPECIAL
                  </span>
                )}
              </div>
              <button
                onClick={onCloseAnomaly}
                className="p-1.5 hover:bg-[#D4AF37]/20 transition-colors"
              >
                <X className="w-4 h-4 text-[#D4AF37]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Position Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-neutral-900/50 p-3 border border-neutral-800">
                  <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
                    Position
                  </div>
                  <div className="text-lg font-mono text-white font-bold">
                    [{selectedAnomaly.pos[0]}, {selectedAnomaly.pos[1]}]
                  </div>
                </div>
                <div className="bg-neutral-900/50 p-3 border border-neutral-800">
                  <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
                    Mirror Position
                  </div>
                  <div className="text-lg font-mono text-neutral-400 font-bold">
                    [{selectedAnomaly.mirrorPos[0]}, {selectedAnomaly.mirrorPos[1]}]
                  </div>
                </div>
              </div>

              {/* Values */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5 p-3 text-center border border-[#D4AF37]/20">
                  <div className="text-xs text-[#D4AF37]/70 mb-1">Value</div>
                  <div
                    className={`text-xl font-mono font-bold ${
                      selectedAnomaly.value >= 0 ? 'text-[#D4AF37]' : 'text-[#D4AF37]'
                    }`}
                  >
                    {selectedAnomaly.value}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5 p-3 text-center border border-[#D4AF37]/20">
                  <div className="text-xs text-[#D4AF37]/70 mb-1">Mirror</div>
                  <div
                    className={`text-xl font-mono font-bold ${
                      selectedAnomaly.mirrorValue >= 0 ? 'text-[#D4AF37]' : 'text-[#D4AF37]'
                    }`}
                  >
                    {selectedAnomaly.mirrorValue}
                  </div>
                </div>
                <div
                  className={`bg-gradient-to-br p-3 text-center border ${
                    selectedAnomaly.sum === -1
                      ? 'from-[#D4AF37]/10 to-[#D4AF37]/5 border-[#D4AF37]/20'
                      : 'from-red-500/10 to-red-500/5 border-red-500/20'
                  }`}
                >
                  <div
                    className={`text-xs mb-1 ${
                      selectedAnomaly.sum === -1 ? 'text-[#D4AF37]/70' : 'text-red-400/70'
                    }`}
                  >
                    Sum
                  </div>
                  <div
                    className={`text-xl font-mono font-bold ${
                      selectedAnomaly.sum === -1 ? 'text-[#D4AF37]' : 'text-red-400'
                    }`}
                  >
                    {selectedAnomaly.sum}
                  </div>
                </div>
              </div>

              {/* Mathematical Proof */}
              <MathProof title="Symmetry Test">
                <div className="flex items-center gap-2">
                  <span>M[{selectedAnomaly.pos[0]}][{selectedAnomaly.pos[1]}]</span>
                  <span className="text-neutral-500">+</span>
                  <span>M[{selectedAnomaly.mirrorPos[0]}][{selectedAnomaly.mirrorPos[1]}]</span>
                  <span className="text-neutral-500">=</span>
                  <span className={selectedAnomaly.sum === -1 ? 'text-[#D4AF37]' : 'text-red-400'}>
                    {selectedAnomaly.value} + {selectedAnomaly.mirrorValue} = {selectedAnomaly.sum}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {selectedAnomaly.sum === -1 ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-[#D4AF37]" />
                      <span className="text-[#D4AF37]">Symmetric (sum = -1)</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3 text-red-400" />
                      <span className="text-red-400">Anomaly (sum != -1)</span>
                    </>
                  )}
                </div>
              </MathProof>

              {/* Special Position Details */}
              {selectedAnomaly.special && (
                <div className="bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/10 border border-[#D4AF37]/20 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-[#D4AF37] font-medium text-xs">
                      Self-Mirror Point
                    </span>
                  </div>
                  <p className="text-[#D4AF37]/80 text-xs leading-relaxed mb-2">
                    This is the only position where the value equals its mirror value.
                    A unique fixed point in the symmetry transformation.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-black/30 p-2">
                      <span className="text-neutral-500">Coord Sum:</span>
                      <span className="text-[#D4AF37] ml-1 font-mono">
                        {selectedAnomaly.pos[0]} + {selectedAnomaly.pos[1]} ={' '}
                        {selectedAnomaly.pos[0] + selectedAnomaly.pos[1]}
                      </span>
                    </div>
                    <div className="bg-black/30 p-2">
                      <span className="text-neutral-500">Value XOR 127:</span>
                      <span className="text-[#D4AF37] ml-1 font-mono">
                        {selectedAnomaly.value} ^ 127 = {selectedAnomaly.value ^ 127}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Symmetry Status */}
              <div className="flex items-center justify-between px-2 py-2 bg-neutral-900/50 text-xs">
                <span className="text-neutral-500">Status:</span>
                {selectedAnomaly.sum === -1 ? (
                  <span className="flex items-center gap-1 text-[#D4AF37]">
                    <CheckCircle2 className="w-3 h-3" />
                    Symmetric (a + b = -1)
                  </span>
                ) : selectedAnomaly.value === selectedAnomaly.mirrorValue ? (
                  <span className="flex items-center gap-1 text-[#D4AF37]">
                    <Sparkles className="w-3 h-3" />
                    Fixed Point (a = b)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-400">
                    <AlertTriangle className="w-3 h-3" />
                    Broken Symmetry
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hint indicator when cube is formed */}
      {viewMode === 'cube' && progress > 0.9 && !selectedAnomaly && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-[#050505] backdrop-blur-xl border border-[#D4AF37]/30 px-4 py-2 shadow-lg shadow-[#D4AF37]/5">
            <p className="text-[#D4AF37] text-xs flex items-center gap-2">
              <span className="w-2 h-2 bg-[#D4AF37] animate-pulse" />
              Special position [22,22] highlighted - click to inspect
            </p>
          </div>
        </div>
      )}
    </>
  )
}
