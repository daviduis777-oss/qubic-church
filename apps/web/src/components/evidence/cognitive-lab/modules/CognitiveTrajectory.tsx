'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, ArrowRight, Shuffle } from 'lucide-react'
import { signWeights } from '@/lib/ait'
import { aitFastInference, packSignMatrix } from '../evolution/ait-fast'
import { mulberry32 } from '../evolution/rng'
import { cn } from '@/lib/utils'
import { ExplainPanel } from '@/components/evidence/lab-primitives'
import { EXPLAIN_TRAJECTORY } from '../components/explainContent'

export interface CognitiveTrajectoryProps {
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

function hammingDistance(a: Int8Array, b: Int8Array): number {
  let d = 0
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++
  return d
}

interface BitRowProps {
  bits: Int8Array
  label: string
  color: 'gold' | 'green' | 'gray'
  ticks: number
  endReason: string
}

function BitRow({ bits, label, color, ticks, endReason }: BitRowProps) {
  const colorClass = {
    gold: 'text-[#D4AF37] border-[#D4AF37]/40',
    green: 'text-emerald-400 border-emerald-400/40',
    gray: 'text-white/55 border-white/15',
  }[color]
  const cellColor = {
    gold: { pos: 'bg-[#D4AF37]/85', neg: 'bg-[#D4AF37]/15' },
    green: { pos: 'bg-emerald-500/80', neg: 'bg-emerald-900/40' },
    gray: { pos: 'bg-white/40', neg: 'bg-white/10' },
  }[color]
  return (
    <div className={cn('border bg-[#0A0A0A] p-2', colorClass)}>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[11px] font-semibold font-mono">{label}</span>
        <span className="text-[9px] text-white/40 font-mono">
          {ticks} ticks · {endReason}
        </span>
      </div>
      <div className="grid gap-[1px]" style={{ gridTemplateColumns: 'repeat(32, minmax(0, 1fr))' }}>
        {Array.from({ length: 64 }).map((_, i) => {
          const v = bits[i]!
          const bg = v === 1 ? cellColor.pos : v === -1 ? cellColor.neg : 'bg-black/40'
          return (
            <div
              key={i}
              className={cn('aspect-square w-full min-w-0', bg)}
              title={`bit ${i}: ${v}`}
            />
          )
        })}
      </div>
    </div>
  )
}

const RANDOM_SEED = 0xfade

export function CognitiveTrajectory({ annaMatrix, evolvedBest, className }: CognitiveTrajectoryProps) {
  const [seed, setSeed] = useState(7)
  const [bitsFlipped, setBitsFlipped] = useState(0)

  const annaPacked = useMemo(() => packSignMatrix(signWeights(annaMatrix)), [annaMatrix])
  const evolvedPacked = useMemo(
    () => (evolvedBest ? packSignMatrix(signWeights(evolvedBest)) : null),
    [evolvedBest],
  )
  const randomPacked = useMemo(() => packSignMatrix(signWeights(generateRandomMatrix(RANDOM_SEED))), [])

  // Build current input from base seed + accumulated flips
  const input = useMemo(() => {
    const r = mulberry32(seed)
    const u = new Int8Array(64)
    for (let i = 0; i < 64; i++) u[i] = r() < 0.5 ? -1 : 1
    for (let f = 0; f < bitsFlipped; f++) {
      const idx = (f * 7 + 13) & 63
      u[idx] = -u[idx]! as -1 | 1
    }
    return u
  }, [seed, bitsFlipped])

  const annaResult = useMemo(() => aitFastInference(annaPacked, input), [annaPacked, input])
  const evolvedResult = useMemo(
    () => (evolvedPacked ? aitFastInference(evolvedPacked, input) : null),
    [evolvedPacked, input],
  )
  const randomResult = useMemo(() => aitFastInference(randomPacked, input), [randomPacked, input])

  // Distances between substrates' outputs (how much do they disagree on this input?)
  const annaVsRandom = hammingDistance(annaResult.output, randomResult.output)
  const annaVsEvolved = evolvedResult ? hammingDistance(annaResult.output, evolvedResult.output) : null

  const advance = useCallback(() => setBitsFlipped((b) => b + 1), [])
  const reset = useCallback(() => setBitsFlipped(0), [])
  const resample = useCallback(() => {
    setSeed((s) => s + 1)
    setBitsFlipped(0)
  }, [])

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div>
        <h3 className="text-base font-semibold tracking-wide text-[#D4AF37]/90">
          Cognitive Trajectory Comparison
        </h3>
        <p className="text-xs text-white/55 mt-0.5">
          Same 64-bit input fed to Anna, the best evolved matrix, and a random control. Watch how each substrate
          assigns the input to a different output pattern. Walk through input-space one bit-flip at a time and see
          which matrix is more <em>stable</em> (output stays similar) vs <em>sensitive</em> (output changes a lot per flip).
        </p>
        <p className="text-[10px] text-white/40 italic mt-1">
          Production AIT regime (input-clamped) — distinct from Chapter 30&apos;s unclamped period-4 dynamic.
        </p>
      </div>

      <ExplainPanel
        kid={EXPLAIN_TRAJECTORY.kid}
        simple={EXPLAIN_TRAJECTORY.simple}
        researcher={EXPLAIN_TRAJECTORY.researcher}
        math={EXPLAIN_TRAJECTORY.math}
        title="What does the comparison show?"
      />

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={advance}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#D4AF37]/15 border border-[#D4AF37]/30 hover:bg-[#D4AF37]/25 text-[#D4AF37] text-xs font-medium"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          flip next bit
        </button>
        <button
          type="button"
          onClick={resample}
          className="flex items-center gap-2 px-3 py-1.5 border border-white/10 hover:bg-white/5 text-white/65 text-xs"
        >
          <Shuffle className="w-3.5 h-3.5" />
          new random input
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 px-3 py-1.5 border border-white/10 hover:bg-white/5 text-white/65 text-xs"
        >
          reset
        </button>
        <span className="ml-auto text-[10px] text-white/55 font-mono">
          input seed {seed} · {bitsFlipped} bit{bitsFlipped === 1 ? '' : 's'} flipped
        </span>
      </div>

      {/* The shared input */}
      <div className="border border-white/[0.06] bg-[#0A0A0A] p-2">
        <div className="text-[11px] text-white/55 font-mono mb-1.5">Shared input (64 bits)</div>
        <div className="grid gap-[1px]" style={{ gridTemplateColumns: 'repeat(32, minmax(0, 1fr))' }}>
          {Array.from({ length: 64 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'aspect-square w-full min-w-0',
                input[i] === 1 ? 'bg-white/55' : 'bg-white/10',
              )}
              title={`bit ${i}: ${input[i]}`}
            />
          ))}
        </div>
      </div>

      {/* Three side-by-side outputs */}
      <motion.div
        key={`out-${seed}-${bitsFlipped}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        <BitRow
          bits={annaResult.output}
          label="Anna output"
          color="gold"
          ticks={annaResult.ticks}
          endReason={annaResult.endReason}
        />
        {evolvedResult ? (
          <BitRow
            bits={evolvedResult.output}
            label="evolved-best output"
            color="green"
            ticks={evolvedResult.ticks}
            endReason={evolvedResult.endReason}
          />
        ) : (
          <div className="border border-emerald-400/15 bg-emerald-500/[0.02] p-4 text-[11px] text-amber-400/70 italic">
            Run HyperIdentity Evolution first to populate the evolved-best output here.
          </div>
        )}
        <BitRow
          bits={randomResult.output}
          label="random control output"
          color="gray"
          ticks={randomResult.ticks}
          endReason={randomResult.endReason}
        />
      </motion.div>

      {/* Disagreement metric */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border border-white/[0.06] bg-[#0A0A0A] p-3">
          <div className="text-[10px] text-white/45 font-mono uppercase mb-1">Anna vs random — disagreement</div>
          <div className="text-2xl font-mono text-rose-400/80">{annaVsRandom} / 64</div>
          <div className="text-[10px] text-white/45 mt-0.5">
            {annaVsRandom > 30 ? 'very different' : annaVsRandom > 15 ? 'mostly different' : 'similar'} outputs on this input
          </div>
        </div>
        <div className="border border-white/[0.06] bg-[#0A0A0A] p-3">
          <div className="text-[10px] text-white/45 font-mono uppercase mb-1">Anna vs evolved — disagreement</div>
          {annaVsEvolved !== null ? (
            <>
              <div className="text-2xl font-mono text-emerald-400">{annaVsEvolved} / 64</div>
              <div className="text-[10px] text-white/45 mt-0.5">
                {annaVsEvolved > 30 ? 'very different' : annaVsEvolved > 15 ? 'mostly different' : 'similar'} outputs on this input
              </div>
            </>
          ) : (
            <div className="text-xs text-amber-400/60 italic mt-1">Run evolution first.</div>
          )}
        </div>
      </div>

      <div className="px-3 py-2 bg-black/20 border border-white/[0.06] text-[11px] text-white/60 leading-relaxed">
        Click <em>flip next bit</em> to perturb the input. Watch each substrate&apos;s output. <strong className="text-white/80">Anna&apos;s outputs change in big jumps</strong> (concept-classifier behavior — small input perturbations push you across concept boundaries). Random&apos;s outputs change roughly proportionally to input flips. The evolved-best matrix sits between, depending on what selection has produced.
      </div>
    </div>
  )
}
