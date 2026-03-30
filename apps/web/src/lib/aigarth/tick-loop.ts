/**
 * TICK-LOOP ALGORITHM
 *
 * The core Aigarth inference algorithm in TypeScript.
 * This is a pure function implementation for browser-side processing.
 *
 * THE REAL AIGARTH ALGORITHM:
 * 1. Set input neuron values
 * 2. Clear output neurons
 * 3. Run tick-loop until:
 *    - All outputs non-zero (solution found)
 *    - No state changes (converged)
 *    - Max ticks reached
 */

import type {
  TernaryState,
  InferenceResult,
  EndReason,
  NeuronType,
} from './types'
import { ternaryClamp, computeEnergy, computeDistribution } from './ternary'

/**
 * Configuration for the tick-loop
 */
export interface TickLoopConfig {
  numInputs: number
  numOutputs: number
  numNeighbors: number
  maxTicks: number
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: TickLoopConfig = {
  numInputs: 64,
  numOutputs: 64,
  numNeighbors: 8,
  maxTicks: 1000,
}

/**
 * Get neighbor indices for a neuron in the circle.
 *
 * Neighbors are arranged symmetrically:
 * - Left neighbors: offset -1, -2, ..., -leftCount
 * - Right neighbors: offset +1, +2, ..., +rightCount
 */
export function getNeighborIndices(
  neuronIdx: number,
  population: number,
  numNeighbors: number
): number[] {
  const leftCount = Math.floor(numNeighbors / 2)
  const rightCount = numNeighbors - leftCount

  const indices: number[] = []

  // Left neighbors
  for (let offset = 1; offset <= leftCount; offset++) {
    indices.push((neuronIdx - offset + population) % population)
  }

  // Right neighbors
  for (let offset = 1; offset <= rightCount; offset++) {
    indices.push((neuronIdx + offset) % population)
  }

  return indices
}

/**
 * Load weights from the Anna Matrix for a specific neuron.
 *
 * Uses circular indexing to get weights corresponding to neighbor positions.
 */
export function loadWeightsForNeuron(
  matrix: number[][],
  neuronIdx: number,
  neighborIndices: number[],
  useSignOnly: boolean = true
): TernaryState[] {
  const rowIdx = neuronIdx % matrix.length
  const row = matrix[rowIdx]
  if (!row) return neighborIndices.map(() => 0 as TernaryState)

  return neighborIndices.map((neighborIdx) => {
    const colIdx = neighborIdx % row.length
    const value = row[colIdx] ?? 0
    return useSignOnly ? ternaryClamp(value) : (ternaryClamp(value) as TernaryState)
  })
}

/**
 * Single neuron feedforward computation.
 *
 * Computes weighted sum of inputs and clamps to ternary.
 */
export function neuronFeedforward(
  neighborStates: TernaryState[],
  weights: TernaryState[]
): TernaryState {
  let total = 0
  const count = Math.min(neighborStates.length, weights.length)

  for (let i = 0; i < count; i++) {
    const state = neighborStates[i] ?? 0
    const weight = weights[i] ?? 0
    total += state * weight
  }

  return ternaryClamp(total)
}

/**
 * Check if all output neurons are non-zero.
 */
export function allOutputsNonzero(
  states: TernaryState[],
  numInputs: number
): boolean {
  for (let i = numInputs; i < states.length; i++) {
    if (states[i] === 0) return false
  }
  return true
}

/**
 * Run the tick-loop algorithm.
 *
 * This is the core Aigarth inference function.
 *
 * @param inputs - Input ternary values
 * @param matrix - The Anna Matrix (128x128)
 * @param config - Configuration options
 * @param recordHistory - Whether to record state history
 * @returns Inference result
 */
export function runTickLoop(
  inputs: TernaryState[],
  matrix: number[][],
  config: Partial<TickLoopConfig> = {},
  recordHistory: boolean = false
): InferenceResult {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const population = cfg.numInputs + cfg.numOutputs

  // Initialize neuron states
  const states: TernaryState[] = new Array(population).fill(0)

  // Set input neurons
  for (let i = 0; i < Math.min(inputs.length, cfg.numInputs); i++) {
    states[i] = inputs[i] ?? 0
  }

  // Precompute neighbor indices and weights for each output neuron
  const neuronData: Array<{
    neighborIndices: number[]
    weights: TernaryState[]
  }> = []

  for (let i = cfg.numInputs; i < population; i++) {
    const neighborIndices = getNeighborIndices(i, population, cfg.numNeighbors)
    const weights = loadWeightsForNeuron(matrix, i, neighborIndices, true)
    neuronData.push({ neighborIndices, weights })
  }

  // Helper to get neuron data safely
  const getData = (neuronIdx: number) => neuronData[neuronIdx - cfg.numInputs]

  // History recording
  const history: TernaryState[][] = []
  if (recordHistory) {
    history.push([...states])
  }

  // Tick-loop
  let endReason: EndReason = 'max_ticks'
  let tickCount = 0

  for (let tick = 0; tick < cfg.maxTicks; tick++) {
    tickCount = tick + 1

    // Check if all outputs are non-zero
    if (allOutputsNonzero(states, cfg.numInputs)) {
      endReason = 'all_nonzero'
      break
    }

    // Compute next states
    const nextStates: TernaryState[] = [...states]
    let anyChanged = false

    for (let i = cfg.numInputs; i < population; i++) {
      const data = getData(i)
      if (!data) continue

      // Get current neighbor states
      const neighborStates = data.neighborIndices.map((idx) => states[idx] ?? 0) as TernaryState[]

      // Compute next state
      const nextState = neuronFeedforward(neighborStates, data.weights)

      if (nextState !== states[i]) {
        anyChanged = true
      }
      nextStates[i] = nextState
    }

    // Commit state changes
    for (let i = cfg.numInputs; i < population; i++) {
      states[i] = nextStates[i] ?? 0
    }

    // Record history
    if (recordHistory) {
      history.push([...states])
    }

    // Check convergence
    if (!anyChanged) {
      endReason = 'converged'
      break
    }
  }

  // Extract outputs
  const outputs = states.slice(cfg.numInputs) as TernaryState[]

  return {
    outputs,
    allStates: states,
    ticks: tickCount,
    endReason,
    energy: computeEnergy(states),
    distribution: computeDistribution(states),
    history: recordHistory ? history : undefined,
  }
}

/**
 * Process input through the Aigarth network.
 *
 * Higher-level function that handles input conversion and result formatting.
 */
export async function processInput(
  input: TernaryState[],
  matrix: number[][],
  config?: Partial<TickLoopConfig>,
  recordHistory?: boolean
): Promise<InferenceResult> {
  // Run in next tick to not block UI
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = runTickLoop(input, matrix, config, recordHistory)
      resolve(result)
    }, 0)
  })
}

/**
 * Stream tick-by-tick processing with callbacks.
 *
 * Useful for real-time visualization.
 */
export function streamTickLoop(
  inputs: TernaryState[],
  matrix: number[][],
  config: Partial<TickLoopConfig> = {},
  onTick: (tick: number, states: TernaryState[], energy: number) => void,
  onComplete: (result: InferenceResult) => void
): () => void {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const population = cfg.numInputs + cfg.numOutputs

  // Initialize
  const states: TernaryState[] = new Array(population).fill(0)
  for (let i = 0; i < Math.min(inputs.length, cfg.numInputs); i++) {
    states[i] = inputs[i] ?? 0
  }

  // Precompute
  const neuronData: Array<{
    neighborIndices: number[]
    weights: TernaryState[]
  }> = []

  for (let i = cfg.numInputs; i < population; i++) {
    const neighborIndices = getNeighborIndices(i, population, cfg.numNeighbors)
    const weights = loadWeightsForNeuron(matrix, i, neighborIndices, true)
    neuronData.push({ neighborIndices, weights })
  }

  let tick = 0
  let cancelled = false

  const runTick = () => {
    if (cancelled || tick >= cfg.maxTicks) {
      const result: InferenceResult = {
        outputs: states.slice(cfg.numInputs) as TernaryState[],
        allStates: states,
        ticks: tick,
        endReason: 'max_ticks',
        energy: computeEnergy(states),
        distribution: computeDistribution(states),
      }
      onComplete(result)
      return
    }

    // Check termination
    if (allOutputsNonzero(states, cfg.numInputs)) {
      const result: InferenceResult = {
        outputs: states.slice(cfg.numInputs) as TernaryState[],
        allStates: states,
        ticks: tick,
        endReason: 'all_nonzero',
        energy: computeEnergy(states),
        distribution: computeDistribution(states),
      }
      onComplete(result)
      return
    }

    // Run tick
    const nextStates: TernaryState[] = [...states]
    let anyChanged = false

    for (let i = cfg.numInputs; i < population; i++) {
      const data = neuronData[i - cfg.numInputs]
      if (!data) continue
      const neighborStates = data.neighborIndices.map((idx) => states[idx] ?? 0) as TernaryState[]
      const nextState = neuronFeedforward(neighborStates, data.weights)

      if (nextState !== states[i]) {
        anyChanged = true
      }
      nextStates[i] = nextState
    }

    // Commit
    for (let i = cfg.numInputs; i < population; i++) {
      states[i] = nextStates[i] ?? 0
    }

    tick++
    onTick(tick, [...states], computeEnergy(states))

    // Check convergence
    if (!anyChanged) {
      const result: InferenceResult = {
        outputs: states.slice(cfg.numInputs) as TernaryState[],
        allStates: states,
        ticks: tick,
        endReason: 'converged',
        energy: computeEnergy(states),
        distribution: computeDistribution(states),
      }
      onComplete(result)
      return
    }

    // Schedule next tick
    requestAnimationFrame(runTick)
  }

  // Start
  requestAnimationFrame(runTick)

  // Return cancel function
  return () => {
    cancelled = true
  }
}
