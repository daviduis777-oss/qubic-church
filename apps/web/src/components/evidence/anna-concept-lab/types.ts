/**
 * Anna Concept Lab — UI types.
 *
 * Re-exports from lib/ait + lab-specific UI types.
 */

import type { Concept as ConceptCore } from '@/lib/ait/types'
import type { ConceptName } from '@/lib/anna-naming'

export type Concept = ConceptCore
export type { ConceptName }
export type ConceptNamingMap = Map<number, ConceptName>

export interface PhaseNIndex {
  phase: string
  name: string
  date: string
  version: string
  description: string
  highlights: Record<string, Record<string, unknown>>
  datasets: { kind: string; label: string; path: string }[]
  plots: { name: string; label: string; file: string }[]
}

export interface RandomControlData {
  seed: number
  description: string
  shape: [number, number]
  matrix: number[][]
  concepts: Concept[]
  n_stable_inputs: number
  n_dominant_concepts: number
  n_total_unique_outputs: number
}

export interface VerificationReport {
  phase: string
  verified_date: string
  summary: string
  total_verifications: number
  passed: number
  falsified: number
  tests: Array<{
    id: string
    claim: string
    anna_value?: string | number
    random_int8_mean?: number
    z_score?: number | string
    p_value?: string
    verdict: 'PASSED' | 'FALSIFIED' | 'PASSED CATEGORICALLY'
    note?: string
  }>
  headline_for_external_engagement: string
  anna_does_NOT: string[]
  anna_DOES: string[]
}

/** Tick state for animation. */
export interface TickFrame {
  tick: number
  state: Int8Array
  /** Cells that changed from previous tick (for highlight). */
  changedCells: Set<number>
}

/** Full animation frames for a single inference. */
export interface InferenceAnimation {
  frames: TickFrame[]
  endReason: 'NO_OUTPUT_ZEROES' | 'NO_NSTATE_CHANGES' | 'TICK_CAP'
  finalConcept: { id: number; family: number; distance: number } | null
  totalTicks: number
}
