export interface QortexNode {
  id: number
  type: 'input' | 'hidden' | 'output'
  seed: string
  realId: string
  documentedId: string
  state: -1 | 0 | 1
  position: [number, number, number]
  frame: number
}

export interface QortexEdge {
  source: number
  target: number
  weight: number
  type: 'fast' | 'slow' | 'meta'
}

export interface QortexFrame {
  id: number
  label: string
  nodeIds: number[]
  startId: number
  endId: number
}

export interface QortexMetadata {
  totalNodes: number
  totalEdges: number
  totalFrames: number
  nodesPerFrame: number
  stateDistribution: {
    negative: number
    zero: number
    positive: number
  }
  typeDistribution: {
    input: number
    hidden: number
    output: number
  }
}

export interface QortexData {
  metadata: QortexMetadata
  nodes: QortexNode[]
  edges: QortexEdge[]
  frames: QortexFrame[]
}

/**
 * Qiner Algorithm Types
 * From: https://github.com/qubic/qiner
 */

/** Qiner algorithm constants from source code */
export interface QinerConstants {
  /** K = Number of input neurons (14 for addition algorithm) */
  K: number
  /** L = Number of output neurons (8 for addition algorithm) */
  L: number
  /** N = Maximum ticks per simulation (120) */
  N: number
  /** S = Number of mutations per training round (100) */
  S: number
  /** M = Max neighbor neurons per neuron (half of 728 = 364) */
  M: number
  /** Population threshold before evolution stops */
  P: number
  /** Solution accuracy threshold (80% for addition) */
  threshold: number
}

/** Evolution metrics for tracking training progress */
export interface EvolutionMetrics {
  /** Current generation/round number */
  generation: number
  /** R = Score (number of mismatched output bits) */
  score: number
  /** Number of mutations applied */
  mutations: number
  /** Mutations that improved score */
  improvements: number
  /** New neurons inserted via weight overflow */
  insertions: number
  /** Neurons pruned (all-zero synapses) */
  prunings: number
  /** Current accuracy percentage */
  accuracy: number
}

/** Tick simulation state for visualization */
export interface TickSimulationState {
  /** Current tick number (0 to N-1) */
  tick: number
  /** Map of neuron ID to current ternary value */
  neuronValues: Map<number, -1 | 0 | 1>
  /** Pre-clamp accumulator values */
  energyBuffer: Map<number, number>
  /** Whether simulation has converged (no changes) */
  converged: boolean
  /** Whether all outputs are non-zero */
  allOutputsNonzero: boolean
}

/** Score function result */
export interface ScoreResult {
  /** R = Number of mismatched output bits */
  R: number
  /** Correct output bits */
  correctOutputs: number
  /** Total output bits */
  totalOutputs: number
  /** Accuracy percentage */
  accuracy: number
  /** Whether solution threshold (80%) is reached */
  solutionFound: boolean
}

/** Synapse weight in Qiner semantics */
export type QinerWeight = -1 | 0 | 1

/** Default Qiner constants for addition algorithm */
export const QINER_ADDITION_CONSTANTS: QinerConstants = {
  K: 14,        // 7 bits × 2 operands
  L: 8,         // 8-bit sum result
  N: 120,       // Max ticks
  S: 100,       // Mutations per round
  M: 364,       // Half of 728 max neighbors
  P: 122,       // K + L + S = 14 + 8 + 100
  threshold: 0.80,
}
