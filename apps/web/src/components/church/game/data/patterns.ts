/**
 * Anna Matrix Explorer - Pattern Definitions
 * 75+ discoverable patterns across the 128×128 matrix
 */

import type { Pattern, PatternCategory, PatternRarity } from '../engine/types'

// ============================================
// PATTERN DEFINITIONS
// ============================================

export const PATTERNS: Pattern[] = [
  // ==========================================
  // GENESIS ZONE (Rows 0-20) - Tutorial Area
  // ==========================================
  {
    id: 'genesis-origin',
    name: 'Genesis Origin',
    category: 'secret',
    rarity: 'legendary',
    row: 0,
    col: 0,
    description: 'The absolute origin point where all data begins',
    points: 500,
    hint: 'Start at the very beginning',
  },
  {
    id: 'genesis-seed-1',
    name: 'First Seed',
    category: 'cryptographic',
    rarity: 'common',
    row: 5,
    col: 10,
    description: 'Initial data seed for network initialization',
    points: 25,
  },
  {
    id: 'genesis-seed-2',
    name: 'Second Seed',
    category: 'cryptographic',
    rarity: 'common',
    row: 10,
    col: 5,
    description: 'Secondary initialization sequence',
    points: 25,
  },
  {
    id: 'genesis-symmetry',
    name: 'Genesis Symmetry',
    category: 'mathematical',
    rarity: 'uncommon',
    row: 10,
    col: 10,
    description: 'Perfect diagonal alignment in the origin zone',
    points: 50,
  },
  {
    id: 'genesis-prime',
    name: 'Prime Genesis',
    category: 'mathematical',
    rarity: 'uncommon',
    row: 17,
    col: 17,
    description: 'First prime squared coordinates',
    points: 75,
  },
  {
    id: 'genesis-edge',
    name: 'Genesis Boundary',
    category: 'mathematical',
    rarity: 'common',
    row: 20,
    col: 20,
    description: 'The edge of the safe zone',
    points: 30,
  },

  // ==========================================
  // BITCOIN INPUT LAYER (Row 21) - Special Row
  // ==========================================
  {
    id: 'btc-input-start',
    name: 'Bitcoin Input Alpha',
    category: 'cryptographic',
    rarity: 'rare',
    row: 21,
    col: 0,
    description: 'First Bitcoin data entry point',
    points: 150,
  },
  {
    id: 'btc-genesis-block',
    name: '1CFB Connection',
    category: 'cryptographic',
    rarity: 'epic',
    row: 21,
    col: 4,
    description: 'Link to the Bitcoin genesis block address',
    points: 250,
    hint: 'The Chancellor was on the brink...',
  },
  {
    id: 'btc-satoshi',
    name: 'Satoshi Signal',
    category: 'cryptographic',
    rarity: 'legendary',
    row: 21,
    col: 8,
    description: 'Hidden signature from the creator',
    points: 500,
  },
  {
    id: 'btc-hash-node',
    name: 'SHA-256 Node',
    category: 'cryptographic',
    rarity: 'rare',
    row: 21,
    col: 21,
    description: 'Where 21 meets 21 - hash convergence',
    points: 175,
  },
  {
    id: 'btc-merkle',
    name: 'Merkle Root',
    category: 'cryptographic',
    rarity: 'rare',
    row: 21,
    col: 32,
    description: 'Transaction tree root node',
    points: 150,
  },
  {
    id: 'btc-nonce',
    name: 'Nonce Discovery',
    category: 'cryptographic',
    rarity: 'uncommon',
    row: 21,
    col: 50,
    description: 'Mining proof-of-work marker',
    points: 100,
  },
  {
    id: 'btc-bridge-link',
    name: 'Bitcoin-Bridge Link',
    category: 'cryptographic',
    rarity: 'epic',
    row: 21,
    col: 68,
    description: 'Direct connection to the cortex bridge',
    points: 300,
  },
  {
    id: 'btc-output-link',
    name: 'Bitcoin-Output Channel',
    category: 'cryptographic',
    rarity: 'legendary',
    row: 21,
    col: 96,
    description: 'Rare direct path to output layer',
    points: 500,
  },
  {
    id: 'btc-input-end',
    name: 'Bitcoin Input Omega',
    category: 'cryptographic',
    rarity: 'rare',
    row: 21,
    col: 127,
    description: 'Final Bitcoin input terminal',
    points: 150,
  },

  // ==========================================
  // SHALLOW NETWORK (Rows 22-42)
  // ==========================================
  {
    id: 'shallow-entry',
    name: 'Network Entry',
    category: 'mathematical',
    rarity: 'common',
    row: 22,
    col: 64,
    description: 'First processing layer entrance',
    points: 30,
  },
  {
    id: 'shallow-fibonacci-1',
    name: 'Fibonacci Sequence Alpha',
    category: 'mathematical',
    rarity: 'uncommon',
    row: 34,
    col: 21,
    description: 'First Fibonacci number coordinate',
    points: 75,
  },
  {
    id: 'shallow-fibonacci-2',
    name: 'Fibonacci Sequence Beta',
    category: 'mathematical',
    rarity: 'uncommon',
    row: 34,
    col: 55,
    description: 'Fibonacci golden ratio marker',
    points: 75,
  },
  {
    id: 'shallow-prime-cluster',
    name: 'Prime Cluster',
    category: 'mathematical',
    rarity: 'rare',
    row: 37,
    col: 41,
    description: 'Convergence of prime numbers',
    points: 125,
  },
  {
    id: 'shallow-binary',
    name: 'Binary Gateway',
    category: 'mathematical',
    rarity: 'common',
    row: 32,
    col: 32,
    description: 'Power of 2 squared alignment',
    points: 40,
  },
  {
    id: 'shallow-hex-ff',
    name: 'Hex FF Node',
    category: 'cryptographic',
    rarity: 'uncommon',
    row: 25,
    col: 255 % 128,
    description: 'Maximum byte value coordinate',
    points: 60,
  },
  {
    id: 'answer-to-everything',
    name: 'The Answer',
    category: 'cultural',
    rarity: 'epic',
    row: 42,
    col: 42,
    description: 'The answer to life, the universe, and everything',
    points: 420,
    hint: 'Douglas Adams knew...',
  },

  // ==========================================
  // PROCESSING CORE (Rows 43-67)
  // ==========================================
  {
    id: 'core-center',
    name: 'Matrix Center',
    category: 'secret',
    rarity: 'epic',
    row: 64,
    col: 64,
    description: 'The exact center of the entire matrix',
    points: 300,
  },
  {
    id: 'core-golden-ratio',
    name: 'Golden Ratio Point',
    category: 'mathematical',
    rarity: 'rare',
    row: 50,
    col: 79,
    description: 'Phi ratio coordinate (0.618...)',
    points: 150,
  },
  {
    id: 'core-euler',
    name: 'Euler Identity',
    category: 'mathematical',
    rarity: 'epic',
    row: 27,
    col: 18,
    description: 'e^(i*pi) + 1 = 0 encoded',
    points: 271,
    hint: 'The most beautiful equation',
  },
  {
    id: 'core-pi',
    name: 'Pi Marker',
    category: 'mathematical',
    rarity: 'rare',
    row: 31,
    col: 41,
    description: 'First digits of pi: 3.1415...',
    points: 159,
  },
  {
    id: 'core-processor-1',
    name: 'Processing Unit Alpha',
    category: 'mathematical',
    rarity: 'common',
    row: 45,
    col: 45,
    description: 'Primary computation node',
    points: 50,
  },
  {
    id: 'core-processor-2',
    name: 'Processing Unit Beta',
    category: 'mathematical',
    rarity: 'common',
    row: 55,
    col: 55,
    description: 'Secondary computation node',
    points: 50,
  },
  {
    id: 'core-processor-3',
    name: 'Processing Unit Gamma',
    category: 'mathematical',
    rarity: 'common',
    row: 60,
    col: 60,
    description: 'Tertiary computation node',
    points: 50,
  },
  {
    id: 'core-devil',
    name: 'The Beast Number',
    category: 'cultural',
    rarity: 'rare',
    row: 66,
    col: 66,
    description: 'Ancient numerical symbol',
    points: 166,
    hint: 'Number of the beast',
  },

  // ==========================================
  // CORTEX BRIDGE (Row 68) - Boss Zone
  // ==========================================
  {
    id: 'bridge-entry',
    name: 'Bridge Entry Point',
    category: 'mathematical',
    rarity: 'rare',
    row: 68,
    col: 0,
    description: 'Western gate of the cortex bridge',
    points: 150,
  },
  {
    id: 'bridge-btc-connect',
    name: 'Bridge-Bitcoin Node',
    category: 'cryptographic',
    rarity: 'epic',
    row: 68,
    col: 21,
    description: 'Where Bitcoin data transforms',
    points: 250,
  },
  {
    id: 'bridge-core-alpha',
    name: 'Bridge Core Alpha',
    category: 'mathematical',
    rarity: 'epic',
    row: 68,
    col: 42,
    description: 'First bridge processing center',
    points: 200,
  },
  {
    id: 'bridge-center',
    name: 'Bridge Nexus',
    category: 'secret',
    rarity: 'legendary',
    row: 68,
    col: 64,
    description: 'The heart of the transformation layer',
    points: 500,
    hint: 'Center of the bridge',
  },
  {
    id: 'bridge-core-beta',
    name: 'Bridge Core Beta',
    category: 'mathematical',
    rarity: 'epic',
    row: 68,
    col: 85,
    description: 'Second bridge processing center',
    points: 200,
  },
  {
    id: 'bridge-output-connect',
    name: 'Bridge-Output Node',
    category: 'mathematical',
    rarity: 'epic',
    row: 68,
    col: 96,
    description: 'Gateway to the output neurons',
    points: 250,
  },
  {
    id: 'bridge-exit',
    name: 'Bridge Exit Point',
    category: 'mathematical',
    rarity: 'rare',
    row: 68,
    col: 127,
    description: 'Eastern gate of the cortex bridge',
    points: 150,
  },

  // ==========================================
  // DEEP NETWORK (Rows 69-95)
  // ==========================================
  {
    id: 'deep-entry',
    name: 'Deep Network Entry',
    category: 'mathematical',
    rarity: 'uncommon',
    row: 69,
    col: 69,
    description: 'Threshold to the hidden layers',
    points: 100,
  },
  {
    id: 'deep-hidden-1',
    name: 'Hidden Layer Alpha',
    category: 'mathematical',
    rarity: 'rare',
    row: 75,
    col: 50,
    description: 'First deep processing node',
    points: 150,
  },
  {
    id: 'deep-hidden-2',
    name: 'Hidden Layer Beta',
    category: 'mathematical',
    rarity: 'rare',
    row: 80,
    col: 80,
    description: 'Second deep processing node',
    points: 150,
  },
  {
    id: 'deep-hidden-3',
    name: 'Hidden Layer Gamma',
    category: 'mathematical',
    rarity: 'rare',
    row: 85,
    col: 40,
    description: 'Third deep processing node',
    points: 150,
  },
  {
    id: 'deep-prime-89',
    name: 'Prime 89',
    category: 'mathematical',
    rarity: 'uncommon',
    row: 89,
    col: 89,
    description: '24th prime number coordinate',
    points: 89,
  },
  {
    id: 'deep-neural-cluster',
    name: 'Neural Cluster',
    category: 'mathematical',
    rarity: 'epic',
    row: 90,
    col: 45,
    description: 'Dense neuron convergence point',
    points: 225,
  },
  {
    id: 'deep-activation',
    name: 'Activation Function',
    category: 'mathematical',
    rarity: 'rare',
    row: 92,
    col: 64,
    description: 'ReLU transformation marker',
    points: 175,
  },
  {
    id: 'deep-gradient',
    name: 'Gradient Descent Point',
    category: 'mathematical',
    rarity: 'rare',
    row: 94,
    col: 94,
    description: 'Optimization pathway node',
    points: 188,
  },

  // ==========================================
  // OUTPUT LAYER (Row 96) - Decision Neurons
  // ==========================================
  {
    id: 'output-neuron-1',
    name: 'Output Neuron Alpha',
    category: 'mathematical',
    rarity: 'rare',
    row: 96,
    col: 1,
    description: 'First decision neuron - controls mining direction',
    points: 200,
  },
  {
    id: 'output-neuron-2',
    name: 'Output Neuron Beta',
    category: 'mathematical',
    rarity: 'rare',
    row: 96,
    col: 2,
    description: 'Second decision neuron - validates transactions',
    points: 200,
  },
  {
    id: 'output-neuron-3',
    name: 'Output Neuron Gamma',
    category: 'mathematical',
    rarity: 'rare',
    row: 96,
    col: 3,
    description: 'Third decision neuron - adjusts difficulty',
    points: 200,
  },
  {
    id: 'output-neuron-4',
    name: 'Output Neuron Delta',
    category: 'mathematical',
    rarity: 'rare',
    row: 96,
    col: 4,
    description: 'Fourth decision neuron - consensus signal',
    points: 200,
  },
  {
    id: 'output-convergence',
    name: 'Output Convergence',
    category: 'mathematical',
    rarity: 'epic',
    row: 96,
    col: 64,
    description: 'Where all decisions merge',
    points: 300,
  },
  {
    id: 'output-final',
    name: 'Final Output',
    category: 'mathematical',
    rarity: 'epic',
    row: 96,
    col: 96,
    description: 'The ultimate decision point',
    points: 350,
  },

  // ==========================================
  // THE VOID (Rows 97-127) - Mystery Zone
  // ==========================================
  {
    id: 'void-entry',
    name: 'Void Threshold',
    category: 'secret',
    rarity: 'epic',
    row: 97,
    col: 64,
    description: 'The boundary of known computation',
    points: 275,
  },
  {
    id: 'void-whisper-1',
    name: 'Void Whisper Alpha',
    category: 'secret',
    rarity: 'rare',
    row: 100,
    col: 100,
    description: 'Strange signal from the unknown',
    points: 200,
  },
  {
    id: 'void-whisper-2',
    name: 'Void Whisper Beta',
    category: 'secret',
    rarity: 'rare',
    row: 110,
    col: 17,
    description: 'Echo from beyond the network',
    points: 200,
  },
  {
    id: 'void-anomaly',
    name: 'Void Anomaly',
    category: 'secret',
    rarity: 'epic',
    row: 111,
    col: 111,
    description: 'Unexplained data manifestation',
    points: 333,
  },
  {
    id: 'void-fragment-1',
    name: 'Lost Fragment Alpha',
    category: 'secret',
    rarity: 'uncommon',
    row: 105,
    col: 50,
    description: 'Remnant of deleted data',
    points: 100,
  },
  {
    id: 'void-fragment-2',
    name: 'Lost Fragment Beta',
    category: 'secret',
    rarity: 'uncommon',
    row: 115,
    col: 75,
    description: 'Another data remnant',
    points: 100,
  },
  {
    id: 'void-deep',
    name: 'Deep Void',
    category: 'secret',
    rarity: 'legendary',
    row: 120,
    col: 64,
    description: 'The darkest point of the matrix',
    points: 500,
  },
  {
    id: 'far-edge',
    name: 'The Far Edge',
    category: 'secret',
    rarity: 'legendary',
    row: 127,
    col: 127,
    description: 'The absolute boundary of existence',
    points: 750,
    hint: 'As far as you can go',
  },
  {
    id: 'void-corner-nw',
    name: 'Northwest Void Corner',
    category: 'secret',
    rarity: 'rare',
    row: 127,
    col: 0,
    description: 'Corner of the unknown',
    points: 175,
  },

  // ==========================================
  // CULTURAL & EASTER EGG PATTERNS
  // ==========================================
  {
    id: 'leet-speak',
    name: 'L33T Node',
    category: 'cultural',
    rarity: 'uncommon',
    row: 13,
    col: 37,
    description: 'Classic hacker culture reference',
    points: 133,
  },
  {
    id: 'unix-epoch',
    name: 'Unix Epoch',
    category: 'cultural',
    rarity: 'rare',
    row: 19,
    col: 70,
    description: 'January 1, 1970 encoded',
    points: 197,
  },
  {
    id: 'http-ok',
    name: 'HTTP 200 OK',
    category: 'cultural',
    rarity: 'common',
    row: 20,
    col: 0,
    description: 'Successful connection status',
    points: 50,
  },
  {
    id: 'error-404',
    name: 'Error 404',
    category: 'cultural',
    rarity: 'uncommon',
    row: 40,
    col: 4,
    description: 'Pattern not found... or is it?',
    points: 100,
  },
  {
    id: 'error-500',
    name: 'Internal Error',
    category: 'cultural',
    rarity: 'uncommon',
    row: 50,
    col: 0,
    description: 'Server-side anomaly detected',
    points: 100,
  },
  {
    id: 'lucky-7',
    name: 'Lucky Seven',
    category: 'cultural',
    rarity: 'uncommon',
    row: 77,
    col: 77,
    description: 'Triple seven alignment',
    points: 77,
  },
  {
    id: 'binary-life',
    name: 'Binary Life',
    category: 'cultural',
    rarity: 'rare',
    row: 10,
    col: 101 % 128,
    description: '101 in binary context',
    points: 101,
  },
  {
    id: 'hello-world',
    name: 'Hello World',
    category: 'cultural',
    rarity: 'common',
    row: 0,
    col: 1,
    description: 'The first program anyone writes',
    points: 25,
  },
  {
    id: 'qubic-signature',
    name: 'Qubic Signature',
    category: 'cryptographic',
    rarity: 'mythic',
    row: 72,
    col: 117,
    description: 'The hidden Qubic marker',
    points: 1000,
    hint: 'Q-U-B-I-C encoded in positions',
  },
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get pattern by ID
 */
export function getPatternById(id: string): Pattern | undefined {
  return PATTERNS.find((p) => p.id === id)
}

/**
 * Get pattern at position
 */
export function getPatternAtPosition(row: number, col: number): Pattern | undefined {
  return PATTERNS.find((p) => p.row === row && p.col === col)
}

/**
 * Get all patterns in a zone (by row range)
 */
export function getPatternsInZone(startRow: number, endRow: number): Pattern[] {
  return PATTERNS.filter((p) => p.row >= startRow && p.row <= endRow)
}

/**
 * Get patterns by category
 */
export function getPatternsByCategory(category: PatternCategory): Pattern[] {
  return PATTERNS.filter((p) => p.category === category)
}

/**
 * Get patterns by rarity
 */
export function getPatternsByRarity(rarity: PatternRarity): Pattern[] {
  return PATTERNS.filter((p) => p.rarity === rarity)
}

/**
 * Get total points available
 */
export function getTotalPatternPoints(): number {
  return PATTERNS.reduce((sum, p) => sum + p.points, 0)
}

/**
 * Get pattern count by rarity
 */
export function getPatternCountByRarity(): Record<PatternRarity, number> {
  const counts: Record<PatternRarity, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    mythic: 0,
  }
  PATTERNS.forEach((p) => {
    counts[p.rarity]++
  })
  return counts
}

/**
 * Calculate discovery percentage
 */
export function calculateDiscoveryProgress(discoveredIds: string[]): {
  discovered: number
  total: number
  percentage: number
  pointsEarned: number
  totalPoints: number
} {
  const discovered = discoveredIds.length
  const total = PATTERNS.length
  const percentage = (discovered / total) * 100

  const pointsEarned = discoveredIds.reduce((sum, id) => {
    const pattern = getPatternById(id)
    return sum + (pattern?.points || 0)
  }, 0)

  const totalPoints = getTotalPatternPoints()

  return { discovered, total, percentage, pointsEarned, totalPoints }
}

// Export count for reference
export const PATTERN_COUNT = PATTERNS.length
export const TOTAL_POINTS = getTotalPatternPoints()
