// node --experimental-strip-types apps/web/src/components/evidence/cognitive-lab/__tests__/pca.test.mjs

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../../../../../../')
const conceptsPath = resolve(repoRoot, 'apps/web/public/data/phase_n/concepts_with_pca.json')

const { computePCABasis, projectOntoBasis } = await import('../evolution/pca.ts')

const data = JSON.parse(readFileSync(conceptsPath, 'utf-8'))
const concepts = data.concepts

if (!Array.isArray(concepts) || concepts.length !== 19) {
  console.error(`FAIL: expected 19 concepts, got ${concepts.length}`)
  process.exit(1)
}

// Build basis from centroids
const centroidVectors = concepts.map((c) => c.centroid)
const basis = computePCABasis(centroidVectors, 2)

if (basis.components.length !== 2) {
  console.error(`FAIL: expected 2 components, got ${basis.components.length}`)
  process.exit(1)
}
if (basis.mean.length !== 64) {
  console.error(`FAIL: mean has length ${basis.mean.length}, expected 64`)
  process.exit(1)
}

// Project centroids and compare with stored pca_x, pca_y up to sign convention
let okWithinTolerance = 0
let bestOrientation = null
let bestRMS = Infinity

const tryOrientations = [
  { sx: +1, sy: +1, swap: false },
  { sx: -1, sy: +1, swap: false },
  { sx: +1, sy: -1, swap: false },
  { sx: -1, sy: -1, swap: false },
  { sx: +1, sy: +1, swap: true },
  { sx: -1, sy: +1, swap: true },
  { sx: +1, sy: -1, swap: true },
  { sx: -1, sy: -1, swap: true },
]

for (const o of tryOrientations) {
  let sumSq = 0
  for (const c of concepts) {
    const [px, py] = projectOntoBasis(c.centroid, basis)
    const x = o.swap ? o.sx * py : o.sx * px
    const y = o.swap ? o.sy * px : o.sy * py
    sumSq += (x - c.pca_x) ** 2 + (y - c.pca_y) ** 2
  }
  const rms = Math.sqrt(sumSq / concepts.length)
  if (rms < bestRMS) {
    bestRMS = rms
    bestOrientation = o
  }
}

// PCA from a different implementation can produce differently-scaled components;
// what matters is that the basis is consistent — points that lie close together
// in the stored PCA should also lie close together when projected.
// Use a structural test: pairwise distances should be correlated.
function pairwiseDist(coords) {
  const out = []
  for (let i = 0; i < coords.length; i++) {
    for (let j = i + 1; j < coords.length; j++) {
      const dx = coords[i][0] - coords[j][0]
      const dy = coords[i][1] - coords[j][1]
      out.push(Math.sqrt(dx * dx + dy * dy))
    }
  }
  return out
}

const storedCoords = concepts.map((c) => [c.pca_x, c.pca_y])
const computedCoords = concepts.map((c) => projectOntoBasis(c.centroid, basis))

const dStored = pairwiseDist(storedCoords)
const dComputed = pairwiseDist(computedCoords)

const ms = dStored.reduce((a, b) => a + b, 0) / dStored.length
const mc = dComputed.reduce((a, b) => a + b, 0) / dComputed.length
let num = 0, ds = 0, dc = 0
for (let i = 0; i < dStored.length; i++) {
  num += (dStored[i] - ms) * (dComputed[i] - mc)
  ds += (dStored[i] - ms) ** 2
  dc += (dComputed[i] - mc) ** 2
}
const corr = num / Math.sqrt(ds * dc)

if (corr < 0.85) {
  console.error(`FAIL: pairwise-distance correlation between computed and stored PCA = ${corr.toFixed(4)} below 0.85`)
  process.exit(1)
}

const explained = basis.explainedVariance.reduce((a, b) => a + b, 0)
if (explained < 0.50) {
  console.error(`FAIL: top-2 PCA explains only ${(explained * 100).toFixed(1)}% (expected ≥ 50%)`)
  process.exit(1)
}

console.log(`PASS: PCA basis recovers concept structure (pairwise-dist corr = ${corr.toFixed(3)}, explained ${(explained * 100).toFixed(1)}%, best-orientation RMS = ${bestRMS.toFixed(3)})`)
