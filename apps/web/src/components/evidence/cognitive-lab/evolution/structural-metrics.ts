import type { StructuralFingerprint } from '../types.ts'
import { aitFastInference, packSignMatrix } from './ait-fast.ts'
import { mulberry32 } from './rng.ts'

const N = 128

/**
 * Compute Anna's 7-axis structural fingerprint on an arbitrary 128×128 sign-only matrix.
 * The full int8 matrix is also accepted to detect K-e-y signature (which depends on magnitudes).
 *
 * @param signW  flat int8 sign-only array length 16384 (-1, 0, +1)
 * @param fullW  optional flat int8 array of original magnitudes (for K-e-y detection)
 */
export function computeFingerprint(signW: Int8Array, fullW?: Int8Array): StructuralFingerprint {
  // 1. Antipodal antisymmetry: M[i,j] should equal -M[127-i, 127-j]
  let antiMatch = 0
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (signW[r * N + c]! === -signW[(N - 1 - r) * N + (N - 1 - c)]!) antiMatch++
    }
  }

  // 2. Period-32 row similarity (Phase N V1 canonical definition):
  //    sign-equality between rows[r] and rows[r+32] for r ∈ [0, N-32), no wraparound.
  //    96 row pairs × 128 columns = 12,288 comparisons. Anna ≈ 0.808, random ≈ 0.50.
  //    Verified independently against `phase_n/n1f_period32_structure.json`.
  let rowSimSame = 0
  const rowPairs = N - 32
  for (let r = 0; r < rowPairs; r++) {
    for (let c = 0; c < N; c++) {
      if (signW[r * N + c]! === signW[(r + 32) * N + c]!) rowSimSame++
    }
  }
  const rowSym = rowSimSame / (rowPairs * N)

  // 3. Kernel reconstruction (Phase N canonical):
  //    kernel = sign(M)[0:32]
  //    rec[0:32]   = kernel                       (identity)
  //    rec[32:64]  = kernel                       (period-32 repeat)
  //    rec[64:96]  = -kernel[::-1, ::-1]          → -kernel[31-(r-64), 127-c]
  //    rec[96:128] = -kernel[::-1, ::-1]          → -kernel[31-(r-96), 127-c]
  //
  //    Anna reproduces sign(M) at ~0.945 accuracy under this reconstruction;
  //    random matrices ~0.62. Match agreed against `build_cell_classification.py`.
  let kernelMatch = 0
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      let recCell: number
      if (r < 32) recCell = signW[r * N + c]!
      else if (r < 64) recCell = signW[(r - 32) * N + c]!
      else if (r < 96) recCell = -signW[(95 - r) * N + (N - 1 - c)]!
      else recCell = -signW[(N - 1 - r) * N + (N - 1 - c)]!
      if (recCell === signW[r * N + c]!) kernelMatch++
    }
  }

  // 4. First-tick output sparsity. Production AIT iterates until all outputs are
  //    non-zero (NO_OUTPUT_ZEROES stop), so the *final* output never has zeros.
  //    We instead measure the structural sparsity at tick 1 — one matmul + ternary
  //    clamp — which IS a property of the matrix's row-wise sign distribution.
  //    Anna scores ~0.86 here per Phase D's documented sparse-output bias.
  const W_packed = packSignMatrix(signW)
  let zeroSum = 0
  const sparsityRng = mulberry32(0xc0ffee)
  const N_SPARSITY_SAMPLES = 32
  for (let s = 0; s < N_SPARSITY_SAMPLES; s++) {
    const u = new Int8Array(64)
    for (let i = 0; i < 64; i++) u[i] = sparsityRng() < 0.5 ? 1 : -1
    // One manual tick on output rows (64..127): for each row r, dot = Σ_c W[r,c] · v[c]
    // where v = [u | 0]
    let zeros = 0
    for (let r = 64; r < 128; r++) {
      let dot = 0
      for (let c = 0; c < 64; c++) dot += signW[r * N + c]! * u[c]!
      // (cells c=64..127 contribute 0 since v[c]=0 there)
      if (dot === 0) zeros++
    }
    zeroSum += zeros / 64
  }
  const sparsity = zeroSum / N_SPARSITY_SAMPLES

  // 5. Spectral dominance: power-iteration estimate of |λ_max|² × 2 / Σ|λ|²
  const dominance = approxSpectralDominance(signW)

  // 6. K-e-y signature: M[8,74]=-75, M[9,75]=101, M[10,76]=-121
  let hasKey = false
  if (fullW) {
    const a = fullW[8 * N + 74]!
    const b = fullW[9 * N + 75]!
    const c = fullW[10 * N + 76]!
    hasKey = a === -75 && b === 101 && c === -121
  }

  // 7. Compression rate: fraction of sampled inputs whose AIT output collides
  //    with another sample's output. Phase N V4 reports Anna = 0.237 vs random
  //    = 0.000 on the full 16,384 input space. We estimate from 1,024 samples;
  //    expect Anna ≈ 0.10–0.18 (scales with sample size), random ≈ 0.
  const compressionRate = estimateCompressionRate(W_packed)

  return {
    antipodalAntisymmetryPct: antiMatch / (N * N),
    rowSymmetryOffset32: rowSym,
    kernelReconstructionAcc: kernelMatch / (N * N),
    outputSparsityPct: sparsity,
    spectralDominancePct: dominance,
    hasKeySignature: hasKey,
    compressionRate,
  }
}

/**
 * Estimate input→output compression rate. Phase N V4 reports Anna 23.7 %,
 * random 0 % on full 16,384 input space. With 1,024 samples this scales to
 * ~10–18 % for Anna, ~0 % for random.
 */
function estimateCompressionRate(W: { pos: Uint32Array; neg: Uint32Array }, samples = 1024, seed = 0xc0ffee): number {
  const seen = new Set<string>()
  const rng = mulberry32(seed)
  for (let s = 0; s < samples; s++) {
    const u = new Int8Array(64)
    for (let i = 0; i < 64; i++) u[i] = rng() < 0.5 ? 1 : -1
    const r = aitFastInference(W, u)
    seen.add(Array.from(r.output).join(''))
  }
  return (samples - seen.size) / samples
}

function approxSpectralDominance(M: Int8Array): number {
  let frob2 = 0
  for (let i = 0; i < M.length; i++) frob2 += M[i]! * M[i]!
  if (frob2 === 0) return 0

  let v = new Float64Array(N)
  for (let i = 0; i < N; i++) v[i] = 1.0
  let norm = Math.sqrt(N)
  for (let i = 0; i < N; i++) v[i]! /= norm
  for (let it = 0; it < 30; it++) {
    const next = new Float64Array(N)
    for (let r = 0; r < N; r++) {
      let s = 0
      for (let c = 0; c < N; c++) s += M[r * N + c]! * v[c]!
      next[r] = s
    }
    norm = Math.sqrt(next.reduce((a, b) => a + b * b, 0))
    if (norm === 0) return 0
    for (let i = 0; i < N; i++) next[i]! /= norm
    v = next
  }
  return Math.min(1, (norm * norm * 2) / frob2)
}

/**
 * Re-export stability helpers for live-discovery modules. These are not used
 * by `computeFingerprint` (which uses `estimateCompressionRate` internally),
 * but downstream modules (cluster discovery, concept emergence) use them.
 */
export { estimateConceptCount, checkStability } from './concept-discovery.ts'

/** Hamming distance between two sign-only matrices, normalized to [0, 1]. */
export function distanceToAnna(W: Int8Array, anna: Int8Array): number {
  if (W.length !== anna.length) throw new Error(`length mismatch ${W.length} vs ${anna.length}`)
  let mismatches = 0
  for (let i = 0; i < W.length; i++) {
    if (Math.sign(W[i]!) !== Math.sign(anna[i]!)) mismatches++
  }
  return mismatches / W.length
}
