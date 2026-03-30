import type { SimulationConfig, ResearchPreset, KeyboardShortcutCategory } from './types'

// --- Particle Colors (matching project design system) ---
export const PARTICLE_COLORS = [
  '#D4AF37', // Gold (primary brand)
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#E11D48', // Rose
] as const

// --- Default Simulation Config ---
export const DEFAULT_CONFIG: SimulationConfig = {
  numTypes: 8,
  particlesPerType: 80,
  radius: 120,
  viscosity: 0.7,
  timeScale: 1.0,
  particleSize: 2,
  boundaryMode: 'bounce',
  trailLength: 6,
  speedMultiplier: 1,
}

// --- Speed Options ---
export const SPEED_OPTIONS = [1, 2, 5, 10, 25, 50] as const

// --- Anna Matrix Constants ---
export const ENERGY_LEVELS = [56, 50, 42, 38] as const // absolute values, symmetric ±
export const SPECTRAL_RADIUS = 2342
export const POINT_SYMMETRY_PERCENT = 99.58
export const FIXED_POINT_COLUMN_SUM = 42
export const SYMMETRY_BREAK_COLUMNS = [0, 22, 30, 41, 86, 97, 105, 127] as const
export const SYMMETRY_BREAK_PAIRS: [number, number][] = [
  [0, 127], [22, 105], [30, 97], [41, 86],
]
export const ROW_6_VALUE_26_COUNT = 24

// --- Keyboard Shortcuts ---
export const KEYBOARD_SHORTCUTS: KeyboardShortcutCategory[] = [
  {
    name: 'Playback',
    shortcuts: [
      { key: 'Space', label: 'Space', description: 'Play / Pause' },
      { key: 's', label: 'S', description: 'Step one tick' },
      { key: 'r', label: 'R', description: 'Reset simulation' },
    ],
  },
  {
    name: 'Speed',
    shortcuts: [
      { key: '1', label: '1', description: '1x speed' },
      { key: '2', label: '2', description: '2x speed' },
      { key: '3', label: '3', description: '5x speed' },
      { key: '4', label: '4', description: '10x speed' },
      { key: '5', label: '5', description: '25x speed' },
      { key: '6', label: '6', description: '50x speed' },
    ],
  },
  {
    name: 'View',
    shortcuts: [
      { key: 'f', label: 'F', description: 'Toggle fullscreen' },
      { key: 'm', label: 'M', description: 'Toggle matrix explorer' },
      { key: 'c', label: 'C', description: 'Toggle comparison mode' },
      { key: 'b', label: 'B', description: 'Toggle boundary mode' },
      { key: 'i', label: 'I', description: 'Show info modal' },
      { key: '?', label: '?', description: 'Show shortcuts' },
      { key: 'Escape', label: 'Esc', description: 'Close panels' },
    ],
  },
]

// --- Research Presets ---
export const RESEARCH_PRESETS: ResearchPreset[] = [
  // --- Validated Research Configurations ---
  {
    id: 'default',
    name: 'Default (8 Types)',
    description: 'Balanced starting point: 8 types, block-average sampling of the Anna Matrix.',
    config: { numTypes: 8, particlesPerType: 80, radius: 120, viscosity: 0.7 },
    matrixMode: 'anna',
    category: 'research',
  },
  {
    id: 'anna-vs-random',
    name: 'Anna vs Random (A/B)',
    description: 'Same parameters for Anna and Random — use A/B mode (C) to compare side-by-side.',
    config: { numTypes: 6, particlesPerType: 80, radius: 100, viscosity: 0.7 },
    matrixMode: 'anna',
    badge: 'Paper',
    category: 'research',
  },
  {
    id: 'energy-level-sampling',
    name: 'Energy Level Sampling',
    description: 'Rules sampled at Anna Matrix energy levels (+-56, +-50, +-42, +-38). Preserves the 8-level structure.',
    config: { numTypes: 8, particlesPerType: 80, radius: 120, viscosity: 0.7 },
    matrixMode: 'anna',
    samplingOverride: 'energy-level',
    badge: 'Paper',
    category: 'research',
  },
  {
    id: 'cooperation-demo',
    name: 'Cooperation Demo (Paper)',
    description: 'Configuration used in the April 2026 validation: 8 types, 100 particles each. Anna produces 4.3x more stable populations than random. Press C for side-by-side comparison.',
    config: { numTypes: 8, particlesPerType: 100, radius: 120, viscosity: 0.7 },
    matrixMode: 'anna',
    badge: 'Paper',
    category: 'research',
  },
  {
    id: 'scale-test-4',
    name: 'Scale Test (4 Types)',
    description: 'Only 4 particle types — the Anna Matrix compressed to 4x4 still shows cooperative clustering. 99.7% spectral dominance at this scale.',
    config: { numTypes: 4, particlesPerType: 120, radius: 100, viscosity: 0.7 },
    matrixMode: 'anna',
    badge: 'New',
    badgeColor: 'bg-[#D4AF37]/15 text-[#D4AF37]/60 border-[#D4AF37]/20',
    category: 'research',
  },
  {
    id: 'diagonal-sampling',
    name: 'Diagonal Sampling',
    description: 'Samples near the diagonal — emphasizes self-interaction and nearest-neighbor properties of the matrix.',
    config: { numTypes: 8, particlesPerType: 80, radius: 120, viscosity: 0.7 },
    matrixMode: 'anna',
    samplingOverride: 'diagonal',
    category: 'research',
  },
  {
    id: 'random-sampling',
    name: 'Golden Ratio Sampling',
    description: 'Deterministic golden-ratio spaced indices — pseudo-random but reproducible sampling of the 128x128 matrix.',
    config: { numTypes: 8, particlesPerType: 80, radius: 120, viscosity: 0.7 },
    matrixMode: 'anna',
    samplingOverride: 'random',
    category: 'research',
  },

  // --- Experiments (change one variable at a time) ---
  {
    id: 'minimal',
    name: 'Minimal (3 Types)',
    description: '3 types, 30 particles each — isolates basic pairwise interactions. Easiest to understand visually.',
    config: { numTypes: 3, particlesPerType: 30, radius: 100, viscosity: 0.7 },
    matrixMode: 'anna',
    category: 'experiments',
  },
  {
    id: 'max-types',
    name: 'Maximum (12 Types)',
    description: 'All 12 particle types active. Most complex interaction network possible from the matrix.',
    config: { numTypes: 12, particlesPerType: 50, radius: 120, viscosity: 0.7 },
    matrixMode: 'anna',
    category: 'experiments',
  },
  {
    id: 'high-density',
    name: 'High Density',
    description: '1500 particles in 10 types. Tests emergence under high spatial pressure.',
    config: { numTypes: 10, particlesPerType: 150, radius: 150, viscosity: 0.6 },
    matrixMode: 'anna',
    category: 'experiments',
  },
  {
    id: 'toroidal',
    name: 'Toroidal Boundary',
    description: 'Wrapping boundaries — no walls. Tests whether Anna Matrix emergence depends on boundary effects.',
    config: { numTypes: 8, particlesPerType: 80, radius: 120, viscosity: 0.7, boundaryMode: 'toroidal' },
    matrixMode: 'anna',
    category: 'experiments',
  },
  {
    id: 'low-viscosity',
    name: 'Low Viscosity',
    description: 'Viscosity 0.3 — particles retain momentum longer. Tests chaotic vs ordered dynamics.',
    config: { numTypes: 8, particlesPerType: 80, radius: 120, viscosity: 0.3 },
    matrixMode: 'anna',
    category: 'experiments',
  },
  {
    id: 'short-range',
    name: 'Short Range',
    description: 'Interaction radius 50px — only nearby particles interact. Tests local vs global structure.',
    config: { numTypes: 8, particlesPerType: 80, radius: 50, viscosity: 0.7 },
    matrixMode: 'anna',
    category: 'experiments',
  },

  // --- Random baselines for comparison ---
  {
    id: 'random-baseline',
    name: 'Random Baseline (seed 42)',
    description: 'Standard random matrix with seed 42. Use as control when comparing to Anna presets.',
    config: { numTypes: 8, particlesPerType: 80, radius: 120, viscosity: 0.7 },
    matrixMode: 'random',
    randomSeed: 42,
    category: 'seeds',
  },
  {
    id: 'random-seed-7',
    name: 'Random (seed 7)',
    description: 'Different random seed to test whether Anna vs Random differences are seed-independent.',
    config: { numTypes: 8, particlesPerType: 80, radius: 120, viscosity: 0.7 },
    matrixMode: 'random',
    randomSeed: 7,
    category: 'seeds',
  },
  {
    id: 'random-seed-256',
    name: 'Random (seed 256)',
    description: 'Another random seed for cross-validation. Compare metrics against Anna Default preset.',
    config: { numTypes: 8, particlesPerType: 80, radius: 120, viscosity: 0.7 },
    matrixMode: 'random',
    randomSeed: 256,
    category: 'seeds',
  },
]

// --- Metric Descriptions (for tooltips) ---
export const METRIC_INFO: Record<string, { label: string; description: string; unit: string }> = {
  cooperation: {
    label: 'Cooperation',
    description: 'Fraction of interacting particle pairs with attractive forces. Higher values indicate more cooperative behavior between types.',
    unit: '%',
  },
  aggression: {
    label: 'Aggression',
    description: 'Fraction of interacting particle pairs with repulsive forces. Higher values indicate more conflict between types.',
    unit: '%',
  },
  energy: {
    label: 'Kinetic Energy',
    description: 'Average kinetic energy per particle. High energy = fast-moving, chaotic system. Low energy = equilibrium reached.',
    unit: 'E/particle',
  },
  segregation: {
    label: 'Segregation Index',
    description: 'Ratio of nearest same-type distance to nearest other-type distance. Low = clustered by type, High = well-mixed.',
    unit: 'ratio',
  },
  spatialEntropy: {
    label: 'Spatial Entropy',
    description: 'Shannon entropy of particle distribution across spatial bins. High = uniform spread, Low = concentrated clusters.',
    unit: 'bits',
  },
  moransI: {
    label: "Moran's I",
    description: 'Spatial autocorrelation of particle types. +1 = perfect clustering, 0 = random, -1 = perfect dispersion.',
    unit: 'I',
  },
  msd: {
    label: 'Mean Sq. Displacement',
    description: 'Average squared distance particles have moved from their starting positions. Measures diffusion rate.',
    unit: 'px²',
  },
  clusterCount: {
    label: 'Clusters',
    description: 'Number of distinct spatial clusters detected. Lower count = more self-organization into coherent groups.',
    unit: 'groups',
  },
  largestCluster: {
    label: 'Largest Cluster',
    description: 'Size of the largest connected particle group. Higher = more dominant structure formation.',
    unit: 'particles',
  },
}
