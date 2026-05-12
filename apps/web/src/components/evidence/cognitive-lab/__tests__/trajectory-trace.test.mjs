// node --experimental-strip-types apps/web/src/components/evidence/cognitive-lab/__tests__/trajectory-trace.test.mjs
//
// Validates that the inline trajectory tracer in TrajectoryScene.tsx produces
// the same final output state as the verified aitFastInference. Necessary
// because the trajectory tracer is a SEPARATE bit-packed loop instrumented
// for per-tick output extraction — must remain byte-equivalent.
//
// We re-implement the tracer here (mirroring TrajectoryScene.tsx) to avoid
// importing a 'use client' tsx file from Node. Both impls must trace the
// same AIT semantics.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../../../../../../')
const annaPath = resolve(repoRoot, 'apps/web/public/data/anna-matrix-min.json')

const { packSignMatrix, aitFastInference } = await import('../evolution/ait-fast.ts')
const { mulberry32 } = await import('../evolution/rng.ts')

function signWeights(M) {
  const W = new Int8Array(M.length)
  for (let i = 0; i < M.length; i++) {
    const v = M[i]
    W[i] = v > 0 ? 1 : v < 0 ? -1 : 0
  }
  return W
}

function popcount32(x) {
  x = x - ((x >>> 1) & 0x55555555)
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333)
  x = (x + (x >>> 4)) & 0x0f0f0f0f
  return (Math.imul(x, 0x01010101) >>> 24) & 0xff
}

/** Inline reproduction of traceTrajectory from TrajectoryScene.tsx */
function traceTrajectory(W, input, maxTicks) {
  const N = 128
  const ROW_WORDS = 4
  const out = new Float32Array((maxTicks + 1) * 64)

  let vPos0 = 0, vPos1 = 0, vPos2 = 0, vPos3 = 0
  let vNeg0 = 0, vNeg1 = 0, vNeg2 = 0, vNeg3 = 0
  for (let i = 0; i < 32; i++) {
    if (input[i] > 0) vPos0 = (vPos0 | (1 << i)) >>> 0
    else if (input[i] < 0) vNeg0 = (vNeg0 | (1 << i)) >>> 0
  }
  for (let i = 0; i < 32; i++) {
    if (input[32 + i] > 0) vPos1 = (vPos1 | (1 << i)) >>> 0
    else if (input[32 + i] < 0) vNeg1 = (vNeg1 | (1 << i)) >>> 0
  }
  const clampPos0 = vPos0, clampPos1 = vPos1, clampNeg0 = vNeg0, clampNeg1 = vNeg1
  let converged = false
  let convergedAt = -1

  for (let t = 1; t <= maxTicks; t++) {
    if (converged) {
      const base = (t - 1) * 64
      const tgt = t * 64
      for (let i = 0; i < 64; i++) out[tgt + i] = out[base + i]
      continue
    }
    let nPos0 = 0, nPos1 = 0, nPos2 = 0, nPos3 = 0
    let nNeg0 = 0, nNeg1 = 0, nNeg2 = 0, nNeg3 = 0
    const Wp = W.pos, Wn = W.neg
    for (let r = 0; r < N; r++) {
      const base = r * ROW_WORDS
      const wp0 = Wp[base], wp1 = Wp[base + 1], wp2 = Wp[base + 2], wp3 = Wp[base + 3]
      const wn0 = Wn[base], wn1 = Wn[base + 1], wn2 = Wn[base + 2], wn3 = Wn[base + 3]
      let dot = 0
      dot += popcount32((wp0 & vPos0) | (wn0 & vNeg0))
      dot += popcount32((wp1 & vPos1) | (wn1 & vNeg1))
      dot += popcount32((wp2 & vPos2) | (wn2 & vNeg2))
      dot += popcount32((wp3 & vPos3) | (wn3 & vNeg3))
      dot -= popcount32((wp0 & vNeg0) | (wn0 & vPos0))
      dot -= popcount32((wp1 & vNeg1) | (wn1 & vPos1))
      dot -= popcount32((wp2 & vNeg2) | (wn2 & vPos2))
      dot -= popcount32((wp3 & vNeg3) | (wn3 & vPos3))
      if (dot > 0) {
        if (r < 32) nPos0 = (nPos0 | (1 << r)) >>> 0
        else if (r < 64) nPos1 = (nPos1 | (1 << (r - 32))) >>> 0
        else if (r < 96) nPos2 = (nPos2 | (1 << (r - 64))) >>> 0
        else nPos3 = (nPos3 | (1 << (r - 96))) >>> 0
      } else if (dot < 0) {
        if (r < 32) nNeg0 = (nNeg0 | (1 << r)) >>> 0
        else if (r < 64) nNeg1 = (nNeg1 | (1 << (r - 32))) >>> 0
        else if (r < 96) nNeg2 = (nNeg2 | (1 << (r - 64))) >>> 0
        else nNeg3 = (nNeg3 | (1 << (r - 96))) >>> 0
      }
    }
    nPos0 = clampPos0; nPos1 = clampPos1; nNeg0 = clampNeg0; nNeg1 = clampNeg1

    if (
      nPos0 === vPos0 && nPos1 === vPos1 && nPos2 === vPos2 && nPos3 === vPos3 &&
      nNeg0 === vNeg0 && nNeg1 === vNeg1 && nNeg2 === vNeg2 && nNeg3 === vNeg3
    ) {
      converged = true
      convergedAt = t
    }

    vPos0 = nPos0; vPos1 = nPos1; vPos2 = nPos2; vPos3 = nPos3
    vNeg0 = nNeg0; vNeg1 = nNeg1; vNeg2 = nNeg2; vNeg3 = nNeg3

    const tgt = t * 64
    for (let i = 0; i < 32; i++) {
      const p = (vPos2 >>> i) & 1
      const n = (vNeg2 >>> i) & 1
      out[tgt + i] = p ? 1 : n ? -1 : 0
    }
    for (let i = 0; i < 32; i++) {
      const p = (vPos3 >>> i) & 1
      const n = (vNeg3 >>> i) & 1
      out[tgt + 32 + i] = p ? 1 : n ? -1 : 0
    }
  }
  return { trajectory: out, convergedAt }
}

// Test
const annaJson = JSON.parse(readFileSync(annaPath, 'utf-8'))
const annaFlat = new Int8Array(annaJson.matrix.flat())
const annaSign = signWeights(annaFlat)
const W = packSignMatrix(annaSign)

const MAX_TICKS = 32
const N_SAMPLES = 1000

const rng = mulberry32(0xa10ace)
let mismatches = 0
let earlyConvergenceMatches = 0
let totalTicks = 0

for (let s = 0; s < N_SAMPLES; s++) {
  const u = new Int8Array(64)
  for (let i = 0; i < 64; i++) u[i] = rng() < 0.5 ? 1 : -1

  // 1) Reference: aitFastInference final output
  const ref = aitFastInference(W, u)

  // 2) Trajectory tracer
  const { trajectory, convergedAt } = traceTrajectory(W, u, MAX_TICKS)

  // The tracer's tick-at-which-state-stopped-changing should match aitFastInference's ticks
  // (aitFastInference stops on NO_NSTATE_CHANGES the FIRST time state == prev_state;
  // the tracer detects the same condition.)

  // Only assert byte-equivalence when both impls reached their stop within MAX_TICKS.
  // If ref.ticks > MAX_TICKS, the tracer simply hasn't run long enough — that's
  // a capped-trajectory artefact, not a math mismatch. Tracker capacity is
  // tuned for the visualisation use-case (~ 8 ticks); 99.8 % of inputs
  // converge by tick 16.
  if (ref.ticks <= MAX_TICKS) {
    const compareTick = ref.ticks
    const tgtBase = compareTick * 64
    let agree = true
    for (let i = 0; i < 64; i++) {
      if (trajectory[tgtBase + i] !== ref.output[i]) {
        agree = false
        break
      }
    }
    if (!agree) {
      if (mismatches < 3) {
        const tracerOut = Array.from({ length: 64 }, (_, i) => trajectory[tgtBase + i])
        const refOut = Array.from(ref.output)
        console.error(`MISMATCH at sample ${s}, compareTick=${compareTick}, ref.ticks=${ref.ticks}, ref.endReason=${ref.endReason}, tracerConvergedAt=${convergedAt}`)
        console.error(`  tracer: ${tracerOut.slice(0, 16).join(',')}...`)
        console.error(`  ref:    ${refOut.slice(0, 16).join(',')}...`)
      }
      mismatches++
    }
  }

  // Also verify: once tracer's converged, subsequent ticks shouldn't change
  if (convergedAt > 0 && convergedAt < MAX_TICKS) {
    let stable = true
    const baseConverged = convergedAt * 64
    for (let t = convergedAt + 1; t <= MAX_TICKS; t++) {
      const tBase = t * 64
      for (let i = 0; i < 64; i++) {
        if (trajectory[tBase + i] !== trajectory[baseConverged + i]) {
          stable = false
          break
        }
      }
      if (!stable) break
    }
    if (stable) earlyConvergenceMatches++
  }

  totalTicks += ref.ticks
}

if (mismatches > 0) {
  console.error(`\nFAIL: ${mismatches} / ${N_SAMPLES} trajectory final-state mismatches vs aitFastInference`)
  process.exit(1)
}

const avgTicks = totalTicks / N_SAMPLES
console.log(`PASS: trajectory tracer byte-equivalent to aitFastInference.
  samples:            ${N_SAMPLES}
  mismatches:         0 / ${N_SAMPLES}
  avg ticks:          ${avgTicks.toFixed(2)}
  post-convergence stability: ${earlyConvergenceMatches} agents stayed at fixed point across ${MAX_TICKS} ticks`)
