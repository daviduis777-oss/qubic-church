// node apps/web/src/components/evidence/__tests__/evidence-data.test.mjs
//
// Checks the counts the /evidence page computes live from its data files,
// so a changed file cannot silently contradict the Key findings text.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const dataDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../public/data'
)
const load = f => JSON.parse(readFileSync(resolve(dataDir, f), 'utf8'))

const N = 128
const raw = load('anna-matrix.json').matrix
const clean = load('anna-matrix-clean.json').matrix
const fp = load('itu-fingerprint.json')

const count = pred => {
  let n = 0
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (pred(r, c)) n++
  return n
}
const breaks = m => count((r, c) => m[r][c] + m[N - 1 - r][N - 1 - c] !== -1)

assert.equal(breaks(raw), 68, 'mirror-rule breaks, transcribed')
assert.equal(breaks(clean), 0, 'mirror-rule breaks, corrected')
assert.equal(
  count((r, c) => raw[r][c] !== clean[r][c]),
  34,
  'differing cells'
)

const full = fp.runs.filter(r => r.regime.startsWith('full/'))
assert.equal(full.length, 100, 'full-table runs')
assert.equal(
  full.filter(r => r.d <= fp.near_threshold).length,
  10,
  'full-table runs near Anna'
)

const trained = fp.runs.filter(
  r => r.regime !== 'walk' && typeof r.best_ternary === 'number'
)
assert.equal(trained.length, 217, 'trained runs with best_ternary')
assert.equal(
  trained.filter(r => r.best_ternary >= fp.anna.best_ternary).length,
  2,
  'reach Anna best_ternary'
)

process.stdout.write('evidence data: all checks pass\n')
