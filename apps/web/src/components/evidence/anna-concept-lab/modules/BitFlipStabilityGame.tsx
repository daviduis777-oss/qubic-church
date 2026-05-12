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
  nearestConcept,
  signWeights,
  N_INPUTS,
} from '@/lib/ait'
import type { Matrix } from '@/lib/ait/types'
import type { Concept, ConceptNamingMap } from '../types'
import { BitToggleRow } from '../components/BitToggleRow'

const SESSION_RECORD_KEY = 'anna-lab-v1.bit-flip-record'

/**
 * Module 5 — Bit-flip Stability Game.
 *
 * Pick (or randomize) an input. See its concept. Flip bits and watch
 * the concept change in real time. Demonstrates locality-sensitive
 * concept basins (50% retention at radius ~4 bits).
 *
 * Game element: counter for "how many flips before concept changed".
 */
export interface BitFlipStabilityGameProps {
  matrix: Matrix
  concepts: Concept[]
  namingMap?: ConceptNamingMap
  className?: string
}

interface HistoryEntry {
  flippedBitIndex: number
  conceptIdAfter: number
  distanceToCentroidAfter: number
  conceptChanged: boolean
}

export function BitFlipStabilityGame({
  matrix,
  concepts,
  namingMap,
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
    if (typeof window === 'undefined') return
    const v = localStorage.getItem(SESSION_RECORD_KEY)
    if (v !== null) {
      const n = parseInt(v, 10)
      if (Number.isFinite(n)) setSessionRecord(n)
    }
  }, [])

  const conceptDisplay = (id: number | undefined): string => {
    if (id === undefined || id < 0) return '—'
    return namingMap?.get(id)?.display ?? `#${id}`
  }

  const conceptCentroids = useMemo(() => concepts.map((c) => c.centroid), [concepts])

  // Cheap synchronous: AIT inference + nearest-concept lookup
  const anchorFast = useMemo(() => {
    const r = aitInference(W, anchor)
    const concept = conceptCentroids.length > 0 ? nearestConcept(r.output, conceptCentroids) : null
    return { result: r, concept }
  }, [W, anchor, conceptCentroids])

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

  const anchorAnalysis = useMemo(
    () => ({
      result: anchorFast.result,
      concept: anchorFast.concept,
      stability: anchorStability ?? 0,
      stabilityKnown: anchorStability !== null,
    }),
    [anchorFast, anchorStability],
  )

  const currentAnalysis = useMemo(() => {
    const r = aitInference(W, current)
    const concept = conceptCentroids.length > 0 ? nearestConcept(r.output, conceptCentroids) : null
    return { result: r, concept }
  }, [W, current, conceptCentroids])

  const numFlipped = useMemo(() => {
    let n = 0
    for (let i = 0; i < N_INPUTS; i++) if (anchor[i] !== current[i]) n++
    return n
  }, [anchor, current])

  const conceptChanged = useMemo(() => {
    if (!anchorAnalysis.concept || !currentAnalysis.concept) return false
    return anchorAnalysis.concept.conceptId !== currentAnalysis.concept.conceptId
  }, [anchorAnalysis, currentAnalysis])

  const flipsBeforeChange = useMemo(() => {
    // First entry where concept changed
    const firstChange = history.find((h) => h.conceptChanged)
    if (!firstChange) return null
    return history.indexOf(firstChange) + 1
  }, [history])

  // Toggle a bit in current
  const onFlipBit = useCallback((idx: number) => {
    setCurrent((prev) => {
      const next = new Int8Array(prev)
      next[idx] = (next[idx] === 1 ? -1 : 1) as -1 | 1
      return next
    })
  }, [])

  // After current changes, compute "did flipping idx cause concept change?"
  // For history tracking, we want to log each flip.
  // Implementation: detect what bit was just flipped relative to history's last "current"
  // Simpler: history is rebuilt on demand via watching `current` state changes vs `anchor`.

  // Watch flips: detect SINGLE bit changes from previous current to new current
  // Simpler design: history is logged by user actions. So onFlipBit logs entry.
  // Refactor: combine flip + history log
  const flipBit = useCallback((idx: number) => {
    setCurrent((prev) => {
      const next = new Int8Array(prev)
      next[idx] = (next[idx] === 1 ? -1 : 1) as -1 | 1
      // Log flip — we need analysis of the new concept; do it inline
      const r = aitInference(W, next)
      const concept = concepts.length > 0 ? nearestConcept(r.output, concepts.map((c) => c.centroid)) : null
      const conceptChangedNow = anchorAnalysis.concept !== null
        && concept !== null
        && anchorAnalysis.concept.conceptId !== concept.conceptId
      setHistory((h) => [
        ...h,
        {
          flippedBitIndex: idx,
          conceptIdAfter: concept?.conceptId ?? -1,
          distanceToCentroidAfter: concept?.distance ?? 64,
          conceptChanged: conceptChangedNow,
        },
      ])
      return next
    })
  }, [W, concepts, anchorAnalysis.concept])

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
        `Found a deeply stable basin (stability = ${(bestStability * 100).toFixed(0)} %). Try flipping bits.`,
      )
    } else {
      setFindStableToast(
        `Couldn't find a deeply stable basin in 50 tries (best = ${(bestStability * 100).toFixed(0)} %). Try again or use 'new random'.`,
      )
    }
    setTimeout(() => setFindStableToast(null), 5000)
  }, [W])

  // Persist best session-record when concept first changes
  useEffect(() => {
    const flipsBeforeChange = history.findIndex((h) => h.conceptChanged) + 1
    if (flipsBeforeChange > 0 && (sessionRecord === null || flipsBeforeChange > sessionRecord)) {
      setSessionRecord(flipsBeforeChange)
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_RECORD_KEY, String(flipsBeforeChange))
      }
    }
  }, [history, sessionRecord])

  const reset = useCallback(() => {
    setCurrent(new Int8Array(anchor))
    setHistory([])
  }, [anchor])

  const conceptDetails = currentAnalysis.concept
    ? concepts[currentAnalysis.concept.conceptId] ?? null
    : null

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div>
        <h3 className="text-base font-semibold tracking-wide text-[#D4AF37]/90 inline-flex items-center gap-2">
          <Crosshair className="w-4 h-4" />
          Bit-flip Stability Game
        </h3>
        <p className="text-xs text-white/50 mt-0.5">
          Click any input bit to flip it. Watch how many bits you can change before Anna assigns
          a different concept. (Average locality-sensitive radius: ~4 bits at 50% retention.)
        </p>
      </div>

      <ExplainPanel
        kid={EXPLAIN_BIT_FLIP_GAME.kid}
        simple={EXPLAIN_BIT_FLIP_GAME.simple}
        researcher={EXPLAIN_BIT_FLIP_GAME.researcher}
        math={EXPLAIN_BIT_FLIP_GAME.math}
        title="What is the basin radius?"
        defaultCollapsed
      />

      {/* Anchor + status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          label="Anchor concept"
          value={anchorAnalysis.concept ? conceptDisplay(anchorAnalysis.concept.conceptId) : '—'}
          sub={anchorAnalysis.concept ? `#${anchorAnalysis.concept.conceptId} · ${anchorAnalysis.concept.distance}/64 from centroid` : ''}
          tone="accent"
        />
        <StatCard
          label="Current concept"
          value={currentAnalysis.concept ? conceptDisplay(currentAnalysis.concept.conceptId) : '—'}
          sub={currentAnalysis.concept
            ? `#${currentAnalysis.concept.conceptId} · ${currentAnalysis.concept.distance}/64 from centroid`
            : ''
          }
          tone={conceptChanged ? 'warn' : 'good'}
        />
        <StatCard
          label="Bits flipped"
          value={`${numFlipped}/64`}
          sub={
            flipsBeforeChange
              ? `Concept changed after ${flipsBeforeChange} flip${flipsBeforeChange === 1 ? '' : 's'}`
              : conceptChanged
                ? 'Concept changed!'
                : 'still in same concept'
          }
          tone={conceptChanged ? 'warn' : numFlipped >= 4 ? 'good' : 'neutral'}
        />
      </div>

      {/* Find-stable toast */}
      {findStableToast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300"
        >
          {findStableToast}
        </motion.div>
      )}

      {/* Session record badge */}
      {sessionRecord !== null && (
        <div className="text-[10px] text-emerald-400/75 font-mono">
          🏆 session record: {sessionRecord} flip{sessionRecord === 1 ? '' : 's'} before concept changed
        </div>
      )}

      {/* Anchor stability info */}
      <div className="px-3 py-2 bg-black/30 border border-white/[0.06] text-xs text-white/60">
        <span className="text-white/40 font-mono uppercase">Anchor basin stability:</span>{' '}
        {anchorAnalysis.stabilityKnown ? (
          <>
            <span className={cn(
              'font-semibold',
              anchorAnalysis.stability >= 0.8 ? 'text-emerald-400' :
              anchorAnalysis.stability >= 0.5 ? 'text-[#D4AF37]' : 'text-amber-400',
            )}>
              {(anchorAnalysis.stability * 100).toFixed(0)}%
            </span>
            <span className="text-white/40 ml-1">
              {anchorAnalysis.stability >= 0.8
                ? '(in stable concept basin — high resistance to perturbation)'
                : anchorAnalysis.stability >= 0.5
                  ? '(near concept centroid — moderate resistance)'
                  : '(near concept boundary — sensitive to flips)'
              }
            </span>
          </>
        ) : (
          <span className="text-white/40">computing...</span>
        )}
      </div>

      {/* Anchor visualization */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/60 font-mono">Anchor (read-only)</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={newAnchor}
              className="text-[10px] px-2 py-1 border border-white/10 hover:bg-white/5 text-white/60 font-mono inline-flex items-center gap-1"
            >
              <Shuffle className="w-3 h-3" />
              new random
            </button>
            <button
              type="button"
              onClick={newStableAnchor}
              className="text-[10px] px-2 py-1 border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 font-mono inline-flex items-center gap-1"
            >
              <Crosshair className="w-3 h-3" />
              find stable
            </button>
          </div>
        </div>
        <div className="p-2 bg-black/30 border border-white/[0.06]">
          <BitToggleRow bits={anchor} readonly layout="4x16" cellSize="md" />
        </div>
      </div>

      {/* Current (clickable) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/60 font-mono">
            Current (click bits to flip — changed bits ringed)
          </span>
          <button
            type="button"
            onClick={reset}
            className="text-[10px] px-2 py-1 border border-white/10 hover:bg-white/5 text-white/60 font-mono inline-flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            reset to anchor
          </button>
        </div>
        <div className={cn(
          'p-2 bg-black/30 border transition-colors',
          conceptChanged ? 'border-amber-500/40' : 'border-emerald-500/30',
        )}>
          <BitToggleRow
            bits={current}
            onToggle={flipBit}
            layout="4x16"
            cellSize="md"
            changedCells={
              new Set<number>(
                Array.from({ length: N_INPUTS })
                  .map((_, i) => (anchor[i] !== current[i] ? i : -1))
                  .filter((x) => x >= 0) as number[],
              )
            }
          />
        </div>
      </div>

      {/* Concept centroid display (current) */}
      {currentAnalysis.concept && conceptDetails && (
        <motion.div layout className="p-3 bg-black/30 border border-white/[0.06] space-y-3">
          <div className="space-y-1">
            <div className="text-[10px] text-white/45 font-mono uppercase">Current output</div>
            <BitToggleRow bits={currentAnalysis.result.output} readonly layout="4x16" cellSize="sm" />
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-white/45 font-mono uppercase flex items-center justify-between">
              <span>{conceptDisplay(currentAnalysis.concept.conceptId)} centroid</span>
              <span className="text-white/40 normal-case">
                {currentAnalysis.concept.distance}/64 bits mismatch
              </span>
            </div>
            <BitToggleRow bits={conceptDetails.centroid} readonly layout="4x16" cellSize="sm" />
          </div>
        </motion.div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="p-3 bg-black/30 border border-white/[0.06]">
          <div className="text-xs text-white/60 font-mono mb-2">
            Flip history ({history.length}{flipsBeforeChange ? `; concept first changed at flip ${flipsBeforeChange}` : ''})
          </div>
          <div className="flex flex-wrap gap-1 max-h-[120px] overflow-auto">
            <AnimatePresence>
              {history.map((h, i) => (
                <motion.div
                  key={`hist-${i}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 text-[10px] font-mono border',
                    h.conceptChanged
                      ? 'border-amber-500/40 bg-amber-500/[0.06] text-amber-300'
                      : 'border-white/10 bg-white/[0.02] text-white/55',
                  )}
                >
                  <span className="text-white/40">{i + 1}.</span>
                  <span>bit {h.flippedBitIndex}</span>
                  <ArrowRight className="w-3 h-3 text-white/30" />
                  <span>{conceptDisplay(h.conceptIdAfter)}</span>
                  <span className="text-white/40">({h.distanceToCentroidAfter})</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, tone }: {
  label: string; value: string; sub: string;
  tone: 'good' | 'neutral' | 'warn' | 'accent';
}) {
  const t = {
    good: 'border-emerald-500/30 bg-emerald-500/[0.04] text-emerald-400/90',
    neutral: 'border-white/[0.06] bg-black/30 text-white/80',
    warn: 'border-amber-500/30 bg-amber-500/[0.04] text-amber-400/90',
    accent: 'border-[#D4AF37]/30 bg-[#D4AF37]/[0.04] text-[#D4AF37]',
  }[tone]
  return (
    <div className={cn('px-3 py-2 border', t)}>
      <div className="text-[10px] text-white/50 font-mono uppercase">{label}</div>
      <div className="text-base font-semibold">{value}</div>
      <div className="text-[10px] text-white/50 mt-0.5">{sub}</div>
    </div>
  )
}
