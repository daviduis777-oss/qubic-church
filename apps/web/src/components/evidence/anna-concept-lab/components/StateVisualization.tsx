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
 *  - currentFrame: 0..frames.length-1, controls which is "current" (others slightly faded)
 *  - endReason: stop reason text shown at end
 *  - maxFrames: max number of tick rows to render (default 25)
 */
export interface StateVisualizationProps {
  frames: TickFrame[]
  currentFrame?: number
  endReason?: string
  maxFrames?: number
  highlightConcept?: number[] // 64-bit ±1: overlay output portion to compare to a reference state
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
      <div className={cn('p-4 text-muted-foreground text-sm', className)}>
        No tick data yet. Click Run to start AIT inference.
      </div>
    )
  }

  const visibleFrames = frames.slice(0, maxFrames)
  const remaining = frames.length - visibleFrames.length

  return (
    <div className={cn('flex flex-col gap-1 font-mono', className)}>
      <div className="flex items-center gap-3 text-xs text-white/50 mb-1">
        <span className="text-gold/70">tick</span>
        <span>state</span>
        <span className="ml-auto text-muted-foreground">[input | output]</span>
      </div>

      <AnimatePresence initial={false}>
        {visibleFrames.map((frame, idx) => {
          const isCurrent = currentFrame === idx
          const isPast = currentFrame !== undefined && idx < currentFrame
          const opacity =
            currentFrame === undefined
              ? 1
              : isCurrent
                ? 1
                : isPast
                  ? 0.55
                  : 0.25

          return (
            <motion.div
              animate={{ opacity, y: 0 }}
              className="flex items-center gap-3"
              initial={{ opacity: 0, y: -4 }}
              key={`tick-${frame.tick}`}
              transition={{ duration: 0.18 }}
            >
              <span
                className={cn(
                  'text-xs tabular-nums w-8 text-right',
                  isCurrent ? 'text-gold' : 'text-muted-foreground'
                )}
              >
                t={frame.tick}
              </span>
              <BitToggleRow
                bits={frame.state}
                cellSize="sm"
                changedCells={frame.changedCells}
                layout="row"
                readonly
                splitInputOutput
              />
            </motion.div>
          )
        })}
      </AnimatePresence>

      {remaining > 0 && (
        <div className="text-xs text-muted-foreground italic">
          (+{remaining} more ticks not shown)
        </div>
      )}

      {endReason && frames.length > 0 && (
        <div
          className={cn(
            'mt-2 text-xs flex items-center gap-2',
            endReason === 'NO_OUTPUT_ZEROES' && 'text-emerald-400/80',
            endReason === 'NO_NSTATE_CHANGES' && 'text-blue-400/80',
            endReason === 'TICK_CAP' && 'text-amber-400/80'
          )}
        >
          <span className="font-mono">STOP</span>
          <span>{endReason}</span>
          <span className="text-muted-foreground">
            at tick {frames[frames.length - 1]!.tick}
          </span>
        </div>
      )}

      {highlightConcept && (
        <div className="mt-3 pt-2 border-t border-border">
          <div className="flex items-center gap-3 text-xs text-white/50 mb-1">
            <span className="w-8 text-right text-gold/80">ref</span>
            <span>nearest stored reference state</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums w-8 text-right text-gold/80">
              →
            </span>
            <BitToggleRow
              bits={[...new Array(64).fill(0), ...highlightConcept]}
              cellSize="sm"
              layout="row"
              readonly
              splitInputOutput
            />
          </div>
        </div>
      )}
    </div>
  )
}
