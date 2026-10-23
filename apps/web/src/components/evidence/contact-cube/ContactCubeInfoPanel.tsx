'use client'

import { X, AlertTriangle, CheckCircle2, Sigma } from 'lucide-react'
import Link from 'next/link'
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

// Arithmetic check component
function MathCheck({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  return (
    <div className="bg-gradient-to-br from-gold/20 to-gold/20 border border-gold/20 p-3">
      <div className="text-gold text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
        <Sigma className="w-3 h-3" />
        {title}
      </div>
      <div className="font-mono text-xs text-gold leading-relaxed">
        {children}
      </div>
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
          <div className="bg-card backdrop-blur-xl border border-gold/30 shadow-2xl shadow-gold/10 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-gold/20 to-red-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-gold" />
                <span className="text-gold font-semibold text-sm">
                  Anomaly Cell
                </span>
                {selectedAnomaly.special && (
                  <span className="px-2 py-0.5 bg-gold/20 text-gold text-xs border border-gold/30">
                    SPECIAL
                  </span>
                )}
              </div>
              <button
                className="p-1.5 hover:bg-gold/20 transition-colors"
                onClick={onCloseAnomaly}
                type="button"
              >
                <X className="w-4 h-4 text-gold" />
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
                    [{selectedAnomaly.mirrorPos[0]},{' '}
                    {selectedAnomaly.mirrorPos[1]}]
                  </div>
                </div>
              </div>

              {/* Values */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gradient-to-br from-gold/10 to-gold/5 p-3 text-center border border-gold/20">
                  <div className="text-xs text-gold/70 mb-1">Value</div>
                  <div
                    className={`text-xl font-mono font-bold ${
                      selectedAnomaly.value >= 0 ? 'text-gold' : 'text-gold'
                    }`}
                  >
                    {selectedAnomaly.value}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gold/10 to-gold/5 p-3 text-center border border-gold/20">
                  <div className="text-xs text-gold/70 mb-1">Mirror</div>
                  <div
                    className={`text-xl font-mono font-bold ${
                      selectedAnomaly.mirrorValue >= 0
                        ? 'text-gold'
                        : 'text-gold'
                    }`}
                  >
                    {selectedAnomaly.mirrorValue}
                  </div>
                </div>
                <div
                  className={`bg-gradient-to-br p-3 text-center border ${
                    selectedAnomaly.sum === -1
                      ? 'from-gold/10 to-gold/5 border-gold/20'
                      : 'from-red-500/10 to-red-500/5 border-red-500/20'
                  }`}
                >
                  <div
                    className={`text-xs mb-1 ${
                      selectedAnomaly.sum === -1
                        ? 'text-gold/70'
                        : 'text-red-400/70'
                    }`}
                  >
                    Sum
                  </div>
                  <div
                    className={`text-xl font-mono font-bold ${
                      selectedAnomaly.sum === -1 ? 'text-gold' : 'text-red-400'
                    }`}
                  >
                    {selectedAnomaly.sum}
                  </div>
                </div>
              </div>

              {/* Arithmetic check */}
              <MathCheck title="Symmetry Test">
                <div className="flex items-center gap-2">
                  <span>
                    M[{selectedAnomaly.pos[0]}][{selectedAnomaly.pos[1]}]
                  </span>
                  <span className="text-neutral-500">+</span>
                  <span>
                    M[{selectedAnomaly.mirrorPos[0]}][
                    {selectedAnomaly.mirrorPos[1]}]
                  </span>
                  <span className="text-neutral-500">=</span>
                  <span
                    className={
                      selectedAnomaly.sum === -1 ? 'text-gold' : 'text-red-400'
                    }
                  >
                    {selectedAnomaly.value} + {selectedAnomaly.mirrorValue} ={' '}
                    {selectedAnomaly.sum}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {selectedAnomaly.sum === -1 ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-gold" />
                      <span className="text-gold">Symmetric (sum = -1)</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3 text-red-400" />
                      <span className="text-red-400">Anomaly (sum != -1)</span>
                    </>
                  )}
                </div>
              </MathCheck>

              {/* Special Position Details */}
              {selectedAnomaly.special && (
                <div className="bg-gold/10 border border-gold/20 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-gold" />
                    <span className="text-gold font-medium text-xs">
                      (22,22) = 100, very likely an entry error
                    </span>
                  </div>
                  <p className="text-gold/80 text-xs leading-relaxed">
                    This cell and its mirror both hold 100 instead of summing to
                    −1. It sits inside a run of exceptions and is very likely an
                    entry error in the typed table.{' '}
                    <Link
                      className="underline underline-offset-2 hover:text-gold"
                      href="/docs/03-results/35-corrections-september-2026"
                    >
                      See the September 2026 re-check
                    </Link>
                  </p>
                </div>
              )}

              {/* Symmetry Status */}
              <div className="flex items-center justify-between px-2 py-2 bg-neutral-900/50 text-xs">
                <span className="text-neutral-500">Status:</span>
                {selectedAnomaly.sum === -1 ? (
                  <span className="flex items-center gap-1 text-gold">
                    <CheckCircle2 className="w-3 h-3" />
                    Symmetric (a + b = -1)
                  </span>
                ) : selectedAnomaly.value === selectedAnomaly.mirrorValue ? (
                  <span className="flex items-center gap-1 text-gold">
                    <AlertTriangle className="w-3 h-3" />
                    Equals mirror (likely entry error)
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
          <div className="bg-card backdrop-blur-xl border border-gold/30 px-4 py-2 shadow-lg shadow-gold/5">
            <p className="text-gold text-xs flex items-center gap-2">
              <span className="w-2 h-2 bg-gold animate-pulse" />
              Cell (22,22) highlighted (likely entry error), click to inspect
            </p>
          </div>
        </div>
      )}
    </>
  )
}
