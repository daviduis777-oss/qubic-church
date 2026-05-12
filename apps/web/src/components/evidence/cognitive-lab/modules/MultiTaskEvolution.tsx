'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Play } from 'lucide-react'
import { signWeights } from '@/lib/ait'
import { ParetoScatter } from '../components/ParetoScatter'
import { scoreMultiTask, MULTITASK_NAMES } from '../evolution/scoring'
import { mulberry32 } from '../evolution/rng'
import { packSignMatrix } from '../evolution/ait-fast'
import { cn } from '@/lib/utils'
import { ExplainPanel } from '@/components/evidence/lab-primitives'
import { EXPLAIN_MULTITASK } from '../components/explainContent'

export interface MultiTaskEvolutionProps {
  annaMatrix: Int8Array
  className?: string
}

export function MultiTaskEvolution({ annaMatrix, className }: MultiTaskEvolutionProps) {
  const [running, setRunning] = useState(false)
  const [fitnessVectors, setFitnessVectors] = useState<number[][]>([])
  const [annaVector, setAnnaVector] = useState<number[]>([])

  // Anna reference
  useEffect(() => {
    const annaPacked = packSignMatrix(signWeights(annaMatrix))
    const r = mulberry32(0xa55a)
    setAnnaVector(scoreMultiTask(annaPacked, 32, r))
  }, [annaMatrix])

  const runSample = useCallback(() => {
    setRunning(true)
    // Sample 32 random matrices on 6 tasks. Single-pass (no evolution loop here).
    // The full multi-task evolution-loop variant would use the worker — defer to v2.
    setTimeout(() => {
      const r = mulberry32(42)
      const N = 32
      const fitnesses: number[][] = []
      for (let i = 0; i < N; i++) {
        const w = new Int8Array(16384)
        for (let j = 0; j < 16384; j++) w[j] = r() < 0.5 ? -1 : 1
        fitnesses.push(scoreMultiTask(packSignMatrix(w), 8, r))
      }
      setFitnessVectors(fitnesses)
      setRunning(false)
    }, 0)
  }, [])

  const annaSummary = useMemo(() => {
    if (annaVector.length === 0) return ''
    return MULTITASK_NAMES.map((n, i) => `${n}=${annaVector[i]?.toFixed(3) ?? '0'}`).join(' · ')
  }, [annaVector])

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div>
        <h3 className="text-base font-semibold tracking-wide text-[#D4AF37]/90">
          Multi-Task Fitness Landscape
        </h3>
        <p className="text-xs text-white/55 mt-0.5">
          6 bit-pattern tasks: identity, MAX, AND, OR, parity, addition. Each random matrix is scored on all 6. Anna&apos;s profile is the gold cross. Pick any 2 axes to compare. Visitors check whether random matrices land near Anna&apos;s profile or differ across tasks.
        </p>
        <p className="text-[10px] text-white/40 font-mono mt-1">Anna profile: {annaSummary}</p>
      </div>

      <ExplainPanel
        kid={EXPLAIN_MULTITASK.kid}
        simple={EXPLAIN_MULTITASK.simple}
        researcher={EXPLAIN_MULTITASK.researcher}
        math={EXPLAIN_MULTITASK.math}
        title="What is the multi-task landscape?"
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={runSample}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/15 border border-[#D4AF37]/30 disabled:opacity-50 text-[#D4AF37] font-medium text-sm"
        >
          <Play className="w-4 h-4" />
          {running ? 'Sampling...' : 'Sample 32 random matrices'}
        </button>
      </div>

      <ParetoScatter fitnessVectors={fitnessVectors} annaVector={annaVector} />

      <div className="px-3 py-2 bg-black/20 border border-white/[0.06] text-xs text-white/65 leading-relaxed">
        Random matrices cluster around chance (0.5) on every axis. Anna sits slightly higher on most axes (because of sparse-output bias matching some tasks). Real specialization would show as <em>off-diagonal</em> dominance — visitor checks whether evolved matrices cluster around Anna or spread Pareto-style.
      </div>
    </div>
  )
}
