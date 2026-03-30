/**
 * AIGARTH A+B TRAINER
 *
 * Implements the actual Qubic mining algorithm for training the neural network
 * to learn addition (A + B = C).
 *
 * Based on score_addition.h from Qubic Core:
 * - Training Set: All 2^K pairs of (A, B, C=A+B)
 * - Mutation: Random synapse weight changes (+1 or -1)
 * - Scoring: Count correct outputs across all training pairs
 * - Main Loop: Mutate → Infer → Keep if better, else rollback
 */

import { TernaryState } from './types'
import { toTernaryBits, ternaryClamp } from './ternary'

// Training Configuration
export interface TrainerConfig {
  inputBits: number       // K/2 bits per number (A and B each use K/2 bits)
  outputBits: number      // Bits for output C
  maxTicks: number        // Max ticks per inference
  numNeighbors: number    // Neighbors per neuron
  maxMutations: number    // How many mutations to try
}

export const DEFAULT_TRAINER_CONFIG: TrainerConfig = {
  inputBits: 4,           // 4 bits per number → A,B ∈ [-8, 7]
  outputBits: 5,          // 5 bits for output → C ∈ [-16, 15]
  maxTicks: 20,           // Fast inference
  numNeighbors: 8,        // 8 neighbors per neuron
  maxMutations: 100,      // Try 100 mutations
}

// Training Sample: (A, B, expected C)
export interface TrainingSample {
  A: number
  B: number
  C: number
  inputTernary: TernaryState[]
  outputTernary: TernaryState[]
}

// Single training result
export interface SampleResult {
  sample: TrainingSample
  predictedC: number
  predictedTernary: TernaryState[]
  correct: boolean
  outputMatch: number  // How many output bits match
}

// Mutation record
export interface Mutation {
  neuronIdx: number
  synapseIdx: number
  oldWeight: TernaryState
  newWeight: TernaryState
}

// Training iteration result
export interface TrainingIteration {
  iteration: number
  score: number           // Correct predictions
  totalSamples: number
  accuracy: number        // score / totalSamples * 100
  mutation: Mutation | null
  accepted: boolean
  bestScore: number
}

// Full training result
export interface TrainingResult {
  config: TrainerConfig
  trainingSet: TrainingSample[]
  finalScore: number
  finalAccuracy: number
  iterations: TrainingIteration[]
  synapseWeights: TernaryState[][]
  durationMs: number
}

/**
 * The A+B Trainer class.
 * Trains a ternary neural network to learn addition.
 */
export class AigarthTrainer {
  private config: TrainerConfig

  // Neural network structure (circular topology like Qubic)
  private population: number = 0
  private synapses: TernaryState[][] = []
  private bestSynapses: TernaryState[][] = []

  // Training set
  private trainingSamples: TrainingSample[] = []

  // Neuron states during inference
  private states: TernaryState[] = []
  private prevStates: TernaryState[] = []

  constructor(config?: Partial<TrainerConfig>) {
    this.config = { ...DEFAULT_TRAINER_CONFIG, ...config }
  }

  /**
   * Generate all 2^K training pairs.
   * For K/2 input bits, A and B each range from -(2^(K/2-1)) to (2^(K/2-1) - 1)
   */
  generateTrainingSet(): TrainingSample[] {
    const K = this.config.inputBits
    const boundValue = Math.pow(2, K - 1)  // 2^(K-1) for K bits → range [-bound, bound-1]

    const samples: TrainingSample[] = []

    for (let A = -boundValue; A < boundValue; A++) {
      for (let B = -boundValue; B < boundValue; B++) {
        const C = A + B

        samples.push({
          A,
          B,
          C,
          inputTernary: [
            ...toTernaryBits(A, K),
            ...toTernaryBits(B, K),
          ],
          outputTernary: toTernaryBits(C, this.config.outputBits),
        })
      }
    }

    this.trainingSamples = samples
    return samples
  }

  /**
   * Initialize the neural network.
   * Creates a circular topology with input and output neurons.
   */
  initializeNetwork(): void {
    const numInputs = this.config.inputBits * 2
    const numOutputs = this.config.outputBits
    this.population = numInputs + numOutputs

    // Initialize synapse weights to random ternary values
    this.synapses = []
    for (let i = 0; i < this.population; i++) {
      const neuronSynapses: TernaryState[] = []
      for (let j = 0; j < this.config.numNeighbors; j++) {
        // Random ternary: -1, 0, or +1
        const r = Math.random()
        neuronSynapses.push(r < 0.33 ? -1 : r < 0.66 ? 0 : 1)
      }
      this.synapses.push(neuronSynapses)
    }

    // Copy to best
    this.bestSynapses = this.synapses.map(s => [...s])
  }

  /**
   * Get neighbor index in circular topology.
   */
  private getNeighborIndex(neuronIdx: number, offset: number): number {
    const idx = neuronIdx + offset
    return ((idx % this.population) + this.population) % this.population
  }

  /**
   * Run single tick of neural network.
   * Each neuron computes weighted sum of neighbors.
   */
  private runTick(): boolean {
    const numInputs = this.config.inputBits * 2
    const neighbors = this.config.numNeighbors
    const leftNeighbors = Math.floor(neighbors / 2)

    // Swap state buffers
    const tmp = this.prevStates
    this.prevStates = this.states
    this.states = tmp

    let anyChanged = false

    // Update each non-input neuron
    for (let n = numInputs; n < this.population; n++) {
      // Compute weighted sum of neighbors
      let sum = 0
      for (let i = 0; i < neighbors; i++) {
        const offset = i < leftNeighbors ? -(leftNeighbors - i) : (i - leftNeighbors + 1)
        const neighborIdx = this.getNeighborIndex(n, offset)
        const weight = this.synapses[n]?.[i] ?? 0
        const neighborState = this.prevStates[neighborIdx] ?? 0
        sum += weight * neighborState
      }

      // Clamp to ternary
      const newState = ternaryClamp(sum)
      if (newState !== this.states[n]) {
        anyChanged = true
      }
      this.states[n] = newState
    }

    return anyChanged
  }

  /**
   * Check if all output neurons are non-zero.
   */
  private allOutputsNonZero(): boolean {
    const numInputs = this.config.inputBits * 2
    for (let i = numInputs; i < this.population; i++) {
      if (this.states[i] === 0) return false
    }
    return true
  }

  /**
   * Run inference for a single training sample.
   */
  infer(sample: TrainingSample): SampleResult {
    const numInputs = this.config.inputBits * 2
    const numOutputs = this.config.outputBits

    // Initialize states
    this.states = new Array(this.population).fill(0)
    this.prevStates = new Array(this.population).fill(0)

    // Set input neurons
    for (let i = 0; i < numInputs && i < sample.inputTernary.length; i++) {
      this.states[i] = sample.inputTernary[i] ?? 0
      this.prevStates[i] = sample.inputTernary[i] ?? 0
    }

    // Run tick loop
    for (let tick = 0; tick < this.config.maxTicks; tick++) {
      const changed = this.runTick()

      // Early termination conditions
      if (!changed) break  // Converged
      if (this.allOutputsNonZero()) break  // All outputs set
    }

    // Extract output neurons
    const predictedTernary: TernaryState[] = []
    for (let i = numInputs; i < numInputs + numOutputs; i++) {
      predictedTernary.push(this.states[i] ?? 0)
    }

    // Decode predicted C from ternary
    let predictedC = 0
    for (let i = 0; i < predictedTernary.length; i++) {
      if (predictedTernary[i] === 1) {
        predictedC += (1 << i)
      }
    }
    // Handle sign (if MSB is set, treat as negative)
    if (predictedTernary[predictedTernary.length - 1] === 1) {
      predictedC -= (1 << predictedTernary.length)
    }

    // Count matching output bits
    let outputMatch = 0
    for (let i = 0; i < numOutputs; i++) {
      if (predictedTernary[i] === sample.outputTernary[i]) {
        outputMatch++
      }
    }

    return {
      sample,
      predictedC,
      predictedTernary,
      correct: predictedC === sample.C,
      outputMatch,
    }
  }

  /**
   * Compute score (number of correct predictions) for all samples.
   */
  computeScore(): number {
    let correct = 0
    for (const sample of this.trainingSamples) {
      const result = this.infer(sample)
      if (result.correct) correct++
    }
    return correct
  }

  /**
   * Apply a single mutation: randomly change one synapse weight.
   */
  mutate(): Mutation {
    const neuronIdx = Math.floor(Math.random() * this.population)
    const synapseIdx = Math.floor(Math.random() * this.config.numNeighbors)

    const neuronSynapses = this.synapses[neuronIdx]
    if (!neuronSynapses) {
      return { neuronIdx, synapseIdx, oldWeight: 0, newWeight: 0 }
    }

    const oldWeight = neuronSynapses[synapseIdx] ?? 0

    // Random direction: +1 or -1
    const direction = Math.random() < 0.5 ? -1 : 1
    let newWeight = (oldWeight + direction) as TernaryState

    // Clamp to valid ternary range
    if (newWeight > 1) newWeight = 1
    if (newWeight < -1) newWeight = -1

    neuronSynapses[synapseIdx] = newWeight

    return { neuronIdx, synapseIdx, oldWeight, newWeight }
  }

  /**
   * Rollback a mutation.
   */
  rollback(mutation: Mutation): void {
    const neuronSynapses = this.synapses[mutation.neuronIdx]
    if (neuronSynapses) {
      neuronSynapses[mutation.synapseIdx] = mutation.oldWeight
    }
  }

  /**
   * Save current weights as best.
   */
  saveBest(): void {
    this.bestSynapses = this.synapses.map(s => [...s])
  }

  /**
   * Restore from best weights.
   */
  restoreBest(): void {
    this.synapses = this.bestSynapses.map(s => [...s])
  }

  /**
   * Run the full training loop.
   * Implements the Qubic mining algorithm: mutate → score → keep if better
   */
  train(onIteration?: (iter: TrainingIteration) => void): TrainingResult {
    const startTime = performance.now()

    // Initialize
    this.generateTrainingSet()
    this.initializeNetwork()

    const iterations: TrainingIteration[] = []
    let bestScore = this.computeScore()
    this.saveBest()

    // Log initial state
    const initialIter: TrainingIteration = {
      iteration: 0,
      score: bestScore,
      totalSamples: this.trainingSamples.length,
      accuracy: (bestScore / this.trainingSamples.length) * 100,
      mutation: null,
      accepted: true,
      bestScore,
    }
    iterations.push(initialIter)
    onIteration?.(initialIter)

    // Main training loop
    for (let i = 1; i <= this.config.maxMutations; i++) {
      // Apply mutation
      const mutation = this.mutate()

      // Compute new score
      const newScore = this.computeScore()

      // Accept or reject
      const accepted = newScore >= bestScore

      if (accepted) {
        bestScore = newScore
        this.saveBest()
      } else {
        this.rollback(mutation)
      }

      const iter: TrainingIteration = {
        iteration: i,
        score: newScore,
        totalSamples: this.trainingSamples.length,
        accuracy: (newScore / this.trainingSamples.length) * 100,
        mutation,
        accepted,
        bestScore,
      }
      iterations.push(iter)
      onIteration?.(iter)

      // Early termination if perfect
      if (bestScore === this.trainingSamples.length) {
        break
      }
    }

    const durationMs = performance.now() - startTime

    return {
      config: this.config,
      trainingSet: this.trainingSamples,
      finalScore: bestScore,
      finalAccuracy: (bestScore / this.trainingSamples.length) * 100,
      iterations,
      synapseWeights: this.bestSynapses,
      durationMs,
    }
  }

  /**
   * Test the trained network on specific inputs.
   */
  test(A: number, B: number): SampleResult {
    const K = this.config.inputBits
    const sample: TrainingSample = {
      A,
      B,
      C: A + B,
      inputTernary: [
        ...toTernaryBits(A, K),
        ...toTernaryBits(B, K),
      ],
      outputTernary: toTernaryBits(A + B, this.config.outputBits),
    }

    return this.infer(sample)
  }

  /**
   * Get current network statistics.
   */
  getStats() {
    return {
      population: this.population,
      numSynapses: this.population * this.config.numNeighbors,
      trainingSamples: this.trainingSamples.length,
      config: this.config,
    }
  }
}
