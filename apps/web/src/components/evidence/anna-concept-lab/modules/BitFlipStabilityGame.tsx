'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crosshair, Shuffle, RotateCcw, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExplainPanel } from '@/components/evidence/lab-primitives'
import { EXPLAIN_BIT_FLIP_GAME } from '../components/explainContent'

import {
  aitInference,
  basinStability,
  hammingDistance,
  signWeights,
  N_INPUTS,
} from '@/lib/ait'
import type { Matrix } from '@/lib/ait/types'
import { BitToggleRow } from '../components/BitToggleRow'

const SESSION_RECORD_KEY = 'anna-lab-v2.bit-flip-record'

/**
 * Module 5: Bit-flip Stability Game.
 *
 * Pick (or randomize) an input and run it. Flip input bits and compare the
 * output after the run with the anchor's output by Hamming distance.
 *
 * Game element: counter for "how many flips before the output changed".
 */
export interface BitFlipStabilityGameProps {
  matrix: Matrix
  className?: string
}

interface HistoryEntry {
  flippedBitIndex: number
  distanceAfter: number
  outputChanged: boolean
}

export function BitFlipStabilityGame({
  matrix,
  className,
}: BitFlipStabilityGameProps) {
  const W = useMemo(() => signWeights(matrix), [matrix])

  const [anchor, setAnchor] = useState<Int8Array>(() => {
    const a = new Int8Array(N_INPUTS)
    for (let i = 0; i < N_INPUTS; i++) a[i] = Math.random() < 0.5 ? -1 : 1
    return a
  })

  const [current, setCurrent] = useState<Int8Array>(() => new Int8Array(anchor))
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [findStableToast, setFindStableToast] = useState<string | null>(null)
  const [sessionRecord, setSessionRecord] = useState<number | null>(null)

  // Hydrate session-record from localStorage on mount
  useEffect(() => {
    try {
      const v = localStorage.getItem(SESSION_RECORD_KEY)
      if (v !== null) {
        const n = parseInt(v, 10)
        if (Number.isFinite(n)) setSessionRecord(n)
      }
    } catch {
      // storage unavailable: the record simply starts empty
    }
  }, [])

  const anchorResult = useMemo(() => aitInference(W, anchor), [W, anchor])

  // Expensive: basinStability runs N inferences. Debounce + run async after anchor changes.
  const [anchorStability, setAnchorStability] = useState<number | null>(null)
  const anchorStabTimer = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (anchorStabTimer.current) clearTimeout(anchorStabTimer.current)
    setAnchorStability(null)
    anchorStabTimer.current = setTimeout(() => {
      const s = basinStability(W, anchor, { trials: 16 })
      setAnchorStability(s)
    }, 150)
    return () => {
      if (anchorStabTimer.current) clearTimeout(anchorStabTimer.current)
    }
  }, [W, anchor])

  const currentResult = useMemo(() => aitInference(W, current), [W, current])

  const outputDistance = useMemo(
    () => hammingDistance(anchorResult.output, currentResult.output),
    [anchorResult, currentResult]
  )
  const outputChanged = outputDistance > 0

  const numFlipped = useMemo(() => {
    let n = 0
    for (let i = 0; i < N_INPUTS; i++) if (anchor[i] !== current[i]) n++
    return n
  }, [anchor, current])

  const flipsBeforeChange = useMemo(() => {
    const idx = history.findIndex(h => h.outputChanged)
    return idx < 0 ? null : idx + 1
  }, [history])

  // Flip a bit and log the output distance after the flip
  const flipBit = useCallback(
    (idx: number) => {
      const next = new Int8Array(current)
      next[idx] = (next[idx] === 1 ? -1 : 1) as -1 | 1
      const d = hammingDistance(
        anchorResult.output,
        aitInference(W, next).output
      )
      setCurrent(next)
      setHistory(h => [
        ...h,
        { flippedBitIndex: idx, distanceAfter: d, outputChanged: d > 0 },
      ])
    },
    [W, anchorResult, current]
  )

  const newAnchor = useCallback(() => {
    const a = new Int8Array(N_INPUTS)
    for (let i = 0; i < N_INPUTS; i++) a[i] = Math.random() < 0.5 ? -1 : 1
    setAnchor(a)
    setCurrent(new Int8Array(a))
    setHistory([])
  }, [])

  const newStableAnchor = useCallback(() => {
    let bestInput: Int8Array | null = null
    let bestStability = 0
    for (let trial = 0; trial < 50; trial++) {
      const cand = new Int8Array(N_INPUTS)
      for (let i = 0; i < N_INPUTS; i++) cand[i] = Math.random() < 0.5 ? -1 : 1
      const stab = basinStability(W, cand, { trials: 10 })
      if (stab > bestStability) {
        bestStability = stab
        bestInput = cand
      }
      if (stab >= 0.95) break
    }
    if (bestInput && bestStability > 0.5) {
      setAnchor(bestInput)
      setCurrent(new Int8Array(bestInput))
      setHistory([])
      setFindStableToast(
        `Found an input whose output rarely changes under one flip (${(bestStability * 100).toFixed(0)} % unchanged). Try flipping bits.`
      )
    } else {
      setFindStableToast(
        `No input above 50 % unchanged in 50 tries (best = ${(bestStability * 100).toFixed(0)} %). Try again or use 'new random'.`
      )
    }
    setTimeout(() => setFindStableToast(null), 5000)
  }, [W])

  // Persist best session-record when the output first changes
  useEffect(() => {
    if (
      flipsBeforeChange !== null &&
      (sessionRecord === null || flipsBeforeChange > sessionRecord)
    ) {
      setSessionRecord(flipsBeforeChange)
      try {
        localStorage.setItem(SESSION_RECORD_KEY, String(flipsBeforeChange))
      } catch {
        // storage unavailable: keep the record for this visit only
      }
    }
  }, [flipsBeforeChange, sessionRecord])

  const reset = useCallback(() => {
    setCurrent(new Int8Array(anchor))
    setHistory([])
  }, [anchor])

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div>
        <h3 className="text-base font-semibold tracking-wide text-gold/90 inline-flex items-center gap-2">
          <Crosshair className="w-4 h-4" />
          Bit-flip Stability Game
        </h3>
        <p className="text-xs text-white/50 mt-0.5">
          Click any input bit to flip it. After each flip Anna runs again, and
          we show how many of the 64 output bits differ from the anchor&apos;s
          output (Hamming distance).
        </p>
      </div>

      <ExplainPanel
        defaultCollapsed
        kid={EXPLAIN_BIT_FLIP_GAME.kid}
        math={EXPLAIN_BIT_FLIP_GAME.math}
        researcher={EXPLAIN_BIT_FLIP_GAME.researcher}
        simple={EXPLAIN_BIT_FLIP_GAME.simple}
        title="What does the game measure?"
      />

      {/* Anchor + status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          label="Anchor run"
          sub={anchorResult.endReason}
          tone="accent"
          value={`${anchorResult.ticks} ticks`}
        />
        <StatCard
          label="Output distance"
          sub="differ from the anchor's output"
          tone={outputChanged ? 'warn' : 'good'}
          value={`${outputDistance}/64 bits`}
        />
        <StatCard
          label="Bits flipped"
          sub={
            flipsBeforeChange
              ? `Output first changed after ${flipsBeforeChange} flip${flipsBeforeChange === 1 ? '' : 's'}`
              : outputChanged
                ? 'Output changed'
                : 'output unchanged'
          }
          tone={outputChanged ? 'warn' : numFlipped >= 4 ? 'good' : 'neutral'}
          value={`${numFlipped}/64`}
        />
      </div>

      {/* Find-stable toast */}
      {findStableToast && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300"
          initial={{ opacity: 0, y: -8 }}
        >
          {findStableToast}
        </motion.div>
      )}

      {/* Session record badge */}
      {sessionRecord !== null && (
        <div className="text-xs text-emerald-400/75 font-mono">
          session record: {sessionRecord} flip{sessionRecord === 1 ? '' : 's'}{' '}
          before the output changed
        </div>
      )}

      {/* Anchor stability info */}
      <div className="px-3 py-2 bg-black/30 border border-border text-xs text-white/60">
        <span className="text-muted-foreground font-mono uppercase">
          Anchor output stability:
        </span>{' '}
        {anchorStability !== null ? (
          <>
            <span
              className={cn(
                'font-semibold',
                anchorStability >= 0.8
                  ? 'text-emerald-400'
                  : anchorStability >= 0.5
                    ? 'text-gold'
                    : 'text-amber-400'
              )}
            >
              {(anchorStability * 100).toFixed(0)}%
            </span>
            <span className="text-muted-foreground ml-1">
              of single-bit flips leave the output unchanged
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">computing...</span>
        )}
      </div>

      {/* Anchor visualization */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/60 font-mono">
            Anchor (read-only)
          </span>
          <div className="flex items-center gap-1">
            <button
              className="text-xs px-2 py-1 border border-white/10 hover:bg-white/5 text-white/60 font-mono inline-flex items-center gap-1"
              onClick={newAnchor}
              type="button"
            >
              <Shuffle className="w-3 h-3" />
              new random
            </button>
            <button
              className="text-xs px-2 py-1 border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 font-mono inline-flex items-center gap-1"
              onClick={newStableAnchor}
              type="button"
            >
              <Crosshair className="w-3 h-3" />
              find stable
            </button>
          </div>
        </div>
        <div className="p-2 bg-black/30 border border-border">
          <BitToggleRow bits={anchor} cellSize="md" layout="4x16" readonly />
        </div>
      </div>

      {/* Current (clickable) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/60 font-mono">
            Current (click bits to flip; changed bits ringed)
          </span>
          <button
            className="text-xs px-2 py-1 border border-white/10 hover:bg-white/5 text-white/60 font-mono inline-flex items-center gap-1"
            onClick={reset}
            type="button"
          >
            <RotateCcw className="w-3 h-3" />
            reset to anchor
          </button>
        </div>
        <div
          className={cn(
            'p-2 bg-black/30 border transition-colors',
            outputChanged ? 'border-amber-500/40' : 'border-emerald-500/30'
          )}
        >
          <BitToggleRow
            bits={current}
            cellSize="md"
            changedCells={
              new Set<number>(
                Array.from({ length: N_INPUTS })
                  .map((_, i) => (anchor[i] !== current[i] ? i : -1))
                  .filter(x => x >= 0) as number[]
              )
            }
            layout="4x16"
            onToggle={flipBit}
          />
        </div>
      </div>

      {/* Output comparison */}
      <motion.div
        className="p-3 bg-black/30 border border-border space-y-3"
        layout
      >
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground font-mono uppercase">
            Anchor output
          </div>
          <BitToggleRow
            bits={anchorResult.output}
            cellSize="sm"
            layout="4x16"
            readonly
          />
        </div>
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground font-mono uppercase flex items-center justify-between">
            <span>Current output</span>
            <span className="text-muted-foreground normal-case">
              {outputDistance}/64 bits differ
            </span>
          </div>
          <BitToggleRow
            bits={currentResult.output}
            cellSize="sm"
            layout="4x16"
            readonly
          />
        </div>
      </motion.div>

      {/* History */}
      {history.length > 0 && (
        <div className="p-3 bg-black/30 border border-border">
          <div className="text-xs text-white/60 font-mono mb-2">
            Flip history ({history.length}
            {flipsBeforeChange
              ? `; output first changed at flip ${flipsBeforeChange}`
              : ''}
            )
          </div>
          <div className="flex flex-wrap gap-1 max-h-[120px] overflow-auto">
            <AnimatePresence>
              {history.map((h, i) => (
                <motion.div
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 text-xs font-mono border',
                    h.outputChanged
                      ? 'border-amber-500/40 bg-amber-500/[0.06] text-amber-300'
                      : 'border-white/10 bg-white/[0.02] text-white/55'
                  )}
                  initial={{ opacity: 0, scale: 0.8 }}
                  key={`hist-${i}`}
                >
                  <span className="text-muted-foreground">{i + 1}.</span>
                  <span>bit {h.flippedBitIndex}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground/70" />
                  <span>{h.distanceAfter}/64 differ</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub: string
  tone: 'good' | 'neutral' | 'warn' | 'accent'
}) {
  const t = {
    good: 'border-emerald-500/30 bg-emerald-500/[0.04] text-emerald-400/90',
    neutral: 'border-border bg-black/30 text-white/80',
    warn: 'border-amber-500/30 bg-amber-500/[0.04] text-amber-400/90',
    accent: 'border-gold/30 bg-gold/[0.04] text-gold',
  }[tone]
  return (
    <div className={cn('px-3 py-2 border', t)}>
      <div className="text-xs text-white/50 font-mono uppercase">{label}</div>
      <div className="text-base font-semibold">{value}</div>
      <div className="text-xs text-white/50 mt-0.5">{sub}</div>
    </div>
  )
}
