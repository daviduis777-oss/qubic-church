import type { ParticleData, SimulationStats, VelocityBin, PhaseTransition } from '../types'

/** Average kinetic energy per particle */
export function kineticEnergy(p: ParticleData): number {
  let sum = 0
  for (let i = 0; i < p.count; i++) {
    sum += p.vx[i]! * p.vx[i]! + p.vy[i]! * p.vy[i]!
  }
  return p.count > 0 ? sum / p.count : 0
}

/** Segregation index: ratio of avg nearest same-type to nearest other-type distance.
 *  Uses sampling for performance (check ~200 particles max). */
export function segregationIndex(p: ParticleData): number {
  if (p.count < 10) return 0
  const sampleSize = Math.min(p.count, 200)
  const step = Math.max(1, Math.floor(p.count / sampleSize))
  let totalSame = 0
  let totalOther = 0
  let sampled = 0

  for (let i = 0; i < p.count; i += step) {
    let nearestSame = Infinity
    let nearestOther = Infinity
    const ax = p.x[i]!
    const ay = p.y[i]!
    const aType = p.type[i]!

    for (let j = 0; j < p.count; j++) {
      if (j === i) continue
      const d2 = (ax - p.x[j]!) ** 2 + (ay - p.y[j]!) ** 2
      if (p.type[j]! === aType) {
        if (d2 < nearestSame) nearestSame = d2
      } else {
        if (d2 < nearestOther) nearestOther = d2
      }
    }

    if (nearestSame < Infinity && nearestOther < Infinity) {
      totalSame += Math.sqrt(nearestSame)
      totalOther += Math.sqrt(nearestOther)
      sampled++
    }
  }

  if (sampled === 0 || totalOther === 0) return 0
  return totalSame / totalOther
}

/** Shannon entropy of spatial particle distribution.
 *  Divides canvas into gridSize x gridSize bins and measures evenness. */
export function spatialEntropy(
  p: ParticleData,
  width: number,
  height: number,
  gridSize = 8,
): number {
  const bins = new Float64Array(gridSize * gridSize)
  for (let i = 0; i < p.count; i++) {
    const col = Math.min(gridSize - 1, Math.max(0, Math.floor((p.x[i]! / width) * gridSize)))
    const row = Math.min(gridSize - 1, Math.max(0, Math.floor((p.y[i]! / height) * gridSize)))
    bins[row * gridSize + col]!++
  }

  let entropy = 0
  const total = p.count
  if (total === 0) return 0

  for (let i = 0; i < bins.length; i++) {
    const prob = bins[i]! / total
    if (prob > 0) {
      entropy -= prob * Math.log2(prob)
    }
  }
  return entropy
}

/** Moran's I spatial autocorrelation of particle types.
 *  Uses sampling for performance. Range: -1 (dispersed) to +1 (clustered). */
export function moransI(
  p: ParticleData,
  width: number,
  height: number,
  numTypes: number,
): number {
  if (p.count < 20) return 0
  const sampleSize = Math.min(p.count, 150)
  const step = Math.max(1, Math.floor(p.count / sampleSize))

  // Build sampled indices
  const indices: number[] = []
  for (let i = 0; i < p.count; i += step) {
    indices.push(i)
  }
  const n = indices.length
  if (n < 10) return 0

  // Mean type value
  let sum = 0
  for (const i of indices) sum += p.type[i]!
  const mean = sum / n

  // Distance threshold for "neighbors"
  const threshold = Math.min(width, height) * 0.15
  const t2 = threshold * threshold

  let numerator = 0
  let denominator = 0
  let W = 0

  for (let a = 0; a < n; a++) {
    const i = indices[a]!
    const xi = p.type[i]! - mean
    denominator += xi * xi

    for (let b = a + 1; b < n; b++) {
      const j = indices[b]!
      const d2 = (p.x[i]! - p.x[j]!) ** 2 + (p.y[i]! - p.y[j]!) ** 2
      if (d2 < t2 && d2 > 0) {
        const xj = p.type[j]! - mean
        numerator += xi * xj
        W++
      }
    }
  }

  if (W === 0 || denominator === 0) return 0
  return (n * numerator) / (W * denominator)
}

/** Mean squared displacement from initial positions */
export function meanSquaredDisplacement(p: ParticleData): number {
  if (p.count === 0) return 0
  let sum = 0
  for (let i = 0; i < p.count; i++) {
    sum += (p.x[i]! - p.x0[i]!) ** 2 + (p.y[i]! - p.y0[i]!) ** 2
  }
  return sum / p.count
}

/** Cluster detection using simple distance-based union-find.
 *  Groups particles within `epsilon` distance. Returns count and sizes. */
export function detectClusters(
  p: ParticleData,
  epsilon: number,
): { count: number; largestCluster: number } {
  if (p.count < 2) return { count: p.count, largestCluster: p.count }

  const parent = new Int32Array(p.count)
  const rank = new Uint8Array(p.count)
  const size = new Int32Array(p.count)
  for (let i = 0; i < p.count; i++) { parent[i] = i; size[i] = 1 }

  function find(x: number): number {
    while (parent[x] !== x) { parent[x] = parent[parent[x]!]!; x = parent[x]! }
    return x
  }

  function union(a: number, b: number) {
    const ra = find(a), rb = find(b)
    if (ra === rb) return
    if (rank[ra]! < rank[rb]!) { parent[ra] = rb; size[rb]! += size[ra]! }
    else if (rank[ra]! > rank[rb]!) { parent[rb] = ra; size[ra]! += size[rb]! }
    else { parent[rb] = ra; size[ra]! += size[rb]!; rank[ra]!++ }
  }

  const eps2 = epsilon * epsilon
  // Use sampling for large particle counts
  const sampleSize = Math.min(p.count, 800)
  const step = Math.max(1, Math.floor(p.count / sampleSize))

  for (let i = 0; i < p.count; i += step) {
    for (let j = i + 1; j < p.count; j++) {
      const d2 = (p.x[i]! - p.x[j]!) ** 2 + (p.y[i]! - p.y[j]!) ** 2
      if (d2 < eps2) union(i, j)
    }
  }

  const roots = new Set<number>()
  let largest = 0
  for (let i = 0; i < p.count; i++) {
    const r = find(i)
    roots.add(r)
    if (size[r]! > largest) largest = size[r]!
  }

  return { count: roots.size, largestCluster: largest }
}

/** Velocity distribution histogram */
export function velocityDistribution(
  p: ParticleData,
  bins = 20,
): VelocityBin[] {
  // Find max speed
  let maxSpeed = 0
  for (let i = 0; i < p.count; i++) {
    const s = Math.sqrt(p.vx[i]! * p.vx[i]! + p.vy[i]! * p.vy[i]!)
    if (s > maxSpeed) maxSpeed = s
  }
  if (maxSpeed === 0) maxSpeed = 1

  const hist = new Uint32Array(bins)
  const binWidth = maxSpeed / bins

  for (let i = 0; i < p.count; i++) {
    const s = Math.sqrt(p.vx[i]! * p.vx[i]! + p.vy[i]! * p.vy[i]!)
    const b = Math.min(bins - 1, Math.floor(s / binWidth))
    hist[b]!++
  }

  return Array.from(hist).map((count, i) => ({
    speed: (i + 0.5) * binWidth,
    count,
  }))
}

/** Cooperation/aggression proxy metrics.
 *  Measures the fraction of active pairwise interactions that are attractive (cooperation)
 *  vs repulsive (aggression), weighted by force magnitude. Uses sampling for performance. */
export function cooperationMetrics(
  p: ParticleData,
  rules: number[][] | null,
  radius: number,
): { cooperation: number; aggression: number; neutral: number; perType: { cooperation: number; aggression: number }[] } {
  if (!rules || p.count < 2) {
    return { cooperation: 0, aggression: 0, neutral: 1, perType: [] }
  }

  const numTypes = rules.length
  const r2 = radius * radius
  const sampleSize = Math.min(p.count, 300)
  const step = Math.max(1, Math.floor(p.count / sampleSize))

  let totalAttract = 0
  let totalRepel = 0
  let totalNeutral = 0

  // Per-type accumulators
  const typeAttract = new Float64Array(numTypes)
  const typeRepel = new Float64Array(numTypes)
  const typeTotal = new Float64Array(numTypes)

  for (let i = 0; i < p.count; i += step) {
    const ax = p.x[i]!
    const ay = p.y[i]!
    const aType = p.type[i]!

    for (let j = i + 1; j < p.count; j++) {
      const d2 = (ax - p.x[j]!) ** 2 + (ay - p.y[j]!) ** 2
      if (d2 >= r2 || d2 === 0) continue

      const bType = p.type[j]!
      const gAB = rules[aType]?.[bType] ?? 0
      const gBA = rules[bType]?.[aType] ?? 0
      const avgForce = (gAB + gBA) / 2

      if (avgForce > 0.01) {
        totalAttract++
        typeAttract[aType]!++
        typeAttract[bType]!++
      } else if (avgForce < -0.01) {
        totalRepel++
        typeRepel[aType]!++
        typeRepel[bType]!++
      } else {
        totalNeutral++
      }
      typeTotal[aType]!++
      typeTotal[bType]!++
    }
  }

  const total = totalAttract + totalRepel + totalNeutral
  const perType = Array.from({ length: numTypes }, (_, t) => ({
    cooperation: typeTotal[t]! > 0 ? typeAttract[t]! / typeTotal[t]! : 0,
    aggression: typeTotal[t]! > 0 ? typeRepel[t]! / typeTotal[t]! : 0,
  }))

  return {
    cooperation: total > 0 ? totalAttract / total : 0,
    aggression: total > 0 ? totalRepel / total : 0,
    neutral: total > 0 ? totalNeutral / total : 1,
    perType,
  }
}

/** Compute all stats at once */
export function computeAllStats(
  p: ParticleData,
  width: number,
  height: number,
  numTypes: number,
  tick: number,
  radius?: number,
  rules?: number[][] | null,
): SimulationStats {
  const r = radius ?? 60
  const clusters = detectClusters(p, r)
  const coop = cooperationMetrics(p, rules ?? null, r)
  return {
    tick,
    energy: kineticEnergy(p),
    segregation: segregationIndex(p),
    spatialEntropy: spatialEntropy(p, width, height),
    moransI: moransI(p, width, height, numTypes),
    msd: meanSquaredDisplacement(p),
    clusterCount: clusters.count,
    largestCluster: clusters.largestCluster,
    velocityDist: velocityDistribution(p, 16),
    cooperation: coop.cooperation,
    aggression: coop.aggression,
    perTypeCooperation: coop.perType,
  }
}

/** Detect phase transitions by checking if metric derivatives exceed 3 sigma.
 *  Returns transitions detected in the most recent sample. */
export function detectPhaseTransitions(
  history: SimulationStats[],
  windowSize = 20,
): PhaseTransition[] {
  if (history.length < windowSize + 2) return []

  const transitions: PhaseTransition[] = []
  const metricKeys = ['energy', 'segregation', 'spatialEntropy', 'moransI'] as const
  const recent = history.slice(-windowSize - 1)

  for (const key of metricKeys) {
    // Compute derivatives
    const derivatives: number[] = []
    for (let i = 1; i < recent.length; i++) {
      const curr = recent[i]![key as keyof SimulationStats] as number
      const prev = recent[i - 1]![key as keyof SimulationStats] as number
      derivatives.push(curr - prev)
    }

    // Mean and std of derivatives (excluding last)
    const n = derivatives.length - 1
    if (n < 5) continue
    const windowDerivs = derivatives.slice(0, n)
    const mean = windowDerivs.reduce((s, v) => s + v, 0) / n
    const variance = windowDerivs.reduce((s, v) => s + (v - mean) ** 2, 0) / n
    const std = Math.sqrt(variance)
    if (std < 1e-10) continue

    // Check if latest derivative exceeds threshold
    const latest = derivatives[derivatives.length - 1]!
    const sigma = Math.abs((latest - mean) / std)
    if (sigma > 3) {
      transitions.push({
        tick: recent[recent.length - 1]!.tick,
        metric: key,
        magnitude: sigma,
      })
    }
  }

  return transitions
}
