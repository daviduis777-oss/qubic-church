// node --experimental-strip-types apps/web/src/components/evidence/cognitive-lab/__tests__/scoring.test.mjs

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../../../../../../')
const annaPath = resolve(repoRoot, 'apps/web/public/data/anna-matrix-min.json')

function signWeights(M) {
  const W = new Int8Array(M.length)
  for (let i = 0; i < M.length; i++) {
    const v = M[i]
    W[i] = v > 0 ? 1 : v < 0 ? -1 : 0
  }
  return W
}

const { packSignMatrix } = await import('../evolution/ait-fast.ts')
const { scoreHyperIdentity, scoreMultiTask, MULTITASK_NAMES } = await import('../evolution/scoring.ts')
const { mulberry32 } = await import('../evolution/rng.ts')

const annaJson = JSON.parse(readFileSync(annaPath, 'utf-8'))
const W = packSignMatrix(signWeights(new Int8Array(annaJson.matrix.flat())))

// Anna ~0.49
const r1 = mulberry32(42)
const annaHI = scoreHyperIdentity(W, 64, r1)
if (annaHI < 0.40 || annaHI > 0.65) {
  console.error(`FAIL: Anna HyperIdentity ${annaHI.toFixed(3)} outside [0.40, 0.65]`)
  process.exit(1)
}

// All-zero matrix → output all zero, never matches input ±1 → score 0
const zeroMatrix = packSignMatrix(new Int8Array(16384))
const r2 = mulberry32(42)
const zeroHI = scoreHyperIdentity(zeroMatrix, 32, r2)
if (zeroHI > 0.05) {
  console.error(`FAIL: zero matrix should score ~0, got ${zeroHI.toFixed(3)}`)
  process.exit(1)
}

// Identity-style matrix where W[64+i, i] = +1 → output bit i = input bit i → score 1.0
// Plus self-feedback W[i, i] = +1 to keep input clamped value passed through
const ident = new Int8Array(16384)
for (let i = 0; i < 64; i++) {
  ident[(64 + i) * 128 + i] = 1
}
const identPacked = packSignMatrix(ident)
const r3 = mulberry32(42)
const identHI = scoreHyperIdentity(identPacked, 32, r3)
if (identHI < 0.95) {
  console.error(`FAIL: identity matrix should score >0.95, got ${identHI.toFixed(3)}`)
  process.exit(1)
}

// Multi-task: 6-element vector, each in [0, 1]
const r4 = mulberry32(42)
const annaMT = scoreMultiTask(W, 8, r4)
if (annaMT.length !== MULTITASK_NAMES.length) {
  console.error(`FAIL: scoreMultiTask returned ${annaMT.length} scores, expected ${MULTITASK_NAMES.length}`)
  process.exit(1)
}
for (let i = 0; i < annaMT.length; i++) {
  if (annaMT[i] < 0 || annaMT[i] > 1) {
    console.error(`FAIL: scoreMultiTask[${MULTITASK_NAMES[i]}] = ${annaMT[i]} outside [0,1]`)
    process.exit(1)
  }
}

console.log(`PASS: Anna HI=${annaHI.toFixed(3)}, zero HI=${zeroHI.toFixed(3)}, ident HI=${identHI.toFixed(3)}`)
console.log(`  Multi-task Anna: ${annaMT.map((s, i) => `${MULTITASK_NAMES[i]}=${s.toFixed(3)}`).join(', ')}`)
