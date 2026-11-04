'use client'

import { useEffect, useRef } from 'react'

/**
 * Maria's presence: 676 dots, one per Qubic computor, laid out as a phyllotaxis band.
 * idle: slow breath. thinking: brighter, turning. settled: holds still in the verdict colour.
 * With prefers-reduced-motion the ring is drawn once per state, never animated.
 */
export type RingMode = 'idle' | 'thinking' | 'settled'

const N = 676
const GOLDEN = Math.PI * (3 - Math.sqrt(5))
const INNER = 0.64

const PTS = (() => {
  const p = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) {
    const t = (i + 0.5) / N
    p[i * 3] = Math.sqrt(INNER * INNER + (1 - INNER * INNER) * t) // radius 0..1
    p[i * 3 + 1] = i * GOLDEN // angle
    p[i * 3 + 2] = (Math.sin(i * 12.9898) * 43758.5453) % 1 // stable per-dot jitter
  }
  return p
})()

const hex = (h: string): [number, number, number] => {
  const n = Number.parseInt(h.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function Ring({ size, mode, tone, label }: { size: number; mode: RingMode; tone: string; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const target = useRef({ mode, tone })
  target.current = { mode, tone }
  const kick = useRef<() => void>(() => {})

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    c.width = Math.round(size * dpr)
    c.height = Math.round(size * dpr)

    // eased state
    let energy = 0.55
    let speed = 0
    let rot = 0
    let col = hex(target.current.tone)
    let last = performance.now()
    let raf = 0
    let visible = true

    const draw = (now: number, still: boolean) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const { mode: m, tone: tn } = target.current
      const want = hex(tn)
      const k = still ? 1 : 1 - Math.exp(-dt * 3)
      col = col.map((v, i) => v + (want[i]! - v) * k) as [number, number, number]
      const eTarget = m === 'thinking' ? 1.15 : m === 'settled' ? 1 : 0.78
      const sTarget = m === 'thinking' ? 0.42 : 0
      energy += (eTarget - energy) * (still ? 1 : 1 - Math.exp(-dt * 2.5))
      speed += (sTarget - speed) * (still ? 1 : 1 - Math.exp(-dt * 1.5))
      if (!still) rot += speed * dt
      const t = still ? 0 : now / 1000
      const breath = m === 'idle' && !still ? 0.12 * Math.sin((t * Math.PI * 2) / 7) : 0

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size, size)
      const R = size / 2 - 1
      const cx = size / 2
      const dot = Math.max(0.45, size / 240)
      ctx.fillStyle = `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`
      for (let i = 0; i < N; i++) {
        const r = PTS[i * 3]!
        const a = PTS[i * 3 + 1]! + rot
        const j = PTS[i * 3 + 2]!
        // a slow wave that travels round the ring; while thinking it runs faster and brighter
        const wave = m === 'settled' ? 0 : 0.5 + 0.5 * Math.sin(a * 2 - t * (m === 'thinking' ? 2.4 : 0.5) + Math.abs(j) * 2)
        const alpha = Math.min(1, (energy + breath) * (0.45 + 0.55 * (m === 'settled' ? 0.85 + 0.15 * Math.abs(j) : wave)))
        const rr = R * (r + (m === 'idle' ? breath * 0.04 * r : 0))
        ctx.globalAlpha = alpha
        ctx.beginPath()
        ctx.arc(cx + Math.cos(a) * rr, cx + Math.sin(a) * rr, dot * (0.75 + 0.5 * r), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    const loop = (now: number) => {
      draw(now, false)
      raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0
    }
    const start = () => {
      cancelAnimationFrame(raf)
      if (reduce.matches) return draw(performance.now(), true)
      last = performance.now()
      raf = requestAnimationFrame(loop)
    }
    kick.current = start
    const io = new IntersectionObserver(([e]) => {
      visible = Boolean(e?.isIntersecting)
      if (visible) start()
    })
    io.observe(c)
    const onVis = () => !document.hidden && start()
    document.addEventListener('visibilitychange', onVis)
    reduce.addEventListener('change', start)
    start()
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      reduce.removeEventListener('change', start)
    }
  }, [size])

  // Redraw the static frame when the state changes under reduced motion.
  useEffect(() => {
    kick.current()
  }, [mode, tone])

  return <canvas aria-hidden={label ? undefined : true} aria-label={label} height={size} ref={ref} role={label ? 'img' : undefined} style={{ width: size, height: size, display: 'block' }} width={size} />
}

/** A tiny static ring for verdict cards: the same mark, at glyph size. */
export function RingGlyph({ color, size = 14 }: { color: string; size?: number }) {
  const dots = Array.from({ length: 26 }, (_, i) => {
    const a = (i / 26) * Math.PI * 2
    return <circle cx={7 + Math.cos(a) * 5.4} cy={7 + Math.sin(a) * 5.4} fill={color} key={i} r={0.75} />
  })
  return (
    <svg aria-hidden height={size} viewBox="0 0 14 14" width={size}>
      {dots}
    </svg>
  )
}
