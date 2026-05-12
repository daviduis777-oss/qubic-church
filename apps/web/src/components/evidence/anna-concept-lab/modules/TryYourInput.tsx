'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Hash, AlertCircle, Lightbulb } from 'lucide-react'
import { sha256 } from '@noble/hashes/sha2.js'
import { cn } from '@/lib/utils'

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
import { ExplainPanel } from '@/components/evidence/lab-primitives'
import { EXPLAIN_TRY_YOUR_INPUT } from '../components/explainContent'

/**
 * Module 3 — Try Your Input.
 *
 * Free-form text → SHA-256 → first 8 bytes → 64-bit ±1 → Anna AIT → concept.
 * Most accessible module: anyone can paste any text and see Anna classify it.
 */
export interface TryYourInputProps {
  matrix: Matrix
  concepts: Concept[]
  namingMap?: ConceptNamingMap
  className?: string
}

const SUGGESTED_INPUTS = [
  'hello world',
  'Anna',
  'Anna 0',
  'CfB',
  'Aigarth',
  'Bitcoin',
  'Qubic',
  'I am here',
]

function textToBitVector(text: string): { bytes: Uint8Array; bits: Int8Array } {
  const data = new TextEncoder().encode(text)
  const hash = sha256(data) // 32 bytes
  const first8 = hash.slice(0, 8)
  const bits = new Int8Array(N_INPUTS)
  for (let byte = 0; byte < 8; byte++) {
    const b = first8[byte]!
    for (let bit = 0; bit < 8; bit++) {
      const isSet = (b >> (7 - bit)) & 1
      bits[byte * 8 + bit] = isSet === 1 ? 1 : -1
    }
  }
  return { bytes: first8, bits }
}

function bytesToHex(b: Uint8Array): string {
  return Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('')
}

export function TryYourInput({ matrix, concepts, namingMap, className }: TryYourInputProps) {
  const W = useMemo(() => signWeights(matrix), [matrix])
  const [text, setText] = useState('hello world')

  const { bytes, bits } = useMemo(() => textToBitVector(text), [text])

  // Centroids are derived once per concepts identity (not per keystroke)
  const conceptCentroids = useMemo(
    () => concepts.map((c) => c.centroid),
    [concepts],
  )

  // Cheap synchronous compute on every keystroke: AIT inference + nearest concept (~1ms)
  const fastResult = useMemo(() => {
    const r = aitInference(W, bits)
    const concept = conceptCentroids.length > 0 ? nearestConcept(r.output, conceptCentroids) : null
    const conceptDetails = concept ? concepts[concept.conceptId] ?? null : null
    return { result: r, concept, conceptDetails }
  }, [W, bits, conceptCentroids, concepts])

  // Expensive: basinStability runs 20 inferences per call. Debounce so fast typing
  // doesn't queue 20 evaluations per keystroke.
  const [stability, setStability] = useState<number | null>(null)
  const stabilityTimer = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (stabilityTimer.current) clearTimeout(stabilityTimer.current)
    setStability(null)
    stabilityTimer.current = setTimeout(() => {
      const s = basinStability(W, bits, { trials: 12 })
      setStability(s)
    }, 200)
    return () => {
      if (stabilityTimer.current) clearTimeout(stabilityTimer.current)
    }
  }, [W, bits])

  const result = useMemo(
    () => ({
      result: fastResult.result,
      concept: fastResult.concept,
      conceptDetails: fastResult.conceptDetails,
      stability: stability ?? 0,
      stabilityKnown: stability !== null,
    }),
    [fastResult, stability],
  )

  const interpretation = useMemo(() => {
    if (!result.concept || !result.conceptDetails) {
      return { primary: 'No concept assignment available', tone: 'neutral' as const }
    }
    const d = result.concept.distance
    const c = result.conceptDetails
    const name = namingMap?.get(c.conceptId)
    const display = name?.display ?? `Concept #${c.conceptId}`
    const partnerNote = name?.isAntipodal ? `, antipode of ${name.partnerLabel}` : ''
    const sizeNote = `cluster ${c.clusterSize}${partnerNote}`

    if (d === 0) {
      return {
        primary: `Your input lands EXACTLY on the ${display} centroid (${sizeNote}).`,
        tone: 'good' as const,
      }
    }
    if (d <= 4) {
      return {
        primary: `Your input is in the stable basin of ${display} (only ${d} bits from centroid; ${sizeNote}).`,
        tone: 'good' as const,
      }
    }
    if (d <= 12) {
      return {
        primary: `Your input is near ${display} (${d}/64 bits from centroid; ${sizeNote}).`,
        tone: 'neutral' as const,
      }
    }
    return {
      primary: `Your input is at a concept boundary — ${d}/64 bits from the nearest centroid (${display}).`,
      tone: 'warn' as const,
    }
  }, [result, namingMap])

  const handleSuggested = useCallback((s: string) => {
    setText(s)
  }, [])

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div>
        <h3 className="text-base font-semibold tracking-wide text-[#D4AF37]/90">
          Try Your Input
        </h3>
        <p className="text-xs text-white/50 mt-0.5">
          Type anything — your name, a word, a sentence. We hash it to 64 bits and feed it to Anna.
        </p>
      </div>

      <ExplainPanel
        kid={EXPLAIN_TRY_YOUR_INPUT.kid}
        simple={EXPLAIN_TRY_YOUR_INPUT.simple}
        researcher={EXPLAIN_TRY_YOUR_INPUT.researcher}
        math={EXPLAIN_TRY_YOUR_INPUT.math}
        title="What is this module doing?"
        defaultCollapsed
      />

      {/* Text input */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono text-white/60" htmlFor="try-input">
          Your text
        </label>
        <input
          id="try-input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type any text..."
          className="px-3 py-2 bg-black/30 border border-white/[0.08] focus:border-[#D4AF37]/40 focus:outline-none text-white/90 font-mono text-sm"
          maxLength={500}
        />
        <div className="flex flex-wrap gap-1 items-center mt-1">
          <span className="text-[10px] text-white/40 mr-2">try:</span>
          {SUGGESTED_INPUTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSuggested(s)}
              className={cn(
                'text-[10px] px-2 py-0.5 border border-white/10 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 font-mono transition-colors',
                text === s ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30' : 'text-white/55',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline visualization */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <PipelineStep
          step="1"
          label="Your text"
          icon={<Hash className="w-4 h-4" />}
          content={
            <div className="font-mono text-xs text-white/70 break-all">
              &quot;{text}&quot;
            </div>
          }
        />
        <PipelineStep
          step="2"
          label="SHA-256 first 8 bytes (64 bits)"
          icon={<Hash className="w-4 h-4" />}
          content={
            <div className="font-mono text-xs text-[#D4AF37]/80 break-all">
              {bytesToHex(bytes)}
            </div>
          }
        />
        <PipelineStep
          step="3"
          label="Concept assignment"
          icon={<Sparkles className="w-4 h-4" />}
          content={
            result.concept && result.conceptDetails ? (
              <div className="flex flex-col gap-0.5">
                <div className="text-sm font-semibold text-emerald-400">
                  {namingMap?.get(result.concept.conceptId)?.display ?? `Concept #${result.concept.conceptId}`}
                </div>
                <div className="text-[10px] text-white/55">
                  #{result.concept.conceptId} · cluster {result.conceptDetails.clusterSize} · {result.concept.distance}/64 bits from centroid
                </div>
                <div className="text-[10px] text-white/55">
                  basin stability {result.stabilityKnown ? `${(result.stability * 100).toFixed(0)}%` : '...'}
                </div>
              </div>
            ) : (
              <div className="text-xs text-white/40">No concepts loaded</div>
            )
          }
        />
      </div>

      {/* Bit visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 bg-black/30 border border-white/[0.06]">
          <div className="text-[10px] text-white/50 font-mono mb-1.5">Input bits (from SHA-256)</div>
          <BitToggleRow bits={bits} readonly layout="4x16" cellSize="md" />
        </div>
        <div className="p-3 bg-black/30 border border-white/[0.06]">
          <div className="text-[10px] text-white/50 font-mono mb-1.5">
            Output bits ({result.result.endReason}, {result.result.ticks} ticks)
          </div>
          <BitToggleRow bits={result.result.output} readonly layout="4x16" cellSize="md" />
        </div>
      </div>

      {/* Interpretation */}
      <motion.div
        layout
        className={cn(
          'flex items-start gap-2 px-4 py-3 border',
          interpretation.tone === 'good' && 'border-emerald-500/30 bg-emerald-500/[0.04]',
          interpretation.tone === 'neutral' && 'border-[#D4AF37]/30 bg-[#D4AF37]/[0.04]',
          interpretation.tone === 'warn' && 'border-amber-500/30 bg-amber-500/[0.04]',
        )}
      >
        <Lightbulb className={cn(
          'w-4 h-4 flex-shrink-0 mt-0.5',
          interpretation.tone === 'good' && 'text-emerald-400',
          interpretation.tone === 'neutral' && 'text-[#D4AF37]',
          interpretation.tone === 'warn' && 'text-amber-400',
        )} />
        <div className="text-sm text-white/80">{interpretation.primary}</div>
      </motion.div>

      {/* Why this works (mini-explainer) */}
      <details className="group">
        <summary className="text-xs text-white/50 cursor-pointer hover:text-[#D4AF37]/80 inline-flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          why does this work? (technical detail)
        </summary>
        <div className="text-xs text-white/55 mt-2 space-y-2 pl-4 leading-relaxed border-l border-white/[0.06]">
          <p>
            SHA-256 produces a uniformly-distributed 256-bit hash. We take the first 8 bytes (64 bits)
            and convert each bit to ±1, giving a uniformly random 64-bit input vector regardless of input text.
          </p>
          <p>
            Anna&apos;s AIT runs <code className="text-[#D4AF37]/70">v_new = ternary_clamp(sign(M)·v)</code>
            with input clamping, settling into one of 19 deterministic concept attractors. Same text → same hash → same concept always.
          </p>
          <p>
            <strong className="text-white/75">Try this:</strong> small text changes cause big concept jumps because SHA-256 is avalanche-uniform.
            Identical inputs always land on identical concepts (deterministic).
          </p>
        </div>
      </details>
    </div>
  )
}

interface PipelineStepProps {
  step: string
  label: string
  icon: React.ReactNode
  content: React.ReactNode
}

function PipelineStep({ step, label, icon, content }: PipelineStepProps) {
  return (
    <div className="flex flex-col gap-2 px-3 py-2 bg-black/30 border border-white/[0.06]">
      <div className="flex items-center gap-2 text-[10px] text-white/50 font-mono uppercase">
        <span className="px-1.5 py-0.5 bg-[#D4AF37]/15 text-[#D4AF37]/80 border border-[#D4AF37]/30">
          {step}
        </span>
        {icon}
        <span>{label}</span>
      </div>
      <div className="min-h-[40px]">{content}</div>
    </div>
  )
}
