// node --experimental-strip-types apps/web/src/components/evidence/cognitive-lab/__tests__/clustering.test.mjs

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../../../../../../')
const annaPath = resolve(repoRoot, 'apps/web/public/data/anna-matrix-min.json')
const conceptsPath = resolve(repoRoot, 'apps/web/public/data/phase_n/concepts.json')

const { packSignMatrix, aitFastInference } = await import('../evolution/ait-fast.ts')
const { checkStability } = await import('../evolution/concept-discovery.ts')
const { kmeans, meanSilhouette, pairwiseHamming, hierarchicalCluster, hammingDistance } = await import('../evolution/clustering.ts')
const { mulberry32 } = await import('../evolution/rng.ts')

function signWeights(M) {
  const W = new Int8Array(M.length)
  for (let i = 0; i < M.length; i++) {
    const v = M[i]
    W[i] = v > 0 ? 1 : v < 0 ? -1 : 0
  }
  return W
}

const annaJson = JSON.parse(readFileSync(annaPath, 'utf-8'))
const conceptsJson = JSON.parse(readFileSync(conceptsPath, 'utf-8'))
const concepts = Array.isArray(conceptsJson) ? conceptsJson : conceptsJson.concepts
const annaSign = signWeights(new Int8Array(annaJson.matrix.flat()))
const annaPacked = packSignMatrix(annaSign)

// Test 1: pairwise Hamming + hierarchical cluster on Anna's 19 centroids
const centroidVecs = concepts.map((c) => c.centroid)
const D = pairwiseHamming(centroidVecs)
if (D.length !== 19) {
  console.error(`FAIL: pairwise matrix length ${D.length}, expected 19`)
  process.exit(1)
}
// Antipodal pairs should have D[i][j] = 64
let pairCount = 0
for (let i = 0; i < 19; i++) {
  for (let j = i + 1; j < 19; j++) if (D[i][j] === 64) pairCount++
}
if (pairCount !== 8) {
  console.error(`FAIL: expected 8 antipodal pairs (D=64), got ${pairCount}`)
  process.exit(1)
}

const root = hierarchicalCluster(D)
if (root.members.length !== 19) {
  console.error(`FAIL: root cluster has ${root.members.length} members, expected 19`)
  process.exit(1)
}
if (root.height < 1 || root.height > 64) {
  console.error(`FAIL: root height ${root.height} outside [1, 64]`)
  process.exit(1)
}

// Test 2: k-means with k=19 on Anna's actual concept centroids should recover them
// We use the centroids themselves as data — should produce k=19 trivial clusters
const km = kmeans(centroidVecs, 19, { seed: 42 })
if (km.centroids.length !== 19) {
  console.error(`FAIL: k-means produced ${km.centroids.length} centroids, expected 19`)
  process.exit(1)
}
if (km.inertia > 100) {
  console.error(`FAIL: k-means on centroids should have low inertia, got ${km.inertia}`)
  process.exit(1)
}

// Test 3: Stable-input clustering — sample some inputs, filter stable, cluster
// This is the real emergence test we'll run live
const stable = []
const rng = mulberry32(0xc105e5)
const SAMPLES = 256 // small for the test
for (let s = 0; s < SAMPLES; s++) {
  const u = new Int8Array(64)
  for (let i = 0; i < 64; i++) u[i] = rng() < 0.5 ? 1 : -1
  const r = checkStability(annaPacked, u, 4, 4.0)
  if (r.stable) stable.push(Array.from(r.output))
}

if (stable.length < 5) {
  console.error(`FAIL: only ${stable.length} stable inputs in 256 samples (expected ≥ 5)`)
  process.exit(1)
}

// Silhouette sweep at k=2..min(15, stable.length-1) — should peak somewhere reasonable
let bestK = 2
let bestSilh = -1
const sweep = {}
const maxK = Math.min(12, stable.length - 1)
for (let k = 2; k <= maxK; k++) {
  const km2 = kmeans(stable, k, { seed: 7 })
  const s = meanSilhouette(stable, km2.assignments, k, 100)
  sweep[k] = s
  if (s > bestSilh) {
    bestSilh = s
    bestK = k
  }
}

console.log(`PASS: clustering verified on Anna's 19 centroids.
  pairwise: 19 × 19 matrix · ${pairCount} antipodal pairs at D=64 (expected 8) ✓
  hierarchical: ${root.members.length} leaves · root height ${root.height} ✓
  k-means@k=19 on centroids: ${km.centroids.length} centroids, inertia ${km.inertia} ✓
  stable basins from ${SAMPLES} samples: ${stable.length} (${(stable.length/SAMPLES*100).toFixed(1)}%)
  silhouette sweep k=2..${maxK}: best k=${bestK} silhouette=${bestSilh.toFixed(3)}
  Full sweep: ${Object.entries(sweep).map(([k, s]) => `${k}:${s.toFixed(2)}`).join(' · ')}`)
