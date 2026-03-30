// Contact Cube Visualization Types
// Inspired by the 1997 film "Contact" - 3D cube folding to reveal hidden patterns

export type CubeFaceId = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'

export type ViewMode = 'flat' | 'folding' | 'cube' | 'overlay' | 'mirror'

export type ColorTheme = 'default' | 'fire' | 'ice' | 'matrix' | 'scientific'

export interface CubeFaceData {
  id: CubeFaceId
  cells: number[][]
  rowRange: [number, number]
  colRange: [number, number]
  opposingFace: CubeFaceId
  anomalies: AnomalyCell[]
  stats: {
    min: number
    max: number
    mean: number
    positiveCount: number
    negativeCount: number
    zeroCount: number
  }
}

export interface AnomalyCell {
  pos: [number, number]
  value: number
  mirrorPos: [number, number]
  mirrorValue: number
  sum: number
  special?: boolean
  faceId?: CubeFaceId
  localPos?: [number, number]
}

export interface FoldingState {
  progress: number // 0 = flat, 1 = fully folded cube
  phase: 'flat' | 'folding' | 'cube' | 'unfolding'
  isAnimating: boolean
}

export interface OverlayState {
  enabled: boolean
  activePair: [CubeFaceId, CubeFaceId] | null
  opacity: number
  showAlignmentLines: boolean
  showPrimer: boolean
}

export interface ContactCubeState {
  viewMode: ViewMode
  colorTheme: ColorTheme
  foldingState: FoldingState
  overlayState: OverlayState
  selectedAnomaly: AnomalyCell | null
  showRegistrationMarks: boolean
  showMirrorLines: boolean
  autoRotate: boolean
  cameraPreset: 'default' | 'top' | 'front' | 'side' | 'isometric'
}

export interface MatrixData {
  matrix: number[][]
  dimensions: { rows: number; cols: number }
}

export interface AnomalyData {
  metadata: {
    title: string
    date: string
    description: string
    symmetryPercentage: number
    anomalyPercentage: number
  }
  statistics: {
    totalCells: number
    symmetricCells: number
    anomalyCells: number
    anomalyPairs: number
    allInUpperHalf: boolean
  }
  quadrantDistribution: {
    NW: number
    NE: number
    SW: number
    SE: number
  }
  keyColumns: {
    column: number
    mirrorColumn: number
    rows: number[]
    count: number
    significance: string
  }[]
  specialPosition: {
    position: [number, number]
    value: number
    mirrorPosition: [number, number]
    mirrorValue: number
    sum: number
    significance: string
    properties: {
      coordinateSum: number
      valueXor127: number
      isSquarePosition: boolean
    }
  }
  anomalies: AnomalyCell[]
}

export interface FaceTransform {
  position: [number, number, number]
  rotation: [number, number, number]
}

export interface PrimerCell {
  row: number
  col: number
  value: 'T' | 'F' | 'S' // True, False, Special
  matrixValue: number
  mirrorValue: number
}
