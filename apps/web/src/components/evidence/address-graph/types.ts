// =============================================================================
// ADDRESS GRAPH - TYPE DEFINITIONS
// =============================================================================

// -----------------------------------------------------------------------------
// ERROR TYPES
// -----------------------------------------------------------------------------

export type AddressGraphErrorType =
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'VALIDATION_ERROR'
  | 'TIMEOUT_ERROR'
  | 'MEMORY_ERROR'
  | 'WEBGL_ERROR'
  | 'UNKNOWN_ERROR'

export interface AddressGraphError {
  type: AddressGraphErrorType
  message: string
  details?: string
  retryable: boolean
}

// -----------------------------------------------------------------------------
// NODE TYPES
// -----------------------------------------------------------------------------

export type AddressType =
  | 'patoshi-genesis'
  | 'patoshi'
  | 'cfb-vanity'
  | 'patoshi-vanity'
  | 'matrix-derived'
  | 'seed-validated'
  | 'seed-mismatch'
  | 'unknown'

export type NodeState =
  | 'default'
  | 'hovered'
  | 'selected'
  | 'connected'
  | 'path-highlight'
  | 'filtered-out'
  | 'loading'
  | 'error'

export type NodeShape = 'sphere' | 'cube' | 'octahedron' | 'dodecahedron'
export type NodeSize = 'xs' | 'small' | 'medium' | 'large' | 'xl'

export type DerivationMethod = 'step13' | 'diagonal' | 'col' | 'row' | 'step7' | 'step27'

export interface AddressNode {
  id: string
  address: string
  type: AddressType
  position: [number, number, number]

  // Visual encoding
  color: string
  shape: NodeShape
  size: NodeSize
  glowIntensity: number
  xorRings: number

  // Blockchain data
  blockHeight?: number
  amount?: number
  scriptType?: 'p2pk' | 'p2pkh' | 'p2sh' | 'p2wpkh'
  pubkey?: string
  derivedAddress?: string // Bitcoin address derived from pubkey
  hash160Derived?: string // Hash160 of the pubkey

  // Derivation data
  matrixPosition?: [number, number]
  derivationMethod?: DerivationMethod
  xorVariant?: number
  compressed?: boolean
  hash160?: string

  // Qubic data
  seed?: string
  documentedIdentity?: string
  realIdentity?: string
  seedValidated?: boolean

  // Private key
  privateKeyAvailable?: boolean
  privateKeyWIF?: string

  // State
  state: NodeState
  isVIP: boolean
  cluster?: string
}

// -----------------------------------------------------------------------------
// EDGE TYPES
// -----------------------------------------------------------------------------

export type EdgeType =
  | 'transaction'
  | 'same-seed'
  | 'matrix-adjacent'
  | 'temporal'
  | 'derivation'

export type EdgeStyle = 'solid' | 'dashed' | 'dotted'

export interface AddressEdge {
  id: string
  source: string
  target: string
  type: EdgeType
  weight: number

  // Metadata
  txHash?: string
  blockHeight?: number
  matrixDistance?: number
  derivationSteps?: number

  // Visual
  color: string
  style: EdgeStyle
  animated: boolean
  particleCount: number
}

// -----------------------------------------------------------------------------
// RAW DATA TYPES (from JSON files)
// -----------------------------------------------------------------------------

export interface RawPatoshiAddress {
  blockHeight: number
  outputIndex: number
  pubkey: string
  amount: number
  scriptType: 'p2pk'
}

export interface RawInterestingAddress {
  id: number
  address: string
  position: [number, number]
  method: string
  xor: number
  compressed: boolean
  hash160: string
}

export interface RawQubicSeed {
  id: number
  seed: string
  documentedIdentity: string
  realIdentity: string
  match: boolean
  source: string
}

export interface RawBitcoinDerived {
  id: number
  address: string
  privateKey: string
  sequence: string
  method: string
}

export interface RawPrivateKey {
  id: number
  address: string
  privateKeyHex: string
  privateKeyWIF: string
  position: number[]
  method: string
  xorVariant: number
  compressed: boolean
  hash160: string
  cfVariant: string
  validationStatus: string
}

export interface RawMatrixAddress {
  id: number
  address: string
}

// -----------------------------------------------------------------------------
// STATS & METADATA
// -----------------------------------------------------------------------------

export interface NetworkStats {
  totalNodes: number
  totalEdges: number
  clusters: number
  avgConnections: number

  byType: Record<AddressType, number>
  byMethod: Record<string, number>
  byXor: Record<number, number>

  patoshiBlocks: { min: number; max: number }
  totalBTC: number

  validatedSeeds: number
  mismatchedSeeds: number

  // Full dataset counts (before sampling for performance)
  fullDatasetCounts?: {
    patoshi: number
    matrix: number
    interesting: number
  }
}

export interface LoadStats {
  patoshi: number
  cfbLinked: number
  matrixDerived: number
  totalEdges: number
}

// -----------------------------------------------------------------------------
// FILTER & VIEW STATE
// -----------------------------------------------------------------------------

export interface FilterState {
  types: Set<AddressType>
  methods: Set<string>
  xorVariants: Set<number>
  seedValidation: 'all' | 'validated' | 'mismatch'
  blockRange: [number, number]
  minConnections: number
  searchQuery: string
}

export type ViewMode = 'force' | 'cluster' | 'timeline' | 'radial' | 'hierarchical'
export type CameraPreset = 'overview' | 'matrix' | 'layers' | 'patoshi' | 'cfb' | 'genesis' | 'timeline' | 'custom'

export interface ViewState {
  mode: ViewMode
  cameraPreset: CameraPreset
  cameraPosition: [number, number, number]
  showEdges: boolean
  selectedNodeId: string | null
  highlightedPath: string[]
  playbackSpeed: number
  isPlaying: boolean
  currentBlock: number
}

// -----------------------------------------------------------------------------
// COMPONENT PROPS
// -----------------------------------------------------------------------------

export interface AddressGraphData {
  nodes: AddressNode[]
  edges: AddressEdge[]
  stats: NetworkStats
  vipNodes: AddressNode[]
}

export interface AddressDetailPanelProps {
  node: AddressNode
  connections: {
    outgoing: AddressEdge[]
    incoming: AddressEdge[]
  }
  onClose: () => void
  onNodeClick: (node: AddressNode) => void
  getNodeById: (id: string) => AddressNode | undefined
}

export interface AddressGraphControlsProps {
  currentBlock: number
  totalBlocks: number
  isPlaying: boolean
  playbackSpeed: number
  showEdges: boolean
  visibleNodes: number
  totalNodes: number
  onBlockChange: (block: number) => void
  onPlayToggle: () => void
  onSpeedChange: (speed: number) => void
  onEdgesToggle: () => void
  onSearch: (query: string) => AddressNode | null
  onNodeFound: (node: AddressNode) => void
}

// -----------------------------------------------------------------------------
// KEYBOARD SHORTCUTS
// -----------------------------------------------------------------------------

export interface KeyboardShortcut {
  key: string
  action: string
}

export interface ShortcutCategory {
  category: string
  items: KeyboardShortcut[]
}
