// node --experimental-strip-types apps/web/src/components/evidence/cognitive-lab/__tests__/ait-fast.test.mjs
//
// Inlines the reference int8 AIT inference (mirrors apps/web/src/lib/ait/index.ts;
// already verified byte-equivalent to the C scanner over 16,384 attractors). Compares
// bit-packed `aitFastInference` from ../evolution/ait-fast.ts against this reference.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../../../../../../')
const annaPath = resolve(repoRoot, 'apps/web/public/data/anna-matrix-min.json')

const annaJson = JSON.parse(readFileSync(annaPath, 'utf-8'))
const annaFlat = new Int8Array(annaJson.matrix.flat())

// ─── Inline reference int8 AIT (mirrors lib/ait/index.ts) ───
const N_NEURONS = 128
const N_INPUTS = 64
const MAX_TICKS = 100

function signWeights(M) {
  const W = new Int8Array(M.length)
  for (let i = 0; i < M.length; i++) {
    const v = M[i]
    W[i] = v > 0 ? 1 : v < 0 ? -1 : 0
  }
  return W
}

function aitInferenceRef(W, input) {
  const v = new Int8Array(N_NEURONS)
  for (let i = 0; i < N_INPUTS; i++) v[i] = input[i]
  for (let i = N_INPUTS; i < N_NEURONS; i++) v[i] = 0

  let ticks = 0
  let endReason = 'TICK_CAP'
  for (let t = 1; t <= MAX_TICKS; t++) {
    const v_new = new Int8Array(N_NEURONS)
    for (let i = 0; i < N_NEURONS; i++) {
      let sum = 0
      const rowBase = i * N_NEURONS
      for (let j = 0; j < N_NEURONS; j++) {
        sum += W[rowBase + j] * v[j]
      }
      v_new[i] = sum > 0 ? 1 : sum < 0 ? -1 : 0
    }
    for (let i = 0; i < N_INPUTS; i++) v_new[i] = input[i]

    let allOutNonZero = true
    for (let i = N_INPUTS; i < N_NEURONS; i++) {
      if (v_new[i] === 0) { allOutNonZero = false; break }
    }
    if (allOutNonZero) {
      for (let i = 0; i < N_NEURONS; i++) v[i] = v_new[i]
      ticks = t
      endReason = 'NO_OUTPUT_ZEROES'
      break
    }
    let same = true
    for (let i = 0; i < N_NEURONS; i++) {
      if (v_new[i] !== v[i]) { same = false; break }
    }
    if (same) {
      for (let i = 0; i < N_NEURONS; i++) v[i] = v_new[i]
      ticks = t
      endReason = 'NO_NSTATE_CHANGES'
      break
    }
    for (let i = 0; i < N_NEURONS; i++) v[i] = v_new[i]
    ticks = t
  }
  const output = new Int8Array(N_INPUTS)
  for (let i = 0; i < N_INPUTS; i++) output[i] = v[N_INPUTS + i]
  return { output, ticks, endReason }
}

// ─── Load fast implementation ───
let aitFastInference, packSignMatrix
try {
  ;({ aitFastInference, packSignMatrix } = await import('../evolution/ait-fast.ts'))
} catch (e) {
  console.error('FAIL: ait-fast not loadable:', e.message)
  process.exit(1)
}

const W_int8 = signWeights(annaFlat)
const W_packed = packSignMatrix(W_int8)

// ─── Test ───
const N_TRIALS = 1000
let s = (42 * 0x9e3779b9) >>> 0
function rng() {
  s = (s + 0x6d2b79f5) >>> 0
  let t = s
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

let mismatches = 0
const examples = []
for (let trial = 0; trial < N_TRIALS; trial++) {
  const input = new Int8Array(64)
  for (let i = 0; i < 64; i++) input[i] = rng() < 0.5 ? -1 : 1

  const slow = aitInferenceRef(W_int8, input)
  const fast = aitFastInference(W_packed, input)

  let match = true
  for (let i = 0; i < 64; i++) {
    if (slow.output[i] !== fast.output[i]) {
      match = false
      if (examples.length < 3) examples.push({ trial, bit: i, slow: slow.output[i], fast: fast.output[i] })
      break
    }
  }
  if (!match) mismatches++
  if (slow.ticks !== fast.ticks) {
    if (examples.length < 5) examples.push({ trial, ticks: { slow: slow.ticks, fast: fast.ticks } })
  }
}

if (mismatches > 0) {
  console.error(`FAIL: ${mismatches}/${N_TRIALS} output mismatches`)
  for (const m of examples) console.error('  ', m)
  process.exit(1)
}

// Benchmark
const N_BENCH = 10000
const inputs = []
for (let i = 0; i < N_BENCH; i++) {
  const u = new Int8Array(64)
  for (let j = 0; j < 64; j++) u[j] = rng() < 0.5 ? -1 : 1
  inputs.push(u)
}
const t0 = performance.now()
for (const u of inputs) aitFastInference(W_packed, u)
const t1 = performance.now()
const us_per_inference = ((t1 - t0) * 1000) / N_BENCH
const max_us = 30
if (us_per_inference > max_us) {
  console.error(`FAIL: ${us_per_inference.toFixed(2)} µs/inference > ${max_us} µs budget`)
  process.exit(1)
}

console.log(
  `PASS: ${N_TRIALS}/${N_TRIALS} byte-equivalent · ${us_per_inference.toFixed(2)} µs/inference (budget ${max_us})`,
)
