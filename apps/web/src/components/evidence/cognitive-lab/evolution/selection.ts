import { mutate } from './mutation.ts'
import { packSignMatrix } from './ait-fast.ts'
import type { Matrix } from '../types.ts'

/**
 * Select top fraction by fitness, reproduce with mutation to fill population back.
 * Each elite survives unchanged. Remaining slots are filled by mutated copies of elites.
 */
export function selectAndReproduce(
  pop: Matrix[],
  eliteFraction: number,
  mutationRate: number,
  rng: () => number,
): Matrix[] {
  const sorted = [...pop].sort((a, b) => b.fitness - a.fitness)
  const eliteCount = Math.max(1, Math.floor(pop.length * eliteFraction))
  const elite = sorted.slice(0, eliteCount)
  const next: Matrix[] = []
  for (const e of elite) next.push(e)
  const remaining = pop.length - eliteCount
  for (let c = 0; c < remaining; c++) {
    const parent = elite[c % eliteCount]!
    const childW = mutate(parent.weights, mutationRate, rng)
    next.push({
      weights: childW,
      packed: packSignMatrix(childW),
      fitness: 0,
    })
  }
  return next
}
