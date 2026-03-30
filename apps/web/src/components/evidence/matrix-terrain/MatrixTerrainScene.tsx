'use client'

import { useState, useMemo, Suspense, useCallback, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { useAnnaMatrixData } from './useAnnaMatrixData'
import { TERRAIN_CAMERA_PRESETS, VIEW_MODES } from './types'
import type { MatrixCell, MatrixStats } from './types'
import { Button } from '@/components/ui/button'
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Eye,
  Grid3X3,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  Info,
  X,
  BookOpen,
  ExternalLink,
  FileCode,
  Hash,
  Download,
  HelpCircle,
  Layers,
  Search,
  Copy,
  Check,
  MessageCircle,
  Sparkles,
  Zap,
  Target,
  Crosshair,
  Map,
  Palette,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Move,
  ScanLine,
  Binary,
  Table2,
  Clock,
  Code,
  FileText,
  Link2,
} from 'lucide-react'

// =============================================================================
// COLOR THEMES
// =============================================================================
const COLOR_THEMES = {
  default: {
    name: 'Default',
    negative: '#3B82F6',
    neutral: '#6B7280',
    positive: '#F59E0B',
  },
  fire: {
    name: 'Fire',
    negative: '#1E3A5F',
    neutral: '#DC2626',
    positive: '#FCD34D',
  },
  ice: {
    name: 'Ice',
    negative: '#1E40AF',
    neutral: '#06B6D4',
    positive: '#FFFFFF',
  },
  matrix: {
    name: 'Matrix',
    negative: '#000000',
    neutral: '#166534',
    positive: '#22C55E',
  },
  scientific: {
    name: 'Scientific',
    negative: '#7C3AED',
    neutral: '#FFFFFF',
    positive: '#EF4444',
  },
}

type ColorTheme = keyof typeof COLOR_THEMES

// =============================================================================
// TERRAIN MESH COMPONENT
// =============================================================================
function TerrainMesh({
  matrix,
  stats,
  viewMode,
  colorTheme,
  selectedCell,
  hoveredCell,
  onCellHover,
  onCellClick,
  showCrosshair,
}: {
  matrix: number[][]
  stats: MatrixStats
  viewMode: 'wireframe' | 'solid' | 'heatmap' | 'contour'
  colorTheme: ColorTheme
  selectedCell: MatrixCell | null
  hoveredCell: MatrixCell | null
  onCellHover: (cell: MatrixCell | null) => void
  onCellClick: (cell: MatrixCell) => void
  showCrosshair: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const crosshairRef = useRef<THREE.Group>(null)

  const theme = COLOR_THEMES[colorTheme]

  // Create geometry with height data from matrix
  const { geometry } = useMemo(() => {
    const size = 128
    const heightScale = 2

    const geo = new THREE.PlaneGeometry(10, 10, size - 1, size - 1)
    const positions = geo.attributes.position
    if (!positions) return { geometry: geo }
    const colorArray = new Float32Array(positions.count * 3)

    const negativeColor = new THREE.Color(theme.negative)
    const neutralColor = new THREE.Color(theme.neutral)
    const positiveColor = new THREE.Color(theme.positive)

    for (let i = 0; i < positions.count; i++) {
      const ix = i % size
      const iy = Math.floor(i / size)
      const matrixRow = size - 1 - iy
      const value = matrix[matrixRow]?.[ix] ?? 0
      const normalized = (value - stats.min) / (stats.max - stats.min)
      const height = (normalized - 0.5) * heightScale
      positions.setZ(i, height)

      let color: THREE.Color
      if (value < 0) {
        const t = (value - stats.min) / (0 - stats.min)
        color = negativeColor.clone().lerp(neutralColor, t)
      } else {
        const t = value / stats.max
        color = neutralColor.clone().lerp(positiveColor, t)
      }

      colorArray[i * 3] = color.r
      colorArray[i * 3 + 1] = color.g
      colorArray[i * 3 + 2] = color.b
    }

    positions.needsUpdate = true
    geo.computeVertexNormals()
    geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3))

    return { geometry: geo }
  }, [matrix, stats, theme])

  useFrame((state) => {
    if (meshRef.current && viewMode !== 'wireframe') {
      const time = state.clock.elapsedTime
      meshRef.current.position.y = Math.sin(time * 0.5) * 0.02
    }

    // Update crosshair position
    if (crosshairRef.current && hoveredCell && showCrosshair) {
      const x = (hoveredCell.col / 128) * 10 - 5
      const z = (hoveredCell.row / 128) * 10 - 5
      crosshairRef.current.position.set(x, 1.5, z)
      crosshairRef.current.visible = true
    } else if (crosshairRef.current) {
      crosshairRef.current.visible = false
    }
  })

  const material = useMemo(() => {
    switch (viewMode) {
      case 'wireframe':
        return <meshBasicMaterial color={theme.negative} wireframe opacity={0.8} transparent />
      case 'solid':
        return <meshStandardMaterial vertexColors metalness={0.1} roughness={0.8} />
      case 'heatmap':
        return <meshStandardMaterial vertexColors metalness={0.3} roughness={0.5} emissive="#000000" emissiveIntensity={0.1} />
      case 'contour':
        return <meshStandardMaterial vertexColors metalness={0.2} roughness={0.6} flatShading />
      default:
        return <meshStandardMaterial vertexColors />
    }
  }, [viewMode, theme])

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onClick={(e) => {
          e.stopPropagation()
          const point = e.point
          const col = Math.floor((point.x + 5) / 10 * 128)
          const row = Math.floor((5 - point.y) / 10 * 128)
          if (row >= 0 && row < 128 && col >= 0 && col < 128) {
            const value = matrix[row]?.[col] ?? 0
            const normalized = (value - stats.min) / (stats.max - stats.min)
            onCellClick({ row, col, value, normalizedValue: normalized, height: (normalized - 0.5) * 2 })
          }
        }}
        onPointerMove={(e) => {
          e.stopPropagation()
          const point = e.point
          const col = Math.floor((point.x + 5) / 10 * 128)
          const row = Math.floor((5 - point.y) / 10 * 128)
          if (row >= 0 && row < 128 && col >= 0 && col < 128) {
            const value = matrix[row]?.[col] ?? 0
            const normalized = (value - stats.min) / (stats.max - stats.min)
            onCellHover({ row, col, value, normalizedValue: normalized, height: (normalized - 0.5) * 2 })
          }
        }}
        onPointerOut={() => onCellHover(null)}
      >
        {material}
      </mesh>

      {/* Crosshair indicator */}
      <group ref={crosshairRef} rotation={[Math.PI / 2, 0, 0]} visible={false}>
        <mesh>
          <ringGeometry args={[0.05, 0.08, 32]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 4]}>
          <planeGeometry args={[0.2, 0.01]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        <mesh rotation={[0, 0, -Math.PI / 4]}>
          <planeGeometry args={[0.2, 0.01]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      </group>

      <gridHelper args={[10, 16, theme.positive, theme.positive]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 1.5]} />
    </group>
  )
}

// =============================================================================
// 2D GRID VIEW COMPONENT
// =============================================================================
function Grid2DView({
  matrix,
  stats,
  colorTheme,
  selectedCell,
  onCellClick,
  zoomRegion,
}: {
  matrix: number[][]
  stats: MatrixStats
  colorTheme: ColorTheme
  selectedCell: MatrixCell | null
  onCellClick: (cell: MatrixCell) => void
  zoomRegion: 'all' | 'q1' | 'q2' | 'q3' | 'q4'
}) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null)
  const theme = COLOR_THEMES[colorTheme]

  // Determine visible range based on zoom region
  const { startRow, endRow, startCol, endCol } = useMemo(() => {
    switch (zoomRegion) {
      case 'q1': return { startRow: 0, endRow: 64, startCol: 0, endCol: 64 }
      case 'q2': return { startRow: 0, endRow: 64, startCol: 64, endCol: 128 }
      case 'q3': return { startRow: 64, endRow: 128, startCol: 0, endCol: 64 }
      case 'q4': return { startRow: 64, endRow: 128, startCol: 64, endCol: 128 }
      default: return { startRow: 0, endRow: 128, startCol: 0, endCol: 128 }
    }
  }, [zoomRegion])

  const visibleRows = endRow - startRow
  const visibleCols = endCol - startCol
  const cellSize = zoomRegion === 'all' ? 4 : 8

  const getCellColor = (value: number) => {
    const normalized = (value - stats.min) / (stats.max - stats.min)
    if (value < 0) {
      const t = (value - stats.min) / (0 - stats.min)
      return `color-mix(in srgb, ${theme.negative} ${(1 - t) * 100}%, ${theme.neutral} ${t * 100}%)`
    } else {
      const t = value / stats.max
      return `color-mix(in srgb, ${theme.neutral} ${(1 - t) * 100}%, ${theme.positive} ${t * 100}%)`
    }
  }

  return (
    <div className="w-full h-full bg-black overflow-auto">
      {/* Axis labels */}
      <div className="sticky top-0 z-20 flex bg-[#050505] backdrop-blur-sm">
        <div className="w-8 h-6 shrink-0" />
        <div className="flex">
          {Array.from({ length: visibleCols }, (_, i) => {
            const col = startCol + i
            return (
              <div
                key={col}
                className="text-[8px] text-white/40 text-center font-mono"
                style={{ width: cellSize, minWidth: cellSize }}
              >
                {col % (zoomRegion === 'all' ? 16 : 8) === 0 ? col : ''}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex">
        {/* Row labels */}
        <div className="sticky left-0 z-10 flex flex-col bg-[#050505] backdrop-blur-sm">
          {Array.from({ length: visibleRows }, (_, i) => {
            const row = startRow + i
            return (
              <div
                key={row}
                className="w-8 text-[8px] text-white/40 text-right pr-1 font-mono flex items-center justify-end"
                style={{ height: cellSize, minHeight: cellSize }}
              >
                {row % (zoomRegion === 'all' ? 16 : 8) === 0 ? row : ''}
              </div>
            )
          })}
        </div>

        {/* Grid cells */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${visibleCols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${visibleRows}, ${cellSize}px)`,
          }}
        >
          {Array.from({ length: visibleRows * visibleCols }, (_, i) => {
            const row = startRow + Math.floor(i / visibleCols)
            const col = startCol + (i % visibleCols)
            const value = matrix[row]?.[col] ?? 0
            const isSelected = selectedCell?.row === row && selectedCell?.col === col
            const isHovered = hoveredCell?.row === row && hoveredCell?.col === col

            return (
              <div
                key={`${row}-${col}`}
                className={`cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-white z-10' : ''
                } ${isHovered ? 'ring-1 ring-white/50 z-5' : ''}`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: getCellColor(value),
                }}
                onClick={() => {
                  const normalized = (value - stats.min) / (stats.max - stats.min)
                  onCellClick({ row, col, value, normalizedValue: normalized, height: (normalized - 0.5) * 2 })
                }}
                onMouseEnter={() => setHoveredCell({ row, col })}
                onMouseLeave={() => setHoveredCell(null)}
                title={`[${row}, ${col}] = ${value}`}
              />
            )
          })}
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredCell && (
        <div className="fixed bottom-4 right-4 bg-[#050505] border border-white/[0.04] px-3 py-2 text-sm font-mono text-white z-50">
          [{hoveredCell.row}, {hoveredCell.col}] = {matrix[hoveredCell.row]?.[hoveredCell.col] ?? 0}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// LOADING SCREEN
// =============================================================================
function LoadingScreen({ progress }: { progress: number }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black">
      <div className="flex flex-col items-center gap-6 max-w-md px-8">
        <div className="relative w-24 h-24">
          <Grid3X3 className="w-24 h-24 text-[#D4AF37]/20 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#D4AF37] animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">Loading Anna Matrix</h2>
          <p className="text-sm text-gray-500 mt-1">128 × 128 = 16,384 cells</p>
        </div>
        <div className="w-full h-2 bg-gray-800 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#D4AF37] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// STATS PANEL WITH HISTOGRAM
// =============================================================================
function StatsPanel({ stats, matrix, onClose }: { stats: MatrixStats; matrix: number[][]; onClose: () => void }) {
  // Calculate histogram data
  const histogram = useMemo(() => {
    const bins = 32
    const binSize = (stats.max - stats.min) / bins
    const counts = new Array(bins).fill(0)

    for (const row of matrix) {
      for (const val of row) {
        const binIndex = Math.min(Math.floor((val - stats.min) / binSize), bins - 1)
        counts[binIndex]++
      }
    }

    const maxCount = Math.max(...counts)
    return counts.map((count, i) => ({
      value: stats.min + (i + 0.5) * binSize,
      count,
      height: (count / maxCount) * 100,
    }))
  }, [matrix, stats])

  return (
    <div className="absolute top-4 right-4 w-72 bg-[#050505] backdrop-blur-md border border-white/[0.04] p-4 pointer-events-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-sm font-semibold text-white">Statistics</span>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 p-2">
            <div className="text-[10px] text-white/40 uppercase">Min</div>
            <div className="text-sm font-mono text-[#D4AF37]">{stats.min}</div>
          </div>
          <div className="bg-white/5 p-2">
            <div className="text-[10px] text-white/40 uppercase">Max</div>
            <div className="text-sm font-mono text-[#D4AF37]">{stats.max}</div>
          </div>
          <div className="bg-white/5 p-2">
            <div className="text-[10px] text-white/40 uppercase">Mean</div>
            <div className="text-sm font-mono text-white/80">{stats.mean.toFixed(2)}</div>
          </div>
          <div className="bg-white/5 p-2">
            <div className="text-[10px] text-white/40 uppercase">Std Dev</div>
            <div className="text-sm font-mono text-white/80">{stats.stdDev.toFixed(2)}</div>
          </div>
        </div>

        {/* Histogram */}
        <div className="space-y-2">
          <div className="text-[10px] text-white/40 uppercase">Distribution Histogram</div>
          <div className="h-20 flex items-end gap-[1px] bg-white/5 p-2">
            {histogram.map((bin, i) => (
              <div
                key={i}
                className="flex-1 transition-all"
                style={{
                  height: `${bin.height}%`,
                  backgroundColor: bin.value < 0 ? '#3B82F6' : bin.value > 0 ? '#F59E0B' : '#6B7280',
                }}
                title={`${bin.value.toFixed(0)}: ${bin.count} cells`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-white/30 font-mono">
            <span>{stats.min}</span>
            <span>0</span>
            <span>{stats.max}</span>
          </div>
        </div>

        {/* Distribution bars */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#D4AF37]" />
            <span className="text-[10px] text-white/60 flex-1">Negative</span>
            <span className="text-[10px] text-[#D4AF37] font-mono">{stats.negativeCount.toLocaleString()}</span>
            <span className="text-[10px] text-white/30">({((stats.negativeCount / stats.totalCells) * 100).toFixed(1)}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-500" />
            <span className="text-[10px] text-white/60 flex-1">Zero</span>
            <span className="text-[10px] text-gray-400 font-mono">{stats.zeroCount.toLocaleString()}</span>
            <span className="text-[10px] text-white/30">({((stats.zeroCount / stats.totalCells) * 100).toFixed(1)}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#D4AF37]" />
            <span className="text-[10px] text-white/60 flex-1">Positive</span>
            <span className="text-[10px] text-[#D4AF37] font-mono">{stats.positiveCount.toLocaleString()}</span>
            <span className="text-[10px] text-white/30">({((stats.positiveCount / stats.totalCells) * 100).toFixed(1)}%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// CELL DETAIL PANEL (ENHANCED)
// =============================================================================
function CellDetailPanel({
  cell,
  matrix,
  stats,
  onClose,
  onNavigate,
}: {
  cell: MatrixCell
  matrix: number[][]
  stats: MatrixStats
  onClose: () => void
  onNavigate: (row: number, col: number) => void
}) {
  const [copied, setCopied] = useState(false)
  const colorClass = cell.value > 0 ? 'text-[#D4AF37]' : cell.value < 0 ? 'text-[#D4AF37]' : 'text-gray-400'

  // Get neighboring values
  const neighbors = useMemo(() => {
    const result: { dir: string; row: number; col: number; value: number }[] = []
    const dirs = [
      { dir: 'N', dr: -1, dc: 0 },
      { dir: 'S', dr: 1, dc: 0 },
      { dir: 'E', dr: 0, dc: 1 },
      { dir: 'W', dr: 0, dc: -1 },
    ]
    for (const { dir, dr, dc } of dirs) {
      const nr = cell.row + dr
      const nc = cell.col + dc
      if (nr >= 0 && nr < 128 && nc >= 0 && nc < 128) {
        result.push({ dir, row: nr, col: nc, value: matrix[nr]?.[nc] ?? 0 })
      }
    }
    return result
  }, [cell, matrix])

  const handleCopy = () => {
    navigator.clipboard.writeText(`[${cell.row}, ${cell.col}] = ${cell.value}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="absolute bottom-4 right-4 w-64 bg-[#050505] backdrop-blur-md border border-white/[0.04] p-4 pointer-events-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-white">Cell Details</span>
        <div className="flex items-center gap-1">
          <button onClick={handleCopy} className="text-white/50 hover:text-white p-1">
            {copied ? <Check className="w-3 h-3 text-[#D4AF37]" /> : <Copy className="w-3 h-3" />}
          </button>
          <button onClick={onClose} className="text-white/50 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/50">Position</span>
          <span className="text-sm font-mono text-white">[{cell.row}, {cell.col}]</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/50">Value</span>
          <span className={`text-2xl font-bold font-mono ${colorClass}`}>{cell.value}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/50">Normalized</span>
          <span className="text-sm font-mono text-white/80">{(cell.normalizedValue * 100).toFixed(2)}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/50">Binary</span>
          <span className="text-xs font-mono text-white/60">{(cell.value >>> 0).toString(2).padStart(8, '0').slice(-8)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/50">Hex</span>
          <span className="text-xs font-mono text-white/60">0x{((cell.value + 256) % 256).toString(16).padStart(2, '0').toUpperCase()}</span>
        </div>

        {/* Neighbor navigation */}
        <div className="pt-2 border-t border-white/[0.04]">
          <div className="text-[10px] text-white/40 uppercase mb-2">Navigate to Neighbors</div>
          <div className="grid grid-cols-3 gap-1">
            <div />
            {neighbors.find((n) => n.dir === 'N') && (
              <button
                onClick={() => {
                  const n = neighbors.find((n) => n.dir === 'N')!
                  onNavigate(n.row, n.col)
                }}
                className="bg-white/10 hover:bg-white/20 px-2 py-1 text-[10px] font-mono text-white/70"
              >
                <ArrowUp className="w-3 h-3 mx-auto" />
              </button>
            )}
            <div />
            {neighbors.find((n) => n.dir === 'W') && (
              <button
                onClick={() => {
                  const n = neighbors.find((n) => n.dir === 'W')!
                  onNavigate(n.row, n.col)
                }}
                className="bg-white/10 hover:bg-white/20 px-2 py-1 text-[10px] font-mono text-white/70"
              >
                <ArrowLeft className="w-3 h-3 mx-auto" />
              </button>
            )}
            <div className="bg-white/5 px-2 py-1 text-[10px] font-mono text-white/50 text-center">
              {cell.value}
            </div>
            {neighbors.find((n) => n.dir === 'E') && (
              <button
                onClick={() => {
                  const n = neighbors.find((n) => n.dir === 'E')!
                  onNavigate(n.row, n.col)
                }}
                className="bg-white/10 hover:bg-white/20 px-2 py-1 text-[10px] font-mono text-white/70"
              >
                <ArrowRight className="w-3 h-3 mx-auto" />
              </button>
            )}
            <div />
            {neighbors.find((n) => n.dir === 'S') && (
              <button
                onClick={() => {
                  const n = neighbors.find((n) => n.dir === 'S')!
                  onNavigate(n.row, n.col)
                }}
                className="bg-white/10 hover:bg-white/20 px-2 py-1 text-[10px] font-mono text-white/70"
              >
                <ArrowDown className="w-3 h-3 mx-auto" />
              </button>
            )}
            <div />
          </div>
        </div>

        {/* Value scale indicator */}
        <div className="pt-2">
          <div className="h-3 bg-gradient-to-r from-[#D4AF37] via-gray-500 to-[#D4AF37] relative">
            <div
              className="absolute top-1/2 w-2 h-5 bg-white shadow-lg border border-black/50"
              style={{ left: `${cell.normalizedValue * 100}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// VALUE SEARCH PANEL
// =============================================================================
function SearchPanel({
  matrix,
  stats,
  onSelectCell,
  onClose,
}: {
  matrix: number[][]
  stats: MatrixStats
  onSelectCell: (row: number, col: number) => void
  onClose: () => void
}) {
  const [searchValue, setSearchValue] = useState('')
  const [results, setResults] = useState<{ row: number; col: number; value: number }[]>([])

  const handleSearch = () => {
    const target = parseInt(searchValue, 10)
    if (isNaN(target)) return

    const found: { row: number; col: number; value: number }[] = []
    for (let row = 0; row < 128; row++) {
      for (let col = 0; col < 128; col++) {
        if (matrix[row]?.[col] === target) {
          found.push({ row, col, value: target })
        }
      }
    }
    setResults(found.slice(0, 50)) // Limit to 50 results
  }

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-80 bg-[#050505] backdrop-blur-md border border-white/[0.04] p-4 pointer-events-auto z-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-sm font-semibold text-white">Search Value</span>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="number"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={`${stats.min} to ${stats.max}`}
          className="flex-1 bg-white/10 border border-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
        />
        <Button size="sm" onClick={handleSearch} className="bg-[#D4AF37] hover:bg-[#D4AF37]">
          Search
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          <div className="text-[10px] text-white/40 uppercase mb-1">
            Found {results.length} cells {results.length === 50 && '(showing first 50)'}
          </div>
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => onSelectCell(r.row, r.col)}
              className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 px-2 py-1 text-sm"
            >
              <span className="font-mono text-white/70">[{r.row}, {r.col}]</span>
              <span className="font-mono text-[#D4AF37]">{r.value}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// COORDINATE INPUT PANEL
// =============================================================================
function CoordinateInput({
  onNavigate,
  onClose,
}: {
  onNavigate: (row: number, col: number) => void
  onClose: () => void
}) {
  const [row, setRow] = useState('')
  const [col, setCol] = useState('')

  const handleGo = () => {
    const r = parseInt(row, 10)
    const c = parseInt(col, 10)
    if (!isNaN(r) && !isNaN(c) && r >= 0 && r < 128 && c >= 0 && c < 128) {
      onNavigate(r, c)
      onClose()
    }
  }

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#050505] backdrop-blur-md border border-white/[0.04] p-4 pointer-events-auto z-50">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-[#D4AF37]" />
        <span className="text-sm font-semibold text-white">Jump to Cell</span>
        <button onClick={onClose} className="ml-auto text-white/50 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={row}
          onChange={(e) => setRow(e.target.value)}
          placeholder="Row (0-127)"
          min={0}
          max={127}
          className="w-24 bg-white/10 border border-white/[0.04] px-2 py-1 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
        />
        <span className="text-white/30">,</span>
        <input
          type="number"
          value={col}
          onChange={(e) => setCol(e.target.value)}
          placeholder="Col (0-127)"
          min={0}
          max={127}
          className="w-24 bg-white/10 border border-white/[0.04] px-2 py-1 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
        />
        <Button size="sm" onClick={handleGo} className="bg-[#D4AF37] hover:bg-[#D4AF37]">
          Go
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// MINI MAP COMPONENT
// =============================================================================
function MiniMap({
  matrix,
  stats,
  selectedCell,
  hoveredCell,
}: {
  matrix: number[][]
  stats: MatrixStats
  selectedCell: MatrixCell | null
  hoveredCell: MatrixCell | null
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Draw matrix as mini heatmap
    const imageData = ctx.createImageData(128, 128)
    for (let row = 0; row < 128; row++) {
      for (let col = 0; col < 128; col++) {
        const value = matrix[row]?.[col] ?? 0
        const normalized = (value - stats.min) / (stats.max - stats.min)
        const i = (row * 128 + col) * 4

        if (value < 0) {
          imageData.data[i] = 59  // Blue
          imageData.data[i + 1] = 130
          imageData.data[i + 2] = 246
        } else if (value > 0) {
          imageData.data[i] = 245  // Orange
          imageData.data[i + 1] = 158
          imageData.data[i + 2] = 11
        } else {
          imageData.data[i] = 107  // Gray
          imageData.data[i + 1] = 114
          imageData.data[i + 2] = 128
        }
        imageData.data[i + 3] = 100 + normalized * 155
      }
    }
    ctx.putImageData(imageData, 0, 0)

    // Draw selected cell marker
    if (selectedCell) {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(selectedCell.col - 1, selectedCell.row - 1, 3, 3)
    }

    // Draw hovered cell marker
    if (hoveredCell && (!selectedCell || hoveredCell.row !== selectedCell.row || hoveredCell.col !== selectedCell.col)) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fillRect(hoveredCell.col - 1, hoveredCell.row - 1, 3, 3)
    }
  }, [matrix, stats, selectedCell, hoveredCell])

  return (
    <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md border border-white/[0.04] p-2 pointer-events-auto">
      <div className="flex items-center gap-1 mb-1">
        <Map className="w-3 h-3 text-white/50" />
        <span className="text-[9px] text-white/50 uppercase">Overview</span>
      </div>
      <canvas
        ref={canvasRef}
        width={128}
        height={128}
       
        style={{ width: 80, height: 80, imageRendering: 'pixelated' }}
      />
    </div>
  )
}

// =============================================================================
// INFO PANEL - Full documentation about Anna Matrix
// =============================================================================
function InfoPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-4 bg-black/98 backdrop-blur-xl border border-white/[0.04] overflow-hidden z-50 pointer-events-auto">
      <div className="h-full overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#D4AF37]/25">
                <Grid3X3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Anna Matrix</h2>
                <p className="text-sm text-gray-400">128 × 128 Signed Byte Cryptographic Matrix</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white p-2 hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Anna AI Chatbot Section */}
          <div className="bg-gradient-to-r from-[#D4AF37]/20 to-pink-500/20 border border-[#D4AF37]/30 p-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-pink-500 flex items-center justify-center shrink-0 shadow-lg">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="font-semibold text-white">Talk to Anna AI</h3>
                  <span className="px-2 py-0.5 bg-[#D4AF37]/30 text-[10px] text-[#D4AF37] uppercase">Live</span>
                </div>
                <p className="text-sm text-gray-300 mb-3">
                  Anna is an AI research assistant specialized in the Bitcoin-Qubic connection. Ask her about the matrix,
                  Patoshi patterns, seed derivation algorithms, or any aspect of the cryptographic evidence.
                  She can help interpret values, explain patterns, and guide your research.
                </p>
                <a
                  href="https://x.com/anna_aigarth"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-pink-600 hover:from-[#D4AF37] hover:to-pink-500 text-white font-medium transition-all shadow-lg shadow-[#D4AF37]/25"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Chat with @anna_aigarth
                </a>
              </div>
            </div>
          </div>

          {/* What is it - Enhanced */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <BookOpen className="w-4 h-4" />
              <h3 className="font-semibold">What is the Anna Matrix?</h3>
            </div>
            <div className="bg-white/5 p-4 space-y-3">
              <p className="text-sm text-gray-300 leading-relaxed">
                The <span className="text-[#D4AF37] font-semibold">Anna Matrix</span> is a 128×128 grid of signed bytes
                (-128 to +127) discovered embedded in the original Qubic codebase by <span className="text-[#D4AF37]">Come-from-Beyond</span> (Sergey Ivancheglo),
                the creator of IOTA and co-creator of NXT.
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                Named after the mysterious &quot;Anna&quot; referenced in early Qubic development, this matrix serves as a
                <span className="text-[#D4AF37] font-medium"> cryptographic lookup table</span> that potentially links
                Bitcoin&apos;s genesis block structures to the Qubic neural network architecture. Each of the
                <span className="text-white font-mono"> 16,384 cells</span> contains a value that, when XOR&apos;d with specific
                Bitcoin address bytes at corresponding positions, may reveal hidden patterns.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs text-gray-400">Qortex Compatible</span>
                </div>
                <div className="flex items-center gap-2">
                  <Binary className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs text-gray-400">Ternary Convertible</span>
                </div>
                <div className="flex items-center gap-2">
                  <ScanLine className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs text-gray-400">Pattern-Dense</span>
                </div>
              </div>
            </div>
          </div>

          {/* Origin - Enhanced */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <Hash className="w-4 h-4" />
              <h3 className="font-semibold">Origin &amp; Technical Specifications</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-3">
                <div className="text-[10px] text-white/40 uppercase mb-1">Source</div>
                <div className="text-sm font-mono text-white">Qubic Core (2018)</div>
              </div>
              <div className="bg-white/5 p-3">
                <div className="text-[10px] text-white/40 uppercase mb-1">Author</div>
                <div className="text-sm text-white">Come-from-Beyond</div>
              </div>
              <div className="bg-white/5 p-3">
                <div className="text-[10px] text-white/40 uppercase mb-1">Dimensions</div>
                <div className="text-sm font-mono text-white">128 × 128</div>
              </div>
              <div className="bg-white/5 p-3">
                <div className="text-[10px] text-white/40 uppercase mb-1">Total Cells</div>
                <div className="text-sm font-mono text-white">16,384</div>
              </div>
              <div className="bg-white/5 p-3">
                <div className="text-[10px] text-white/40 uppercase mb-1">Data Type</div>
                <div className="text-sm font-mono text-white">int8 (signed byte)</div>
              </div>
              <div className="bg-white/5 p-3">
                <div className="text-[10px] text-white/40 uppercase mb-1">Value Range</div>
                <div className="text-sm font-mono text-white">-128 to +127</div>
              </div>
            </div>
          </div>

          {/* How to Verify */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <FileCode className="w-4 h-4" />
              <h3 className="font-semibold">How to Verify &amp; Reproduce</h3>
            </div>
            <div className="bg-white/5 p-4">
              <ol className="text-sm text-gray-300 space-y-3">
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  <div>
                    <div className="font-medium text-white">Download the matrix data</div>
                    <code className="text-xs bg-black/50 px-2 py-1 mt-1 inline-block text-[#D4AF37]">/data/anna-matrix.json</code>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  <div>
                    <div className="font-medium text-white">Verify SHA256 checksum</div>
                    <code className="text-xs bg-black/50 px-2 py-1 mt-1 inline-block text-gray-400 break-all">sha256sum anna-matrix.json</code>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  <div>
                    <div className="font-medium text-white">Cross-reference with Patoshi blocks</div>
                    <span className="text-xs text-gray-400">Match public key bytes at row/col positions</span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center text-xs font-bold shrink-0">4</span>
                  <div>
                    <div className="font-medium text-white">Apply transformations</div>
                    <span className="text-xs text-gray-400">K12, SHA256, XOR operations with seed bytes</span>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          {/* Interactive Features Guide */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <Move className="w-4 h-4" />
              <h3 className="font-semibold">Interactive Controls</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/5 p-3 flex items-start gap-2">
                <div className="w-8 h-8 bg-white/10 flex items-center justify-center shrink-0">
                  <Table2 className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <div className="font-medium text-white">2D/3D Toggle</div>
                  <div className="text-xs text-gray-400">Switch between terrain and grid view</div>
                </div>
              </div>
              <div className="bg-white/5 p-3 flex items-start gap-2">
                <div className="w-8 h-8 bg-white/10 flex items-center justify-center shrink-0">
                  <Crosshair className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <div className="font-medium text-white">Crosshair</div>
                  <div className="text-xs text-gray-400">Visual cell targeting indicator</div>
                </div>
              </div>
              <div className="bg-white/5 p-3 flex items-start gap-2">
                <div className="w-8 h-8 bg-white/10 flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <div className="font-medium text-white">Value Search</div>
                  <div className="text-xs text-gray-400">Find all cells with specific value</div>
                </div>
              </div>
              <div className="bg-white/5 p-3 flex items-start gap-2">
                <div className="w-8 h-8 bg-white/10 flex items-center justify-center shrink-0">
                  <Palette className="w-4 h-4 text-pink-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Color Themes</div>
                  <div className="text-xs text-gray-400">5 professional color schemes</div>
                </div>
              </div>
            </div>
          </div>

          {/* Reading the Visualization */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <Eye className="w-4 h-4" />
              <h3 className="font-semibold">Reading the Visualization</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/10 border border-[#D4AF37]/30 p-4 text-center">
                <div className="w-10 h-10 bg-[#D4AF37] mx-auto mb-2 shadow-lg shadow-[#D4AF37]/50" />
                <div className="text-[#D4AF37] font-semibold">Negative</div>
                <div className="text-gray-500 text-xs">-128 to -1</div>
                <div className="text-[10px] text-gray-600 mt-1">Valleys in 3D</div>
              </div>
              <div className="bg-gradient-to-br from-gray-500/30 to-gray-600/10 border border-gray-500/30 p-4 text-center">
                <div className="w-10 h-10 bg-gray-500 mx-auto mb-2 shadow-lg shadow-gray-500/50" />
                <div className="text-gray-400 font-semibold">Zero</div>
                <div className="text-gray-500 text-xs">0</div>
                <div className="text-[10px] text-gray-600 mt-1">Base level</div>
              </div>
              <div className="bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/10 border border-[#D4AF37]/30 p-4 text-center">
                <div className="w-10 h-10 bg-[#D4AF37] mx-auto mb-2 shadow-lg shadow-[#D4AF37]/50" />
                <div className="text-[#D4AF37] font-semibold">Positive</div>
                <div className="text-gray-500 text-xs">1 to 127</div>
                <div className="text-[10px] text-gray-600 mt-1">Peaks in 3D</div>
              </div>
            </div>
          </div>

          {/* Research Applications */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <HelpCircle className="w-4 h-4" />
              <h3 className="font-semibold">Research Applications</h3>
            </div>
            <div className="space-y-2">
              {[
                { icon: '🔑', title: 'Seed Derivation', desc: 'Map Qubic 55-char seeds to Bitcoin addresses via matrix XOR operations' },
                { icon: '🔍', title: 'Pattern Analysis', desc: 'Identify non-random value distributions linking to Patoshi mining' },
                { icon: '🧠', title: 'Neural Networks', desc: 'Use as weight initialization for Qortex-style ternary networks' },
                { icon: '📊', title: 'Statistical Proofs', desc: 'Verify entropy and randomness metrics against null hypothesis' },
                { icon: '⛓️', title: 'Cross-Chain Links', desc: 'Correlate matrix positions with Bitcoin block heights and timestamps' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/5 p-3">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <div className="font-medium text-white text-sm">{item.title}</div>
                    <div className="text-xs text-gray-400">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Bitcoin Artifacts - Pre-Genesis Evidence */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-red-400">
              <Clock className="w-4 h-4" />
              <h3 className="font-semibold">Historical Bitcoin Artifacts</h3>
              <span className="px-2 py-0.5 bg-red-500/20 text-[10px] text-red-300 uppercase">Critical</span>
            </div>

            {/* Pre-Genesis Block */}
            <div className="bg-gradient-to-r from-red-500/10 to-[#D4AF37]/10 border border-red-500/30 p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-[#D4AF37] flex items-center justify-center shadow-lg shadow-red-500/30 shrink-0">
                  <Hash className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white">Pre-Genesis Block (Hidden)</div>
                  <div className="text-xs text-gray-400">September 10, 2008 - Before public Bitcoin announcement</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] text-white/40 uppercase">Block Hash (Never Published)</div>
                <div className="bg-black/50 p-3 font-mono text-xs text-[#D4AF37] break-all border border-white/5">
                  0x000006b15d1327d67e971d1de9116bd60a3a01556c91b6ebaa416ebc0cfaa646
                </div>
                <p className="text-xs text-gray-400">
                  This hash was discovered in pre-release Bitcoin code from 2008 and was never part of the public blockchain.
                  Only the original development team had access to this artifact before 2013.
                </p>
              </div>
            </div>

            {/* Time-Lock Correlations */}
            <div className="bg-white/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <Link2 className="w-4 h-4" />
                <span className="font-medium text-sm">Time-Lock Correlations</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-black/30 p-3">
                  <div className="text-white/40 uppercase text-[10px] mb-1">Pre-Genesis Timestamp</div>
                  <div className="font-mono text-white">1221069728</div>
                  <div className="text-gray-500 mt-1">Sept 10, 2008 20:02:08 UTC</div>
                </div>
                <div className="bg-black/30 p-3">
                  <div className="text-white/40 uppercase text-[10px] mb-1">Public Genesis Timestamp</div>
                  <div className="font-mono text-white">1231006505</div>
                  <div className="text-gray-500 mt-1">Jan 3, 2009 18:15:05 UTC</div>
                </div>
                <div className="bg-black/30 p-3">
                  <div className="text-white/40 uppercase text-[10px] mb-1">Pre-Genesis % 121</div>
                  <div className="font-mono text-[#D4AF37] text-lg">43</div>
                  <div className="text-gray-500 mt-1">Qubic modulo result</div>
                </div>
                <div className="bg-black/30 p-3">
                  <div className="text-white/40 uppercase text-[10px] mb-1">Time Difference</div>
                  <div className="font-mono text-[#D4AF37] text-lg">~115 days</div>
                  <div className="text-gray-500 mt-1">9,936,777 seconds</div>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                The modulo 121 operation (11×11, Qubic&apos;s magic number) on the pre-genesis timestamp yields 43.
                This needs cross-referencing with Anna Matrix cell [4,3] or related positions.
              </p>
            </div>

            {/* CFB Code Style Indicators */}
            <div className="bg-white/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <Code className="w-4 h-4" />
                <span className="font-medium text-sm">CFB Code Style Indicators</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-3 bg-black/30 p-3">
                  <FileText className="w-4 h-4 text-[#D4AF37] shrink-0 mt-1" />
                  <div>
                    <div className="font-medium text-white text-sm">&quot;Four Slash&quot; Comments</div>
                    <code className="text-xs bg-black/50 px-2 py-1 mt-1 block text-[#D4AF37] font-mono">
                      //// issue here: it doesn&apos;t know the version.
                    </code>
                    <p className="text-xs text-gray-400 mt-2">
                      Found in early Bitcoin code. CFB is known for idiosyncratic comment styles.
                      The plural &quot;we&quot; form in comments suggests a team, consistent with CFB&apos;s style.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-black/30 p-3">
                  <Binary className="w-4 h-4 text-[#D4AF37] shrink-0 mt-1" />
                  <div>
                    <div className="font-medium text-white text-sm">Integer-First Philosophy</div>
                    <p className="text-xs text-gray-400">
                      Early Bitcoin used &quot;Cents&quot; (10,000 units) instead of decimals.
                      CFB avoids floating-point (Qubic uses QUs as integers).
                      Both systems prefer precise integer math over decimal representations.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Research Significance */}
            <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/10 border border-[#D4AF37]/30 p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <div className="text-xs text-gray-300">
                  <span className="text-[#D4AF37] font-medium">Research Significance:</span> If the Anna Matrix or Qubic algorithms
                  &quot;recognize&quot; the pre-genesis hash (which was never public until 2013), it would demonstrate that the creator
                  of Qubic had access to private Bitcoin development code from 2008 — evidence that CFB was part of the original team.
                </div>
              </div>
            </div>
          </div>

          {/* Sources */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <ExternalLink className="w-4 h-4" />
              <h3 className="font-semibold">Sources &amp; References</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a href="https://github.com/qubic/core" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 p-3 text-sm text-[#D4AF37] hover:text-[#D4AF37] transition-colors">
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>Qubic Core (GitHub)</span>
              </a>
              <a href="https://qubic.org" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 p-3 text-sm text-[#D4AF37] hover:text-[#D4AF37] transition-colors">
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>Qubic Official</span>
              </a>
              <a href="https://x.com/anna_aigarth" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 p-3 text-sm text-[#D4AF37] hover:text-[#D4AF37] transition-colors">
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Anna AI (@anna_aigarth)</span>
              </a>
              <a href="/data/anna-matrix.json" download
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 p-3 text-sm text-[#D4AF37] hover:text-[#D4AF37] transition-colors">
                <Download className="w-4 h-4 shrink-0" />
                <span>Download JSON</span>
              </a>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-[#D4AF37]">Research Notice</div>
                <p className="text-gray-400 mt-1">
                  This visualization is provided for cryptographic research and educational purposes.
                  The relationship between the Anna Matrix and Bitcoin/Qubic is subject to ongoing
                  academic investigation. Always verify findings independently using the provided sources.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function MatrixTerrainScene() {
  const { loading, error, matrix, stats, retry, retryCount } = useAnnaMatrixData()

  // View states
  const [viewMode, setViewMode] = useState<'wireframe' | 'solid' | 'heatmap' | 'contour'>('heatmap')
  const [displayMode, setDisplayMode] = useState<'3d' | '2d'>('3d')
  const [colorTheme, setColorTheme] = useState<ColorTheme>('default')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoomRegion, setZoomRegion] = useState<'all' | 'q1' | 'q2' | 'q3' | 'q4'>('all')

  // Panel states
  const [showStats, setShowStats] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showCoordInput, setShowCoordInput] = useState(false)
  const [showCrosshair, setShowCrosshair] = useState(true)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [showColorPicker, setShowColorPicker] = useState(false)

  // Cell states
  const [selectedCell, setSelectedCell] = useState<MatrixCell | null>(null)
  const [hoveredCell, setHoveredCell] = useState<MatrixCell | null>(null)
  const [cameraPreset, setCameraPreset] = useState<keyof typeof TERRAIN_CAMERA_PRESETS>('perspective')
  const [loadProgress, setLoadProgress] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<any>(null)

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell || showInfo || showSearch) return

      let newRow = selectedCell.row
      let newCol = selectedCell.col

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          newRow = Math.max(0, selectedCell.row - 1)
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          newRow = Math.min(127, selectedCell.row + 1)
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          newCol = Math.max(0, selectedCell.col - 1)
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          newCol = Math.min(127, selectedCell.col + 1)
          break
        case 'Escape':
          setSelectedCell(null)
          return
        default:
          return
      }

      e.preventDefault()
      if (matrix) {
        const value = matrix[newRow]?.[newCol] ?? 0
        const normalized = stats ? (value - stats.min) / (stats.max - stats.min) : 0.5
        setSelectedCell({
          row: newRow,
          col: newCol,
          value,
          normalizedValue: normalized,
          height: (normalized - 0.5) * 2,
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCell, matrix, stats, showInfo, showSearch])

  // Loading progress
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadProgress((p) => Math.min(p + Math.random() * 20, 95))
      }, 150)
      return () => clearInterval(interval)
    } else {
      setLoadProgress(100)
    }
  }, [loading])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const resetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
    setCameraPreset('perspective')
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const handleNavigateToCell = useCallback((row: number, col: number) => {
    if (!matrix || !stats) return
    const value = matrix[row]?.[col] ?? 0
    const normalized = (value - stats.min) / (stats.max - stats.min)
    setSelectedCell({ row, col, value, normalizedValue: normalized, height: (normalized - 0.5) * 2 })
  }, [matrix, stats])

  if (loading || loadProgress < 100) {
    return (
      <div ref={containerRef} className="w-full h-[700px] overflow-hidden border border-border">
        <LoadingScreen progress={loadProgress} />
      </div>
    )
  }

  if (error) {
    return (
      <div ref={containerRef} className="w-full h-[700px] overflow-hidden border border-border bg-gradient-to-b from-black to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-[#D4AF37] mx-auto" />
          <h3 className="text-lg font-semibold text-white">{error.message}</h3>
          {error.details && <p className="text-sm text-gray-500">{error.details}</p>}
          {error.retryable && retryCount < 3 && (
            <Button onClick={retry} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (!matrix || !stats) return null

  const cameraPresetData = TERRAIN_CAMERA_PRESETS[cameraPreset]
  const currentCameraPosition = cameraPresetData?.position ?? [8, 8, 8] as [number, number, number]

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black overflow-hidden border border-border ${
        isFullscreen ? 'h-screen rounded-none' : 'h-[700px]'
      }`}
    >
      {/* 3D or 2D View */}
      {displayMode === '3d' ? (
        <Canvas gl={{ antialias: true, alpha: false }} dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={currentCameraPosition} fov={50} />
          <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.05} minDistance={3} maxDistance={25} maxPolarAngle={Math.PI / 2.1} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, 10, -10]} intensity={0.5} color={COLOR_THEMES[colorTheme].negative} />
          <pointLight position={[10, 10, 10]} intensity={0.5} color={COLOR_THEMES[colorTheme].positive} />
          <Stars radius={100} depth={50} count={2000} factor={4} fade speed={0.3} />
          <Suspense fallback={null}>
            <TerrainMesh
              matrix={matrix}
              stats={stats}
              viewMode={viewMode}
              colorTheme={colorTheme}
              selectedCell={selectedCell}
              hoveredCell={hoveredCell}
              onCellHover={setHoveredCell}
              onCellClick={setSelectedCell}
              showCrosshair={showCrosshair}
            />
          </Suspense>
        </Canvas>
      ) : (
        <Grid2DView
          matrix={matrix}
          stats={stats}
          colorTheme={colorTheme}
          selectedCell={selectedCell}
          onCellClick={setSelectedCell}
          zoomRegion={zoomRegion}
        />
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Left - Legend */}
        <div className="absolute top-4 left-4 bg-[#050505] backdrop-blur-md border border-white/[0.04] p-4 pointer-events-auto group">
          <div className="flex items-center gap-2 mb-3">
            <Grid3X3 className="w-5 h-5 text-[#D4AF37]" />
            <div>
              <div className="text-sm font-semibold text-white">Anna Matrix</div>
              <div className="text-[10px] text-gray-400">128 × 128 • {displayMode.toUpperCase()}</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] text-white/50 uppercase">Value Scale ({COLOR_THEMES[colorTheme].name})</div>
            <div
              className="h-3 cursor-help"
              style={{
                background: `linear-gradient(to right, ${COLOR_THEMES[colorTheme].negative}, ${COLOR_THEMES[colorTheme].neutral}, ${COLOR_THEMES[colorTheme].positive})`,
              }}
              title={`Range: ${stats.min} to ${stats.max} | Mean: ${stats.mean.toFixed(1)} | StdDev: ${stats.stdDev.toFixed(1)}`}
            />
            <div className="flex justify-between text-[10px] text-white/50">
              <span>{stats.min}</span>
              <span>0</span>
              <span>{stats.max}</span>
            </div>
          </div>

          {/* Quick Stats - Always visible */}
          <div className="mt-3 pt-3 border-t border-white/[0.04] space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-[#D4AF37]">Negative</span>
              <span className="text-white/70 font-mono">{stats.negativeCount.toLocaleString()} ({((stats.negativeCount / stats.totalCells) * 100).toFixed(0)}%)</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-400">Zero</span>
              <span className="text-white/70 font-mono">{stats.zeroCount.toLocaleString()} ({((stats.zeroCount / stats.totalCells) * 100).toFixed(0)}%)</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-[#D4AF37]">Positive</span>
              <span className="text-white/70 font-mono">{stats.positiveCount.toLocaleString()} ({((stats.positiveCount / stats.totalCells) * 100).toFixed(0)}%)</span>
            </div>
          </div>

          {/* Keyboard hints */}
          {selectedCell && (
            <div className="mt-3 pt-3 border-t border-white/[0.04]">
              <div className="text-[9px] text-white/30 uppercase">Navigate: Arrow keys / WASD</div>
            </div>
          )}
        </div>

        {/* Top Right - Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-auto">
          {/* Primary actions */}
          <div className="flex gap-1 bg-[#050505] backdrop-blur-md border border-white/[0.04] p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10" onClick={toggleFullscreen} title="Fullscreen">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10" onClick={resetCamera} title="Reset Camera">
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${displayMode === '2d' ? 'text-[#D4AF37] bg-[#D4AF37]/20' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              onClick={() => setDisplayMode(displayMode === '3d' ? '2d' : '3d')}
              title="Toggle 2D/3D"
            >
              <Table2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${showCrosshair ? 'text-[#D4AF37] bg-[#D4AF37]/20' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowCrosshair(!showCrosshair)}
              title="Toggle Crosshair"
            >
              <Crosshair className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${showSearch ? 'text-[#D4AF37] bg-[#D4AF37]/20' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowSearch(!showSearch)}
              title="Search Value"
            >
              <Search className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${showCoordInput ? 'text-[#D4AF37] bg-[#D4AF37]/20' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowCoordInput(!showCoordInput)}
              title="Jump to Cell"
            >
              <Target className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${showStats ? 'text-[#D4AF37] bg-[#D4AF37]/20' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowStats(!showStats)}
              title="Statistics"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${showInfo ? 'text-[#D4AF37] bg-[#D4AF37]/20' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowInfo(!showInfo)}
              title="About Anna Matrix"
            >
              <Info className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${showMiniMap ? 'text-[#D4AF37] bg-[#D4AF37]/20' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              onClick={() => setShowMiniMap(!showMiniMap)}
              title="Toggle MiniMap"
            >
              <Map className="w-4 h-4" />
            </Button>
            <a
              href="/data/anna-matrix.json"
              download
              className="h-8 w-8 inline-flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10"
              title="Download Matrix JSON"
            >
              <Download className="w-4 h-4" />
            </a>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => {
                // Random discovery - find a random extreme value cell
                if (!matrix || !stats) return
                const threshold = 0.85
                const extremeCells: { row: number; col: number; value: number }[] = []
                for (let row = 0; row < 128; row++) {
                  for (let col = 0; col < 128; col++) {
                    const value = matrix[row]?.[col] ?? 0
                    const normalized = (value - stats.min) / (stats.max - stats.min)
                    if (normalized > threshold || normalized < (1 - threshold)) {
                      extremeCells.push({ row, col, value })
                    }
                  }
                }
                if (extremeCells.length > 0) {
                  const randomCell = extremeCells[Math.floor(Math.random() * extremeCells.length)]
                  if (randomCell) {
                    const normalized = (randomCell.value - stats.min) / (stats.max - stats.min)
                    setSelectedCell({
                      row: randomCell.row,
                      col: randomCell.col,
                      value: randomCell.value,
                      normalizedValue: normalized,
                      height: (normalized - 0.5) * 2,
                    })
                  }
                }
              }}
              title="Random Discovery (Jump to extreme value)"
            >
              <Sparkles className="w-4 h-4" />
            </Button>
          </div>

          {/* Color themes */}
          <div className="bg-[#050505] backdrop-blur-md border border-white/[0.04] p-1">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-2 px-2 py-1 text-[10px] text-gray-400 hover:text-white w-full"
            >
              <Palette className="w-3 h-3" />
              <span>Theme: {COLOR_THEMES[colorTheme].name}</span>
            </button>
            {showColorPicker && (
              <div className="grid grid-cols-5 gap-1 mt-1 p-1">
                {(Object.keys(COLOR_THEMES) as ColorTheme[]).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => { setColorTheme(theme); setShowColorPicker(false) }}
                    className={`w-6 h-6 ${colorTheme === theme ? 'ring-2 ring-white' : ''}`}
                    style={{ background: `linear-gradient(135deg, ${COLOR_THEMES[theme].negative}, ${COLOR_THEMES[theme].positive})` }}
                    title={COLOR_THEMES[theme].name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* View modes (3D only) */}
          {displayMode === '3d' && (
            <div className="bg-[#050505] backdrop-blur-md border border-white/[0.04] p-1">
              <div className="text-[10px] text-gray-500 px-2 py-1">View Mode</div>
              <div className="grid grid-cols-2 gap-1">
                {VIEW_MODES.map((mode) => (
                  <Button
                    key={mode.id}
                    variant="ghost"
                    size="sm"
                    className={`h-7 text-xs ${viewMode === mode.id ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                    onClick={() => setViewMode(mode.id)}
                  >
                    {mode.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Zoom regions (2D only) */}
          {displayMode === '2d' && (
            <div className="bg-[#050505] backdrop-blur-md border border-white/[0.04] p-1">
              <div className="text-[10px] text-gray-500 px-2 py-1">Zoom Region</div>
              <div className="grid grid-cols-3 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 text-xs col-span-3 ${zoomRegion === 'all' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                  onClick={() => setZoomRegion('all')}
                >
                  Full 128×128
                </Button>
                {(['q1', 'q2', 'q3', 'q4'] as const).map((q, i) => (
                  <Button
                    key={q}
                    variant="ghost"
                    size="sm"
                    className={`h-6 text-[10px] ${zoomRegion === q ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                    onClick={() => setZoomRegion(q)}
                  >
                    Q{i + 1}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Camera presets (3D only) */}
          {displayMode === '3d' && (
            <div className="bg-[#050505] backdrop-blur-md border border-white/[0.04] p-1">
              <div className="text-[10px] text-gray-500 px-2 py-1">Camera</div>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(TERRAIN_CAMERA_PRESETS).map(([key, preset]) => (
                  <Button
                    key={key}
                    variant="ghost"
                    size="sm"
                    className={`h-7 text-xs ${cameraPreset === key ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                    onClick={() => setCameraPreset(key as keyof typeof TERRAIN_CAMERA_PRESETS)}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats Panel */}
        {showStats && stats && <StatsPanel stats={stats} matrix={matrix} onClose={() => setShowStats(false)} />}

        {/* Info Panel */}
        {showInfo && <InfoPanel onClose={() => setShowInfo(false)} />}

        {/* Search Panel */}
        {showSearch && <SearchPanel matrix={matrix} stats={stats} onSelectCell={handleNavigateToCell} onClose={() => setShowSearch(false)} />}

        {/* Coordinate Input */}
        {showCoordInput && <CoordinateInput onNavigate={handleNavigateToCell} onClose={() => setShowCoordInput(false)} />}

        {/* Mini Map */}
        {showMiniMap && displayMode === '3d' && <MiniMap matrix={matrix} stats={stats} selectedCell={selectedCell} hoveredCell={hoveredCell} />}

        {/* Hover info */}
        {hoveredCell && !selectedCell && displayMode === '3d' && (
          <div className="absolute bottom-20 left-24 bg-[#050505] backdrop-blur-md border border-white/[0.04] px-3 py-2 pointer-events-none">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-white/50 font-mono">[{hoveredCell.row}, {hoveredCell.col}]</span>
              <span className={`font-mono font-bold ${hoveredCell.value > 0 ? 'text-[#D4AF37]' : hoveredCell.value < 0 ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                {hoveredCell.value}
              </span>
            </div>
          </div>
        )}

        {/* Selected cell detail */}
        {selectedCell && (
          <CellDetailPanel
            cell={selectedCell}
            matrix={matrix}
            stats={stats}
            onClose={() => setSelectedCell(null)}
            onNavigate={handleNavigateToCell}
          />
        )}
      </div>

      {/* Watermark */}
      <div className="absolute bottom-4 right-4 text-[10px] text-white/20 pointer-events-none font-mono">
        Anna Matrix v2.0 • 128×128 • {stats.totalCells.toLocaleString()} cells • {COLOR_THEMES[colorTheme].name}
      </div>
    </div>
  )
}
