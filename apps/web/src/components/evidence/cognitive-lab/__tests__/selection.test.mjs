// node --experimental-strip-types apps/web/src/components/evidence/cognitive-lab/__tests__/selection.test.mjs

const { selectAndReproduce } = await import('../evolution/selection.ts')
const { mulberry32 } = await import('../evolution/rng.ts')
const { packSignMatrix } = await import('../evolution/ait-fast.ts')

const matrices = []
for (let i = 0; i < 8; i++) {
  const w = new Int8Array(16384)
  for (let j = 0; j < 16384; j++) w[j] = (i + j) % 2 === 0 ? 1 : -1
  matrices.push({ weights: w, packed: packSignMatrix(w), fitness: i / 8 })
}

const r = mulberry32(42)
const next = selectAndReproduce(matrices, 0.25, 0.02, r)

if (next.length !== 8) {
  console.error(`FAIL: expected 8 children, got ${next.length}`)
  process.exit(1)
}

const topElite = next.find((m) => m.fitness === 0.875)
if (!topElite) {
  console.error(`FAIL: top elite (fitness 0.875) did not survive`)
  process.exit(1)
}
const origTop = matrices[7].weights
for (let j = 0; j < 16384; j++) {
  if (topElite.weights[j] !== origTop[j]) {
    console.error(`FAIL: top elite mutated at byte ${j}`)
    process.exit(1)
  }
}

const children = next.filter((m) => m.fitness === 0)
if (children.length === 0) {
  console.error(`FAIL: no fitness-0 children found`)
  process.exit(1)
}

// Determinism
const r2 = mulberry32(42)
const next2 = selectAndReproduce(matrices, 0.25, 0.02, r2)
let mismatches = 0
for (let i = 0; i < next.length; i++) {
  for (let j = 0; j < 16384; j++) {
    if (next[i].weights[j] !== next2[i].weights[j]) mismatches++
  }
}
if (mismatches !== 0) {
  console.error(`FAIL: deterministic selection broken — ${mismatches} byte mismatches`)
  process.exit(1)
}

console.log(`PASS: top-25% selection preserved elite + deterministic`)
