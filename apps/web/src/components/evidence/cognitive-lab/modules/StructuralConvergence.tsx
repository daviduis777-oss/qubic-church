'use client'

import { useMemo } from 'react'
import { signWeights } from '@/lib/ait'
import { computeFingerprint } from '../evolution/structural-metrics'
import { mulberry32 } from '../evolution/rng'
import { StructuralRadar } from '../components/StructuralRadar'
import { cn } from '@/lib/utils'
import { ExplainPanel } from '@/components/evidence/lab-primitives'
import { EXPLAIN_STRUCTURAL } from '../components/explainContent'

export interface StructuralConvergenceProps {
  annaMatrix: Int8Array
  evolvedBest: Int8Array | null
  className?: string
}

function generateRandomMatrix(seed: number): Int8Array {
  const r = mulberry32(seed)
  const w = new Int8Array(16384)
  for (let i = 0; i < 16384; i++) w[i] = r() < 0.5 ? -1 : 1
  return w
}

export function StructuralConvergence({
  annaMatrix,
  evolvedBest,
  className,
}: StructuralConvergenceProps) {
  const annaFP = useMemo(
    () => computeFingerprint(signWeights(annaMatrix), annaMatrix),
    [annaMatrix],
  )
  const evolvedFP = useMemo(
    () => evolvedBest ? computeFingerprint(signWeights(evolvedBest)) : null,
    [evolvedBest],
  )
  // Fixed random control (seed 0xabcdef, matching the test)
  const randomFP = useMemo(() => computeFingerprint(generateRandomMatrix(0xabcdef)), [])

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div>
        <h3 className="text-base font-semibold tracking-wide text-[#D4AF37]/90">
          Structural Convergence
        </h3>
        <p className="text-xs text-white/55 mt-0.5">
          7 Anna-properties measured on Anna (gold), the best-evolved matrix from <em>HyperIdentity Evolution</em> module (green, after running it), and a fresh random control (grey). Watch which axes the evolved matrix saturates and which stay at 0 %.
        </p>
      </div>

      <ExplainPanel
        kid={EXPLAIN_STRUCTURAL.kid}
        simple={EXPLAIN_STRUCTURAL.simple}
        researcher={EXPLAIN_STRUCTURAL.researcher}
        math={EXPLAIN_STRUCTURAL.math}
        title="What's the structural fingerprint?"
      />

      <StructuralRadar evolved={evolvedFP} anna={annaFP} random={randomFP} />

      <div className="px-3 py-3 bg-black/20 border border-white/[0.06] text-xs text-white/70 leading-relaxed space-y-2">
        <p>
          <strong className="text-[#D4AF37]">Five functional properties</strong> (antipodal antisymmetry, spectral dominance, period-32 row symmetry, kernel reconstruction, tick-1 sparsity) correlate with fitness on the HyperIdentity scoring task. Selection finds them — the evolved-radar (green) should fill these axes over generations.
        </p>
        <p>
          <strong className="text-rose-400">Two identity properties</strong> (K-e-y diagonal at exact positions [8,74][9,75][10,76], concept-count = 19) are position-specific design content. Random search has trillions of fitness-equivalent alternatives, so selection cannot recover them. The evolved-radar stays near 0 % on these axes.
        </p>
        <p className="text-white/50">
          Watching the evolved matrix saturate at ~5 / 7 functional axes IS the result. The 2 / 7 identity gap quantifies what CfB designed beyond what task pressure produces — that gap is Anna&apos;s irreducible design content.
        </p>
        {!evolvedBest && (
          <p className="text-amber-400/80 text-[11px] italic">
            Run the <em>HyperIdentity Evolution</em> module first; the evolved-best matrix populates here automatically.
          </p>
        )}
      </div>
    </div>
  )
}
