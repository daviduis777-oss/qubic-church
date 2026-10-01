'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export interface PopulationCanvasProps {
  /** N matrices × 2 floats (x, y) in [-1, 1] PCA space */
  positions: Float32Array | null
  /** N fitness values, normalized to [0, 1] */
  fitness: Float32Array | null
  /** Optional Anna reference position [x, y] in [-1, 1] */
  annaPosition?: [number, number]
  /** Speed multiplier 1, 2, 5, 10, 25, 50 (visual hint only; data update rate is worker-driven) */
  speedMult: number
  className?: string
  width?: number
  height?: number
}

const COLOR_TOP = '#D4AF37'
const COLOR_MED = '#6b7280'
const COLOR_LOW = '#a16060'

export function PopulationCanvas({
  positions,
  fitness,
  annaPosition,
  speedMult,
  className,
  width = 480,
  height = 300,
}: PopulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    cv.width = width
    cv.height = height

    // Motion-blur trail effect: paint translucent black instead of clearing
    ctx.fillStyle = 'rgba(5, 5, 5, 0.20)'
    ctx.fillRect(0, 0, width, height)

    if (positions && fitness) {
      const toX = (px: number) => width * (0.5 + 0.45 * px)
      const toY = (py: number) => height * (0.5 - 0.45 * py)

      const n = fitness.length
      const indices = [...Array(n).keys()].sort((a, b) => fitness[b]! - fitness[a]!)
      const topK = Math.max(1, Math.floor(n * 0.1))
      const rankOf = new Int32Array(n)
      indices.forEach((idx, rank) => {
        rankOf[idx] = rank
      })

      for (let i = 0; i < n; i++) {
        const x = toX(positions[i * 2]!)
        const y = toY(positions[i * 2 + 1]!)
        const rank = rankOf[i]!
        const color = rank < topK ? COLOR_TOP : rank < n / 2 ? COLOR_MED : COLOR_LOW
        const r = rank < topK ? 4 : 2.5
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    if (annaPosition) {
      const toX = (px: number) => width * (0.5 + 0.45 * px)
      const toY = (py: number) => height * (0.5 - 0.45 * py)
      const [ax, ay] = annaPosition
      const x = toX(ax)
      const y = toY(ay)
      ctx.strokeStyle = COLOR_TOP
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y)
      ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8)
      ctx.stroke()
      ctx.fillStyle = COLOR_TOP
      ctx.font = '10px monospace'
      ctx.fillText('ANNA', x + 10, y + 3)
    }
  }, [positions, fitness, annaPosition, width, height, speedMult])

  return (
    <canvas
      ref={canvasRef}
      className={cn('bg-[#050505] border border-white/[0.06]', className)}
      style={{ imageRendering: 'pixelated', width, height, maxWidth: '100%' }}
    />
  )
}
