// --- Particle Life Emergence Lab Types ---

/** Structure-of-Arrays particle data for cache-coherent access */
export interface ParticleData {
  x: Float32Array
  y: Float32Array
  vx: Float32Array
  vy: Float32Array
  type: Uint8Array
  /** Initial positions for MSD calculation */
  x0: Float32Array
  y0: Float32Array
  count: number
}

export interface SimulationConfig {
  numTypes: number
  particlesPerType: number
  radius: number
  viscosity: number
  timeScale: number
  particleSize: number
  boundaryMode: 'bounce' | 'toroidal'
  trailLength: number // 0 = no trails, up to 50
  speedMultiplier: number // physics steps per frame
}

export type MatrixMode = 'anna' | 'random' | 'custom'
export type VocabularyMode = 'casual' | 'technical'
export type ComparisonMode = 'single' | 'side-by-side'
export type SamplingStrategy = 'block-average' | 'diagonal' | 'random' | 'energy-level'

export interface SimulationState {
  isPlaying: boolean
  tick: number
  fps: number
  mode: MatrixMode
  comparisonMode: ComparisonMode
}

export interface VelocityBin {
  speed: number
  count: number
}

export interface SimulationStats {
  tick: number
  energy: number
  segregation: number
  spatialEntropy: number
  moransI: number
  msd: number
  clusterCount?: number
  largestCluster?: number
  velocityDist?: VelocityBin[]
  cooperation?: number
  aggression?: number
  perTypeCooperation?: { cooperation: number; aggression: number }[]
}

export interface PhaseTransition {
  tick: number
  metric: string
  magnitude: number  // how many sigma
}

export interface MetricHistoryEntry extends SimulationStats {
  timestamp: number
}

export interface ResearchPreset {
  id: string
  name: string
  description: string
  config: Partial<SimulationConfig>
  matrixMode: MatrixMode
  randomSeed?: number
  badge?: string
  badgeColor?: string
  category: 'research' | 'seeds' | 'experiments'
  samplingOverride?: SamplingStrategy
}

export interface KeyboardShortcut {
  key: string
  label: string
  description: string
}

export interface KeyboardShortcutCategory {
  name: string
  shortcuts: KeyboardShortcut[]
}
