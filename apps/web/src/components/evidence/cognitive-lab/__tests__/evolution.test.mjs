// node --experimental-strip-types apps/web/src/components/evidence/cognitive-lab/__tests__/evolution.test.mjs

const { runEvolution } = await import('../evolution/matrix-pop.ts')
const { mulberry32 } = await import('../evolution/rng.ts')

const seed = 42
const popSize = 16
const generations = 20
const samplesPerScore = 8

const t0 = performance.now()

const r1 = mulberry32(seed)
const result1 = runEvolution({
  popSize, generations, samplesPerScore,
  mutationRate: 0.02, eliteFraction: 0.25,
  scoringMode: 'hyperidentity',
  rng: r1,
})

const r2 = mulberry32(seed)
const result2 = runEvolution({
  popSize, generations, samplesPerScore,
  mutationRate: 0.02, eliteFraction: 0.25,
  scoringMode: 'hyperidentity',
  rng: r2,
})

const elapsed = performance.now() - t0

if (result1.history.length !== generations + 1) {
  console.error(`FAIL: history length ${result1.history.length} != ${generations + 1}`)
  process.exit(1)
}

const final1 = result1.history[generations].fitness.best
const final2 = result2.history[generations].fitness.best
if (Math.abs(final1 - final2) > 1e-9) {
  console.error(`FAIL: deterministic evolution broken — ${final1} vs ${final2}`)
  process.exit(1)
}

const initial = result1.history[0].fitness.best
const final = result1.history[generations].fitness.best
if (final < initial - 0.01) {
  console.error(`FAIL: best fitness decreased ${initial} -> ${final}`)
  process.exit(1)
}

console.log(
  `PASS: deterministic ${generations}-gen evolution: ${initial.toFixed(3)} -> ${final.toFixed(3)} in ${elapsed.toFixed(0)}ms (2 runs)`,
)
