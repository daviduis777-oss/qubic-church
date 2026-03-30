'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { ChevronDown, ChevronUp, ZoomIn, ZoomOut, Crosshair } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SYMMETRY_BREAK_COLUMNS, POINT_SYMMETRY_PERCENT, SPECTRAL_RADIUS, FIXED_POINT_COLUMN_SUM, ENERGY_LEVELS } from '../config'

interface MatrixExplorerProps {
  matrix: number[][] | null
  numTypes: number
  samplingStrategy: string
  isOpen: boolean
  onToggle: () => void
}

const ZOOM_LEVELS = [3, 4, 5] as const

export function MatrixExplorer({ matrix, numTypes, samplingStrategy, isOpen, onToggle }: MatrixExplorerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number; value: number; mouseX: number; mouseY: number } | null>(null)
  const [zoomIdx, setZoomIdx] = useState(1) // default 4px cells
  const [showBreaks, setShowBreaks] = useState(true)
  const [showRow6, setShowRow6] = useState(true)
  const [showSamplingGrid, setShowSamplingGrid] = useState(true)
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)

  const cellSize = ZOOM_LEVELS[zoomIdx] ?? 4

  // Compute symmetry break cells once
  const symmetryBreaks = useMemo(() => {
    if (!matrix) return new Set<string>()
    const breaks = new Set<string>()
    for (let r = 0; r < 128; r++) {
      for (let c = 0; c < 128; c++) {
        const sum = matrix[r]![c]! + matrix[127 - r]![127 - c]!
        if (sum !== -1) breaks.add(`${r},${c}`)
      }
    }
    return breaks
  }, [matrix])

  // Draw the 128x128 heatmap
  useEffect(() => {
    if (!isOpen || !matrix) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 128 * cellSize
    canvas.width = size
    canvas.height = size

    // Draw cells
    for (let r = 0; r < 128; r++) {
      for (let c = 0; c < 128; c++) {
        const val = matrix[r]![c]!
        ctx.fillStyle = valueToColor(val)
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize)
      }
    }

    // Overlay: Row 6 band
    if (showRow6) {
      ctx.fillStyle = 'rgba(212, 175, 55, 0.12)'
      ctx.fillRect(0, 6 * cellSize, size, cellSize)
      // Row 6 label
      ctx.fillStyle = 'rgba(212, 175, 55, 0.5)'
      ctx.font = `${Math.max(8, cellSize - 1)}px monospace`
      ctx.fillText('R6', 2, 6 * cellSize + cellSize - 1)
    }

    // Overlay: Symmetry break column bands
    if (showBreaks) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.08)'
      for (const col of SYMMETRY_BREAK_COLUMNS) {
        ctx.fillRect(col * cellSize, 0, cellSize, size)
      }

      // Draw individual break cells
      for (const key of symmetryBreaks) {
        const [r, c] = key.split(',').map(Number) as [number, number]
        ctx.fillStyle = 'rgba(239, 68, 68, 0.7)'
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize)
        // Small dot marker
        if (cellSize >= 4) {
          ctx.fillStyle = 'rgba(255, 100, 100, 0.9)'
          ctx.beginPath()
          ctx.arc(c * cellSize + cellSize / 2, r * cellSize + cellSize / 2, 1, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    // Overlay: Sampling grid
    if (showSamplingGrid) {
      const step = Math.floor(128 / numTypes)
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      for (let i = 0; i <= numTypes; i++) {
        const pos = Math.min(128, i * step) * cellSize
        ctx.beginPath(); ctx.moveTo(pos, 0); ctx.lineTo(pos, size); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, pos); ctx.lineTo(size, pos); ctx.stroke()
      }
      ctx.setLineDash([])
    }

    // Selected cell highlight
    if (selectedCell) {
      ctx.strokeStyle = '#D4AF37'
      ctx.lineWidth = 2
      ctx.strokeRect(selectedCell.col * cellSize, selectedCell.row * cellSize, cellSize, cellSize)
      // Mirror cell
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'
      ctx.strokeRect((127 - selectedCell.col) * cellSize, (127 - selectedCell.row) * cellSize, cellSize, cellSize)
    }
  }, [isOpen, matrix, numTypes, cellSize, showBreaks, showRow6, showSamplingGrid, symmetryBreaks, selectedCell])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!matrix) return
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return
      const canvasRect = canvas.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const x = e.clientX - canvasRect.left
      const y = e.clientY - canvasRect.top
      const col = Math.floor((x / canvasRect.width) * 128)
      const row = Math.floor((y / canvasRect.height) * 128)
      if (row >= 0 && row < 128 && col >= 0 && col < 128) {
        setHoveredCell({
          row, col,
          value: matrix[row]![col]!,
          mouseX: e.clientX - containerRect.left,
          mouseY: e.clientY - containerRect.top,
        })
      } else {
        setHoveredCell(null)
      }
    },
    [matrix],
  )

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!matrix) return
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const col = Math.floor((x / rect.width) * 128)
      const row = Math.floor((y / rect.height) * 128)
      if (row >= 0 && row < 128 && col >= 0 && col < 128) {
        setSelectedCell((prev) =>
          prev?.row === row && prev?.col === col ? null : { row, col },
        )
      }
    },
    [matrix],
  )

  const canvasPixelSize = 128 * cellSize

  return (
    <div className="border border-white/[0.06] bg-[#050505]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-xs font-mono text-white/55 uppercase tracking-wider">
          Anna Matrix Explorer (128x128)
        </span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-white/45" /> : <ChevronDown className="w-3.5 h-3.5 text-white/45" />}
      </button>

      {isOpen && matrix && (
        <div ref={containerRef} className="p-3 sm:p-4 pt-0 space-y-3 relative">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Zoom */}
            <div className="flex items-center gap-0.5 bg-[#0a0a0a] border border-white/[0.06] p-0.5">
              <button
                onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
                className="p-1 text-white/45 hover:text-white/60 disabled:opacity-30"
                disabled={zoomIdx === 0}
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="text-[11px] font-mono text-white/45 px-1">{cellSize}px</span>
              <button
                onClick={() => setZoomIdx((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
                className="p-1 text-white/45 hover:text-white/60 disabled:opacity-30"
                disabled={zoomIdx === ZOOM_LEVELS.length - 1}
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>

            {/* Toggle overlays */}
            <OverlayToggle label="Breaks" active={showBreaks} color="red" onClick={() => setShowBreaks(!showBreaks)} />
            <OverlayToggle label="Row 6" active={showRow6} color="gold" onClick={() => setShowRow6(!showRow6)} />
            <OverlayToggle label="Grid" active={showSamplingGrid} color="gold" onClick={() => setShowSamplingGrid(!showSamplingGrid)} />

            {selectedCell && (
              <button
                onClick={() => setSelectedCell(null)}
                className="text-[11px] font-mono text-white/45 hover:text-white/65 flex items-center gap-1"
              >
                <Crosshair className="w-3 h-3" /> Clear selection
              </button>
            )}
          </div>

          {/* Main content: canvas + info */}
          <div className="flex gap-4 items-start flex-col lg:flex-row">
            {/* Heatmap canvas - scrollable on small screens */}
            <div className="overflow-auto max-w-full border border-white/[0.06] bg-black/20">
              <canvas
                ref={canvasRef}
                className="block cursor-crosshair"
                style={{ width: canvasPixelSize, height: canvasPixelSize, imageRendering: 'pixelated' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredCell(null)}
                onClick={handleClick}
              />
            </div>

            {/* Right panel: info + selected cell */}
            <div className="space-y-3 text-xs min-w-[200px] flex-shrink-0">
              {/* Selected cell detail */}
              {selectedCell && matrix && (
                <div className="bg-[#0a0a0a] border border-[#D4AF37]/20 p-2.5 space-y-1.5">
                  <div className="text-[#D4AF37]/60 font-mono uppercase text-[11px]">Selected Cell</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-white/65 font-mono">
                    <span className="text-white/40">Position:</span>
                    <span>[{selectedCell.row}, {selectedCell.col}]</span>
                    <span className="text-white/40">Value:</span>
                    <span className="text-[#D4AF37]">{matrix[selectedCell.row]![selectedCell.col]}</span>
                    <span className="text-white/40">Mirror:</span>
                    <span>[{127 - selectedCell.row}, {127 - selectedCell.col}]</span>
                    <span className="text-white/40">Mirror val:</span>
                    <span className="text-blue-400">{matrix[127 - selectedCell.row]![127 - selectedCell.col]}</span>
                    <span className="text-white/40">Sum:</span>
                    <span>{matrix[selectedCell.row]![selectedCell.col]! + matrix[127 - selectedCell.row]![127 - selectedCell.col]!}</span>
                    <span className="text-white/40">Sym. break:</span>
                    <span className={symmetryBreaks.has(`${selectedCell.row},${selectedCell.col}`) ? 'text-red-400' : 'text-emerald-400'}>
                      {symmetryBreaks.has(`${selectedCell.row},${selectedCell.col}`) ? 'YES' : 'no'}
                    </span>
                    <span className="text-white/40">Row 6:</span>
                    <span>{selectedCell.row === 6 ? 'YES (Oracle row)' : 'no'}</span>
                  </div>
                </div>
              )}

              {/* Color legend */}
              <div className="space-y-1">
                <div className="text-white/40 font-mono uppercase">Color Scale</div>
                <div className="flex items-center gap-1">
                  <div className="w-full h-3 rounded-sm" style={{
                    background: 'linear-gradient(to right, #3B82F6, #1a1a2e, #D4AF37)',
                  }} />
                </div>
                <div className="flex justify-between text-white/35 font-mono text-[11px]">
                  <span>-128 (repulsion)</span>
                  <span>0</span>
                  <span>+127 (attraction)</span>
                </div>
              </div>

              {/* Overlay legend */}
              <div className="space-y-1">
                <div className="text-white/40 font-mono uppercase">Overlays</div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2.5 bg-red-500/60 rounded-sm" />
                  <span className="text-white/45">{symmetryBreaks.size} symmetry breaks (34 pairs)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2.5 bg-[#D4AF37]/25 rounded-sm" />
                  <span className="text-white/45">Row 6 oracle (24x value 26)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2.5 border border-[#D4AF37]/40 border-dashed rounded-sm" />
                  <span className="text-white/45">Sampling grid ({numTypes}x{numTypes})</span>
                </div>
              </div>

              {/* Key numbers */}
              <div className="space-y-1 pt-1 border-t border-white/[0.04]">
                <div className="text-white/40 font-mono uppercase">Matrix Properties</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono">
                  <span className="text-white/40">Symmetry:</span>
                  <span className="text-[#D4AF37]/70">{POINT_SYMMETRY_PERCENT}%</span>
                  <span className="text-white/40">Spectral r:</span>
                  <span className="text-[#D4AF37]/70">{SPECTRAL_RADIUS}</span>
                  <span className="text-white/40">Col sums:</span>
                  <span className="text-[#D4AF37]/70">all = {FIXED_POINT_COLUMN_SUM}</span>
                  <span className="text-white/40">Energy lvls:</span>
                  <span className="text-[#D4AF37]/70">{ENERGY_LEVELS.map((e) => `±${e}`).join(', ')}</span>
                  <span className="text-white/40">Sampling:</span>
                  <span className="text-white/55">{samplingStrategy}</span>
                </div>
              </div>

              {/* Hint */}
              <div className="text-[11px] text-white/30 pt-1">
                Click a cell to inspect. Gold = selected, Blue = mirror partner.
              </div>
            </div>
          </div>

          {/* Floating tooltip that follows mouse */}
          {hoveredCell && (
            <div
              className="fixed bg-black/95 border border-white/[0.12] px-2.5 py-1.5 text-xs font-mono text-white/80 whitespace-nowrap pointer-events-none z-50 shadow-lg shadow-black/50"
              style={{
                left: hoveredCell.mouseX + containerRef.current!.getBoundingClientRect().left + 16,
                top: hoveredCell.mouseY + containerRef.current!.getBoundingClientRect().top - 10,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-white/55">[{hoveredCell.row},{hoveredCell.col}]</span>
                <span className={hoveredCell.value > 0 ? 'text-[#D4AF37]' : hoveredCell.value < 0 ? 'text-blue-400' : 'text-white/45'}>
                  {hoveredCell.value > 0 ? '+' : ''}{hoveredCell.value}
                </span>
                <span className="text-white/35">|</span>
                <span className="text-white/45">
                  mirror [{127 - hoveredCell.row},{127 - hoveredCell.col}] = {matrix[127 - hoveredCell.row]![127 - hoveredCell.col]}
                </span>
                {symmetryBreaks.has(`${hoveredCell.row},${hoveredCell.col}`) && (
                  <span className="text-red-400/80 text-[11px]">BREAK</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function OverlayToggle({ label, active, color, onClick }: {
  label: string; active: boolean; color: 'red' | 'gold'; onClick: () => void
}) {
  const colors = color === 'red'
    ? { active: 'bg-red-500/15 text-red-400/70 border-red-500/30', inactive: 'text-white/40 border-white/[0.06]' }
    : { active: 'bg-[#D4AF37]/15 text-[#D4AF37]/70 border-[#D4AF37]/30', inactive: 'text-white/40 border-white/[0.06]' }

  return (
    <button
      onClick={onClick}
      className={cn(
        'px-1.5 py-0.5 text-[11px] font-mono border transition-all',
        active ? colors.active : colors.inactive,
      )}
    >
      {label}
    </button>
  )
}

/** Map matrix value (-128..127) to a diverging blue-black-gold color with smoother gradient */
function valueToColor(val: number): string {
  const norm = val / 128
  if (norm > 0) {
    const t = Math.min(1, norm)
    // Gold gradient: dark -> rich gold
    const r = Math.floor(15 + 197 * t)
    const g = Math.floor(15 + 160 * t)
    const b = Math.floor(15 + 40 * t)
    return `rgb(${r},${g},${b})`
  } else if (norm < 0) {
    const t = Math.min(1, -norm)
    // Blue gradient: dark -> rich blue
    const r = Math.floor(15 + 44 * t)
    const g = Math.floor(15 + 115 * t)
    const b = Math.floor(15 + 231 * t)
    return `rgb(${r},${g},${b})`
  }
  return 'rgb(15,15,15)'
}
