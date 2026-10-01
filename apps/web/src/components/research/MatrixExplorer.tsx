'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

interface MatrixExplorerProps {
  matrix: number[][]
  selectedCell: { row: number; col: number } | null
  onCellSelect: (row: number, col: number) => void
  onCellHover?: (row: number, col: number) => void
}

type ZoomLevel = 'full' | 'q1' | 'q2' | 'q3' | 'q4' | 'custom'

const ZOOM_PRESETS: Record<
  string,
  {
    startRow: number
    endRow: number
    startCol: number
    endCol: number
    label: string
  }
> = {
  full: {
    startRow: 0,
    endRow: 128,
    startCol: 0,
    endCol: 128,
    label: 'Full 128x128',
  },
  q1: {
    startRow: 0,
    endRow: 64,
    startCol: 0,
    endCol: 64,
    label: 'Q1 (Top-Left)',
  },
  q2: {
    startRow: 0,
    endRow: 64,
    startCol: 64,
    endCol: 128,
    label: 'Q2 (Top-Right)',
  },
  q3: {
    startRow: 64,
    endRow: 128,
    startCol: 0,
    endCol: 64,
    label: 'Q3 (Bottom-Left)',
  },
  q4: {
    startRow: 64,
    endRow: 128,
    startCol: 64,
    endCol: 128,
    label: 'Q4 (Bottom-Right)',
  },
}

export function MatrixExplorer({
  matrix,
  selectedCell,
  onCellSelect,
  onCellHover,
}: MatrixExplorerProps) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('full')
  const [hoveredCell, setHoveredCell] = useState<{
    row: number
    col: number
  } | null>(null)
  const [showRowHighlight, setShowRowHighlight] = useState(true)
  const [showColHighlight, setShowColHighlight] = useState(true)
  const [cellSize, setCellSize] = useState(4)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate view bounds
  const viewBounds = useMemo(() => {
    return ZOOM_PRESETS[zoomLevel] ?? ZOOM_PRESETS.full!
  }, [zoomLevel])

  const visibleRows = viewBounds!.endRow - viewBounds!.startRow
  const visibleCols = viewBounds!.endCol - viewBounds!.startCol

  // Color calculation
  const getCellColor = useCallback((value: number): string => {
    // Normalize to 0-1 range
    const normalized = (value + 128) / 255

    if (value < 0) {
      // Blue gradient for negative
      const intensity = Math.abs(value) / 128
      return `rgb(${Math.round(59 + (1 - intensity) * 50)}, ${Math.round(130 + (1 - intensity) * 50)}, ${Math.round(246 - intensity * 100)})`
    } else if (value > 0) {
      // Orange gradient for positive
      const intensity = value / 127
      return `rgb(${Math.round(245 - (1 - intensity) * 50)}, ${Math.round(158 - intensity * 80)}, ${Math.round(11 + (1 - intensity) * 40)})`
    }
    // Gray for zero
    return 'rgb(107, 114, 128)'
  }, [])

  // Handle cell click
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      onCellSelect(row, col)
    },
    [onCellSelect]
  )

  // Handle cell hover
  const handleCellHover = useCallback(
    (row: number, col: number) => {
      setHoveredCell({ row, col })
      onCellHover?.(row, col)
    },
    [onCellHover]
  )

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell) return
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return

      let newRow = selectedCell.row
      let newCol = selectedCell.col

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          newRow = Math.max(0, selectedCell.row - 1)
          break
        case 'ArrowDown':
        case 's':
          newRow = Math.min(127, selectedCell.row + 1)
          break
        case 'ArrowLeft':
        case 'a':
          newCol = Math.max(0, selectedCell.col - 1)
          break
        case 'ArrowRight':
        case 'd':
          newCol = Math.min(127, selectedCell.col + 1)
          break
        default:
          return
      }

      e.preventDefault()
      onCellSelect(newRow, newCol)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCell, onCellSelect])

  // Get selected cell info
  const selectedCellInfo = useMemo(() => {
    if (!selectedCell) return null
    const value = matrix[selectedCell.row]?.[selectedCell.col] ?? 0
    const address = selectedCell.row * 128 + selectedCell.col
    const hex = (value < 0 ? value + 256 : value)
      .toString(16)
      .toUpperCase()
      .padStart(2, '0')
    const binary = (value < 0 ? value + 256 : value)
      .toString(2)
      .padStart(8, '0')
    return { ...selectedCell, value, address, hex, binary }
  }, [selectedCell, matrix])

  // Get hovered cell info
  const hoveredCellInfo = useMemo(() => {
    if (!hoveredCell) return null
    const value = matrix[hoveredCell.row]?.[hoveredCell.col] ?? 0
    return { ...hoveredCell, value }
  }, [hoveredCell, matrix])

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Controls Bar */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2 bg-card">
        <div className="flex items-center gap-2">
          {/* Zoom Presets */}
          <div className="flex gap-1">
            {Object.entries(ZOOM_PRESETS).map(([key, preset]) => (
              <Button
                className={cn(
                  'h-7 px-2 text-xs',
                  zoomLevel === key
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                )}
                key={key}
                onClick={() => setZoomLevel(key as ZoomLevel)}
                size="sm"
                variant="ghost"
              >
                {key === 'full' ? '128²' : key.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Cell Size Slider */}
          <div className="flex items-center gap-2">
            <ZoomOut className="h-3 w-3 text-muted-foreground/70" />
            <Slider
              className="w-20"
              max={12}
              min={2}
              onValueChange={([v]) => setCellSize(v ?? 4)}
              step={1}
              value={[cellSize]}
            />
            <ZoomIn className="h-3 w-3 text-muted-foreground/70" />
          </div>

          {/* Toggle buttons */}
          <Button
            className={cn(
              'h-7 px-2',
              showRowHighlight
                ? 'text-gold bg-gold/20'
                : 'text-muted-foreground'
            )}
            onClick={() => setShowRowHighlight(!showRowHighlight)}
            size="sm"
            title="Toggle row highlight"
            variant="ghost"
          >
            <span className="text-xs font-mono">ROW</span>
          </Button>
          <Button
            className={cn(
              'h-7 px-2',
              showColHighlight
                ? 'text-gold bg-gold/20'
                : 'text-muted-foreground'
            )}
            onClick={() => setShowColHighlight(!showColHighlight)}
            size="sm"
            title="Toggle column highlight"
            variant="ghost"
          >
            <span className="text-xs font-mono">COL</span>
          </Button>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="flex-1 overflow-auto p-2" ref={containerRef}>
        <div className="relative inline-block">
          {/* Column Headers */}
          <div className="sticky top-0 z-20 flex bg-card/95 backdrop-blur-sm">
            <div className="shrink-0" style={{ width: 32, minWidth: 32 }} />
            <div className="flex">
              {Array.from({ length: visibleCols }, (_, i) => {
                const col = viewBounds.startCol + i
                const isSelected = selectedCell?.col === col
                const isHovered = hoveredCell?.col === col
                return (
                  <div
                    className={cn(
                      'text-center font-mono transition-colors',
                      isSelected
                        ? 'text-white font-bold'
                        : isHovered && showColHighlight
                          ? 'text-gold'
                          : 'text-muted-foreground'
                    )}
                    key={col}
                    style={{
                      width: cellSize,
                      minWidth: cellSize,
                      fontSize: Math.max(6, cellSize - 2),
                    }}
                  >
                    {col % (zoomLevel === 'full' ? 16 : 8) === 0 ? col : ''}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Matrix Cells */}
          <div className="flex">
            {/* Row Headers */}
            <div className="sticky left-0 z-10 flex flex-col bg-card/95 backdrop-blur-sm">
              {Array.from({ length: visibleRows }, (_, i) => {
                const row = viewBounds.startRow + i
                const isSelected = selectedCell?.row === row
                const isHovered = hoveredCell?.row === row
                return (
                  <div
                    className={cn(
                      'w-8 text-right pr-1 font-mono flex items-center justify-end transition-colors',
                      isSelected
                        ? 'text-white font-bold'
                        : isHovered && showRowHighlight
                          ? 'text-gold'
                          : 'text-muted-foreground'
                    )}
                    key={row}
                    style={{
                      height: cellSize,
                      minHeight: cellSize,
                      fontSize: Math.max(6, cellSize - 2),
                    }}
                  >
                    {row % (zoomLevel === 'full' ? 16 : 8) === 0 ? row : ''}
                  </div>
                )
              })}
            </div>

            {/* Grid */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${visibleCols}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${visibleRows}, ${cellSize}px)`,
              }}
            >
              {Array.from({ length: visibleRows * visibleCols }, (_, i) => {
                const row = viewBounds.startRow + Math.floor(i / visibleCols)
                const col = viewBounds.startCol + (i % visibleCols)
                const value = matrix[row]?.[col] ?? 0
                const isSelected =
                  selectedCell?.row === row && selectedCell?.col === col
                const isHovered =
                  hoveredCell?.row === row && hoveredCell?.col === col
                const isRowHovered =
                  showRowHighlight && hoveredCell?.row === row
                const isColHovered =
                  showColHighlight && hoveredCell?.col === col

                return (
                  <div
                    className={cn(
                      'cursor-crosshair transition-all',
                      isSelected && 'ring-2 ring-white z-10',
                      isHovered && 'ring-1 ring-white/80 z-5',
                      isRowHovered && !isHovered && 'brightness-125',
                      isColHovered && !isHovered && 'brightness-125'
                    )}
                    key={`${row}-${col}`}
                    onClick={() => handleCellClick(row, col)}
                    onMouseEnter={() => handleCellHover(row, col)}
                    onMouseLeave={() => setHoveredCell(null)}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: getCellColor(value),
                    }}
                    title={`[${row}, ${col}] = ${value}`}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="border-t border-border bg-card px-3 py-2">
        {selectedCellInfo ? (
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Position</span>
              <div className="font-mono text-white">
                [{selectedCellInfo.row}, {selectedCellInfo.col}]
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Value</span>
              <div
                className={cn(
                  'font-mono font-bold',
                  selectedCellInfo.value > 0
                    ? 'text-gold'
                    : selectedCellInfo.value < 0
                      ? 'text-gold/80'
                      : 'text-gray-400'
                )}
              >
                {selectedCellInfo.value}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Hex</span>
              <div className="font-mono text-gold/70">
                0x{selectedCellInfo.hex}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Binary</span>
              <div className="font-mono text-gold/80 text-xs">
                {selectedCellInfo.binary}
              </div>
            </div>
          </div>
        ) : hoveredCellInfo ? (
          <div className="flex items-center gap-4 text-xs">
            <span className="font-mono text-white/60">
              [{hoveredCellInfo.row}, {hoveredCellInfo.col}]
            </span>
            <span
              className={cn(
                'font-mono font-bold',
                hoveredCellInfo.value > 0
                  ? 'text-gold'
                  : hoveredCellInfo.value < 0
                    ? 'text-gold/80'
                    : 'text-gray-400'
              )}
            >
              {hoveredCellInfo.value}
            </span>
            <span className="text-muted-foreground">Click to select</span>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            Hover over cells to see values. Click to select. Use WASD or arrow
            keys to navigate.
          </div>
        )}
      </div>

      {/* Color Legend */}
      <div className="border-t border-border px-3 py-2 bg-card">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-gold/80">-128</span>
          <div
            className="flex-1 mx-2 h-2"
            style={{
              background:
                'linear-gradient(to right, rgb(59, 130, 246), rgb(107, 114, 128), rgb(245, 158, 11))',
            }}
          />
          <span className="text-gold">+127</span>
        </div>
      </div>
    </div>
  )
}

export default MatrixExplorer
