'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { BitToggleRow } from './BitToggleRow'
import type { TickFrame } from '../types'

/**
 * Animated tick-by-tick state evolution panel.
 *
 * Shows the 128-cell state at each tick of AIT inference.
 * Cells that changed from previous tick are highlighted with a ring.
 *
 * Props:
 *  - frames: ordered list of tick frames (frame 0 = initial, frame N = final)
 *  - currentFrame: 0..frames.length-1 — controls which is "current" (others slightly faded)
 *  - endReason: stop reason text shown at end
 *  - maxFrames: max number of tick rows to render (default 25)
 */
export interface StateVisualizationProps {
  frames: TickFrame[]
  currentFrame?: number
  endReason?: string
  maxFrames?: number
  highlightConcept?: number[] // 64-bit ±1 — overlay output portion to compare to concept
  className?: string
}

export function StateVisualization({
  frames,
  currentFrame,
  endReason,
  maxFrames = 30,
  highlightConcept,
  className,
}: StateVisualizationProps) {
  if (frames.length === 0) {
    return (
      <div className={cn('p-4 text-white/40 text-sm', className)}>
        No tick data yet. Click Run to start AIT inference.
      </div>
    )
  }

  const visibleFrames = frames.slice(0, maxFrames)
  const remaining = frames.length - visibleFrames.length

  return (
    <div className={cn('flex flex-col gap-1 font-mono', className)}>
      <div className="flex items-center gap-3 text-[11px] text-white/50 mb-1">
        <span className="text-[#D4AF37]/70">tick</span>
        <span>state</span>
        <span className="ml-auto text-white/30">[input | output]</span>
      </div>

      <AnimatePresence initial={false}>
        {visibleFrames.map((frame, idx) => {
          const isCurrent = currentFrame === idx
          const isPast = currentFrame !== undefined && idx < currentFrame
          const opacity = currentFrame === undefined ? 1 : isCurrent ? 1 : isPast ? 0.55 : 0.25

          return (
            <motion.div
              key={`tick-${frame.tick}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity, y: 0 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-3"
            >
              <span className={cn(
                'text-[10px] tabular-nums w-8 text-right',
                isCurrent ? 'text-[#D4AF37]' : 'text-white/30',
              )}>
                t={frame.tick}
              </span>
              <BitToggleRow
                bits={frame.state}
                readonly
                changedCells={frame.changedCells}
                layout="row"
                cellSize="sm"
                splitInputOutput
              />
            </motion.div>
          )
        })}
      </AnimatePresence>

      {remaining > 0 && (
        <div className="text-[10px] text-white/40 italic">
          (+{remaining} more ticks not shown)
        </div>
      )}

      {endReason && frames.length > 0 && (
        <div className={cn(
          'mt-2 text-[11px] flex items-center gap-2',
          endReason === 'NO_OUTPUT_ZEROES' && 'text-emerald-400/80',
          endReason === 'NO_NSTATE_CHANGES' && 'text-blue-400/80',
          endReason === 'TICK_CAP' && 'text-amber-400/80',
        )}>
          <span className="font-mono">STOP</span>
          <span>{endReason}</span>
          <span className="text-white/40">at tick {frames[frames.length - 1]!.tick}</span>
        </div>
      )}

      {highlightConcept && (
        <div className="mt-3 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 text-[10px] text-white/50 mb-1">
            <span className="w-8 text-right text-[#D4AF37]/50">cn</span>
            <span>nearest concept centroid</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] tabular-nums w-8 text-right text-[#D4AF37]/50">→</span>
            <BitToggleRow
              bits={[...new Array(64).fill(0), ...highlightConcept]}
              readonly
              layout="row"
              cellSize="sm"
              splitInputOutput
            />
          </div>
        </div>
      )}
    </div>
  )
}
