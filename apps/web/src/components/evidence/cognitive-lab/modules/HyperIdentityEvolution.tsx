'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { signWeights } from '@/lib/ait'
import { cn } from '@/lib/utils'
import { FitnessHistogram } from '../components/FitnessHistogram'
import { FitnessChart } from '../components/FitnessChart'
import { DistanceCurve } from '../components/DistanceCurve'
import { ExplainPanel } from '@/components/evidence/lab-primitives'
import { EXPLAIN_HYPERIDENTITY, EXPLAIN_BRAIN3D } from '../components/explainContent'
import type { GenerationSnapshot } from '../types'

// Three.js scene is heavy — lazy-load on first render
const AnnaBrain3D = dynamic(
  () => import('../components/AnnaBrain3D').then((m) => m.AnnaBrain3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full bg-[#020203] border border-white/[0.06] flex items-center justify-center" style={{ height: 560 }}>
        <span className="text-xs text-white/45 font-mono">loading Anna brain…</span>
      </div>
    ),
  },
)

export interface HyperIdentityEvolutionProps {
  annaMatrix: Int8Array
  annaBaseline: number
  /** Called whenever the worker emits a new best matrix (every 10 gens or final). */
  onBestUpdate?: (weights: Int8Array) => void
  className?: string
}

const POP_SIZE = 64
const MAX_GENS = 200

export function HyperIdentityEvolution({
  annaMatrix,
  annaBaseline,
  onBestUpdate,
  className,
}: HyperIdentityEvolutionProps) {
  const [running, setRunning] = useState(false)
  const [history, setHistory] = useState<GenerationSnapshot[]>([])
  const [distances, setDistances] = useState<{ generation: number; distance: number }[]>([])
  const [perMatrix, setPerMatrix] = useState<Float32Array | null>(null)
  const [evolvedBestLocal, setEvolvedBestLocal] = useState<Int8Array | null>(null)
  const [seed, setSeed] = useState(42)
  const workerRef = useRef<Worker | null>(null)

  const annaSign = useMemo(() => signWeights(annaMatrix), [annaMatrix])
  // Anna's antipodal antisymmetry (precomputed once for the EvolutionPlane reference cross)
  const annaAntipodal = useMemo(() => {
    const N = 128
    let match = 0
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (annaSign[r * N + c]! === -annaSign[(N - 1 - r) * N + (N - 1 - c)]!) match++
      }
    }
    return match / (N * N)
  }, [annaSign])

  useEffect(() => {
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (workerRef.current) workerRef.current.terminate()
    setHistory([])
    setDistances([])
    setPerMatrix(null)
    setEvolvedBestLocal(null)
    setRunning(true)

    const w = new Worker(new URL('../workers/evolution.worker.ts', import.meta.url), {
      type: 'module',
    })
    workerRef.current = w
    w.onmessage = (e: MessageEvent) => {
      const msg = e.data as
        | { type: 'generation'; snapshot: GenerationSnapshot; perMatrix: Float32Array; bestWeights?: Int8Array }
        | { type: 'complete'; history: GenerationSnapshot[]; bestWeights: Int8Array }
        | { type: 'error'; message: string }

      if (msg.type === 'generation') {
        setHistory((h) => [...h, msg.snapshot])
        setDistances((d) => [
          ...d,
          { generation: msg.snapshot.generation, distance: msg.snapshot.bestDistanceToAnna },
        ])
        setPerMatrix(msg.perMatrix)
        if (msg.bestWeights) {
          // Worker transfers Int8Array — copy to retain ownership across renders
          const copy = new Int8Array(msg.bestWeights)
          setEvolvedBestLocal(copy)
          if (onBestUpdate) onBestUpdate(copy)
        }
      } else if (msg.type === 'complete') {
        setRunning(false)
        const copy = new Int8Array(msg.bestWeights)
        setEvolvedBestLocal(copy)
        if (onBestUpdate) onBestUpdate(copy)
      } else if (msg.type === 'error') {
        console.error('[evolution worker] error:', msg.message)
        setRunning(false)
      }
    }
    w.postMessage({
      type: 'start',
      payload: {
        seed,
        popSize: POP_SIZE,
        generations: MAX_GENS,
        samplesPerScore: 16,
        mutationRate: 0.02,
        eliteFraction: 0.25,
        scoringMode: 'hyperidentity' as const,
        annaSign,
      },
    })
  }, [seed, annaSign, onBestUpdate])

  const stop = useCallback(() => {
    workerRef.current?.terminate()
    workerRef.current = null
    setRunning(false)
  }, [])

  const reset = useCallback(() => {
    stop()
    setHistory([])
    setDistances([])
    setPerMatrix(null)
    setEvolvedBestLocal(null)
  }, [stop])

  const lastSnap = history[history.length - 1]

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div>
        <h3 className="text-base font-semibold tracking-wide text-[#D4AF37]/90">
          HyperIdentity Evolution
        </h3>
        <p className="text-xs text-white/55 mt-0.5">
          {POP_SIZE} random matrices, top-25% selection, sign-flip mutation. Watch fitness rise across {MAX_GENS} generations. Anna&apos;s baseline (gold dashed line) is what visitors should compare against.
        </p>
      </div>

      <ExplainPanel
        kid={EXPLAIN_HYPERIDENTITY.kid}
        simple={EXPLAIN_HYPERIDENTITY.simple}
        researcher={EXPLAIN_HYPERIDENTITY.researcher}
        math={EXPLAIN_HYPERIDENTITY.math}
        title="What's happening in this evolution loop?"
      />

      <div className="flex items-center gap-2 flex-wrap">
        {!running ? (
          <button
            type="button"
            onClick={start}
            className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/15 border border-[#D4AF37]/30 hover:bg-[#D4AF37]/25 text-[#D4AF37] font-medium text-sm"
          >
            <Play className="w-4 h-4" />
            Run {MAX_GENS} generations
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-medium text-sm"
          >
            <Pause className="w-4 h-4" />
            Stop
          </button>
        )}
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 px-3 py-2 border border-white/10 hover:bg-white/5 text-white/70 text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
        <div className="ml-auto flex items-center gap-1 text-xs text-white/55">
          <span className="font-mono">seed</span>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value, 10) || 42)}
            disabled={running}
            className="w-16 px-2 py-1 bg-black/30 border border-white/10 text-white/85 font-mono text-xs"
          />
        </div>
      </div>

      {/* HERO: Anna's brain as living neural network — morphs to evolved matrix during runs */}
      <AnnaBrain3D
        annaMatrix={annaMatrix}
        evolvedMatrix={evolvedBestLocal}
        generation={lastSnap?.generation ?? 0}
        isEvolutionRunning={running}
      />

      <ExplainPanel
        kid={EXPLAIN_BRAIN3D.kid}
        simple={EXPLAIN_BRAIN3D.simple}
        researcher={EXPLAIN_BRAIN3D.researcher}
        math={EXPLAIN_BRAIN3D.math}
        title="What is the brain doing?"
        defaultCollapsed
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {lastSnap ? (
          <FitnessHistogram
            best={lastSnap.fitness.best}
            median={lastSnap.fitness.median}
            worst={lastSnap.fitness.worst}
            generation={lastSnap.generation}
            totalGenerations={MAX_GENS}
            annaBaseline={annaBaseline}
          />
        ) : (
          <div className="border border-white/[0.06] bg-[#0A0A0A] p-6 flex items-center justify-center text-xs text-white/45 italic h-[280px]">
            Click Run to start; population fitness distribution renders here.
          </div>
        )}
        <FitnessChart history={history} annaBaseline={annaBaseline} />
      </div>

      <DistanceCurve history={distances} />

      <div className="px-3 py-2 bg-black/30 border border-white/[0.06] text-xs text-white/65">
        {lastSnap ? (
          <>
            Generation {lastSnap.generation} / {MAX_GENS} ·{' '}
            best <span className="text-[#D4AF37] font-mono">{lastSnap.fitness.best.toFixed(4)}</span> ·
            median {lastSnap.fitness.median.toFixed(4)} ·
            distance to Anna {(lastSnap.bestDistanceToAnna * 100).toFixed(1)} %
            {!running && lastSnap.generation === MAX_GENS && (
              <span className="ml-2 text-emerald-400/80">✓ complete</span>
            )}
          </>
        ) : (
          <>
            Click <em>Run</em> to start evolution. Each generation: score 64 matrices on 16 random inputs, keep top 25 %, mutate to refill population. Browser worker handles compute off-thread; UI stays responsive.
          </>
        )}
      </div>
    </div>
  )
}
