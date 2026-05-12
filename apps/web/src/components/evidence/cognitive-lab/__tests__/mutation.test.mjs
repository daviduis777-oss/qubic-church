// node --experimental-strip-types apps/web/src/components/evidence/cognitive-lab/__tests__/mutation.test.mjs

const { mutate } = await import('../evolution/mutation.ts')
const { mulberry32 } = await import('../evolution/rng.ts')

const m1 = new Int8Array(16384)
for (let i = 0; i < 16384; i++) m1[i] = i % 2 === 0 ? 1 : -1

// Determinism: same seed → same result
const r1 = mulberry32(42)
const r2 = mulberry32(42)
const child1 = mutate(m1, 0.05, r1)
const child2 = mutate(m1, 0.05, r2)
let mismatches = 0
for (let i = 0; i < 16384; i++) {
  if (child1[i] !== child2[i]) mismatches++
}
if (mismatches !== 0) {
  console.error(`FAIL: deterministic mutation broken — ${mismatches} bytes differ`)
  process.exit(1)
}

// rate=0 → child == parent
const r0 = mulberry32(7)
const noMut = mutate(m1, 0, r0)
for (let i = 0; i < 16384; i++) {
  if (noMut[i] !== m1[i]) {
    console.error(`FAIL: rate=0 mutated cell ${i}`)
    process.exit(1)
  }
}

// rate=1.0 → every cell flips
const rAll = mulberry32(7)
const allMut = mutate(m1, 1.0, rAll)
for (let i = 0; i < 16384; i++) {
  if (allMut[i] !== -m1[i]) {
    console.error(`FAIL: rate=1.0 cell ${i} not flipped`)
    process.exit(1)
  }
}

// rate=0.1 → ~10% of cells differ (within ±4σ)
const r10 = mulberry32(13)
const partMut = mutate(m1, 0.1, r10)
let flips = 0
for (let i = 0; i < 16384; i++) if (partMut[i] !== m1[i]) flips++
const expected = 16384 * 0.1
const std = Math.sqrt(16384 * 0.1 * 0.9)
if (Math.abs(flips - expected) > 4 * std) {
  console.error(`FAIL: rate=0.1 produced ${flips} flips, expected ~${expected.toFixed(0)} ± ${(4 * std).toFixed(0)}`)
  process.exit(1)
}

console.log(`PASS: mutation deterministic + rate sanity (rate=0.1 gave ${flips} flips, expected ~${expected.toFixed(0)})`)
