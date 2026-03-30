'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import type { ProcessingResult, TernaryState } from '@/lib/aigarth/types'

interface TickHistoryPanelProps {
  result: ProcessingResult | null
  currentTick: number
  currentEnergy: number
  isProcessing: boolean
}

export function TickHistoryPanel({
  result,
  currentTick,
  currentEnergy,
  isProcessing,
}: TickHistoryPanelProps) {
  // Compute energy curve from history if available
  const energyCurve = useMemo(() => {
    if (!result?.history) return []
    return result.history.map((states) =>
      states.reduce((sum: number, s) => sum + s, 0 as number)
    )
  }, [result])

  // Compute state distribution per tick
  const distributionCurve = useMemo(() => {
    if (!result?.history) return []
    return result.history.map((states) => ({
      positive: states.filter((s) => s === 1).length,
      neutral: states.filter((s) => s === 0).length,
      negative: states.filter((s) => s === -1).length,
    }))
  }, [result])

  // If no result yet
  if (!result && !isProcessing) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 mx-auto text-zinc-600 mb-4" />
        <h3 className="text-lg font-semibold text-zinc-400 mb-2">
          Tick History Timeline
        </h3>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          Process an input to see the tick-by-tick state evolution,
          energy curve, and convergence analysis.
        </p>
      </div>
    )
  }

  // Processing state
  if (isProcessing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-[#D4AF37] animate-pulse" />
          <span className="font-semibold text-white">Processing...</span>
          <span className="text-sm text-zinc-400">Tick {currentTick}</span>
        </div>

        {/* Live energy display */}
        <div className="bg-[#050505] border border-white/[0.04] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-zinc-400">Current Energy</span>
            </div>
            <span className={`text-2xl font-bold font-mono ${
              currentEnergy > 0 ? 'text-[#D4AF37]' :
              currentEnergy < 0 ? 'text-red-400' : 'text-zinc-400'
            }`}>
              {currentEnergy > 0 ? '+' : ''}{currentEnergy}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Guard: if we reach here without result, show empty state
  if (!result) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 mx-auto text-zinc-600 mb-4" />
        <h3 className="text-lg font-semibold text-zinc-400 mb-2">
          Tick History Timeline
        </h3>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          Process an input to see the tick-by-tick state evolution,
          energy curve, and convergence analysis.
        </p>
      </div>
    )
  }

  // Completed result
  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
          <span className="font-semibold text-white">Processing Complete</span>
        </div>
        <Badge
          variant="outline"
          className={`${
            result.endReason === 'converged' ? 'text-[#D4AF37] border-[#D4AF37]/50' :
            result.endReason === 'all_nonzero' ? 'text-[#D4AF37]/70 border-[#D4AF37]/30' :
            'text-[#D4AF37]/50 border-[#D4AF37]/20'
          }`}
        >
          {result.endReason === 'converged' && <RotateCcw className="w-3 h-3 mr-1" />}
          {result.endReason === 'all_nonzero' && <Zap className="w-3 h-3 mr-1" />}
          {result.endReason === 'max_ticks' && <AlertCircle className="w-3 h-3 mr-1" />}
          {result.endReason.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Ticks */}
        <div className="bg-[#050505] border border-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
            <Clock className="w-4 h-4" />
            <span>Ticks</span>
          </div>
          <div className="text-2xl font-bold text-[#D4AF37] font-mono">
            {result.ticks}
          </div>
        </div>

        {/* Energy */}
        <div className="bg-[#050505] border border-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
            <Zap className="w-4 h-4" />
            <span>Final Energy</span>
          </div>
          <div className={`text-2xl font-bold font-mono ${
            result.energy > 0 ? 'text-[#D4AF37]' :
            result.energy < 0 ? 'text-red-400' : 'text-zinc-400'
          }`}>
            {result.energy > 0 ? '+' : ''}{result.energy}
          </div>
        </div>

        {/* Duration */}
        <div className="bg-[#050505] border border-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
            <Activity className="w-4 h-4" />
            <span>Duration</span>
          </div>
          <div className="text-2xl font-bold text-[#D4AF37]/80 font-mono">
            {result.durationMs.toFixed(1)}ms
          </div>
        </div>

        {/* Tick Rate */}
        <div className="bg-[#050505] border border-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
            <TrendingUp className="w-4 h-4" />
            <span>Tick Rate</span>
          </div>
          <div className="text-2xl font-bold text-[#D4AF37]/70 font-mono">
            {result.durationMs > 0 ? (result.ticks / result.durationMs * 1000).toFixed(0) : '---'}/s
          </div>
        </div>
      </div>

      {/* State Distribution */}
      <div className="bg-[#050505] border border-white/[0.04] p-4">
        <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#D4AF37]" />
          State Distribution
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-sm text-zinc-400">Excited (+1)</span>
            </div>
            <div className="text-xl font-bold text-[#D4AF37]">{result.distribution.positive}</div>
            <div className="text-xs text-zinc-500">
              {((result.distribution.positive / result.stateVector.length) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Minus className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-400">Neutral (0)</span>
            </div>
            <div className="text-xl font-bold text-zinc-400">{result.distribution.neutral}</div>
            <div className="text-xs text-zinc-500">
              {((result.distribution.neutral / result.stateVector.length) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-sm text-zinc-400">Inhibited (-1)</span>
            </div>
            <div className="text-xl font-bold text-red-400">{result.distribution.negative}</div>
            <div className="text-xs text-zinc-500">
              {((result.distribution.negative / result.stateVector.length) * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Distribution Bar */}
        <div className="mt-4 h-4 overflow-hidden flex border border-white/[0.04]">
          <div
            className="bg-[#D4AF37] h-full transition-all"
            style={{ width: `${(result.distribution.positive / result.stateVector.length) * 100}%` }}
          />
          <div
            className="bg-zinc-600 h-full transition-all"
            style={{ width: `${(result.distribution.neutral / result.stateVector.length) * 100}%` }}
          />
          <div
            className="bg-red-500 h-full transition-all"
            style={{ width: `${(result.distribution.negative / result.stateVector.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Energy Curve (if history available) */}
      {energyCurve.length > 0 && (
        <div className="bg-[#050505] border border-white/[0.04] p-4">
          <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
            Energy Curve
          </h4>
          <div className="h-32 flex items-end gap-px">
            {energyCurve.map((energy, i) => {
              const maxEnergy = Math.max(...energyCurve.map(Math.abs), 1)
              const height = Math.abs(energy) / maxEnergy * 100
              const isPositive = energy >= 0
              return (
                <div
                  key={i}
                  className="flex-1 min-w-[2px] relative"
                  style={{ height: '100%' }}
                >
                  <div
                    className={`absolute bottom-1/2 w-full transition-all ${
                      isPositive ? 'bg-[#D4AF37]' : 'bg-red-500'
                    }`}
                    style={{
                      height: `${height / 2}%`,
                      transform: isPositive ? 'translateY(0)' : 'translateY(100%)',
                    }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-zinc-500 mt-2">
            <span>Tick 0</span>
            <span>Tick {result.ticks}</span>
          </div>
        </div>
      )}

      {/* Input/Output Info */}
      <div className="bg-[#050505] border border-white/[0.04] p-4">
        <h4 className="font-semibold text-white mb-3">Input Details</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-zinc-500">Type:</span>
            <span className="ml-2 text-[#D4AF37]">{result.inputType}</span>
          </div>
          <div>
            <span className="text-zinc-500">Ternary Length:</span>
            <span className="ml-2 text-white font-mono">{result.inputTernaryLength}</span>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-zinc-500 text-sm">Raw Input:</span>
          <code className="block mt-1 text-xs text-zinc-400 bg-[#0a0a0a] border border-white/[0.04] p-2 overflow-x-auto">
            {result.inputRaw.length > 100
              ? `${result.inputRaw.slice(0, 100)}...`
              : result.inputRaw}
          </code>
        </div>
      </div>
    </div>
  )
}
