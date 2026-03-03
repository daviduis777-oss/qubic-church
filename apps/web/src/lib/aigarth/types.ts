/**
 * AIGARTH TYPE DEFINITIONS
 *
 * TypeScript types for the Local Aigarth Computer.
 */

/**
 * Ternary state values: -1 (inhibited), 0 (neutral), +1 (excited)
 */
export type TernaryState = -1 | 0 | 1

/**
 * Neuron types in the network
 */
export enum NeuronType {
  INPUT = 0,
  OUTPUT = 1,
  EVOLUTION = 2,
}

/**
 * Input types supported by the engine
 */
export type InputType =
  | 'text'
  | 'hex'
  | 'coords'
  | 'qubic_seed'
  | 'bitcoin'
  | 'binary'
  | 'unknown'

/**
 * Reasons why inference can end
 */
export type EndReason = 'converged' | 'all_nonzero' | 'max_ticks'

/**
 * State distribution counts
 */
export interface StateDistribution {
  positive: number
  neutral: number
  negative: number
}

/**
 * Result of running inference on the network
 */
export interface InferenceResult {
  /** Output neuron states */
  outputs: TernaryState[]

  /** All neuron states (inputs + outputs) */
  allStates: TernaryState[]

  /** Number of ticks executed */
  ticks: number

  /** Why inference ended */
  endReason: EndReason

  /** Total energy (sum of states) */
  energy: number

  /** Distribution of states */
  distribution: StateDistribution

  /** Optional state history per tick */
  history?: TernaryState[][]
}

/**
 * Complete processing result
 */
export interface ProcessingResult {
  // Input info
  inputRaw: string
  inputType: InputType
  inputTernaryLength: number

  // Processing info
  ticks: number
  endReason: EndReason
  durationMs: number

  // Output info
  energy: number
  stateVector: TernaryState[]
  outputVector: TernaryState[]
  distribution: StateDistribution

  // Decoded value (if applicable)
  decodedValue: number | null

  // Optional history
  history?: TernaryState[][]
}

/**
 * Matrix query result
 */
export interface MatrixQueryResult {
  row: number
  col: number
  value: number
  annaX: number
  annaY: number
  annaFormat: string
  hex: string
  ternary: TernaryState
  neighbors: number[]
  neighborsSum: number
}

/**
 * Comparison result
 */
export interface CompareResult {
  inputA: string
  inputB: string
  energyA: number
  energyB: number
  energyDiff: number
  similarity: number
  exactMatches: number
  matchPercentage: number
  ticksA: number
  ticksB: number
}

/**
 * Oracle result
 */
export interface OracleResult {
  question: string
  answer: 'YES' | 'NO' | 'UNCERTAIN'
  confidence: number
  energy: number
  ticks: number
}

/**
 * Engine statistics
 */
export interface EngineStats {
  engineVersion: string
  matrixLoaded: boolean
  numInputs: number
  numOutputs: number
  numNeighbors: number
  maxTicks: number
  population: number
  matrixShape?: [number, number]
  matrixMin?: number
  matrixMax?: number
  matrixMean?: number
  positiveCells?: number
  negativeCells?: number
  zeroCells?: number
}

/**
 * Engine configuration options
 */
export interface EngineConfig {
  numInputs?: number
  numOutputs?: number
  numNeighbors?: number
  maxTicks?: number
}

/**
 * Animation state for UI
 */
export interface AnimationState {
  isProcessing: boolean
  currentTick: number
  maxTicks: number
  progress: number
  phase: 'idle' | 'encoding' | 'processing' | 'decoding' | 'complete'
}
