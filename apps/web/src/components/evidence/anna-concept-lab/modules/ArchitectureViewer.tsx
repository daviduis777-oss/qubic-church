'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExplainPanel } from '@/components/evidence/lab-primitives'
import { EXPLAIN_ARCHITECTURE } from '../components/explainContent'

interface CellClassification {
  row: number
  col: number
  value: number
  sign: number
  block: number
  is_kernel: boolean
  is_decoration: boolean
  antipode_row: number
  antipode_col: number
  breaks_symmetry: boolean
}

interface ClassificationFile {
  cells: CellClassification[]
  n_kernel: number
  n_decorations: number
  break_cols: number[]
}

type Overlay = 'off' | 'kernel' | 'decorations' | 'breaks'

const N = 128
const SCALE = 4

const OVERLAY_LABELS: Record<Overlay, string> = {
  off: 'none',
  kernel: 'kernel',
  decorations: 'decorations',
  breaks: 'symmetry breaks',
}

export function ArchitectureViewer({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [data, setData] = useState<ClassificationFile | null>(null)
  const [overlay, setOverlay] = useState<Overlay>('off')
  const [hoverCell, setHoverCell] = useState<CellClassification | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/data/phase_n/cell_classification.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<ClassificationFile>
      })
      .then(setData)
      .catch((err) => setLoadError(err.message || String(err)))
  }, [])

  const cellLookup = useMemo(() => {
    if (!data) return null
    const m = new Map<string, CellClassification>()
    for (const c of data.cells) m.set(`${c.row},${c.col}`, c)
    return m
  }, [data])

  useEffect(() => {
    if (!data || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = N * SCALE
    canvas.height = N * SCALE
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const c of data.cells) {
      const sat = Math.min(64, Math.abs(c.value)) / 64
      let r = 30
      let g = 30
      let b = 30
      if (c.sign > 0) {
        r = 30 + (1 - sat) * 100
        g = 30 + (1 - sat) * 100
        b = 80 + sat * 175
      } else if (c.sign < 0) {
        r = 80 + sat * 175
        g = 30 + (1 - sat) * 100
        b = 30 + (1 - sat) * 100
      }

      if (overlay === 'kernel' && c.is_kernel) {
        b = Math.min(255, b + 60)
        g = Math.min(255, g + 30)
      } else if (overlay === 'decorations' && c.is_decoration) {
        r = Math.min(255, r + 80)
        g = Math.min(255, g + 60)
      } else if (overlay === 'breaks' && c.breaks_symmetry) {
        r = Math.min(255, r + 100)
        g = Math.min(255, g + 80)
      }

      ctx.fillStyle = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`
      ctx.fillRect(c.col * SCALE, c.row * SCALE, SCALE, SCALE)
    }
  }, [data, overlay])

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cellLookup || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * N
    const y = ((e.clientY - rect.top) / rect.height) * N
    const col = Math.floor(x)
    const row = Math.floor(y)
    if (col < 0 || col >= N || row < 0 || row >= N) {
      setHoverCell(null)
      return
    }
    const c = cellLookup.get(`${row},${col}`) ?? null
    setHoverCell(c)
  }

  if (loadError) {
    return (
      <div className="p-4 border border-rose-500/30 bg-rose-500/[0.04] text-xs text-rose-400">
        Failed to load architecture data: {loadError}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-4 text-xs text-white/45 italic">Loading 128×128 cell classification (~2 MB, lazy)...</div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div>
        <h3 className="text-base font-semibold tracking-wide text-[#D4AF37]/90 inline-flex items-center gap-2">
          <LayoutGrid className="w-4 h-4" />
          Architecture Viewer
        </h3>
        <p className="text-xs text-white/55 mt-0.5">
          Anna&apos;s 128×128 cells. Toggle overlays to highlight her two-layer architecture: {data.n_kernel.toLocaleString()} kernel cells (designed core) plus {data.n_decorations} decoration cells (the symmetry-breaking layer).
        </p>
      </div>

      <ExplainPanel
        kid={EXPLAIN_ARCHITECTURE.kid}
        simple={EXPLAIN_ARCHITECTURE.simple}
        researcher={EXPLAIN_ARCHITECTURE.researcher}
        math={EXPLAIN_ARCHITECTURE.math}
        title="What's inside Anna's 16,384 cells?"
        defaultCollapsed
      />

      <div className="flex flex-wrap gap-2 items-center text-xs">
        <span className="text-white/55 font-mono">Overlay:</span>
        {(['off', 'kernel', 'decorations', 'breaks'] as Overlay[]).map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setOverlay(o)}
            className={cn(
              'px-2 py-1 border font-mono text-[10px] uppercase tracking-wider transition-colors',
              overlay === o
                ? 'border-[#D4AF37]/60 bg-[#D4AF37]/15 text-[#D4AF37]'
                : 'border-white/10 text-white/65 hover:bg-white/5',
            )}
          >
            {OVERLAY_LABELS[o]}
          </button>
        ))}
        <span className="text-[10px] text-white/45 ml-2">
          ({data.n_kernel.toLocaleString()} kernel · {data.n_decorations} decorations · {data.break_cols.length} symmetry-break columns: {data.break_cols.join(', ')})
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4">
        <canvas
          ref={canvasRef}
          onMouseMove={onMouseMove}
          onMouseLeave={() => setHoverCell(null)}
          role="img"
          aria-label="Anna 128 by 128 matrix heatmap with kernel and decoration overlays"
          className="bg-black border border-white/[0.06]"
          style={{
            imageRendering: 'pixelated',
            width: 512,
            height: 512,
            maxWidth: '100%',
          }}
        />

        <div className="flex flex-col gap-2">
          {hoverCell ? (
            <motion.div
              key={`${hoverCell.row},${hoverCell.col}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-black/30 border border-[#D4AF37]/30 space-y-2 text-xs"
            >
              <div className="text-base font-mono text-[#D4AF37]">
                M[{hoverCell.row}][{hoverCell.col}] = {hoverCell.value}
              </div>
              <div className="text-white/65">
                block {hoverCell.block} ·{' '}
                {hoverCell.is_kernel
                  ? 'kernel'
                  : hoverCell.is_decoration
                    ? 'decoration'
                    : 'symmetric extension'}
              </div>
              <div className="text-white/65">
                antipodal partner: M[{hoverCell.antipode_row}][{hoverCell.antipode_col}]
              </div>
              {hoverCell.breaks_symmetry && (
                <div className="text-amber-400/85">on a Phase-3 symmetry-break column</div>
              )}
            </motion.div>
          ) : (
            <div className="text-xs text-white/45 italic p-3 bg-black/20 border border-white/[0.04]">
              Hover any cell to inspect its value, antipode, and overlay membership.
            </div>
          )}
          <details className="text-xs text-white/45">
            <summary className="cursor-pointer hover:text-white/65">about this view</summary>
            <p className="mt-2 leading-relaxed">
              Color: red = negative, blue = positive; saturation = absolute magnitude (capped at 64).
              The kernel overlay highlights rows 0-31 (the {data.n_kernel.toLocaleString()}-cell designed core);
              decorations highlight the {data.n_decorations} cells in blocks 2-4 that deviate from
              kernel-reconstruction. The {data.break_cols.length} symmetry-break columns from
              Phase 3 are at: {data.break_cols.join(', ')}.
            </p>
          </details>
        </div>
      </div>
    </div>
  )
}
