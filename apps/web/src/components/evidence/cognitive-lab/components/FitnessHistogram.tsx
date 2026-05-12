'use client'

import { cn } from '@/lib/utils'

export interface FitnessHistogramProps {
  /** Best, median, worst from current generation snapshot. */
  best: number
  median: number
  worst: number
  generation: number
  totalGenerations: number
  /** Anna's reference fitness (gold horizontal line). */
  annaBaseline: number
  className?: string
}

const BARS = 32 // visual bar count (interpolated from best/median/worst)

/**
 * Vertical fitness bars showing the population's spread per generation. Replaces
 * the previous fake-PCA "PopulationCanvas" — bars derived from the real
 * best/median/worst fitness values from the worker, not RNG noise.
 *
 * Bars are sorted highest fitness first, gold for top-25%, dim grey for bottom.
 */
export function FitnessHistogram({
  best,
  median,
  worst,
  generation,
  totalGenerations,
  annaBaseline,
  className,
}: FitnessHistogramProps) {
  // Interpolate bar heights from best -> median -> worst (smooth gradient)
  const bars: number[] = []
  for (let i = 0; i < BARS; i++) {
    const t = i / (BARS - 1)
    let v: number
    if (t < 0.25) {
      v = best - (best - median) * (t / 0.25) * 0.4
    } else if (t < 0.75) {
      v = median + (median - worst) * Math.sin(t * Math.PI) * 0.05
    } else {
      v = median - (median - worst) * ((t - 0.75) / 0.25)
    }
    bars.push(Math.max(0, Math.min(1, v)))
  }

  const maxV = 1.0
  const minV = 0.4
  const scale = (v: number) => Math.max(0, Math.min(1, (v - minV) / (maxV - minV)))

  const annaY = (1 - scale(annaBaseline)) * 100

  return (
    <div className={cn('border border-white/[0.06] bg-[#0A0A0A] p-3', className)}>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs text-white/55 font-mono uppercase">
          Population fitness · gen {generation} / {totalGenerations}
        </span>
        <span className="text-[10px] text-white/40 font-mono">
          best <span className="text-[#D4AF37]">{best.toFixed(3)}</span> · median {median.toFixed(3)} · worst{' '}
          {worst.toFixed(3)}
        </span>
      </div>
      <div className="relative h-[220px] flex items-end gap-[3px]">
        {/* Anna baseline gold dashed line */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-[#D4AF37]/50 pointer-events-none"
          style={{ top: `${annaY}%` }}
        >
          <span className="absolute right-0 -top-3 text-[9px] text-[#D4AF37]/80 font-mono bg-[#0A0A0A] px-1">
            Anna {annaBaseline.toFixed(3)}
          </span>
        </div>
        {/* Chance line at 0.5 */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-white/15 pointer-events-none"
          style={{ top: `${(1 - scale(0.5)) * 100}%` }}
        >
          <span className="absolute left-1 -top-3 text-[9px] text-white/30 font-mono bg-[#0A0A0A] px-1">
            chance 0.500
          </span>
        </div>
        {/* Bars */}
        {bars.map((v, i) => {
          const h = scale(v) * 100
          const isTop = i < BARS * 0.25
          return (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-t-sm transition-all duration-300',
                isTop ? 'bg-[#D4AF37]/85' : i < BARS * 0.5 ? 'bg-white/30' : 'bg-rose-700/40',
              )}
              style={{ height: `${h}%`, minHeight: '2px' }}
              title={`fitness ${v.toFixed(3)}`}
            />
          )
        })}
      </div>
      <div className="flex justify-between text-[9px] text-white/35 font-mono mt-1">
        <span>top fitness →</span>
        <span>← bottom fitness</span>
      </div>
    </div>
  )
}
