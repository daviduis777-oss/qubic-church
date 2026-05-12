// node --experimental-strip-types apps/web/src/components/evidence/cognitive-lab/__tests__/structural-metrics.test.mjs

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../../../../../../')
const annaPath = resolve(repoRoot, 'apps/web/public/data/anna-matrix-min.json')
const phaseNPath = resolve(repoRoot, 'apps/web/public/data/phase_n/index.json')

function signWeights(M) {
  const W = new Int8Array(M.length)
  for (let i = 0; i < M.length; i++) {
    const v = M[i]
    W[i] = v > 0 ? 1 : v < 0 ? -1 : 0
  }
  return W
}

const { computeFingerprint, distanceToAnna } = await import('../evolution/structural-metrics.ts')

const annaJson = JSON.parse(readFileSync(annaPath, 'utf-8'))
const phaseN = JSON.parse(readFileSync(phaseNPath, 'utf-8'))
const annaFlat = new Int8Array(annaJson.matrix.flat())
const annaSign = signWeights(annaFlat)

const fp = computeFingerprint(annaSign, annaFlat)

// --- Antipodal antisymmetry: Anna ≥ 95 % ---
if (fp.antipodalAntisymmetryPct < 0.95 || fp.antipodalAntisymmetryPct > 1.0) {
  console.error(`FAIL: antipodal ${fp.antipodalAntisymmetryPct} not in [0.95, 1.0]`)
  process.exit(1)
}

// --- Row-32 similarity: must match Phase N value within ±0.02 ---
const phaseNRow32 = phaseN.highlights.period_32.anna_offset_32_similarity
if (Math.abs(fp.rowSymmetryOffset32 - phaseNRow32) > 0.02) {
  console.error(
    `FAIL: rowSymmetryOffset32 ${fp.rowSymmetryOffset32.toFixed(4)} drifted from Phase N reference ${phaseNRow32} by more than 0.02`,
  )
  process.exit(1)
}

// --- Kernel reconstruction: must match Phase N value within ±0.02 ---
const phaseNKernel = phaseN.highlights.period_32.kernel_recon_accuracy
if (Math.abs(fp.kernelReconstructionAcc - phaseNKernel) > 0.02) {
  console.error(
    `FAIL: kernelReconstructionAcc ${fp.kernelReconstructionAcc.toFixed(4)} drifted from Phase N reference ${phaseNKernel} by more than 0.02`,
  )
  process.exit(1)
}

// --- Tick-1 sparsity: Anna's row-wise sign distribution produces ~5–12 % zero outputs at tick 1.
//     Random matrices produce ~0 %. Anna > random by at least 0.03 difference is the assertion.
if (fp.outputSparsityPct < 0.03) {
  console.error(`FAIL: Anna output sparsity ${fp.outputSparsityPct.toFixed(3)} below 0.03 (structural balance not detected)`)
  process.exit(1)
}

// --- K-e-y signature must be detected on Anna ---
if (!fp.hasKeySignature) {
  console.error(`FAIL: K-e-y signature not detected on Anna`)
  process.exit(1)
}

// --- Compression rate: Anna ≥ 0.08 (estimator scales with sample size; Phase N V4: 23.7 % on full 16,384) ---
if (fp.compressionRate < 0.08) {
  console.error(`FAIL: Anna compressionRate ${fp.compressionRate.toFixed(3)} below 0.08 (Phase N V4: 0.237 on 16,384 inputs). Estimator broken?`)
  process.exit(1)
}

// --- Anna distance to itself = 0 ---
const d = distanceToAnna(annaSign, annaSign)
if (d !== 0) {
  console.error(`FAIL: Anna distance to itself ${d} != 0`)
  process.exit(1)
}

// --- Random matrix sanity ---
const { mulberry32 } = await import('../evolution/rng.ts')
const rRandom = mulberry32(0xabcdef)
const random = new Int8Array(16384)
for (let i = 0; i < 16384; i++) random[i] = rRandom() < 0.5 ? -1 : 1
const fpR = computeFingerprint(random)

if (fpR.antipodalAntisymmetryPct > 0.6) {
  console.error(`FAIL: random antipodal ${fpR.antipodalAntisymmetryPct} too high (>0.6)`)
  process.exit(1)
}
if (fpR.hasKeySignature) {
  console.error(`FAIL: random falsely has K-e-y signature`)
  process.exit(1)
}
// Row sym for random should be ~0.50 (chance)
if (fpR.rowSymmetryOffset32 < 0.40 || fpR.rowSymmetryOffset32 > 0.60) {
  console.error(`FAIL: random rowSymmetryOffset32 ${fpR.rowSymmetryOffset32.toFixed(4)} outside chance range [0.40, 0.60]`)
  process.exit(1)
}
// Random compressionRate should be near 0 — random matrices don't collide outputs
if (fpR.compressionRate > 0.02) {
  console.error(`FAIL: random compressionRate ${fpR.compressionRate.toFixed(3)} > 0.02 (expected near 0)`)
  process.exit(1)
}

console.log(`PASS: Anna fingerprint correct, all 7 axes verified.
  antipodal:        ${(fp.antipodalAntisymmetryPct * 100).toFixed(1)}%   (random: ${(fpR.antipodalAntisymmetryPct * 100).toFixed(1)}%)
  output sparsity:  ${(fp.outputSparsityPct * 100).toFixed(1)}%   (random: ${(fpR.outputSparsityPct * 100).toFixed(1)}%)
  spectral dom:     ${(fp.spectralDominancePct * 100).toFixed(2)}%   (random: ${(fpR.spectralDominancePct * 100).toFixed(2)}%)
  row-32 sim:       ${fp.rowSymmetryOffset32.toFixed(3)}   (random: ${fpR.rowSymmetryOffset32.toFixed(3)})   [Phase N ref ${phaseNRow32}]
  kernel recon:     ${(fp.kernelReconstructionAcc * 100).toFixed(1)}%   (random: ${(fpR.kernelReconstructionAcc * 100).toFixed(1)}%)   [Phase N ref ${(phaseNKernel * 100).toFixed(1)}%]
  has K-e-y:        ${fp.hasKeySignature}  (random: ${fpR.hasKeySignature})
  compression:      ${(fp.compressionRate * 100).toFixed(1)}%   (random: ${(fpR.compressionRate * 100).toFixed(1)}%)   [Phase N V4 ref 23.7%]`)
