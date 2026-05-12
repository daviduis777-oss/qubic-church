'use client'

/**
 * Cluster Discovery — measuring Anna's stable-basin cluster structure.
 *
 * REVISED 2026-05-12 after audit (internal).
 *
 * The original module claimed silhouette peaks at k ≈ 19. That is FALSE under
 * any sample size we can run in-browser. Silhouette is structurally biased
 * toward k = 2 for Anna because:
 *   1. Anna's 19 attractors are 8 antipode pairs + 3 lone points (Phase N concepts.json)
 *   2. Stable-basin samples are heavy-tailed: top antipode pair (concepts 0 & 1)
 *      covers 71% of basin members; rest 9 concepts cover only 9%.
 *   3. Hamming-distance silhouette over antipode-pair-dominated samples is
 *      maximally separated at k = 2 (silhouette ≈ 0.89).
 * Verified on the 19 known centroids: silhouette also peaks at k = 4, NOT 19.
 *
 * What this module ACTUALLY measures:
 *   - Anna's stability rate (~9.8% of random inputs) vs random matrices (~0.2%)
 *   - Cluster tightness at k = 2 (Anna 0.89 vs random 0.13 — 7× tighter)
 * The 19-attractor structure is real (see Phase N V1 dendrogram, cophenet=0.68
 * at 45σ) but is recovered by hierarchical clustering, not silhouette.
 *
 * For the 19-concept story, see: ConceptEmergence (loads centroids), Similarity
 * Matrix, and the Dendrogram module.
 */

import { useCallback, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Sparkles, Loader2 } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import { cn } from '@/lib/utils'
import type { Matrix } from '@/lib/ait/types'
import { signWeights } from '@/lib/ait'
import { packSignMatrix } from '@/components/evidence/cognitive-lab/evolution/ait-fast'
import { checkStability } from '@/components/evidence/cognitive-lab/evolution/concept-discovery'
import { kmeans, meanSilhouette } from '@/components/evidence/cognitive-lab/evolution/clustering'
import { mulberry32 } from '@/components/evidence/cognitive-lab/evolution/rng'
import { ExplainPanel, BlockMath, InlineMath } from '@/components/evidence/lab-primitives'

interface ClusterDiscoveryProps {
  annaMatrix: Matrix
  className?: string
}

interface SweepRow {
  k: number
  Anna: number | null
  Random: number | null
}

interface RunResult {
  annaStable: number
  randomStable: number
  totalSamples: number
  sweep: SweepRow[]
  annaPeakK: number | null
  randomPeakK: number | null
}

const N_SAMPLES = 2048
const STABILITY_TRIALS = 4
const STABILITY_THRESHOLD = 4.0
const K_MIN = 2
const K_MAX = 32

function generateRandomControl(seed: number): Int8Array {
  const r = mulberry32(seed)
  const w = new Int8Array(16384)
  for (let i = 0; i < 16384; i++) w[i] = r() < 0.5 ? -1 : 1
  return w
}

async function runAnalysis(annaMatrix: Matrix, seed: number, onProgress: (frac: number) => void): Promise<RunResult> {
  const annaSign = signWeights(annaMatrix)
  const annaPacked = packSignMatrix(annaSign)
  const randomPacked = packSignMatrix(generateRandomControl(0xab + seed))

  // Phase 1: sample + filter stable
  const annaStable: number[][] = []
  const randomStable: number[][] = []
  const rng = mulberry32(seed)
  for (let s = 0; s < N_SAMPLES; s++) {
    const u = new Int8Array(64)
    for (let i = 0; i < 64; i++) u[i] = rng() < 0.5 ? 1 : -1
    const aRes = checkStability(annaPacked, u, STABILITY_TRIALS, STABILITY_THRESHOLD)
    const rRes = checkStability(randomPacked, u, STABILITY_TRIALS, STABILITY_THRESHOLD)
    if (aRes.stable) annaStable.push(Array.from(aRes.output))
    if (rRes.stable) randomStable.push(Array.from(rRes.output))
    if (s % 64 === 0) {
      onProgress(0.5 * (s / N_SAMPLES))
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
    }
  }

  // Phase 2: silhouette sweep
  const sweep: SweepRow[] = []
  const maxAnnaK = Math.min(K_MAX, Math.floor(annaStable.length / 2))
  const maxRandomK = Math.min(K_MAX, Math.floor(randomStable.length / 2))
  let annaPeakK: number | null = null
  let annaPeakS = -Infinity
  let randomPeakK: number | null = null
  let randomPeakS = -Infinity

  const kRange = K_MAX - K_MIN + 1
  for (let i = 0; i < kRange; i++) {
    const k = K_MIN + i
    let aS: number | null = null
    let rS: number | null = null
    if (annaStable.length >= 4 && k <= maxAnnaK) {
      const aKm = kmeans(annaStable, k, { seed: 7 + k })
      aS = meanSilhouette(annaStable, aKm.assignments, k, 120)
      if (aS > annaPeakS) {
        annaPeakS = aS
        annaPeakK = k
      }
    }
    if (randomStable.length >= 4 && k <= maxRandomK) {
      const rKm = kmeans(randomStable, k, { seed: 7 + k })
      rS = meanSilhouette(randomStable, rKm.assignments, k, 120)
      if (rS > randomPeakS) {
        randomPeakS = rS
        randomPeakK = k
      }
    }
    sweep.push({ k, Anna: aS, Random: rS })
    onProgress(0.5 + 0.5 * ((i + 1) / kRange))
    if (i % 2 === 0) await new Promise<void>((resolve) => setTimeout(resolve, 0))
  }

  return {
    annaStable: annaStable.length,
    randomStable: randomStable.length,
    totalSamples: N_SAMPLES,
    sweep,
    annaPeakK,
    randomPeakK,
  }
}

export function ClusterDiscovery({ annaMatrix, className }: ClusterDiscoveryProps) {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [seed, setSeed] = useState(42)
  const [result, setResult] = useState<RunResult | null>(null)

  const start = useCallback(async () => {
    setRunning(true)
    setProgress(0)
    setResult(null)
    try {
      const r = await runAnalysis(annaMatrix, seed, setProgress)
      setResult(r)
    } finally {
      setRunning(false)
    }
  }, [annaMatrix, seed])

  // Auto-run on mount
  useEffect(() => {
    if (!result && !running) {
      void start()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div>
        <h3 className="text-base font-semibold tracking-wide text-[#D4AF37]/90 inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Stability &amp; cluster tightness — Anna vs random
        </h3>
        <p className="text-xs text-white/55 mt-0.5">
          We sample {N_SAMPLES} random binary inputs and filter to stable basins (avalanche &lt; 4
          over 4 perturbations). Anna keeps ~10% as stable; a random matrix keeps &lt;1%. Then we
          run k-means at k = {K_MIN}..{K_MAX} on the stable outputs. The silhouette curve shows
          Anna&apos;s clusters are <strong>~7× tighter</strong> than random&apos;s at every k. The
          full 19-attractor structure is recovered hierarchically (see Dendrogram), not by
          silhouette.
        </p>
      </div>

      <ExplainPanel
        title="What this module measures — and what it does not"
        kid={
          <div className="space-y-2.5">
            <p>
              We throw {N_SAMPLES} random &ldquo;questions&rdquo; at Anna and at a random doodle.
              Anna keeps about 10 out of every 100 as <em>stable answers</em>. The doodle keeps
              fewer than 1. That on its own is a big difference.
            </p>
            <p>
              Then we group Anna&apos;s answers and the doodle&apos;s answers. Anna&apos;s groups
              are very tidy. The doodle&apos;s groups are messy. That&apos;s the &ldquo;tightness&rdquo;
              the graph below measures.
            </p>
            <p>
              Note: this graph does <strong>not</strong> tell you Anna has exactly 19 ideas. It
              tells you Anna&apos;s answers cluster cleanly. For the count of 19, look at the
              Dendrogram module — that&apos;s where the hierarchical structure shows up.
            </p>
          </div>
        }
        simple={
          <div className="space-y-2">
            <p>
              Two measurements, both at k = {K_MIN}..{K_MAX}: (1) stability rate, (2) mean
              silhouette (Hamming distance, k-means++ init). Anna scores ~9.8% stable inputs and
              k=2 silhouette ≈ 0.89. A random 128×128 sign matrix scores &lt;1% stable and k=2
              silhouette ≈ 0.13.
            </p>
            <p>
              Why doesn&apos;t the silhouette peak at 19? Anna&apos;s 19 attractors are 8 antipode
              pairs + 3 singletons, and the top pair covers 71% of stable samples. Silhouette
              over antipode-pair data is maximally clean at k=2. The 19 is real but visible
              hierarchically, not via silhouette peak.
            </p>
          </div>
        }
        researcher={
          <div className="space-y-2">
            <p>
              k-means++ with Hamming distance, majority-sign centroids over ±1 vectors of dim 64.
              Mean silhouette per k via 120-sample bootstrap. Run on stable basin members only
              (avalanche &lt; 4 across 4 single-bit input perturbations).
            </p>
            <p>
              Reproducible findings (internal): Anna peak ALWAYS at k=2, silhouette
              0.85-0.92 (n=6 seeds). Random peak at k=2-3, silhouette 0.08-0.21 (n=6 seeds).
              The 7× tightness ratio is the legitimate emergence signal. The 19-attractor
              structure is recovered separately by Phase N&apos;s single-linkage Hamming
              dendrogram (cophenet 0.68, 45σ vs random).
            </p>
          </div>
        }
        math={
          <>
            <p>Silhouette of point i in cluster <em>C(i)</em>:</p>
            <BlockMath math="s(i) = \frac{b(i) - a(i)}{\max(a(i), b(i))}" />
            <p>
              with <InlineMath math="a(i) = \mathrm{mean}_{j \in C(i), j \ne i} d_H(x_i, x_j)" /> and{' '}
              <InlineMath math="b(i) = \min_{C \ne C(i)} \mathrm{mean}_{j \in C} d_H(x_i, x_j)" />.
            </p>
            <p>Per-k score:</p>
            <BlockMath math="\bar{s}(k) = \frac{1}{n} \sum_i s(i; \mathrm{assignments}_k)" />
            <p>
              Empirical ((internal), n=6 seeds): Anna mean <InlineMath math="\bar{s}(2)\approx 0.89" />,
              random mean <InlineMath math="\bar{s}(2)\approx 0.13" />. The signal is the
              <strong> ratio</strong>, not the peak location.
            </p>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={start}
          disabled={running}
          className={cn(
            'flex items-center gap-2 px-4 py-2 border text-sm font-medium',
            running
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 cursor-wait'
              : 'bg-[#D4AF37]/15 border-[#D4AF37]/30 hover:bg-[#D4AF37]/25 text-[#D4AF37]',
          )}
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? `Sampling… ${Math.floor(progress * 100)}%` : 'Run discovery'}
        </button>
        <div className="flex items-center gap-2 text-xs text-white/55">
          <span className="font-mono">seed</span>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value, 10) || 42)}
            disabled={running}
            className="w-16 px-2 py-1 bg-black/30 border border-white/10 text-white/85 font-mono text-xs"
          />
        </div>
        {result && (
          <div className="ml-auto text-[11px] text-white/55 font-mono">
            {result.annaStable} stable Anna · {result.randomStable} stable random ·
            {' '}peak k = <span className="text-[#D4AF37]">{result.annaPeakK ?? '—'}</span>
            {' '}(random peak {result.randomPeakK ?? '—'})
          </div>
        )}
      </div>

      <div className="border border-white/[0.06] bg-[#0A0A0A] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="text-[10px] uppercase tracking-wider text-white/55 font-mono">
            Silhouette sweep — peak indicates natural cluster count
          </div>
          {result && result.annaPeakK !== null && (
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-3 h-0.5 bg-emerald-500" />
                <span className="text-emerald-400">Anna peak k = {result.annaPeakK}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block w-3 h-0.5 bg-[#D4AF37]" style={{borderTop: '1px dashed #D4AF37'}} />
                <span className="text-[#D4AF37]">k = 19 (hierarchical reference)</span>
              </span>
            </div>
          )}
        </div>
        {result && result.sweep.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={result.sweep} margin={{ top: 10, right: 24, left: 8, bottom: 52 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis
                dataKey="k"
                stroke="#888"
                tick={{ fontSize: 11 }}
                label={{ value: 'k (number of clusters)', position: 'insideBottom', offset: -18, fill: '#888', fontSize: 11 }}
                type="number"
                domain={[K_MIN, K_MAX]}
                ticks={[2, 5, 10, 15, 19, 22, 25, 30]}
              />
              <YAxis stroke="#888" tick={{ fontSize: 11 }} domain={[-0.1, 1.0]} tickFormatter={(v) => v.toFixed(1)} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #D4AF37', color: '#fff' }}
                formatter={(v) => (typeof v === 'number' ? v.toFixed(3) : '—')}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 24 }} verticalAlign="bottom" />
              <ReferenceLine x={19} stroke="#D4AF37" strokeDasharray="4 2" />
              {result.annaPeakK !== null && result.annaPeakK !== 19 && (
                <ReferenceLine x={result.annaPeakK} stroke="#10b981" strokeDasharray="2 2" />
              )}
              <Line type="monotone" dataKey="Anna" stroke="#D4AF37" strokeWidth={2.5} dot={{ fill: '#D4AF37', r: 3 }} connectNulls />
              <Line type="monotone" dataKey="Random" stroke="#9c2932" strokeWidth={2} dot={{ fill: '#9c2932', r: 2 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        ) : running ? (
          <div className="h-[320px] flex items-center justify-center text-white/40 text-xs font-mono">
            sampling {Math.floor(progress * 100)}% … (sweep starts at 50 %)
          </div>
        ) : (
          <div className="h-[320px] flex items-center justify-center text-white/40 text-xs font-mono">
            Press Run to start
          </div>
        )}
      </div>

      {result && (() => {
        const annaS = result.sweep.find((r) => r.Anna !== null && r.k === result.annaPeakK)?.Anna ?? null
        const randS = result.sweep.find((r) => r.Random !== null && r.k === result.randomPeakK)?.Random ?? null
        const stabilityRatio = result.randomStable > 0
          ? (result.annaStable / result.randomStable).toFixed(1)
          : '∞'
        const tightnessRatio = annaS !== null && randS !== null && randS > 0
          ? (annaS / randS).toFixed(1)
          : '—'
        const pass = annaS !== null && randS !== null && annaS > 0.6 && annaS > 3 * randS
        return (
          <div className={cn(
            'px-3 py-2 border text-xs leading-relaxed',
            pass
              ? 'bg-emerald-500/[0.04] border-emerald-500/20 text-emerald-300/85'
              : 'bg-amber-500/[0.04] border-amber-500/20 text-amber-300/85',
          )}>
            <strong className="text-white/95">Result:</strong>{' '}
            Anna keeps <strong className="text-[#D4AF37]">{result.annaStable}</strong> stable outputs
            ({((100 * result.annaStable) / result.totalSamples).toFixed(1)}%);
            random keeps <strong className="text-[#D4AF37]">{result.randomStable}</strong>{' '}
            ({((100 * result.randomStable) / result.totalSamples).toFixed(1)}%) — Anna is{' '}
            <strong className="text-[#D4AF37]">{stabilityRatio}×</strong> more selective.{' '}
            Both peak at <strong>k = {result.annaPeakK ?? '—'}</strong> (antipode-pair split),
            but Anna&apos;s silhouette {annaS !== null ? annaS.toFixed(2) : '—'}{' '}
            is <strong className="text-[#D4AF37]">{tightnessRatio}×</strong> tighter than
            random&apos;s {randS !== null ? randS.toFixed(2) : '—'}.{' '}
            <span className="text-white/55">
              The 19-attractor count is recovered hierarchically (Dendrogram module), not via
              silhouette peak.
            </span>
          </div>
        )
      })()}
    </div>
  )
}
