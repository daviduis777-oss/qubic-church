import { packSignMatrix } from './ait-fast.ts'
import { scoreHyperIdentity, scoreMultiTask } from './scoring.ts'
import { selectAndReproduce } from './selection.ts'
import type { Matrix, GenerationSnapshot, ScoringMode } from '../types.ts'

export interface EvolutionParams {
  popSize: number
  generations: number
  samplesPerScore: number
  mutationRate: number
  eliteFraction: number
  scoringMode: ScoringMode
  rng: () => number
}

export interface EvolutionResult {
  finalPopulation: Matrix[]
  history: GenerationSnapshot[]
}

function initialPopulation(size: number, rng: () => number): Matrix[] {
  const out: Matrix[] = []
  for (let i = 0; i < size; i++) {
    const w = new Int8Array(16384)
    for (let j = 0; j < 16384; j++) w[j] = rng() < 0.5 ? -1 : 1
    out.push({ weights: w, packed: packSignMatrix(w), fitness: 0 })
  }
  return out
}

function snapshotFromPopulation(pop: Matrix[], gen: number): GenerationSnapshot {
  const fits = pop.map((m) => m.fitness)
  const sorted = [...fits].sort((a, b) => b - a)
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0
  return {
    generation: gen,
    fitness: {
      best: sorted[0] ?? 0,
      median,
      worst: sorted[sorted.length - 1] ?? 0,
      mean: fits.reduce((a, b) => a + b, 0) / fits.length,
    },
    bestDistanceToAnna: 0,
  }
}

function scoreOne(m: Matrix, mode: ScoringMode, samples: number, rng: () => number): number {
  if (mode === 'hyperidentity') return scoreHyperIdentity(m.packed, samples, rng)
  const v = scoreMultiTask(m.packed, samples, rng)
  return v.reduce((a, b) => a + b, 0) / v.length
}

export function runEvolution(params: EvolutionParams): EvolutionResult {
  let pop = initialPopulation(params.popSize, params.rng)
  for (const m of pop) m.fitness = scoreOne(m, params.scoringMode, params.samplesPerScore, params.rng)
  const history: GenerationSnapshot[] = [snapshotFromPopulation(pop, 0)]

  for (let g = 1; g <= params.generations; g++) {
    pop = selectAndReproduce(pop, params.eliteFraction, params.mutationRate, params.rng)
    for (const m of pop) {
      if (m.fitness === 0) m.fitness = scoreOne(m, params.scoringMode, params.samplesPerScore, params.rng)
    }
    history.push(snapshotFromPopulation(pop, g))
  }
  return { finalPopulation: pop, history }
}
