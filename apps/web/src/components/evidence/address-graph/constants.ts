// =============================================================================
// ADDRESS GRAPH - CONSTANTS & CONFIGURATION
// =============================================================================

import type { AddressType, DerivationMethod, EdgeType, AddressGraphErrorType } from './types'
import {
  WifiOff,
  FileWarning,
  AlertTriangle,
  Clock,
  HardDrive,
  Monitor,
} from 'lucide-react'

// -----------------------------------------------------------------------------
// COLOR PALETTE
// -----------------------------------------------------------------------------

export const COLORS = {
  // XOR Layer colors - Subtle blue gradient for depth
  layer0: '#1E3A5F',  // Deep Navy - Base
  layer1: '#2D4A6E',  // Steel Blue
  layer2: '#3C5A7D',  // Slate Blue
  layer3: '#4B6A8C',  // Dusty Blue
  layer4: '#5A7A9B',  // Light Slate - Top

  // Node type colors
  vip: '#D4AF37',             // Gold - VIP addresses
  vipActive: '#F59E0B',       // Gold - VIP with balance
  matrixDerived: '#4B6A8C',   // Dusty Blue - Matrix nodes
  selected: '#FFFFFF',        // White - Selected
  seedValidated: '#D4AF37',   // Gold
  seedMismatch: '#EF4444',    // Red
  unknown: '#6B7280',         // Gray

  // Legacy (kept for compatibility)
  patoshiGenesis: '#6B7280',
  patoshi: '#6B7280',
  cfbVanity: '#D4AF37',
  patoshiVanity: '#6B7280',

  // Derivation method colors - subtle
  step13: '#4B6A8C',
  diagonal: '#5A7A9B',
  col: '#3C5A7D',
  row: '#2D4A6E',
  step7: '#3C5A7D',
  step27: '#D4AF37',

  // Edge colors
  transaction: '#FFFFFF',
  sameSeed: '#D4AF37',
  matrixAdjacent: '#D4AF37',
  temporal: '#4B6A8C',
  derivation: '#5A7A9B',

  // UI colors
  background: '#0A0A0A',
  surface: '#121212',
  border: 'rgba(255, 255, 255, 0.08)',
  text: '#F9FAFB',
  textMuted: '#9CA3AF',
  accent: '#D4AF37',
} as const

// -----------------------------------------------------------------------------
// NODE TYPE CONFIGURATION
// -----------------------------------------------------------------------------

export const NODE_TYPE_CONFIG: Record<AddressType, {
  color: string
  shape: 'sphere' | 'cube' | 'octahedron' | 'dodecahedron'
  size: 'xs' | 'small' | 'medium' | 'large' | 'xl'
  glow: number
  label: string
}> = {
  'patoshi-genesis': {
    color: COLORS.unknown,
    shape: 'sphere',
    size: 'xs',
    glow: 0,
    label: 'Not Displayed',
  },
  'patoshi': {
    color: COLORS.unknown,
    shape: 'sphere',
    size: 'xs',
    glow: 0,
    label: 'Not Displayed',
  },
  'cfb-vanity': {
    color: COLORS.vip,
    shape: 'cube',
    size: 'large',
    glow: 0.8,
    label: 'VIP Address (1CFB*)',
  },
  'patoshi-vanity': {
    color: COLORS.unknown,
    shape: 'sphere',
    size: 'xs',
    glow: 0,
    label: 'Not Displayed',
  },
  'matrix-derived': {
    color: COLORS.matrixDerived,
    shape: 'sphere',
    size: 'small',
    glow: 0.2,
    label: 'Matrix Derived',
  },
  'seed-validated': {
    color: COLORS.seedValidated,
    shape: 'sphere',
    size: 'medium',
    glow: 0.6,
    label: 'Seed Validated',
  },
  'seed-mismatch': {
    color: COLORS.seedMismatch,
    shape: 'sphere',
    size: 'medium',
    glow: 0.8,
    label: 'Seed Mismatch',
  },
  'unknown': {
    color: COLORS.unknown,
    shape: 'sphere',
    size: 'xs',
    glow: 0,
    label: 'Unknown',
  },
}

// -----------------------------------------------------------------------------
// DERIVATION METHOD CONFIGURATION
// -----------------------------------------------------------------------------

export const METHOD_CONFIG: Record<DerivationMethod, {
  color: string
  rings: number
  label: string
}> = {
  'step13': { color: COLORS.step13, rings: 1, label: '13-Step Pattern' },
  'diagonal': { color: COLORS.diagonal, rings: 2, label: 'Diagonal Traversal' },
  'col': { color: COLORS.col, rings: 0, label: 'Column-Based' },
  'row': { color: COLORS.row, rings: 0, label: 'Row-Based' },
  'step7': { color: COLORS.step7, rings: 1, label: '7-Step Pattern' },
  'step27': { color: COLORS.step27, rings: 3, label: '27-Step Pattern' },
}

// -----------------------------------------------------------------------------
// XOR RING CONFIGURATION
// -----------------------------------------------------------------------------

export const XOR_RING_CONFIG: Record<number, {
  rings: number
  color: string
  label: string
  yLevel: number
}> = {
  0: { rings: 0, color: COLORS.layer0, label: 'Layer 0 (XOR 0)', yLevel: 0 },
  7: { rings: 1, color: COLORS.layer1, label: 'Layer 1 (XOR 7)', yLevel: 8 },
  13: { rings: 2, color: COLORS.layer2, label: 'Layer 2 (XOR 13)', yLevel: 16 },
  27: { rings: 3, color: COLORS.layer3, label: 'Layer 3 (XOR 27)', yLevel: 24 },
  33: { rings: 4, color: COLORS.layer4, label: 'Layer 4 (XOR 33)', yLevel: 32 },
}

// -----------------------------------------------------------------------------
// EDGE TYPE CONFIGURATION
// -----------------------------------------------------------------------------

export const EDGE_TYPE_CONFIG: Record<EdgeType, {
  color: string
  style: 'solid' | 'dashed' | 'dotted'
  animated: boolean
  label: string
}> = {
  'transaction': {
    color: COLORS.transaction,
    style: 'solid',
    animated: false,
    label: 'On-chain Transaction',
  },
  'same-seed': {
    color: COLORS.sameSeed,
    style: 'dashed',
    animated: true,
    label: 'Same Qubic Seed',
  },
  'matrix-adjacent': {
    color: COLORS.matrixAdjacent,
    style: 'dotted',
    animated: true,
    label: 'Matrix Position',
  },
  'temporal': {
    color: COLORS.temporal,
    style: 'solid',
    animated: true,
    label: 'Same Block Range',
  },
  'derivation': {
    color: COLORS.derivation,
    style: 'solid',
    animated: false,
    label: 'Derivation Path',
  },
}

// -----------------------------------------------------------------------------
// ERROR CONFIGURATION
// -----------------------------------------------------------------------------

export const ERROR_CONFIG: Record<AddressGraphErrorType, {
  icon: typeof WifiOff
  color: string
  bgColor: string
  retryable: boolean
  message: string
}> = {
  NETWORK_ERROR: {
    icon: WifiOff,
    color: 'text-[#D4AF37]',
    bgColor: 'bg-[#D4AF37]/10',
    retryable: true,
    message: 'Network Connection Failed',
  },
  PARSE_ERROR: {
    icon: FileWarning,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    retryable: false,
    message: 'Data Format Error',
  },
  VALIDATION_ERROR: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    retryable: false,
    message: 'Data Validation Failed',
  },
  TIMEOUT_ERROR: {
    icon: Clock,
    color: 'text-[#D4AF37]',
    bgColor: 'bg-[#D4AF37]/10',
    retryable: true,
    message: 'Request Timed Out',
  },
  MEMORY_ERROR: {
    icon: HardDrive,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    retryable: false,
    message: 'Memory Limit Exceeded',
  },
  WEBGL_ERROR: {
    icon: Monitor,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    retryable: false,
    message: 'WebGL Not Supported',
  },
  UNKNOWN_ERROR: {
    icon: AlertTriangle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    retryable: true,
    message: 'An Error Occurred',
  },
}

// -----------------------------------------------------------------------------
// CAMERA PRESETS
// -----------------------------------------------------------------------------

export const CAMERA_PRESETS = {
  overview: {
    position: [60, 40, 60] as [number, number, number],
    target: [0, 16, 0] as [number, number, number],
    name: 'Overview',
  },
  matrix: {
    position: [0, 80, 0] as [number, number, number],
    target: [0, 16, 0] as [number, number, number],
    name: 'Top-Down Matrix',
  },
  layers: {
    position: [80, 20, 0] as [number, number, number],
    target: [0, 16, 0] as [number, number, number],
    name: 'Layer Side View',
  },
  cfb: {
    position: [20, 20, 20] as [number, number, number],
    target: [0, 8, 0] as [number, number, number],
    name: 'VIP Focus',
  },
  // Legacy presets kept for compatibility
  patoshi: {
    position: [60, 40, 60] as [number, number, number],
    target: [0, 16, 0] as [number, number, number],
    name: 'Overview',
  },
  genesis: {
    position: [60, 40, 60] as [number, number, number],
    target: [0, 16, 0] as [number, number, number],
    name: 'Overview',
  },
  timeline: {
    position: [60, 40, 60] as [number, number, number],
    target: [0, 16, 0] as [number, number, number],
    name: 'Overview',
  },
}

// -----------------------------------------------------------------------------
// PLAYBACK SPEEDS
// -----------------------------------------------------------------------------

export const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2, 3, 5] as const

// -----------------------------------------------------------------------------
// KEYBOARD SHORTCUTS
// -----------------------------------------------------------------------------

export const KEYBOARD_SHORTCUTS = [
  {
    category: 'Navigation',
    items: [
      { key: 'R', action: 'Reset camera' },
    ],
  },
  {
    category: 'Visibility',
    items: [
      { key: 'E', action: 'Toggle edges' },
      { key: 'M', action: 'Toggle Matrix addresses' },
      { key: 'V', action: 'VIP only mode' },
    ],
  },
  {
    category: 'Interface',
    items: [
      { key: '?', action: 'Show shortcuts' },
      { key: 'Esc', action: 'Close / Deselect' },
      { key: 'F', action: 'Toggle FPS stats' },
    ],
  },
]

// -----------------------------------------------------------------------------
// PERFORMANCE LIMITS
// -----------------------------------------------------------------------------

export const PERFORMANCE = {
  MAX_VISIBLE_NODES: 35000, // Increased for full dataset
  MAX_VISIBLE_EDGES: 50000,
  LOD_DISTANCE: 100,
  CHUNK_SIZE: 1000,
  SIMULATION_ITERATIONS: 300,
  TARGET_FPS: 60,
} as const

// -----------------------------------------------------------------------------
// DATA URLS
// -----------------------------------------------------------------------------

export const DATA_URLS = {
  summary: '/data/summary.json',
  patoshi: '/data/patoshi-addresses.json',
  interesting: '/data/interesting-addresses.json',
  derived: '/data/bitcoin-derived-addresses.json',
  privateKeys: '/data/bitcoin-private-keys.json',
  qubicSeeds: '/data/qubic-seeds.json',
  matrix: '/data/matrix-addresses.json',
  matrixWithXor: '/data/matrix_addresses_with_xor.json', // 983k with XOR metadata
  annaMatrix: '/data/anna-matrix.json',
} as const
