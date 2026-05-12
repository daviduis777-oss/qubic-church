/**
 * AIT — Aigarth Intelligent Tissue dense-matrix inference.
 *
 * VERIFIED 100% against `aigarth_search` C scanner output.
 * Algorithm: `(internal)` (Update 2026-05-09 21:00)
 * Python reference: `(internal)`
 *
 *   W = sign(M)                              # binarize int8 to ternary {-1, 0, +1}
 *   v[0:64]   = u                             # input neurons (clamped)
 *   v[64:128] = 0                             # output neurons start at 0
 *   loop tick = 1..MAX_TICKS=100:
 *     v_new = ternary_clamp(W @ v)            # synchronous update
 *     v_new[0:64] = u                         # input clamp
 *     if all(v_new[64:128] != 0): return      # NO_OUTPUT_ZEROES
 *     if v_new == v: return                   # NO_NSTATE_CHANGES
 *     v = v_new
 *
 * `ternary_clamp(x) = sign(x) with sign(0) = 0`.
 */

import {
  type AITResult,
  type Input,
  type Matrix,
  type State,
  MAX_TICKS_DEFAULT,
  N_INPUTS,
  N_NEURONS,
} from './types'

export * from './types'

/**
 * Compute the sign-only weight matrix W = sign(M).
 *
 * @param M 128×128 int8 matrix flattened to length 16384
 * @returns 128×128 int8 ternary matrix flattened to length 16384
 */
export function signWeights(M: Matrix): Matrix {
  if (M.length !== N_NEURONS * N_NEURONS) {
    throw new Error(`expected matrix length ${N_NEURONS * N_NEURONS}, got ${M.length}`)
  }
  const W = new Int8Array(M.length)
  for (let i = 0; i < M.length; i++) {
    const v = M[i]!
    W[i] = v > 0 ? 1 : v < 0 ? -1 : 0
  }
  return W
}

/**
 * Run AIT inference on a single 64-bit input.
 *
 * @param W Pre-computed sign(M) ternary weight matrix (128×128 = 16384 entries)
 * @param input 64-bit ±1 input vector
 * @param options.maxTicks default 100 (matches scanner cap)
 * @param options.recordTrajectory if true, return full per-tick state history (memory ≈ ticks × 128 bytes)
 */
export function aitInference(
  W: Matrix,
  input: Input,
  options: { maxTicks?: number; recordTrajectory?: boolean } = {},
): AITResult {
  if (input.length !== N_INPUTS) {
    throw new Error(`input must have ${N_INPUTS} elements, got ${input.length}`)
  }
  if (W.length !== N_NEURONS * N_NEURONS) {
    throw new Error(`weights must be ${N_NEURONS}×${N_NEURONS} = ${N_NEURONS * N_NEURONS}, got ${W.length}`)
  }

  const maxTicks = options.maxTicks ?? MAX_TICKS_DEFAULT
  const recordTrajectory = options.recordTrajectory ?? false

  // Initial state: input neurons fixed, output neurons 0
  const state = new Int8Array(N_NEURONS)
  for (let i = 0; i < N_INPUTS; i++) state[i] = input[i]!
  // state[64..127] already 0 (Int8Array default)

  const trajectory: State[] | undefined = recordTrajectory ? [new Int8Array(state)] : undefined

  for (let tick = 1; tick <= maxTicks; tick++) {
    // Compute new state for output neurons only (input neurons are clamped)
    // raw[i] = sum_j W[i,j] * state[j], for i in {64..127}
    // new_state[i] = ternary_clamp(raw[i])

    let allOutputsNonzero = true
    let stateChanged = false
    const newState = new Int8Array(N_NEURONS)

    // Input clamp
    for (let i = 0; i < N_INPUTS; i++) newState[i] = state[i]!

    // Output neuron updates
    for (let i = N_INPUTS; i < N_NEURONS; i++) {
      let sum = 0
      const rowOffset = i * N_NEURONS
      for (let j = 0; j < N_NEURONS; j++) {
        // W[i, j] * state[j]; W is Int8 ±1 or 0, state is Int8 ±1 or 0
        sum += W[rowOffset + j]! * state[j]!
      }
      const newVal: -1 | 0 | 1 = sum > 0 ? 1 : sum < 0 ? -1 : 0
      newState[i] = newVal
      if (newVal === 0) allOutputsNonzero = false
      if (newVal !== state[i]!) stateChanged = true
    }

    if (recordTrajectory) trajectory!.push(new Int8Array(newState))

    // Stop conditions match Python ait_python.py exactly:
    //   NO_OUTPUT_ZEROES checked first, NO_NSTATE_CHANGES second, TICK_CAP last
    if (allOutputsNonzero) {
      const output = newState.slice(N_INPUTS)
      return {
        state: newState,
        output,
        ticks: tick,
        endReason: 'NO_OUTPUT_ZEROES',
        trajectory,
      }
    }
    if (!stateChanged) {
      const output = newState.slice(N_INPUTS)
      return {
        state: newState,
        output,
        ticks: tick,
        endReason: 'NO_NSTATE_CHANGES',
        trajectory,
      }
    }

    // Iterate
    for (let i = N_INPUTS; i < N_NEURONS; i++) state[i] = newState[i]!
  }

  // TICK_CAP
  const output = state.slice(N_INPUTS)
  return {
    state,
    output,
    ticks: maxTicks,
    endReason: 'TICK_CAP',
    trajectory,
  }
}

/**
 * Hamming distance between two ±1 / 0 vectors.
 */
export function hammingDistance(a: Int8Array, b: Int8Array): number {
  if (a.length !== b.length) throw new Error('hamming: length mismatch')
  let d = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i]! !== b[i]!) d++
  }
  return d
}

/**
 * Find the nearest concept centroid for a given output vector.
 * Returns concept index (0..N-1) and Hamming distance.
 */
export function nearestConcept(
  output: Int8Array,
  centroids: number[][],
): { conceptId: number; distance: number } {
  let bestId = -1
  let bestDist = output.length + 1
  for (let i = 0; i < centroids.length; i++) {
    let d = 0
    const c = centroids[i]!
    for (let j = 0; j < output.length; j++) {
      if (output[j]! !== c[j]!) d++
    }
    if (d < bestDist) {
      bestDist = d
      bestId = i
    }
  }
  return { conceptId: bestId, distance: bestDist }
}

/**
 * Measure basin stability: fraction of 1-bit perturbations that produce same output.
 */
export function basinStability(
  W: Matrix,
  input: Input,
  options: { trials?: number; seed?: number } = {},
): number {
  const trials = options.trials ?? 20
  const baseResult = aitInference(W, input)
  const baseOutput = baseResult.output

  // Simple deterministic PRNG (mulberry32) seeded by input bytes if no seed given
  let seedValue = options.seed ?? 0
  if (options.seed === undefined) {
    for (let i = 0; i < input.length; i++) seedValue = ((seedValue << 5) - seedValue) + input[i]!
    seedValue = Math.abs(seedValue) || 12345
  }
  const rng = mulberry32(seedValue)

  const outputLen = N_NEURONS - N_INPUTS
  let same = 0
  for (let t = 0; t < trials; t++) {
    const pos = Math.floor(rng() * N_INPUTS) % N_INPUTS
    const perturbed = new Int8Array(input)
    perturbed[pos] = -perturbed[pos]! as -1 | 1
    const res = aitInference(W, perturbed)
    let isSame = true
    for (let i = 0; i < outputLen; i++) {
      if (res.output[i]! !== baseOutput[i]!) {
        isSame = false
        break
      }
    }
    if (isSame) same++
  }
  return same / trials
}

function mulberry32(a: number): () => number {
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
