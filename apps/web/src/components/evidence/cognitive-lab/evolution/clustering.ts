/**
 * Lightweight k-means clustering + silhouette analysis for binary/ternary
 * output vectors. Used by Cluster Discovery to recover Anna's 19-cluster
 * structure from raw output data without prior knowledge of the centroids.
 *
 * Distance metric: Hamming distance (since outputs are ±1 vectors).
 * Init: k-means++ for stability.
 */

import { mulberry32 } from './rng.ts'

/** Hamming distance between two ±1/-1 vectors of equal length. */
export function hammingDistance(a: Int8Array | number[], b: Int8Array | number[]): number {
  const n = a.length
  let d = 0
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) d++
  return d
}

/**
 * k-means with k-means++ initialisation, Hamming distance, modal-bit centroid.
 *
 * Centroid for a cluster is the majority sign per bit — for ±1 vectors this is
 * the closest analogue to "mean" that stays on the {-1, +1} lattice.
 */
export interface KMeansResult {
  /** Each input's cluster id ∈ [0, k). */
  assignments: number[]
  /** k centroid vectors of length `dim`. */
  centroids: number[][]
  /** Sum of within-cluster Hamming distances (smaller = tighter). */
  inertia: number
  /** Number of iterations run before convergence. */
  iterations: number
}

export function kmeans(
  data: Int8Array[] | number[][],
  k: number,
  opts: { maxIter?: number; seed?: number } = {},
): KMeansResult {
  const maxIter = opts.maxIter ?? 50
  const seed = opts.seed ?? 0xc105e5
  const rng = mulberry32(seed)
  const n = data.length
  if (n === 0) throw new Error('kmeans: empty data')
  const dim = data[0]!.length
  const arr = (i: number): number[] => Array.from(data[i]!)

  // k-means++ init
  const centroids: number[][] = []
  centroids.push(arr(Math.floor(rng() * n)))
  while (centroids.length < k) {
    const dists = new Array<number>(n)
    let total = 0
    for (let i = 0; i < n; i++) {
      let best = Infinity
      for (const c of centroids) {
        const d = hammingDistance(c, data[i]!)
        if (d < best) best = d
      }
      dists[i] = best * best // squared for variance proxy
      total += dists[i]!
    }
    if (total === 0) {
      // all points equidistant; just pick a random one
      centroids.push(arr(Math.floor(rng() * n)))
      continue
    }
    let pick = rng() * total
    let idx = 0
    for (let i = 0; i < n; i++) {
      pick -= dists[i]!
      if (pick <= 0) {
        idx = i
        break
      }
    }
    centroids.push(arr(idx))
  }

  const assignments = new Array<number>(n).fill(0)
  let inertia = 0
  let iterations = 0

  for (let it = 0; it < maxIter; it++) {
    iterations = it + 1
    let changed = false
    inertia = 0
    // Assign
    for (let i = 0; i < n; i++) {
      let best = Infinity
      let bestK = 0
      for (let kk = 0; kk < k; kk++) {
        const d = hammingDistance(centroids[kk]!, data[i]!)
        if (d < best) {
          best = d
          bestK = kk
        }
      }
      if (assignments[i] !== bestK) {
        assignments[i] = bestK
        changed = true
      }
      inertia += best
    }
    if (!changed && it > 0) break
    // Update centroids: majority sign per bit
    const sums = Array.from({ length: k }, () => new Float64Array(dim))
    const counts = new Int32Array(k)
    for (let i = 0; i < n; i++) {
      const c = assignments[i]!
      counts[c]!++
      const v = data[i]!
      for (let d = 0; d < dim; d++) sums[c]![d]! += v[d]!
    }
    for (let kk = 0; kk < k; kk++) {
      if (counts[kk] === 0) {
        // Re-seed empty cluster with a random point
        centroids[kk] = arr(Math.floor(rng() * n))
        continue
      }
      const newC = new Array<number>(dim)
      for (let d = 0; d < dim; d++) {
        const s = sums[kk]![d]!
        newC[d] = s > 0 ? 1 : s < 0 ? -1 : (rng() < 0.5 ? -1 : 1)
      }
      centroids[kk] = newC
    }
  }

  return { assignments, centroids, inertia, iterations }
}

/**
 * Silhouette score in [-1, 1] — higher = better separation.
 *
 * s(i) = (b(i) - a(i)) / max(a(i), b(i))
 *   a(i) = mean Hamming to OWN cluster (excluding self)
 *   b(i) = mean Hamming to NEAREST OTHER cluster
 *
 * Mean silhouette over a sample. We sample up to `sampleSize` points if `data`
 * is larger, to keep computation bounded.
 */
export function meanSilhouette(
  data: Int8Array[] | number[][],
  assignments: number[],
  k: number,
  sampleSize = 200,
): number {
  const n = data.length
  if (k < 2 || n < k + 1) return 0

  // Pre-group indices by cluster
  const byCluster: number[][] = Array.from({ length: k }, () => [])
  for (let i = 0; i < n; i++) byCluster[assignments[i]!]!.push(i)
  if (byCluster.some((c) => c.length === 0)) return 0

  const rng = mulberry32(0xc105e5 + n)
  const indices = n > sampleSize
    ? Array.from({ length: sampleSize }, () => Math.floor(rng() * n))
    : Array.from({ length: n }, (_, i) => i)

  let total = 0
  let count = 0
  for (const i of indices) {
    const ci = assignments[i]!
    const own = byCluster[ci]!
    if (own.length < 2) continue
    let a = 0
    for (const j of own) if (j !== i) a += hammingDistance(data[i]!, data[j]!)
    a /= (own.length - 1)
    let b = Infinity
    for (let kk = 0; kk < k; kk++) {
      if (kk === ci) continue
      const grp = byCluster[kk]!
      if (grp.length === 0) continue
      let bk = 0
      for (const j of grp) bk += hammingDistance(data[i]!, data[j]!)
      bk /= grp.length
      if (bk < b) b = bk
    }
    if (b === Infinity) continue
    const s = (b - a) / Math.max(a, b, 1e-9)
    total += s
    count++
  }
  return count === 0 ? 0 : total / count
}

/**
 * Pairwise Hamming distance matrix for `n` vectors. Symmetric, O(n²·dim).
 */
export function pairwiseHamming(vectors: number[][]): number[][] {
  const n = vectors.length
  const D: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = hammingDistance(vectors[i]!, vectors[j]!)
      D[i]![j]! = d
      D[j]![i]! = d
    }
  }
  return D
}

/**
 * Single-linkage hierarchical clustering with Hamming distance. Returns the
 * merge sequence (Z-style: for each merge, [left, right, height, size]).
 *
 * Linkage = single (min over pair). For our small N=19 this is fast.
 */
export interface DendrogramNode {
  /** Cluster id this node represents (orig point ids 0..n-1 + new ids n..2n-2). */
  id: number
  /** Merge height (Hamming distance between merged clusters). */
  height: number
  /** Member original-point ids beneath this node. */
  members: number[]
  /** Left/right children (null at leaves). */
  left?: DendrogramNode
  right?: DendrogramNode
}

export function hierarchicalCluster(D: number[][]): DendrogramNode {
  const n = D.length
  if (n === 0) throw new Error('hierarchicalCluster: empty distance matrix')
  if (n === 1) return { id: 0, height: 0, members: [0] }

  // Initial: each point is its own cluster
  const nodes = new Map<number, DendrogramNode>()
  for (let i = 0; i < n; i++) nodes.set(i, { id: i, height: 0, members: [i] })

  // Pairwise distances copied so we can mutate
  const dist = new Map<string, number>()
  const key = (a: number, b: number) => (a < b ? `${a},${b}` : `${b},${a}`)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) dist.set(key(i, j), D[i]![j]!)
  }

  let nextId = n
  while (nodes.size > 1) {
    // Find minimum pair
    let minD = Infinity
    let minA = -1
    let minB = -1
    const ids = Array.from(nodes.keys())
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const d = dist.get(key(ids[i]!, ids[j]!))
        if (d !== undefined && d < minD) {
          minD = d
          minA = ids[i]!
          minB = ids[j]!
        }
      }
    }
    if (minA === -1) break
    // Merge
    const left = nodes.get(minA)!
    const right = nodes.get(minB)!
    const newNode: DendrogramNode = {
      id: nextId++,
      height: minD,
      members: [...left.members, ...right.members],
      left,
      right,
    }
    nodes.delete(minA)
    nodes.delete(minB)
    // Update distances: single linkage = min over the merged points
    for (const otherId of nodes.keys()) {
      const dA = dist.get(key(minA, otherId))
      const dB = dist.get(key(minB, otherId))
      const dNew = dA !== undefined && dB !== undefined ? Math.min(dA, dB)
                 : dA !== undefined ? dA
                 : dB ?? Infinity
      dist.set(key(newNode.id, otherId), dNew)
    }
    // Drop old keys involving merged clusters
    for (const k of Array.from(dist.keys())) {
      const [a, b] = k.split(',').map(Number) as [number, number]
      if (a === minA || a === minB || b === minA || b === minB) dist.delete(k)
    }
    nodes.set(newNode.id, newNode)
  }

  return Array.from(nodes.values())[0]!
}
