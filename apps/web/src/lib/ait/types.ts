/**
 * AIT — Aigarth Intelligent Tissue dense-matrix inference types.
 *
 * This is the exact algorithm `aigarth_search` C scanner runs on Anna,
 * verified 100% against scanner output for 81,920 attractors across 5 fresh seeds.
 *
 * Distinct from `lib/aigarth/` which implements the circular-topology variant.
 *
 * Verified equivalent of __.
 */

export const N_NEURONS = 128
export const N_INPUTS = 64
export const N_OUTPUTS = 64
export const MAX_TICKS_DEFAULT = 100

export type EndReason = 'NO_OUTPUT_ZEROES' | 'NO_NSTATE_CHANGES' | 'TICK_CAP'

/** A 128-dim ternary vector ({-1, 0, +1}). Stored as Int8Array. */
export type State = Int8Array

/** A 64-dim binary input vector (±1). */
export type Input = Int8Array

/** A 64-dim ternary output vector ({-1, 0, +1}). */
export type Output = Int8Array

/** Result of running AIT inference on a single input. */
export interface AITResult {
 /** Final 128-dim state ({-1, 0, +1}). First 64 = input, last 64 = output. */
 state: State
 /** Final 64-dim output ({-1, 0, +1}). */
 output: Output
 /** Number of ticks used (1..maxTicks). */
 ticks: number
 /** Why the loop stopped. */
 endReason: EndReason
 /** If recorded, full per-tick state history (length = ticks + 1, including initial). */
 trajectory?: State[]
}

/** A pre-discovered concept centroid in Anna's output space. */
export interface Concept {
 conceptId: number
 centroid: number[] // 64 elements, each ±1
 clusterSize: number
 posCount: number
 family: number
 isAntipodeOf: number | null
}

/** Anna matrix (or any 128×128 int8 matrix) loaded as Int8Array of length 16384. */
export type Matrix = Int8Array
