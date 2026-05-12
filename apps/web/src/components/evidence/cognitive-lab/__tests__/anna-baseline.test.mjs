// node --experimental-strip-types apps/web/src/components/evidence/cognitive-lab/__tests__/anna-baseline.test.mjs
//
// Measures Anna's HyperIdentity score (output-i tracks input-i) on the exact
// scoring function visitors will see in Sub-module A. The result is baked
// into data-loader.ts as ANNA_HYPERIDENTITY_BASELINE.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../../../../../../')
const annaPath = resolve(repoRoot, 'apps/web/public/data/anna-matrix-min.json')

const annaJson = JSON.parse(readFileSync(annaPath, 'utf-8'))
const annaFlat = new Int8Array(annaJson.matrix.flat())

function signWeights(M) {
  const W = new Int8Array(M.length)
  for (let i = 0; i < M.length; i++) {
    const v = M[i]
    W[i] = v > 0 ? 1 : v < 0 ? -1 : 0
  }
  return W
}

const { aitFastInference, packSignMatrix } = await import('../evolution/ait-fast.ts')
const W = packSignMatrix(signWeights(annaFlat))

let s = 0xdeadbeef
function rng() {
  s = (s * 1664525 + 1013904223) >>> 0
  return s / 4294967296
}

const SAMPLES = 1000
let total = 0
for (let i = 0; i < SAMPLES; i++) {
  const u = new Int8Array(64)
  for (let b = 0; b < 64; b++) u[b] = rng() < 0.5 ? -1 : 1
  const result = aitFastInference(W, u)
  let matches = 0
  for (let b = 0; b < 64; b++) {
    if (u[b] === result.output[b]) matches++
  }
  total += matches / 64
}
const baseline = total / SAMPLES

console.log(`Anna HyperIdentity baseline (n=${SAMPLES} samples): ${baseline.toFixed(4)}`)
if (baseline < 0.40 || baseline > 0.65) {
  console.warn(`WARN: baseline ${baseline.toFixed(3)} outside expected [0.40, 0.65]`)
}

// Print copy-paste line for data-loader.ts
console.log(`\n// Copy this into data-loader.ts:`)
console.log(`export const ANNA_HYPERIDENTITY_BASELINE = ${baseline.toFixed(4)}`)
console.log(`PASS: baseline measured`)
