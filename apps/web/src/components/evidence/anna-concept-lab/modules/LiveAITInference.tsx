'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, Shuffle, Zap, } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExplainPanel } from '@/components/evidence/lab-primitives'
import { EXPLAIN_LIVE_INFERENCE } from '../components/explainContent'

import {
  aitInference,
  basinStability,
  nearestConcept,
  signWeights,
  N_NEURONS,
  N_INPUTS,
} from '@/lib/ait'
import type { Matrix } from '@/lib/ait/types'
import type { Concept, TickFrame } from '../types'
import { BitToggleRow } from '../components/BitToggleRow'
import { StateVisualization } from '../components/StateVisualization'

/**
 * Module 1: Live AIT Inference.
 *
 * User edits a 64-bit input. Click Run → tick-by-tick AIT inference animation
 * then the output, its Hamming distance to the nearest stored reference state,
 * and the share of single-bit flips that leave the output unchanged.
 */
export interface LiveAITInferenceProps {
  matrix: Matrix
  concepts: Concept[]
  /** Optional: link this module to the same input as another panel (Module 2). */
  controlledInput?: Int8Array
  onInputChange?: (input: Int8Array) => void
  matrixLabel?: string
  className?: string
}

const TICK_DURATION_MS = 220 // animation tick speed

export function LiveAITInference({
  matrix,
  concepts,
  controlledInput,
  onInputChange,
  matrixLabel = 'Anna',
  className,
}: LiveAITInferenceProps) {
  const W = useMemo(() => signWeights(matrix), [matrix])

  // input state: managed locally unless controlledInput is provided
  const [input, setInput] = useState<Int8Array>(() => {
    const a = new Int8Array(N_INPUTS)
    // start with random input
    for (let i = 0; i < N_INPUTS; i++) a[i] = Math.random() < 0.5 ? -1 : 1
    return a
  })

  // sync controlled
  useEffect(() => {
    if (controlledInput) setInput(new Int8Array(controlledInput))
  }, [controlledInput])

  // animation state
  const [frames, setFrames] = useState<TickFrame[]>([])
  const [currentFrameIdx, setCurrentFrameIdx] = useState<number>(0)
  const [running, setRunning] = useState(false)
  const [endReason, setEndReason] = useState<string | undefined>()
  const [stability, setStability] = useState<number | null>(null)
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null)

  // computed result (final state, ticks, concept)
  const result = useMemo(() => {
    if (frames.length === 0) return null
    const finalFrame = frames[frames.length - 1]
    if (!finalFrame) return null
    const output = finalFrame.state.slice(N_INPUTS)
    const concept =
      concepts.length > 0
        ? (() => {
            const centroids = concepts.map(c => c.centroid)
            return nearestConcept(output, centroids)
          })()
        : null
    return { finalFrame, output, concept, ticks: finalFrame.tick }
  }, [frames, concepts])

  // notify parent of input changes
  useEffect(() => {
    onInputChange?.(input)
  }, [input, onInputChange])

  // ------ event handlers ------

  const onToggleBit = useCallback((idx: number) => {
    setInput(prev => {
      const next = new Int8Array(prev)
      next[idx] = (next[idx] === 1 ? -1 : 1) as -1 | 1
      return next
    })
    // reset animation
    setFrames([])
    setCurrentFrameIdx(0)
    setEndReason(undefined)
    setStability(null)
  }, [])

  const setAllZeros = useCallback(() => {
    const a = new Int8Array(N_INPUTS)
    for (let i = 0; i < N_INPUTS; i++) a[i] = -1
    setInput(a)
    setFrames([])
    setEndReason(undefined)
    setStability(null)
  }, [])

  const setAllOnes = useCallback(() => {
    const a = new Int8Array(N_INPUTS)
    for (let i = 0; i < N_INPUTS; i++) a[i] = 1
    setInput(a)
    setFrames([])
    setEndReason(undefined)
    setStability(null)
  }, [])

  const setRandom = useCallback(() => {
    const a = new Int8Array(N_INPUTS)
    for (let i = 0; i < N_INPUTS; i++) a[i] = Math.random() < 0.5 ? -1 : 1
    setInput(a)
    setFrames([])
    setEndReason(undefined)
    setStability(null)
  }, [])

  const computeFrames = useCallback((): TickFrame[] => {
    // Run inference with trajectory recording
    const r = aitInference(W, input, { recordTrajectory: true })
    if (!r.trajectory) return []
    const f: TickFrame[] = []
    for (let i = 0; i < r.trajectory.length; i++) {
      const cur = r.trajectory[i]!
      const changedCells = new Set<number>()
      if (i > 0) {
        const prev = r.trajectory[i - 1]!
        for (let k = 0; k < N_NEURONS; k++) {
          if (cur[k]! !== prev[k]!) changedCells.add(k)
        }
      }
      f.push({ tick: i, state: cur, changedCells })
    }
    setEndReason(r.endReason)
    return f
  }, [W, input])

  const playAnimation = useCallback(async () => {
    if (running) return
    const f = computeFrames()
    if (f.length === 0) return
    setFrames(f)
    setCurrentFrameIdx(0)
    setRunning(true)
    setStability(null)

    // animate frames with timer
    let i = 0
    const tick = () => {
      if (i >= f.length) {
        setRunning(false)
        // compute basin stability after animation completes
        const s = basinStability(W, input, { trials: 20 })
        setStability(s)
        return
      }
      setCurrentFrameIdx(i)
      i++
      animationTimerRef.current = setTimeout(tick, TICK_DURATION_MS)
    }
    tick()
  }, [running, computeFrames, W, input])

  const reset = useCallback(() => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current)
      animationTimerRef.current = null
    }
    setRunning(false)
    setFrames([])
    setCurrentFrameIdx(0)
    setEndReason(undefined)
    setStability(null)
  }, [])

  const stop = useCallback(() => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current)
      animationTimerRef.current = null
    }
    setRunning(false)
  }, [])

  // cleanup
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current)
    }
  }, [])

  // skip animation: jump to final
  const showFinal = useCallback(() => {
    const f = computeFrames()
    setFrames(f)
    setCurrentFrameIdx(f.length - 1)
    setRunning(false)
    const s = basinStability(W, input, { trials: 20 })
    setStability(s)
  }, [computeFrames, W, input])

  // nearest reference state details
  const nearestConceptDetails = useMemo(() => {
    if (!result?.concept) return null
    const c = concepts[result.concept.conceptId]
    if (!c) return null
    return c
  }, [result, concepts])

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-wide text-gold/90">
            Live Inference: {matrixLabel}
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            Watch Anna&apos;s 128 neurons update, tick by tick, until the
            scanner&apos;s stop rule fires.
          </p>
        </div>
      </div>

      <ExplainPanel
        defaultCollapsed
        kid={EXPLAIN_LIVE_INFERENCE.kid}
        math={EXPLAIN_LIVE_INFERENCE.math}
        researcher={EXPLAIN_LIVE_INFERENCE.researcher}
        simple={EXPLAIN_LIVE_INFERENCE.simple}
        title="What is one tick?"
      />

      {/* Input panel */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/60 font-mono">
            Input (64 bits)
          </span>
          <div className="flex items-center gap-1">
            <button
              className="text-xs px-2 py-1 border border-white/10 hover:bg-white/5 text-white/60 font-mono"
              disabled={running}
              onClick={setAllZeros}
              type="button"
            >
              all −1
            </button>
            <button
              className="text-xs px-2 py-1 border border-white/10 hover:bg-white/5 text-white/60 font-mono"
              disabled={running}
              onClick={setAllOnes}
              type="button"
            >
              all +1
            </button>
            <button
              className="text-xs px-2 py-1 border border-white/10 hover:bg-white/5 text-white/60 font-mono inline-flex items-center gap-1"
              disabled={running}
              onClick={setRandom}
              type="button"
            >
              <Shuffle className="w-3 h-3" />
              random
            </button>
          </div>
        </div>

        <div className="p-2 bg-black/30 border border-border">
          <BitToggleRow
            bits={input}
            cellSize="md"
            layout="4x16"
            onToggle={onToggleBit}
            readonly={running}
          />
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex items-center gap-2">
        {!running ? (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-gold/15 border border-gold/30 hover:bg-gold/25 text-gold font-medium text-sm"
            onClick={playAnimation}
            type="button"
          >
            <Play className="w-4 h-4" />
            Run AIT
          </button>
        ) : (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-400 font-medium text-sm"
            onClick={stop}
            type="button"
          >
            <Pause className="w-4 h-4" />
            Pause
          </button>
        )}
        <button
          className="flex items-center gap-2 px-3 py-2 border border-white/10 hover:bg-white/5 text-white/70 font-medium text-sm"
          disabled={running}
          onClick={showFinal}
          type="button"
        >
          <Zap className="w-4 h-4" />
          Skip to result
        </button>
        <button
          className="flex items-center gap-2 px-3 py-2 border border-white/10 hover:bg-white/5 text-white/70 font-medium text-sm"
          onClick={reset}
          type="button"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* State evolution */}
      {frames.length > 0 && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-black/30 border border-border"
          initial={{ opacity: 0, y: 10 }}
        >
          <StateVisualization
            currentFrame={currentFrameIdx}
            endReason={running ? undefined : endReason}
            frames={frames}
            highlightConcept={
              !running && result?.concept && nearestConceptDetails
                ? nearestConceptDetails.centroid
                : undefined
            }
          />
        </motion.div>
      )}

      {/* Result panel */}
      {result && !running && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 10 }}
        >
          <ResultStat
            label="Run length"
            sub={endReason || ''}
            tone={endReason === 'NO_OUTPUT_ZEROES' ? 'good' : 'neutral'}
            value={`${result.ticks} ticks`}
          />
          <ResultStat
            label="Distance to nearest reference state"
            sub={
              result.concept
                ? `reference state #${result.concept.conceptId} of ${concepts.length} from the earlier grouping, which was not confirmed`
                : 'no reference states loaded'
            }
            tone="accent"
            value={result.concept ? `${result.concept.distance}/64 bits` : '-'}
          />
          <ResultStat
            label="Output stability"
            sub="of single-bit input flips leave the output unchanged"
            tone={
              stability === null
                ? 'neutral'
                : stability >= 0.8
                  ? 'good'
                  : stability >= 0.4
                    ? 'neutral'
                    : 'warn'
            }
            value={
              stability === null ? '...' : `${(stability * 100).toFixed(0)}%`
            }
          />
          <div className="md:col-span-2 px-3 py-2 bg-black/30 border border-border">
            <div className="text-xs text-white/50 font-mono mb-1">
              Output (64 bits)
            </div>
            <BitToggleRow
              bits={result.output}
              cellSize="md"
              layout="4x16"
              readonly
            />
          </div>
        </motion.div>
      )}
    </div>
  )
}

interface ResultStatProps {
  label: string
  value: string
  sub: string
  tone: 'good' | 'neutral' | 'warn' | 'accent'
}

function ResultStat({ label, value, sub, tone }: ResultStatProps) {
  const toneClasses = {
    good: 'border-emerald-500/30 bg-emerald-500/[0.04] text-emerald-400/90',
    neutral: 'border-border bg-black/30 text-white/80',
    warn: 'border-amber-500/30 bg-amber-500/[0.04] text-amber-400/90',
    accent: 'border-gold/30 bg-gold/[0.04] text-gold',
  }[tone]
  return (
    <div className={cn('px-3 py-2 border', toneClasses)}>
      <div className="text-xs text-white/50 font-mono uppercase tracking-wide">
        {label}
      </div>
      <div className="text-base font-semibold">{value}</div>
      <div className="text-xs text-white/50 mt-0.5">{sub}</div>
    </div>
  )
}
