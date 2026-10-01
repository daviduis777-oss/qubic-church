'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PARTICLE_COLORS } from '../config'

interface InteractionForceMapProps {
  rules: number[][] | null
  numTypes: number
  isOpen: boolean
  onToggle: () => void
  perTypeStats?: { cooperation: number; aggression: number }[]
}

export function InteractionForceMap({ rules, numTypes, isOpen, onToggle, perTypeStats }: InteractionForceMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number; value: number } | null>(null)

  // Draw the heatmap on canvas for performance
  useEffect(() => {
    if (!isOpen || !rules || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const n = Math.min(numTypes, rules.length)
    const cellSize = Math.floor(Math.min(240, canvas.parentElement?.clientWidth ?? 240) / (n + 1))
    const headerSize = cellSize
    canvas.width = headerSize + n * cellSize
    canvas.height = headerSize + n * cellSize

    ctx.fillStyle = '#050505'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Header row (column labels)
    for (let c = 0; c < n; c++) {
      const color = PARTICLE_COLORS[c % PARTICLE_COLORS.length]!
      ctx.fillStyle = color + '80'
      ctx.beginPath()
      ctx.arc(headerSize + c * cellSize + cellSize / 2, headerSize / 2, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    // Header column (row labels)
    for (let r = 0; r < n; r++) {
      const color = PARTICLE_COLORS[r % PARTICLE_COLORS.length]!
      ctx.fillStyle = color + '80'
      ctx.beginPath()
      ctx.arc(headerSize / 2, headerSize + r * cellSize + cellSize / 2, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    // Cells
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const val = rules[r]?.[c] ?? 0
        const x = headerSize + c * cellSize
        const y = headerSize + r * cellSize

        // Color: green for attraction, red for repulsion
        if (val > 0) {
          const intensity = Math.min(1, val)
          ctx.fillStyle = `rgba(74, 222, 128, ${intensity * 0.7})`
        } else if (val < 0) {
          const intensity = Math.min(1, Math.abs(val))
          ctx.fillStyle = `rgba(248, 113, 113, ${intensity * 0.7})`
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.02)'
        }
        ctx.fillRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1)

        // Value text for small grids
        if (n <= 8) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
          ctx.font = `${Math.max(8, cellSize * 0.35)}px monospace`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(val.toFixed(1), x + cellSize / 2, y + cellSize / 2)
        }
      }
    }

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= n; i++) {
      ctx.beginPath()
      ctx.moveTo(headerSize + i * cellSize, headerSize)
      ctx.lineTo(headerSize + i * cellSize, headerSize + n * cellSize)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(headerSize, headerSize + i * cellSize)
      ctx.lineTo(headerSize + n * cellSize, headerSize + i * cellSize)
      ctx.stroke()
    }
  }, [isOpen, rules, numTypes])

  const handleCanvasHover = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!rules || !canvasRef.current) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const n = Math.min(numTypes, rules.length)
    const cellSize = Math.floor(Math.min(240, canvas.parentElement?.clientWidth ?? 240) / (n + 1))
    const headerSize = cellSize

    const mx = ((e.clientX - rect.left) / rect.width) * canvas.width
    const my = ((e.clientY - rect.top) / rect.height) * canvas.height

    const col = Math.floor((mx - headerSize) / cellSize)
    const row = Math.floor((my - headerSize) / cellSize)

    if (row >= 0 && row < n && col >= 0 && col < n) {
      setHoveredCell({ row, col, value: rules[row]?.[col] ?? 0 })
    } else {
      setHoveredCell(null)
    }
  }

  // Summary stats from rules
  const summary = rules ? (() => {
    const n = Math.min(numTypes, rules.length)
    let pos = 0, neg = 0, total = 0
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const v = rules[r]?.[c] ?? 0
        if (v > 0.01) pos++
        else if (v < -0.01) neg++
        total++
      }
    }
    return { pos, neg, neutral: total - pos - neg, total }
  })() : null

  return (
    <div className="border border-white/[0.06] bg-[#050505]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-white/55 uppercase tracking-wider">
            Interaction Force Map
          </span>
          {summary && (
            <span className="text-[11px] font-mono text-white/35">
              <span className="text-emerald-400/40">{summary.pos} attract</span>
              {' · '}
              <span className="text-red-400/40">{summary.neg} repel</span>
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-white/45" /> : <ChevronDown className="w-3.5 h-3.5 text-white/45" />}
      </button>

      {isOpen && rules && (
        <div className="p-3 pt-0 space-y-3">
          {/* Layperson explanation */}
          <div className="text-xs text-white/45 font-sans leading-relaxed">
            This map shows how each particle type interacts with every other.{' '}
            <span className="text-emerald-400/50">Green = attraction (cooperation)</span>,{' '}
            <span className="text-red-400/50">Red = repulsion (aggression)</span>.
            Hover over a cell to see the exact force value.
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Heatmap canvas */}
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="w-full max-w-[240px] cursor-crosshair"
                style={{ imageRendering: 'pixelated' }}
                onMouseMove={handleCanvasHover}
                onMouseLeave={() => setHoveredCell(null)}
              />
              {/* Hover tooltip */}
              {hoveredCell && (
                <div className="absolute top-0 right-0 bg-black/80 border border-white/10 px-2 py-1 text-[11px] font-mono pointer-events-none">
                  <span style={{ color: PARTICLE_COLORS[hoveredCell.row % PARTICLE_COLORS.length] }}>Type {hoveredCell.row}</span>
                  <span className="text-white/35"> → </span>
                  <span style={{ color: PARTICLE_COLORS[hoveredCell.col % PARTICLE_COLORS.length] }}>Type {hoveredCell.col}</span>
                  <span className={cn('ml-2 font-bold', hoveredCell.value > 0 ? 'text-emerald-400' : hoveredCell.value < 0 ? 'text-red-400' : 'text-white/45')}>
                    {hoveredCell.value > 0 ? '+' : ''}{hoveredCell.value.toFixed(3)}
                  </span>
                </div>
              )}
            </div>

            {/* Per-type summary */}
            <div className="flex-1 space-y-1.5">
              <div className="text-[10px] font-mono text-white/35 uppercase">Per-Type Behavior Profile</div>
              {Array.from({ length: Math.min(numTypes, 12) }, (_, i) => {
                const typeStats = perTypeStats?.[i]
                const coopPct = typeStats ? Math.round(typeStats.cooperation * 100) : 0
                const aggrPct = typeStats ? Math.round(typeStats.aggression * 100) : 0
                return (
                  <div key={`force-type-${i}`} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: PARTICLE_COLORS[i % PARTICLE_COLORS.length] }}
                    />
                    <div className="flex-1 flex items-center gap-px h-[5px]">
                      <div className="h-full bg-emerald-400/60" style={{ width: `${coopPct}%` }} />
                      <div className="h-full bg-white/[0.06]" style={{ width: `${100 - coopPct - aggrPct}%` }} />
                      <div className="h-full bg-red-400/60" style={{ width: `${aggrPct}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-white/40 w-[40px] text-right shrink-0">
                      {coopPct}/{aggrPct}%
                    </span>
                  </div>
                )
              })}
              <div className="text-[10px] font-mono text-white/30 mt-1">
                Format: cooperation% / aggression%
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[10px] font-mono text-white/35">
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 bg-emerald-400/60" />
              <span>Strong attract (+1)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 bg-white/[0.04]" />
              <span>Neutral (0)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 bg-red-400/60" />
              <span>Strong repel (-1)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
