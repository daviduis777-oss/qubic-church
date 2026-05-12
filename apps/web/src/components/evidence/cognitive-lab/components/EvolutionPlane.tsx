'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export interface EvolutionPlaneProps {
  /** Float32Array length popSize × 3: [fitness, distanceToAnna, antipodalPct] for each matrix.
   *  Pass null/undefined to clear/idle. */
  perMatrix: Float32Array | null
  generation: number
  totalGenerations: number
  /** Anna's reference fitness. */
  annaBaseline: number
  /** Anna's antipodal antisymmetry pct (Phase N: ~0.994). */
  annaAntipodal: number
  className?: string
}

/**
 * Particle-life-style 2D plane with high-DPI support and animated render.
 * x-axis = fitness; y-axis = antipodal antisymmetry (Anna near 99.4%, random near 50%).
 *
 * The vertical axis reveals real evolutionary motion: under HyperIdentity selection,
 * matrices drift on the antipodal axis based on whether structural symmetry helps the
 * task. Anna sits in the upper-mid region (low fitness, high antipodal). Random
 * matrices start at center-bottom (mid fitness, ~50% antipodal). Watching where the
 * cluster ends up vs where Anna sits is the experimental result.
 */
export function EvolutionPlane({
  perMatrix,
  generation,
  totalGenerations,
  annaBaseline,
  annaAntipodal,
  className,
}: EvolutionPlaneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastDataRef = useRef<Float32Array | null>(null)
  const lastGenRef = useRef(0)
  const rafRef = useRef<number>(0)
  const tickRef = useRef(0)

  // Track latest data ref so the rAF loop can read fresh data without re-creating itself
  useEffect(() => {
    lastDataRef.current = perMatrix
    lastGenRef.current = generation
  }, [perMatrix, generation])

  // Setup canvas with devicePixelRatio for sharp rendering, run rAF loop
  useEffect(() => {
    const cv = canvasRef.current
    const wrap = containerRef.current
    if (!cv || !wrap) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    let cssWidth = 0
    let cssHeight = 0

    const setupSize = () => {
      const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1))
      const rect = wrap.getBoundingClientRect()
      cssWidth = rect.width
      cssHeight = 380
      cv.style.width = `${cssWidth}px`
      cv.style.height = `${cssHeight}px`
      cv.width = Math.round(cssWidth * dpr)
      cv.height = Math.round(cssHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Initial paint
      ctx.fillStyle = '#050505'
      ctx.fillRect(0, 0, cssWidth, cssHeight)
      drawAxes(ctx, cssWidth, cssHeight, annaBaseline, annaAntipodal)
    }

    setupSize()
    const ro = new ResizeObserver(() => setupSize())
    ro.observe(wrap)

    // Reset trail when generation = 0 (new run)
    let lastResetGen = -1
    const render = () => {
      const data = lastDataRef.current
      const gen = lastGenRef.current

      if (gen === 0 && lastResetGen !== 0) {
        ctx.fillStyle = '#050505'
        ctx.fillRect(0, 0, cssWidth, cssHeight)
        drawAxes(ctx, cssWidth, cssHeight, annaBaseline, annaAntipodal)
        lastResetGen = 0
      }
      if (gen > 0) lastResetGen = gen

      // Always paint a faint translucent layer for trail decay
      ctx.fillStyle = 'rgba(5, 5, 5, 0.06)'
      ctx.fillRect(0, 0, cssWidth, cssHeight)
      drawAxes(ctx, cssWidth, cssHeight, annaBaseline, annaAntipodal)

      if (data && data.length >= 3) {
        const stride = 3
        const n = data.length / stride
        // Sort by fitness rank for color
        const indices = new Int32Array(n)
        for (let i = 0; i < n; i++) indices[i] = i
        const sorted = [...indices].sort((a, b) => data[b * stride]! - data[a * stride]!)
        const topK = Math.max(1, Math.floor(n * 0.15))
        const rankOf = new Int32Array(n)
        sorted.forEach((idx, rank) => { rankOf[idx] = rank })

        // Subtle pulse so it feels alive between worker updates
        tickRef.current = (tickRef.current + 1) % 60
        const pulse = 1 + 0.06 * Math.sin((tickRef.current / 60) * Math.PI * 2)

        for (let i = 0; i < n; i++) {
          const fitness = data[i * stride]!
          const antipodal = data[i * stride + 2]!
          const x = fitnessToX(fitness, cssWidth)
          const y = antipodalToY(antipodal, cssHeight)
          const rank = rankOf[i]!
          const t = rank / Math.max(1, n - 1) // 0 = top, 1 = bottom
          // gradient: gold → orange → grey → rose
          const color = lerpColor(
            t < 0.15 ? '#D4AF37' : t < 0.4 ? '#f59e0b' : t < 0.75 ? '#9ca3af' : '#9c2932',
            '#D4AF37',
            rank < topK ? 0.3 : 0,
          )
          const r = (rank < topK ? 5 : 3) * pulse
          // Soft glow
          ctx.shadowBlur = rank < topK ? 8 : 0
          ctx.shadowColor = rank < topK ? color : 'transparent'
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(x, y, r, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.shadowBlur = 0
      }

      rafRef.current = requestAnimationFrame(render)
    }
    rafRef.current = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [annaBaseline, annaAntipodal])

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-white/55 font-mono uppercase tracking-wider">
          Population evolution · fitness × antipodal antisymmetry
        </span>
        <span className="text-[10px] text-white/40 font-mono">
          gen {generation} / {totalGenerations}
        </span>
      </div>
      <div ref={containerRef} className="relative w-full">
        <canvas
          ref={canvasRef}
          className="bg-[#050505] border border-white/[0.06] block w-full"
          style={{ height: 380 }}
        />
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] text-white/45 px-1 mt-1">
        <span><span className="inline-block w-2 h-2 rounded-full bg-[#D4AF37] mr-1 align-middle" /> top-15% fitness</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1 align-middle" /> upper</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-[#9ca3af] mr-1 align-middle" /> mid</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-[#9c2932] mr-1 align-middle" /> bottom</span>
        <span className="ml-auto text-[#D4AF37]/70">
          ✚ Anna at (fitness {annaBaseline.toFixed(3)}, antipodal {(annaAntipodal * 100).toFixed(1)} %)
        </span>
      </div>
    </div>
  )
}

function fitnessToX(f: number, w: number): number {
  const t = Math.max(0, Math.min(1, (f - 0.4) / 0.3))
  return w * (0.08 + 0.86 * t)
}

function antipodalToY(a: number, h: number): number {
  // y inverted: top of canvas = high antipodal (Anna direction)
  const t = Math.max(0, Math.min(1, (a - 0.4) / 0.6)) // 0.4..1.0 mapped
  return h * (0.92 - 0.84 * t)
}

function lerpColor(base: string, target: string, t: number): string {
  if (t === 0) return base
  // Simple hex blend
  const b = parseHex(base)
  const tg = parseHex(target)
  return `rgb(${Math.round(b.r + (tg.r - b.r) * t)},${Math.round(b.g + (tg.g - b.g) * t)},${Math.round(b.b + (tg.b - b.b) * t)})`
}

function parseHex(c: string): { r: number; g: number; b: number } {
  const h = c.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  }
}

function drawAxes(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  annaFitness: number,
  annaAntipodal: number,
): void {
  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1)

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.025)'
  for (let f = 0.4; f <= 0.7; f += 0.05) {
    const x = fitnessToX(f, w)
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let a = 0.4; a <= 1.0; a += 0.1) {
    const y = antipodalToY(a, h)
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }

  // Anna's "ridge" — gradient halo around her position
  const ax = fitnessToX(annaFitness, w)
  const ay = antipodalToY(annaAntipodal, h)
  const grad = ctx.createRadialGradient(ax, ay, 0, ax, ay, 80)
  grad.addColorStop(0, 'rgba(212,175,55,0.18)')
  grad.addColorStop(1, 'rgba(212,175,55,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Anna baseline lines (subtle)
  ctx.strokeStyle = 'rgba(212,175,55,0.18)'
  ctx.setLineDash([5, 4])
  ctx.beginPath(); ctx.moveTo(ax, 0); ctx.lineTo(ax, h); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, ay); ctx.lineTo(w, ay); ctx.stroke()
  ctx.setLineDash([])

  // Anna gold cross
  ctx.strokeStyle = '#D4AF37'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(ax - 11, ay); ctx.lineTo(ax + 11, ay)
  ctx.moveTo(ax, ay - 11); ctx.lineTo(ax, ay + 11)
  ctx.stroke()
  // Anna label
  ctx.fillStyle = '#D4AF37'
  ctx.font = 'bold 12px ui-monospace, monospace'
  ctx.fillText('ANNA', ax + 14, ay + 4)

  // Y-axis labels (antipodal pct)
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = '11px ui-monospace, monospace'
  ctx.fillText('100%', 6, antipodalToY(1.0, h) + 4)
  ctx.fillText(' 80%', 6, antipodalToY(0.8, h) + 4)
  ctx.fillText(' 50% (random)', 6, antipodalToY(0.5, h) + 4)

  // X-axis labels (fitness)
  ctx.fillText('fitness 0.40', fitnessToX(0.40, w) - 30, h - 6)
  ctx.fillText('0.50', fitnessToX(0.50, w) - 14, h - 6)
  ctx.fillText('0.60', fitnessToX(0.60, w) - 14, h - 6)
  ctx.fillText('0.70', fitnessToX(0.70, w) - 14, h - 6)

  // Top-right hint
  ctx.fillStyle = 'rgba(212,175,55,0.55)'
  ctx.font = '10px ui-monospace, monospace'
  ctx.fillText('higher antipodal-antisymmetry → more Anna-like', w - 280, 16)
  ctx.fillText('higher fitness →', w - 130, h - 24)
}
