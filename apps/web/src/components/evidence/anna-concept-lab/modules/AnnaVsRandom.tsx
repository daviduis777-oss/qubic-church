'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Shuffle, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

import {
  aitInference,
  signWeights,
  nearestConcept,
  N_INPUTS,
} from '@/lib/ait'
import type { Matrix } from '@/lib/ait/types'
import type { Concept, ConceptNamingMap } from '../types'
import { BitToggleRow } from '../components/BitToggleRow'
import { ExplainPanel } from '@/components/evidence/lab-primitives'
import { EXPLAIN_ANNA_VS_RANDOM } from '../components/explainContent'

/**
 * Module 2 — Anna vs Random side-by-side comparison.
 *
 * Same input → both classifiers → distance to nearest concept on each side.
 * Demonstrates that random matrices have NO concept structure.
 */
export interface AnnaVsRandomProps {
  annaMatrix: Matrix
  annaConcepts: Concept[]
  namingMap?: ConceptNamingMap
  randomMatrix: Matrix
  randomConcepts: Concept[]
  randomLabel?: string
  className?: string
}

export function AnnaVsRandom({
  annaMatrix,
  annaConcepts,
  namingMap,
  randomMatrix,
  randomConcepts,
  randomLabel = 'Random_int8 (seed 42)',
  className,
}: AnnaVsRandomProps) {
  const W_anna = useMemo(() => signWeights(annaMatrix), [annaMatrix])
  const W_random = useMemo(() => signWeights(randomMatrix), [randomMatrix])

  const [input, setInput] = useState<Int8Array>(() => {
    const a = new Int8Array(N_INPUTS)
    for (let i = 0; i < N_INPUTS; i++) a[i] = Math.random() < 0.5 ? -1 : 1
    return a
  })

  const [batchStats, setBatchStats] = useState<{ anna: number[]; random: number[] } | null>(null)
  const [batchRunning, setBatchRunning] = useState(false)

  const onToggleBit = useCallback((idx: number) => {
    setInput((prev) => {
      const next = new Int8Array(prev)
      next[idx] = (next[idx] === 1 ? -1 : 1) as -1 | 1
      return next
    })
  }, [])

  const setRandom = useCallback(() => {
    const a = new Int8Array(N_INPUTS)
    for (let i = 0; i < N_INPUTS; i++) a[i] = Math.random() < 0.5 ? -1 : 1
    setInput(a)
  }, [])

  // Run both inferences on current input
  const result = useMemo(() => {
    const annaResult = aitInference(W_anna, input)
    const randomResult = aitInference(W_random, input)

    const annaConceptCentroids = annaConcepts.map((c) => c.centroid)
    const randomConceptCentroids = randomConcepts.map((c) => c.centroid)

    const annaNearest = annaConcepts.length > 0
      ? nearestConcept(annaResult.output, annaConceptCentroids)
      : null
    const randomNearest = randomConcepts.length > 0
      ? nearestConcept(randomResult.output, randomConceptCentroids)
      : null

    return {
      anna: {
        output: annaResult.output,
        ticks: annaResult.ticks,
        endReason: annaResult.endReason,
        concept: annaNearest,
      },
      random: {
        output: randomResult.output,
        ticks: randomResult.ticks,
        endReason: randomResult.endReason,
        concept: randomNearest,
      },
    }
  }, [W_anna, W_random, input, annaConcepts, randomConcepts])

  // Run a batch of N inputs through both, gather distance distribution
  const runBatchTest = useCallback(async () => {
    setBatchRunning(true)
    const N = 100
    const annaDists: number[] = []
    const randomDists: number[] = []

    // yield to UI between iterations
    for (let n = 0; n < N; n++) {
      const inp = new Int8Array(N_INPUTS)
      for (let i = 0; i < N_INPUTS; i++) inp[i] = Math.random() < 0.5 ? -1 : 1

      const aR = aitInference(W_anna, inp)
      const rR = aitInference(W_random, inp)
      const aN = annaConcepts.length > 0 ? nearestConcept(aR.output, annaConcepts.map((c) => c.centroid)) : null
      const rN = randomConcepts.length > 0 ? nearestConcept(rR.output, randomConcepts.map((c) => c.centroid)) : null

      if (aN) annaDists.push(aN.distance)
      if (rN) randomDists.push(rN.distance)

      if (n % 20 === 0) {
        await new Promise((r) => setTimeout(r, 0))
      }
    }
    setBatchStats({ anna: annaDists, random: randomDists })
    setBatchRunning(false)
  }, [W_anna, W_random, annaConcepts, randomConcepts])

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold tracking-wide text-[#D4AF37]/90">
          Anna vs Random — same algorithm, different worlds
        </h3>
        <p className="text-xs text-white/50 mt-0.5">
          Same 64-bit input, two matrices, one algorithm. Anna lands on a concept; random doesn&apos;t.
        </p>
      </div>

      <ExplainPanel
        kid={EXPLAIN_ANNA_VS_RANDOM.kid}
        simple={EXPLAIN_ANNA_VS_RANDOM.simple}
        researcher={EXPLAIN_ANNA_VS_RANDOM.researcher}
        math={EXPLAIN_ANNA_VS_RANDOM.math}
        title="What's the difference, exactly?"
        defaultCollapsed
      />

      {/* Shared input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/60 font-mono">Shared input (64 bits)</span>
          <button
            type="button"
            onClick={setRandom}
            className="text-[10px] px-2 py-1 border border-white/10 hover:bg-white/5 text-white/60 font-mono inline-flex items-center gap-1"
          >
            <Shuffle className="w-3 h-3" />
            random
          </button>
        </div>
        <div className="p-2 bg-black/30 border border-white/[0.06]">
          <BitToggleRow
            bits={input}
            onToggle={onToggleBit}
            layout="4x16"
            cellSize="md"
          />
        </div>
      </div>

      {/* Side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SidePanel
          label="Anna"
          subtitle="The 128×128 designed matrix — runs as concept classifier"
          accentColor="emerald"
          output={result.anna.output}
          ticks={result.anna.ticks}
          endReason={result.anna.endReason}
          concept={result.anna.concept}
          conceptDetails={result.anna.concept ? (annaConcepts[result.anna.concept.conceptId] ?? null) : null}
          conceptDisplay={
            result.anna.concept
              ? namingMap?.get(result.anna.concept.conceptId)?.display ?? null
              : null
          }
        />
        <SidePanel
          label={randomLabel}
          subtitle="Random ternary matrix, same shape — no concept structure"
          accentColor="rose"
          output={result.random.output}
          ticks={result.random.ticks}
          endReason={result.random.endReason}
          concept={result.random.concept}
          conceptDetails={result.random.concept ? (randomConcepts[result.random.concept.conceptId] ?? null) : null}
          conceptDisplay={null}
        />
      </div>

      {/* Batch comparison */}
      <div className="p-3 bg-black/30 border border-white/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/70 font-mono">Statistical comparison (100 random inputs)</span>
          <button
            type="button"
            onClick={runBatchTest}
            disabled={batchRunning}
            className="text-[10px] px-2 py-1 border border-[#D4AF37]/30 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] font-mono inline-flex items-center gap-1 disabled:opacity-50"
          >
            <Play className="w-3 h-3" />
            {batchRunning ? 'Running...' : 'Run 100 random inputs'}
          </button>
        </div>

        {batchStats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <BatchStat
              label="Anna mean distance"
              value={`${(batchStats.anna.reduce((a, b) => a + b, 0) / batchStats.anna.length).toFixed(1)}/64`}
              sub={`${(100 * batchStats.anna.filter((d) => d <= 10).length / batchStats.anna.length).toFixed(0)}% within 10 bits of a concept`}
              tone="good"
            />
            <BatchStat
              label="Random mean distance"
              value={`${(batchStats.random.reduce((a, b) => a + b, 0) / batchStats.random.length).toFixed(1)}/64`}
              sub={`${(100 * batchStats.random.filter((d) => d <= 10).length / batchStats.random.length).toFixed(0)}% within 10 bits`}
              tone="warn"
            />
            <BatchStat
              label="Anna advantage"
              value={`${((batchStats.random.reduce((a, b) => a + b, 0) / batchStats.random.length) - (batchStats.anna.reduce((a, b) => a + b, 0) / batchStats.anna.length)).toFixed(1)} bits closer`}
              sub="Anna's deterministic concept structure"
              tone="accent"
            />
          </div>
        ) : (
          <div className="text-xs text-white/50 italic">
            Click <em>Run 100 random inputs</em> — Anna lands a mean Hamming ~11/64 from the nearest concept; random lands ~22/64 (no structure).
          </div>
        )}
      </div>
    </div>
  )
}

interface SidePanelProps {
  label: string
  subtitle: string
  accentColor: 'emerald' | 'rose'
  output: Int8Array
  ticks: number
  endReason: string
  concept: { conceptId: number; distance: number } | null
  conceptDetails: Concept | null
  /** Human-readable concept name (e.g. "Pair A+"). Null = use numerical id. */
  conceptDisplay: string | null
}

function SidePanel({
  label,
  subtitle,
  accentColor,
  output,
  ticks,
  endReason,
  concept,
  conceptDetails,
  conceptDisplay,
}: SidePanelProps) {
  const accentClasses = {
    emerald: 'border-emerald-500/30 bg-emerald-500/[0.04]',
    rose: 'border-rose-500/30 bg-rose-500/[0.04]',
  }[accentColor]
  const headingColor = {
    emerald: 'text-emerald-400',
    rose: 'text-rose-400',
  }[accentColor]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('p-3 border', accentClasses)}
    >
      <div className="mb-3">
        <div className={cn('text-sm font-semibold', headingColor)}>{label}</div>
        <div className="text-[10px] text-white/40">{subtitle}</div>
      </div>

      <div className="text-[10px] text-white/50 font-mono mb-1">Output (64 bits)</div>
      <BitToggleRow bits={output} readonly layout="4x16" cellSize="md" className="mb-3" />

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-[10px] text-white/40">ticks</div>
          <div className="text-white/80">{ticks} <span className="text-[10px] text-white/40">{endReason}</span></div>
        </div>
        <div>
          <div className="text-[10px] text-white/40">nearest concept</div>
          <div className="text-white/80">
            {concept ? (conceptDisplay ?? `#${concept.conceptId}`) : '—'}
            {conceptDetails && (
              <span className="text-[10px] text-white/40 ml-1">
                (#{concept!.conceptId} · size {conceptDetails.clusterSize})
              </span>
            )}
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-[10px] text-white/40">distance to centroid</div>
          <div className={cn(
            'font-semibold',
            concept && concept.distance <= 8 ? 'text-emerald-400/90' :
            concept && concept.distance <= 16 ? 'text-amber-400/90' :
            'text-rose-400/90',
          )}>
            {concept ? `${concept.distance}/64 (${(100 * concept.distance / 64).toFixed(0)}%)` : '—'}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

interface BatchStatProps {
  label: string
  value: string
  sub: string
  tone: 'good' | 'warn' | 'accent'
}

function BatchStat({ label, value, sub, tone }: BatchStatProps) {
  const toneClasses = {
    good: 'border-emerald-500/30 text-emerald-400/90',
    warn: 'border-rose-500/30 text-rose-400/90',
    accent: 'border-[#D4AF37]/30 text-[#D4AF37]',
  }[tone]
  return (
    <div className={cn('px-3 py-2 border bg-black/30', toneClasses)}>
      <div className="text-[10px] text-white/50 font-mono uppercase">{label}</div>
      <div className="text-base font-semibold mt-0.5">{value}</div>
      <div className="text-[10px] text-white/50 mt-0.5">{sub}</div>
    </div>
  )
}
