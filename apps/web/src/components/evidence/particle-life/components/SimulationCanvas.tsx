'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import type { ParticleEngine } from '../engine/ParticleEngine'
import { PARTICLE_COLORS } from '../config'
import { cn } from '@/lib/utils'

interface SimulationCanvasProps {
  engine: ParticleEngine | null
  trailLength: number
  particleSize: number
  label?: string
  labelColor?: string
  showDensity?: boolean
  showGrid?: boolean
  className?: string
  onPulse?: (x: number, y: number, strength: number) => void
  onResize?: (width: number, height: number) => void
}

export function SimulationCanvas({
  engine,
  trailLength,
  particleSize,
  label,
  labelColor = '#D4AF37',
  showDensity = false,
  showGrid = false,
  className,
  onPulse,
  onResize,
}: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDragging = useRef(false)
  const lastPulse = useRef({ x: 0, y: 0 })
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)

  // Resize canvas with proper DPR
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const container = canvas.parentElement
      if (!container) return
      const rect = container.getBoundingClientRect()
      const w = Math.floor(rect.width)
      const h = Math.floor(Math.min(rect.width * 0.5, 500))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        onResize?.(w, h)
      }
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas.parentElement!)
    return () => observer.disconnect()
  }, [onResize])

  // Canvas position helpers
  const getCanvasPos = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    }
  }, [])

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true
    const pos = getCanvasPos(e.clientX, e.clientY)
    lastPulse.current = pos
    onPulse?.(pos.x, pos.y, e.shiftKey ? -100 : 100)
  }, [getCanvasPos, onPulse])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e.clientX, e.clientY)
    setCursorPos(pos)
    if (!isDragging.current) return
    const dx = pos.x - lastPulse.current.x
    const dy = pos.y - lastPulse.current.y
    if (dx * dx + dy * dy > 100) {
      lastPulse.current = pos
      onPulse?.(pos.x, pos.y, e.shiftKey ? -30 : 30)
    }
  }, [getCanvasPos, onPulse])

  const handleMouseUp = useCallback(() => { isDragging.current = false }, [])
  const handleMouseLeave = useCallback(() => { isDragging.current = false; setCursorPos(null) }, [])

  // Touch handlers (mobile support - improvement #1)
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const touch = e.touches[0]
    if (!touch) return
    isDragging.current = true
    const pos = getCanvasPos(touch.clientX, touch.clientY)
    lastPulse.current = pos
    onPulse?.(pos.x, pos.y, 80)
  }, [getCanvasPos, onPulse])

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const touch = e.touches[0]
    if (!touch || !isDragging.current) return
    const pos = getCanvasPos(touch.clientX, touch.clientY)
    const dx = pos.x - lastPulse.current.x
    const dy = pos.y - lastPulse.current.y
    if (dx * dx + dy * dy > 200) {
      lastPulse.current = pos
      onPulse?.(pos.x, pos.y, 25)
    }
  }, [getCanvasPos, onPulse])

  const handleTouchEnd = useCallback(() => { isDragging.current = false }, [])

  return (
    <div className={cn('relative', className)}>
      <canvas
        ref={canvasRef}
        className="w-full block cursor-crosshair touch-none"
        style={{ aspectRatio: '16/8', maxHeight: 500 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      {/* Mode label */}
      {label && (
        <div
          className="absolute top-2 right-2 px-2 py-1 text-xs font-mono border backdrop-blur-sm pointer-events-none"
          style={{
            backgroundColor: `${labelColor}15`,
            color: `${labelColor}B3`,
            borderColor: `${labelColor}33`,
          }}
        >
          {label}
        </div>
      )}
      {/* Cursor ripple indicator when dragging (#2) */}
      {isDragging.current && cursorPos && (
        <div
          className="absolute w-6 h-6 border border-white/20 rounded-full pointer-events-none animate-ping"
          style={{
            left: `${(cursorPos.x / (canvasRef.current?.width ?? 1)) * 100}%`,
            top: `${(cursorPos.y / (canvasRef.current?.height ?? 1)) * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
    </div>
  )
}

/** Enhanced frame renderer with glow, density, grid overlays (#3-7) */
export function drawFrame(
  canvas: HTMLCanvasElement,
  engine: ParticleEngine,
  trailLength: number,
  particleSize: number,
  options?: {
    showDensity?: boolean
    showGrid?: boolean
    showConnections?: boolean
    highlightType?: number | null
  },
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvas.width
  const h = canvas.height

  // Trail effect (#8 - improved alpha curve)
  if (trailLength <= 0) {
    ctx.fillStyle = '#050505'
    ctx.fillRect(0, 0, w, h)
  } else {
    const alpha = Math.max(0.015, 0.8 / (trailLength + 1))
    ctx.fillStyle = `rgba(5, 5, 5, ${alpha})`
    ctx.fillRect(0, 0, w, h)
  }

  const p = engine.particles

  // Density heatmap background (#9)
  if (options?.showDensity) {
    drawDensityHeatmap(ctx, p, w, h)
  }

  // Spatial grid overlay (#10)
  if (options?.showGrid) {
    const cellSize = engine.config.radius
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    ctx.lineWidth = 0.5
    for (let x = 0; x < w; x += cellSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
    }
    for (let y = 0; y < h; y += cellSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    }
  }

  // Draw particles with enhanced glow (#11 - radial gradient for fast particles)
  for (let i = 0; i < p.count; i++) {
    const vx = p.vx[i]!
    const vy = p.vy[i]!
    const speed = Math.sqrt(vx * vx + vy * vy)
    const glow = Math.min(1, speed * 0.25)
    const size = particleSize + glow * 2
    const x = p.x[i]!
    const y = p.y[i]!
    const typeIdx = p.type[i]!
    const color = PARTICLE_COLORS[typeIdx % PARTICLE_COLORS.length]!

    // Dim non-highlighted types (#12)
    const dimmed = options?.highlightType !== undefined && options.highlightType !== null && options.highlightType !== typeIdx
    const baseAlpha = dimmed ? 0.15 : (0.65 + glow * 0.35)

    // Fast particles get a soft glow aura (#13)
    if (glow > 0.3 && !dimmed) {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, size * 3)
      grad.addColorStop(0, color + '40')
      grad.addColorStop(1, color + '00')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, size * 3, 0, Math.PI * 2)
      ctx.fill()
    }

    // Core particle
    ctx.globalAlpha = baseAlpha
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // Type legend (#14 - bottom-left)
  drawTypeLegend(ctx, engine.config.numTypes, w, h)
}

/** Draw density heatmap as background */
function drawDensityHeatmap(ctx: CanvasRenderingContext2D, p: { x: Float32Array; y: Float32Array; count: number }, w: number, h: number) {
  const gridSize = 16
  const cellW = w / gridSize
  const cellH = h / gridSize
  const bins = new Uint32Array(gridSize * gridSize)
  let maxBin = 0

  for (let i = 0; i < p.count; i++) {
    const col = Math.min(gridSize - 1, Math.max(0, Math.floor(p.x[i]! / cellW)))
    const row = Math.min(gridSize - 1, Math.max(0, Math.floor(p.y[i]! / cellH)))
    const val = ++bins[row * gridSize + col]!
    if (val > maxBin) maxBin = val
  }

  if (maxBin === 0) return
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const intensity = bins[r * gridSize + c]! / maxBin
      if (intensity > 0.05) {
        ctx.fillStyle = `rgba(212, 175, 55, ${intensity * 0.08})`
        ctx.fillRect(c * cellW, r * cellH, cellW, cellH)
      }
    }
  }
}

/** Draw color legend for particle types */
function drawTypeLegend(ctx: CanvasRenderingContext2D, numTypes: number, w: number, h: number) {
  const dotSize = 4
  const spacing = 14
  const startX = 8
  const startY = h - 8

  ctx.globalAlpha = 0.5
  for (let i = 0; i < numTypes; i++) {
    const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length]!
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(startX + i * spacing, startY, dotSize, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}
