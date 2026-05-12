/**
 * Tiny PCA implementation via power iteration with Hotelling deflation.
 * Used for projecting AIT outputs into the same 2D space as Anna's 19
 * concept centroids (see `phase_n/concepts_with_pca.json`).
 *
 * For the small 19-centroid × 64-dim covariance this is fast and exact
 * enough; we don't pull in a numerical linalg package.
 */

export interface PCABasis {
  /** centroid-mean vector, length `dim` */
  mean: number[]
  /** top-K eigenvectors of the covariance, each length `dim` */
  components: number[][]
  /** explained variance fraction per component (sums to ≤ 1) */
  explainedVariance: number[]
}

/**
 * Compute top-K principal components of `vectors` (each row a sample).
 * Returns mean-centred basis with K orthonormal eigenvectors.
 */
export function computePCABasis(vectors: number[][], topK = 2): PCABasis {
  const n = vectors.length
  if (n === 0) throw new Error('computePCABasis: empty input')
  const dim = vectors[0]!.length

  // 1. Mean centre
  const mean = new Array<number>(dim).fill(0)
  for (const v of vectors) for (let i = 0; i < dim; i++) mean[i]! += v[i]!
  for (let i = 0; i < dim; i++) mean[i]! /= n

  const centred: number[][] = vectors.map((v) => v.map((x, i) => x - mean[i]!))

  // 2. Covariance matrix Σ = (1/(n-1)) Xᵀ X
  const cov = make2D(dim, dim)
  for (const v of centred) {
    for (let i = 0; i < dim; i++) {
      for (let j = i; j < dim; j++) {
        cov[i]![j]! += v[i]! * v[j]!
      }
    }
  }
  const denom = Math.max(1, n - 1)
  for (let i = 0; i < dim; i++) {
    for (let j = i; j < dim; j++) {
      cov[i]![j]! /= denom
      cov[j]![i]! = cov[i]![j]!
    }
  }

  // 3. Power iteration with Hotelling deflation for top-K eigenvectors
  const components: number[][] = []
  const explainedVariance: number[] = []
  let workCov = cov
  const totalVariance = traceOf(cov)

  for (let k = 0; k < topK; k++) {
    const { vector, eigenvalue } = powerIterate(workCov, 200, 1e-9)
    components.push(vector)
    explainedVariance.push(totalVariance > 0 ? Math.max(0, eigenvalue) / totalVariance : 0)
    workCov = deflate(workCov, vector, eigenvalue)
  }

  return { mean, components, explainedVariance }
}

/**
 * Project a single sample onto the PCA basis. Returns a length-K coordinate.
 */
export function projectOntoBasis(sample: number[] | Int8Array, basis: PCABasis): number[] {
  const centred = new Array<number>(basis.mean.length)
  for (let i = 0; i < basis.mean.length; i++) centred[i] = (sample[i] as number) - basis.mean[i]!
  return basis.components.map((c) => {
    let dot = 0
    for (let i = 0; i < c.length; i++) dot += c[i]! * centred[i]!
    return dot
  })
}

// --- internals ---

function make2D(rows: number, cols: number): number[][] {
  const out: number[][] = []
  for (let r = 0; r < rows; r++) {
    const row = new Array<number>(cols)
    for (let c = 0; c < cols; c++) row[c] = 0
    out.push(row)
  }
  return out
}

function traceOf(M: number[][]): number {
  let s = 0
  for (let i = 0; i < M.length; i++) s += M[i]![i]!
  return s
}

function powerIterate(M: number[][], maxIter: number, tol: number): { vector: number[]; eigenvalue: number } {
  const dim = M.length
  // Initialise with a fixed deterministic vector so PCA is reproducible
  let v = new Array<number>(dim).fill(0).map((_, i) => Math.sin((i + 1) * 0.123) + 1e-3)
  v = normalise(v)
  let lambda = 0
  for (let it = 0; it < maxIter; it++) {
    const Mv = new Array<number>(dim).fill(0)
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) Mv[i]! += M[i]![j]! * v[j]!
    }
    const newLambda = norm(Mv)
    if (newLambda < tol) break
    const newV = Mv.map((x) => x / newLambda)
    const delta = Math.abs(newLambda - lambda)
    v = newV
    lambda = newLambda
    if (delta < tol) break
  }
  return { vector: v, eigenvalue: lambda }
}

function deflate(M: number[][], v: number[], lambda: number): number[][] {
  const dim = M.length
  const result = make2D(dim, dim)
  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      result[i]![j]! = M[i]![j]! - lambda * v[i]! * v[j]!
    }
  }
  return result
}

function normalise(v: number[]): number[] {
  const n = norm(v)
  if (n === 0) return v
  return v.map((x) => x / n)
}

function norm(v: number[]): number {
  let s = 0
  for (const x of v) s += x * x
  return Math.sqrt(s)
}
