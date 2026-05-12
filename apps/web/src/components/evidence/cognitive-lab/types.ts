import type { PackedMatrix } from './evolution/ait-fast'

export interface Matrix {
  /** Sign-only int8 weights, length 16384. Source of truth for mutation/distance. */
  weights: Int8Array
  /** Bit-packed cache for fast inference. Recomputed on mutation. */
  packed: PackedMatrix
  /** Last computed fitness; -1 if not yet scored. */
  fitness: number
}

export interface Population {
  matrices: Matrix[]
  generation: number
  size: number
  mutationRate: number
}

export interface GenerationSnapshot {
  generation: number
  fitness: { best: number; median: number; worst: number; mean: number }
  bestDistanceToAnna: number
  /** Optional: top matrix's structural fingerprint. */
  bestStructural?: StructuralFingerprint
  /** Optional: 2D PCA position of every matrix for canvas render (length = pop.size * 2). */
  positions?: Float32Array
}

export interface StructuralFingerprint {
  // Functional — emerge under selection
  antipodalAntisymmetryPct: number
  spectralDominancePct: number
  rowSymmetryOffset32: number
  kernelReconstructionAcc: number
  outputSparsityPct: number
  // Identity — design-only
  hasKeySignature: boolean
  /**
   * Input → output compression rate ∈ [0, 1]: fraction of N sampled inputs whose
   * AIT output collides with another sample's output. Anna ≈ 0.15–0.24 (depends
   * on sample size; full 16,384 inputs gives Phase N's 0.237). Random ≈ 0.
   * Estimator uses 1,024 sampled binary inputs.
   */
  compressionRate: number
}

export type ScoringMode = 'hyperidentity' | 'multitask'

export interface MultiTaskFitness {
  identity_a: number
  max: number
  and: number
  or: number
  parity: number
  addition_low: number
}
