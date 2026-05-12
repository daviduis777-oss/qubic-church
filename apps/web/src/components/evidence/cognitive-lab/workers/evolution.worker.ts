/// <reference lib="webworker" />

import { mulberry32 } from '../evolution/rng.ts'
import { packSignMatrix } from '../evolution/ait-fast.ts'
import { scoreHyperIdentity, scoreMultiTask } from '../evolution/scoring.ts'
import { selectAndReproduce } from '../evolution/selection.ts'
import { distanceToAnna } from '../evolution/structural-metrics.ts'
import type { Matrix, GenerationSnapshot, ScoringMode } from '../types.ts'

declare const self: DedicatedWorkerGlobalScope

export type WorkerInMessage =
  | {
      type: 'start'
      payload: {
        seed: number
        popSize: number
        generations: number
        samplesPerScore: number
        mutationRate: number
        eliteFraction: number
        scoringMode: ScoringMode
        annaSign: Int8Array
      }
    }
  | { type: 'reset' }

export type WorkerOutMessage =
  | {
      type: 'generation'
      snapshot: GenerationSnapshot
      /** Float32Array of length popSize × 2: [fitness, distanceToAnna] per matrix in current generation */
      perMatrix: Float32Array
      bestWeights?: Int8Array
    }
  | { type: 'complete'; history: GenerationSnapshot[]; bestWeights: Int8Array }
  | { type: 'error'; message: string }

let cancelToken = false

self.onmessage = (e: MessageEvent<WorkerInMessage>): void => {
  const msg = e.data
  if (msg.type === 'start') {
    cancelToken = false
    try {
      const rng = mulberry32(msg.payload.seed)
      streamingEvolution(msg.payload, rng)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      self.postMessage({ type: 'error', message } satisfies WorkerOutMessage)
    }
  } else if (msg.type === 'reset') {
    cancelToken = true
  }
}

function streamingEvolution(
  params: Extract<WorkerInMessage, { type: 'start' }>['payload'],
  rng: () => number,
): void {
  const annaSign = params.annaSign

  // Init population
  let pop: Matrix[] = []
  for (let i = 0; i < params.popSize; i++) {
    const w = new Int8Array(16384)
    for (let j = 0; j < 16384; j++) w[j] = rng() < 0.5 ? -1 : 1
    pop.push({ weights: w, packed: packSignMatrix(w), fitness: 0 })
  }
  for (const m of pop) m.fitness = scoreOne(m, params.scoringMode, params.samplesPerScore, rng)

  const history: GenerationSnapshot[] = []
  const snap0 = snapshotWithDistance(pop, 0, annaSign)
  history.push(snap0)
  postSnapshot(snap0, perMatrixArray(pop, annaSign), bestOf(pop).weights)

  for (let g = 1; g <= params.generations; g++) {
    if (cancelToken) return
    pop = selectAndReproduce(pop, params.eliteFraction, params.mutationRate, rng)
    for (const m of pop) {
      if (m.fitness === 0) m.fitness = scoreOne(m, params.scoringMode, params.samplesPerScore, rng)
    }
    const snap = snapshotWithDistance(pop, g, annaSign)
    history.push(snap)
    const includeBest = g % 10 === 0 || g === params.generations
    postSnapshot(snap, perMatrixArray(pop, annaSign), includeBest ? bestOf(pop).weights : undefined)
  }

  self.postMessage({
    type: 'complete',
    history,
    bestWeights: bestOf(pop).weights,
  } satisfies WorkerOutMessage)
}

function bestOf(pop: Matrix[]): Matrix {
  let best = pop[0]!
  for (const m of pop) if (m.fitness > best.fitness) best = m
  return best
}

function scoreOne(m: Matrix, mode: ScoringMode, samples: number, rng: () => number): number {
  if (mode === 'hyperidentity') return scoreHyperIdentity(m.packed, samples, rng)
  const v = scoreMultiTask(m.packed, samples, rng)
  return v.reduce((a, b) => a + b, 0) / v.length
}

function snapshotWithDistance(pop: Matrix[], gen: number, annaSign: Int8Array): GenerationSnapshot {
  const fits = pop.map((m) => m.fitness)
  const sorted = [...fits].sort((a, b) => b - a)
  const best = bestOf(pop)
  return {
    generation: gen,
    fitness: {
      best: sorted[0] ?? 0,
      median: sorted[Math.floor(sorted.length / 2)] ?? 0,
      worst: sorted[sorted.length - 1] ?? 0,
      mean: fits.reduce((a, b) => a + b, 0) / fits.length,
    },
    bestDistanceToAnna: distanceToAnna(best.weights, annaSign),
  }
}

/** Cheap antipodal-antisymmetry pct: M[i,j] === -M[127-i, 127-j] / total cells. */
function antipodalPct(W: Int8Array): number {
  const N = 128
  let match = 0
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (W[r * N + c]! === -W[(N - 1 - r) * N + (N - 1 - c)]!) match++
    }
  }
  return match / (N * N)
}

function perMatrixArray(pop: Matrix[], annaSign: Int8Array): Float32Array {
  // Per-matrix triplet: [fitness, distanceToAnna, antipodalAntisymPct]
  const arr = new Float32Array(pop.length * 3)
  for (let i = 0; i < pop.length; i++) {
    arr[i * 3] = pop[i]!.fitness
    arr[i * 3 + 1] = distanceToAnna(pop[i]!.weights, annaSign)
    arr[i * 3 + 2] = antipodalPct(pop[i]!.weights)
  }
  return arr
}

function postSnapshot(snapshot: GenerationSnapshot, perMatrix: Float32Array, bestWeights?: Int8Array): void {
  const msg: WorkerOutMessage = bestWeights
    ? { type: 'generation', snapshot, perMatrix, bestWeights }
    : { type: 'generation', snapshot, perMatrix }
  self.postMessage(msg)
}
