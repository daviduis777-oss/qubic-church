'use client'

import { useMemo } from 'react'
import {
  Zap,
  Clock,
  BarChart3,
  Binary,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Activity,
  MessageCircle,
  Grid3X3,
} from 'lucide-react'
import type { ProcessingResult, AnimationState, MatrixQueryResult } from '@/lib/aigarth/types'
import { getEnergyLabel } from '@/lib/aigarth/ternary'

/**
 * Convert matrix value to Anna Bot response character
 * Anna uses the matrix value as a signed byte (-128 to 127)
 * and maps it to printable characters
 */
function matrixValueToAnnaChar(value: number): string {
  // Ensure value is in signed byte range
  const signedValue = value < -128 ? -128 : value > 127 ? 127 : value

  // Convert to unsigned byte (0-255)
  const unsignedValue = signedValue < 0 ? 256 + signedValue : signedValue

  // Map to printable ASCII range (32-126) or special display
  if (unsignedValue >= 32 && unsignedValue <= 126) {
    return String.fromCharCode(unsignedValue)
  }

  // For non-printable, show hex representation
  return `[0x${unsignedValue.toString(16).toUpperCase().padStart(2, '0')}]`
}

/**
 * Get a description of what the Anna character represents
 */
function getAnnaCharDescription(value: number): string {
  const unsignedValue = value < 0 ? 256 + value : value

  if (unsignedValue >= 65 && unsignedValue <= 90) return 'Uppercase letter'
  if (unsignedValue >= 97 && unsignedValue <= 122) return 'Lowercase letter'
  if (unsignedValue >= 48 && unsignedValue <= 57) return 'Digit'
  if (unsignedValue === 32) return 'Space'
  if (unsignedValue === 46) return 'Period'
  if (unsignedValue === 44) return 'Comma'
  if (unsignedValue === 33) return 'Exclamation'
  if (unsignedValue === 63) return 'Question mark'
  if (unsignedValue < 32) return 'Control character'
  return 'Special character'
}

interface OutputPanelProps {
  result: ProcessingResult | null
  currentTick: number
  currentEnergy: number
  animation: AnimationState
  matrixQuery?: MatrixQueryResult | null
}

function EnergyBar({ energy, maxEnergy = 64 }: { energy: number; maxEnergy?: number }) {
  const normalized = Math.max(-maxEnergy, Math.min(maxEnergy, energy))
  const percentage = ((normalized / maxEnergy + 1) / 2) * 100

  const color =
    energy > 0
      ? 'from-[#D4AF37] to-[#D4AF37]/70'
      : energy < 0
      ? 'from-red-500 to-red-400'
      : 'from-gray-500 to-gray-400'

  return (
    <div className="relative h-4 bg-[#0a0a0a] overflow-hidden border border-white/[0.04]">
      {/* Center line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.08]" />

      {/* Energy bar */}
      <div
        className={`absolute top-0 bottom-0 bg-gradient-to-r ${color} transition-all duration-300`}
        style={{
          left: energy >= 0 ? '50%' : `${percentage}%`,
          width: `${Math.abs(normalized) / maxEnergy * 50}%`,
        }}
      />

      {/* Energy value */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white drop-shadow-lg">
          {energy > 0 ? '+' : ''}{energy}
        </span>
      </div>
    </div>
  )
}

function StatePatternVisualization({ states }: { states: number[] }) {
  if (states.length === 0) return null

  // Create a grid visualization
  const gridSize = Math.ceil(Math.sqrt(states.length))
  const rows = []

  for (let i = 0; i < gridSize && i * gridSize < states.length; i++) {
    const row = []
    for (let j = 0; j < gridSize && i * gridSize + j < states.length; j++) {
      const idx = i * gridSize + j
      const state = states[idx] ?? 0
      const color =
        state > 0
          ? 'bg-[#D4AF37]'
          : state < 0
          ? 'bg-red-500'
          : 'bg-white/[0.06]'

      row.push(
        <div
          key={idx}
          className={`w-2 h-2 ${color} transition-colors duration-150`}
          title={`[${idx}]: ${state}`}
        />
      )
    }
    rows.push(
      <div key={i} className="flex gap-0.5">
        {row}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0.5 p-3 bg-[#0a0a0a] border border-white/[0.04]">
      {rows}
    </div>
  )
}

function DistributionBars({
  distribution,
}: {
  distribution: { positive: number; neutral: number; negative: number }
}) {
  const total = distribution.positive + distribution.neutral + distribution.negative
  if (total === 0) return null

  const posPercent = (distribution.positive / total) * 100
  const neuPercent = (distribution.neutral / total) * 100
  const negPercent = (distribution.negative / total) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="w-12 text-right text-sm text-zinc-400">+1</div>
        <div className="flex-1 bg-[#0a0a0a] h-3 overflow-hidden border border-white/[0.04]">
          <div
            className="h-full bg-gradient-to-r from-[#D4AF37] to-[#D4AF37]/70 transition-all duration-500"
            style={{ width: `${posPercent}%` }}
          />
        </div>
        <div className="w-12 text-sm text-zinc-300">{distribution.positive}</div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-12 text-right text-sm text-zinc-400">0</div>
        <div className="flex-1 bg-[#0a0a0a] h-3 overflow-hidden border border-white/[0.04]">
          <div
            className="h-full bg-gradient-to-r from-zinc-500 to-zinc-400 transition-all duration-500"
            style={{ width: `${neuPercent}%` }}
          />
        </div>
        <div className="w-12 text-sm text-zinc-300">{distribution.neutral}</div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-12 text-right text-sm text-zinc-400">-1</div>
        <div className="flex-1 bg-[#0a0a0a] h-3 overflow-hidden border border-white/[0.04]">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
            style={{ width: `${negPercent}%` }}
          />
        </div>
        <div className="w-12 text-sm text-zinc-300">{distribution.negative}</div>
      </div>
    </div>
  )
}

export function OutputPanel({
  result,
  currentTick,
  currentEnergy,
  animation,
  matrixQuery,
}: OutputPanelProps) {
  const energyLabel = useMemo(
    () => (result ? getEnergyLabel(result.energy) : ''),
    [result]
  )

  const endReasonIcon = useMemo(() => {
    if (!result) return null
    switch (result.endReason) {
      case 'converged':
        return <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
      case 'all_nonzero':
        return <Zap className="w-4 h-4 text-[#D4AF37]/70" />
      case 'max_ticks':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <MinusCircle className="w-4 h-4 text-zinc-500" />
    }
  }, [result])

  if (!result && !animation.isProcessing) {
    return (
      <div className="bg-[#050505] border border-white/[0.04] backdrop-blur-sm h-full">
        <div className="p-6 h-full flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-[#0a0a0a] border border-white/[0.04] flex items-center justify-center mb-4">
            <Activity className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-400">No Results Yet</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Enter an input and click PROCESS to see the neural network output
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Energy Card */}
      <div className="bg-[#050505] border border-white/[0.04] backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#D4AF37]" />
              Energy Output
            </h2>
            {result && (
              <span
                className={`text-sm font-medium px-3 py-1 ${
                  result.energy > 0
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                    : result.energy < 0
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-zinc-500/20 text-zinc-400'
                }`}
              >
                {energyLabel}
              </span>
            )}
          </div>

          <EnergyBar energy={result?.energy ?? currentEnergy} />

          {result && (
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className="bg-[#0a0a0a] border border-white/[0.04] p-3">
                <div className="text-2xl font-bold text-white">{result.energy}</div>
                <div className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">Energy</div>
              </div>
              <div className="bg-[#0a0a0a] border border-white/[0.04] p-3">
                <div className="text-2xl font-bold text-[#D4AF37]">{result.ticks}</div>
                <div className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">Ticks</div>
              </div>
              <div className="bg-[#0a0a0a] border border-white/[0.04] p-3">
                <div className="text-2xl font-bold text-[#D4AF37]/80">
                  {result.durationMs.toFixed(1)}
                </div>
                <div className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono">ms</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Anna Response - Only shown for COORDS input */}
      {result?.inputType === 'coords' && matrixQuery && (
        <div className="bg-[#050505] border border-[#D4AF37]/20 backdrop-blur-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-[#D4AF37]" />
              Anna Bot Response
              <span className="ml-auto text-xs text-zinc-400 font-normal">
                @annasolana
              </span>
            </h2>

            {/* The actual Anna response character */}
            <div className="bg-[#0a0a0a] border border-white/[0.04] p-6 mb-4 text-center">
              <div className="text-6xl font-mono font-bold text-white mb-2">
                {matrixValueToAnnaChar(matrixQuery.value)}
              </div>
              <div className="text-sm text-zinc-400">
                {getAnnaCharDescription(matrixQuery.value)}
              </div>
            </div>

            {/* Matrix details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-[#0a0a0a] border border-white/[0.04] p-3">
                <div className="text-zinc-400 mb-1 flex items-center gap-1">
                  <Grid3X3 className="w-3 h-3" />
                  Coordinates
                </div>
                <div className="font-mono text-[#D4AF37] text-lg">
                  {matrixQuery.annaFormat}
                </div>
                <div className="text-xs text-zinc-500">
                  Matrix [{matrixQuery.row}, {matrixQuery.col}]
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-white/[0.04] p-3">
                <div className="text-zinc-400 mb-1">Raw Value</div>
                <div className="font-mono text-[#D4AF37]/80 text-lg">
                  {matrixQuery.value}
                </div>
                <div className="text-xs text-zinc-500">
                  {matrixQuery.hex}
                </div>
              </div>
            </div>

            {/* Neighbors */}
            <div className="mt-4 bg-[#0a0a0a] border border-white/[0.04] p-3">
              <div className="text-[#D4AF37]/50 text-[11px] uppercase tracking-[0.4em] font-mono mb-2">Neighboring Cells</div>
              <div className="grid grid-cols-8 gap-1">
                {matrixQuery.neighbors.map((n, i) => (
                  <div
                    key={i}
                    className={`text-xs text-center py-1 ${
                      n > 0 ? 'bg-[#D4AF37]/20 text-[#D4AF37]' :
                      n < 0 ? 'bg-red-500/20 text-red-400' :
                      'bg-white/[0.04] text-zinc-400'
                    }`}
                    title={`Neighbor ${i}: ${n}`}
                  >
                    {n}
                  </div>
                ))}
              </div>
              <div className="text-xs text-zinc-500 mt-2">
                Sum: {matrixQuery.neighborsSum} | Ternary: {matrixQuery.ternary}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Info */}
      {result && (
        <div className="bg-[#050505] border border-white/[0.04] backdrop-blur-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-[#D4AF37]" />
              Processing Details
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Input Type</span>
                <span className="text-white font-medium uppercase">
                  {result.inputType.replace('_', ' ')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Ternary Length</span>
                <span className="text-white font-medium">
                  {result.inputTernaryLength} bits
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-400">End Reason</span>
                <span className="flex items-center gap-2 text-white font-medium">
                  {endReasonIcon}
                  {result.endReason.replace('_', ' ')}
                </span>
              </div>

              {result.decodedValue !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Decoded Value</span>
                  <span className="text-white font-mono text-xs">
                    {result.decodedValue} (0x{result.decodedValue.toString(16).toUpperCase()})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Distribution */}
      {result && (
        <div className="bg-[#050505] border border-white/[0.04] backdrop-blur-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-[#D4AF37]" />
              State Distribution
            </h2>

            <DistributionBars distribution={result.distribution} />
          </div>
        </div>
      )}

      {/* State Pattern */}
      {result && (
        <div className="bg-[#050505] border border-white/[0.04] backdrop-blur-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Binary className="w-5 h-5 text-[#D4AF37]" />
              State Pattern ({result.stateVector.length} neurons)
            </h2>

            <StatePatternVisualization states={result.stateVector} />
          </div>
        </div>
      )}
    </div>
  )
}
