// Matrix Terrain Types

export interface AnnaMatrixData {
  matrix: (number | string)[][]
  dimensions: {
    rows: number
    cols: number
  }
  note?: string
}

export interface MatrixStats {
  min: number
  max: number
  mean: number
  median: number
  stdDev: number
  totalCells: number
  positiveCount: number
  negativeCount: number
  zeroCount: number
}

export interface MatrixCell {
  row: number
  col: number
  value: number
  normalizedValue: number // 0-1 for color mapping
  height: number // For 3D terrain
}

export interface TerrainViewMode {
  id: 'wireframe' | 'solid' | 'heatmap' | 'contour'
  label: string
}

export const VIEW_MODES: TerrainViewMode[] = [
  { id: 'wireframe', label: 'Wireframe' },
  { id: 'solid', label: 'Solid' },
  { id: 'heatmap', label: 'Heatmap' },
  { id: 'contour', label: 'Contour' },
]

export interface CameraPreset {
  position: [number, number, number]
  name: string
}

export const TERRAIN_CAMERA_PRESETS: Record<string, CameraPreset> = {
  top: { position: [0, 12, 0], name: 'Top' },
  perspective: { position: [8, 8, 8], name: 'Perspective' },
  front: { position: [0, 4, 12], name: 'Front' },
  side: { position: [12, 4, 0], name: 'Side' },
}
