/**
 * Shared stability + concept-discovery utilities. One definition of "stable
 * basin" used by structural-metrics and the visualisation modules.
 *
 * Phase N reference: an input is stable when its average output Hamming
 * change under single-bit input perturbations is < 1 bit. Anna shows ~7.3 %
 * stable inputs out of 50,000 sampled in Phase N; random matrices show ~0 %.
 *
 * Uses `mulberry32` for input generation — LCG-low-bit patterns produce
 * degenerate sequences (period-2 alternation), so do NOT inline an LCG here.
 */
import { aitFastInference, type PackedMatrix } from './ait-fast.ts'
import { mulberry32 } from './rng.ts'

export interface StabilityResult {
  stable: boolean
  /** Average output bits changed across `trials` single-bit perturbations of input. */
  avalanche: number
  /** Baseline (unperturbed) output. */
  output: Int8Array
}

export function checkStability(
  W: PackedMatrix,
  input: Int8Array,
  trials = 4,
  threshold = 1.0,
  rng?: () => number,
): StabilityResult {
  const r0 = aitFastInference(W, input)
  let totalDiff = 0
  // Hash input into a seed so behaviour is deterministic per input across runs
  const seed = hashInput(input)
  const localRng = rng ?? mulberry32(seed)
  for (let t = 0; t < trials; t++) {
    const perturbed = new Int8Array(input)
    const flipIdx = Math.floor(localRng() * input.length)
    perturbed[flipIdx] = -perturbed[flipIdx]! as -1 | 1
    const r1 = aitFastInference(W, perturbed)
    for (let i = 0; i < r0.output.length; i++) {
      if (r0.output[i]! !== r1.output[i]!) totalDiff++
    }
  }
  return {
    stable: totalDiff / trials < threshold,
    avalanche: totalDiff / trials,
    output: r0.output,
  }
}

/**
 * Estimate distinct stable concept count by sampling N random binary inputs,
 * filtering by stability (avg avalanche < threshold across `trials` single-bit
 * perturbations), and deduplicating the resulting outputs.
 *
 * Phase N's reference value for Anna: 19 concepts. This estimator should
 * approach that number as `samples` grows. With 2,048 samples + 8 trials +
 * threshold 4.0 (matching Phase N M3's "stable" criterion), expect Anna ≈ 15–22
 * concepts, random ≈ 0–2.
 */
export function estimateConceptCount(
  W: PackedMatrix,
  samples = 2048,
  trials = 8,
  threshold = 4.0,
  seed = 0xfeedbabe,
): number {
  const seen = new Set<string>()
  const rng = mulberry32(seed)
  for (let s = 0; s < samples; s++) {
    const u = new Int8Array(64)
    for (let i = 0; i < 64; i++) u[i] = rng() < 0.5 ? 1 : -1
    const r = checkStability(W, u, trials, threshold)
    if (r.stable) seen.add(Array.from(r.output).join(''))
  }
  return seen.size
}

/** Hash a binary input into a 32-bit seed for deterministic per-input PRNG state. */
function hashInput(input: Int8Array): number {
  let h = 0xc0ffee
  for (let i = 0; i < input.length; i++) {
    const v = input[i]! > 0 ? 1 : 0
    h = ((h << 5) - h + v) | 0
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995)
  }
  return h >>> 0
}
