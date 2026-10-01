'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  Cell,
} from 'recharts'
import { Maximize2, Minimize2, ChevronDown, Pause, Play } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TypedText } from '../lab-primitives/TypedText'

// ─── Types ───
interface SpectralData {
  eigenvalues: {
    real: number
    imag: number
    magnitude: number
    angle_deg: number
  }[]
  dominant: {
    real: number
    imag: number
    angle_deg: number
    magnitude: number
    dominance_pct: number
  }
  scale_invariance: {
    size: number
    angle_deg: number
    dominance_pct: number
    magnitude: number
  }[]
  period4: { energies: number[]; behaviors: string[] }
  essence_2x2: number[][]
  matrix_stats: {
    trace: number
    sum: number
    zeros: number
    antisymmetry_pct: number
    spectral_radius: number
  }
}

// ─── Expandable detail ───
function TechDetail({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-3">
      <button
        className="flex items-center gap-1.5 text-xs text-gold/70 hover:text-gold/80 font-mono uppercase tracking-wider transition-colors"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <ChevronDown
          className={cn('w-3 h-3 transition-transform', open && 'rotate-180')}
        />
        {open ? 'Hide' : 'Show'} technical details
      </button>
      {open && (
        <m.div
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 text-xs font-mono text-muted-foreground leading-relaxed border-l-2 border-gold/10 pl-3 space-y-1"
          initial={{ opacity: 0, height: 0 }}
        >
          {children}
        </m.div>
      )}
    </div>
  )
}

// ─── Section wrapper with scroll reveal ───
const FadeSection = m.section
const fadeIn = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6, ease: 'easeOut' as const },
}

// ─── Animated canvas ───
function RotationCanvas({
  data,
  paused,
}: {
  data: SpectralData
  paused: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const mountRef = useRef(true)
  const sizeRef = useRef({ w: 0, h: 0 })
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  useEffect(() => {
    mountRef.current = true
    const canvas = canvasRef.current
    if (!canvas) return

    function resize() {
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      sizeRef.current = { w: rect.width, h: rect.height }
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
    }
    resize()
    window.addEventListener('resize', resize)

    function draw() {
      if (!canvas || !mountRef.current) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const dpr = window.devicePixelRatio || 1
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const W = sizeRef.current.w,
        H = sizeRef.current.h
      if (W === 0 || H === 0) {
        requestAnimationFrame(draw)
        return
      }
      const cx = W / 2,
        cy = H / 2
      const radius = Math.min(W * 0.34, H * 0.36)
      const frame = frameRef.current

      ctx.clearRect(0, 0, W, H)

      // Radial glow
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 2.5)
      bg.addColorStop(0, 'rgba(212,175,55,0.05)')
      bg.addColorStop(1, 'transparent')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.015)'
      ctx.lineWidth = 0.5
      const gs = Math.max(30, radius / 5)
      for (let x = cx % gs; x < W; x += gs) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, H)
        ctx.stroke()
      }
      for (let y = cy % gs; y < H; y += gs) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
        ctx.stroke()
      }

      // Rings
      for (let r = 1; r <= 4; r++) {
        ctx.beginPath()
        ctx.arc(cx, cy, radius * r * 0.3, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(212,175,55,${0.02 + r * 0.015})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // Main orbit
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(212,175,55,0.2)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Axes
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 0.5
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(cx - radius * 1.4, cy)
      ctx.lineTo(cx + radius * 1.4, cy)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx, cy - radius * 1.4)
      ctx.lineTo(cx, cy + radius * 1.4)
      ctx.stroke()
      ctx.setLineDash([])

      // 90° arc
      const arcR = radius * 0.38
      ctx.beginPath()
      ctx.arc(cx, cy, arcR, 0, -Math.PI / 2, true)
      ctx.strokeStyle = 'rgba(212,175,55,0.7)'
      ctx.lineWidth = 2.5
      ctx.stroke()
      // Arrow
      const aX = cx + Math.cos(-Math.PI / 2) * arcR,
        aY = cy + Math.sin(-Math.PI / 2) * arcR
      ctx.fillStyle = 'rgba(212,175,55,0.9)'
      ctx.beginPath()
      ctx.moveTo(aX, aY)
      ctx.lineTo(aX + 6, aY + 8)
      ctx.lineTo(aX - 5, aY + 4)
      ctx.fill()

      // Angle label
      const fs = Math.max(14, radius * 0.1)
      ctx.font = `bold ${fs}px monospace`
      ctx.fillStyle = '#D4AF37'
      ctx.textAlign = 'center'
      ctx.fillText('90.456°', cx + arcR * 0.5, cy - arcR * 0.5)

      // Small eigenvalue dots
      const maxMag = data.dominant.magnitude
      for (const ev of data.eigenvalues) {
        if (ev.magnitude > maxMag * 0.95) continue
        const ex = cx + (ev.real / maxMag) * radius * 0.88
        const ey = cy - (ev.imag / maxMag) * radius * 0.88
        ctx.beginPath()
        ctx.arc(ex, ey, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.08)'
        ctx.fill()
      }

      // Period-4 rotating states
      const phase = (frame * 0.01) % (Math.PI * 2)
      const sc = [
        { fill: '#34d399', glow: 'rgba(52,211,153,0.25)', label: 'STEP 1' },
        {
          fill: 'rgba(52,211,153,0.45)',
          glow: 'rgba(52,211,153,0.1)',
          label: 'STEP 2',
        },
        { fill: '#94a3b8', glow: 'rgba(148,163,184,0.25)', label: 'STEP 3' },
        {
          fill: 'rgba(148,163,184,0.45)',
          glow: 'rgba(148,163,184,0.1)',
          label: 'STEP 4',
        },
      ]

      for (let i = 3; i >= 0; i--) {
        const a = phase + (i * Math.PI) / 2
        const sx = cx + Math.cos(a) * radius,
          sy = cy - Math.sin(a) * radius
        const c = sc[i]!,
          active = i === 0
        const dr = active
          ? Math.max(9, radius * 0.045)
          : Math.max(5, radius * 0.025)

        if (active) {
          const g = ctx.createRadialGradient(sx, sy, dr, sx, sy, dr * 5)
          g.addColorStop(0, c.glow)
          g.addColorStop(1, 'transparent')
          ctx.beginPath()
          ctx.arc(sx, sy, dr * 5, 0, Math.PI * 2)
          ctx.fillStyle = g
          ctx.fill()
        }
        ctx.beginPath()
        ctx.arc(sx, sy, dr, 0, Math.PI * 2)
        ctx.fillStyle = c.fill
        ctx.fill()

        if (active || i === 2) {
          const ls = Math.max(10, radius * 0.04)
          ctx.font = `${active ? 'bold ' : ''}${ls}px monospace`
          ctx.fillStyle = active ? c.fill : 'rgba(255,255,255,0.2)'
          ctx.textAlign = 'center'
          ctx.fillText(c.label, sx, sy + dr + ls + 5)
          ctx.font = `${ls * 0.8}px monospace`
          ctx.fillStyle = 'rgba(255,255,255,0.12)'
          ctx.fillText(
            `E=${data.period4.energies[i]}`,
            sx,
            sy + dr + ls * 2 + 5
          )
        }
      }

      // Dominant pair
      for (const sign of [1, -1]) {
        const dx = cx + (data.dominant.real / maxMag) * radius * 0.88
        const dy = cy - ((data.dominant.imag * sign) / maxMag) * radius * 0.88
        const pr = 5 + Math.sin(frame * 0.04) * 2
        const dg = ctx.createRadialGradient(dx, dy, 2, dx, dy, pr * 3)
        dg.addColorStop(0, 'rgba(212,175,55,0.5)')
        dg.addColorStop(0.4, 'rgba(212,175,55,0.08)')
        dg.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(dx, dy, pr * 3, 0, Math.PI * 2)
        ctx.fillStyle = dg
        ctx.fill()
        ctx.beginPath()
        ctx.arc(dx, dy, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#D4AF37'
        ctx.fill()

        if (sign === 1) {
          const lfs = Math.max(10, radius * 0.04)
          ctx.font = `bold ${lfs}px monospace`
          ctx.fillStyle = '#D4AF37'
          ctx.textAlign = 'left'
          ctx.fillText(
            `|λ| = ${data.dominant.magnitude.toLocaleString()}`,
            dx + 14,
            dy - 3
          )
          ctx.font = `${lfs * 0.8}px monospace`
          ctx.fillStyle = 'rgba(212,175,55,0.4)'
          ctx.fillText(
            `angle = ${data.dominant.angle_deg}°`,
            dx + 14,
            dy + lfs + 1
          )
        }
      }

      if (!pausedRef.current) frameRef.current++
      if (mountRef.current) requestAnimationFrame(draw)
    }
    requestAnimationFrame(draw)
    return () => {
      mountRef.current = false
      window.removeEventListener('resize', resize)
    }
  }, [data])

  return <canvas className="w-full h-full" ref={canvasRef} />
}

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════
export default function SpectralTab() {
  const [data, setData] = useState<SpectralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [paused, setPaused] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/data/anna-spectral-data.json')
      .then(r => r.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!heroRef.current) return
    if (!document.fullscreenElement) {
      heroRef.current.requestFullscreen?.()
      setFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) setFullscreen(false)
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const eigenPts = useMemo(
    () =>
      data?.eigenvalues.map((e, i) => ({
        real: e.real,
        imag: e.imag,
        magnitude: e.magnitude,
        isDom: i < 2,
      })) ?? [],
    [data]
  )
  const scalePts = useMemo(
    () => data?.scale_invariance.map(s => ({ ...s, label: `${s.size}` })) ?? [],
    [data]
  )

  const ttStyle = {
    backgroundColor: '#0a0a0a',
    border: '1px solid rgba(212,175,55,0.3)',
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#e5e5e5',
  }
  const ttLabelStyle = { color: 'rgba(212,175,55,0.6)' }
  const ttItemStyle = { color: '#e5e5e5' }

  if (loading || !data)
    return (
      <div className="w-full h-[500px] bg-card flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border border-gold/30 animate-spin"
            style={{ animationDuration: '2s' }}
          />
          <span className="text-muted-foreground text-xs font-mono tracking-widest">
            LOADING
          </span>
        </div>
      </div>
    )

  return (
    <LazyMotion features={domAnimation}>
      <div className="bg-card overflow-x-hidden">
        {/* ════════════════════ HERO ════════════════════ */}
        <FadeSection {...fadeIn}>
          <div
            className={cn(
              'relative border border-border overflow-hidden',
              fullscreen ? 'bg-card' : ''
            )}
            ref={heroRef}
          >
            {/* Canvas */}
            <div
              className={cn(
                'relative',
                fullscreen ? 'h-screen' : 'h-[55vh] sm:h-[60vh] lg:h-[70vh]'
              )}
            >
              <RotationCanvas data={data} paused={paused} />

              {/* Controls overlay */}
              <div className="absolute top-3 right-3 flex gap-2 z-10">
                <button
                  aria-label={paused ? 'Play' : 'Pause'}
                  className="p-2 bg-black/40 backdrop-blur-sm border border-white/10 hover:border-gold/30 transition-colors"
                  onClick={() => setPaused(!paused)}
                  type="button"
                >
                  {paused ? (
                    <Play className="w-4 h-4 text-white/50" />
                  ) : (
                    <Pause className="w-4 h-4 text-white/50" />
                  )}
                </button>
                <button
                  aria-label="Toggle fullscreen"
                  className="p-2 bg-black/40 backdrop-blur-sm border border-white/10 hover:border-gold/30 transition-colors"
                  onClick={toggleFullscreen}
                  type="button"
                >
                  {fullscreen ? (
                    <Minimize2 className="w-4 h-4 text-white/50" />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-white/50" />
                  )}
                </button>
              </div>

              {/* Text overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent p-5 sm:p-8 lg:p-10">
                <div className="text-xs text-gold/80 uppercase tracking-widest font-mono mb-2">
                  Hypothesis
                </div>
                <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-tight max-w-2xl">
                  <TypedText
                    delay={500}
                    text="A spectral property of the matrix."
                  />
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm mt-2 max-w-xl leading-relaxed">
                  Anna&apos;s dominant eigenvalue has phase angle 90.456° and
                  carries 40% of the spectral magnitude. Under direct ternary
                  iteration T(v) = sign(M·v), it has at least 2 period-4 cycles
                  (reported on 100K random samples and 32K HW≤2 inputs). Under
                  the separate input-clamped AIT operator (the production
                  scanner), period-4 does not transfer. A dominant phase near a
                  quarter-turn is not necessary for period 4.
                </p>
                <p className="text-white/60 text-xs sm:text-sm mt-2 max-w-xl leading-relaxed">
                  Computed on the table as transcribed. Random matrices that
                  obey the same mirror rule also show a near-90° angle; the
                  strong dominance of the first eigenvalue is specific to this
                  table.
                </p>
              </div>
            </div>

            {/* Stat bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-border">
              {[
                {
                  val: '90.456°',
                  label: 'Phase angle',
                  note: 'mirror-rule random matrices also land near 90°',
                },
                {
                  val: data.dominant.magnitude.toLocaleString(),
                  label: 'Magnitude |λ₁|',
                  note: '2.7× the random-matrix value',
                },
                {
                  val: `${data.dominant.dominance_pct}%`,
                  label: 'Share of spectrum',
                  note: '0 of 1,000 random matrices reach 35%',
                },
                {
                  val: 'Period-4',
                  label: 'Cycle structure (T operator)',
                  note: 'at least 2 cycles · 100K random + 32K exhaustive · 0/800 in random nulls',
                },
              ].map(({ val, label, note }) => (
                <div
                  className="p-4 sm:p-5 lg:p-6 text-center border-r border-border last:border-0 border-b lg:border-b-0 border-border"
                  key={label}
                >
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono text-gold">
                    {val}
                  </div>
                  <div className="text-xs sm:text-xs text-muted-foreground uppercase tracking-wider mt-1.5">
                    {label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 hidden sm:block">
                    {note}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeSection>

        {/* ════════════════════ BLOCK AVERAGES ════════════════════ */}
        <FadeSection
          {...fadeIn}
          className="py-10 sm:py-14 lg:py-18 px-4 sm:px-6 lg:px-8 border border-border border-t-0"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-xs text-gold/80 uppercase tracking-widest font-mono mb-2">
              Block averages
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Phase angle under block averaging
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              We average the matrix over N×N blocks, from 2×2 up to the full
              128×128, and compute the dominant eigenvalue each time. Its phase
              angle stays near 90° at all 11 sizes tested. The three
              unconstrained random matrices we compared show widely varying
              angles; random matrices that obey the mirror rule were not part of
              this comparison.
            </p>

            <div className="mt-8 h-[260px] sm:h-[320px] lg:h-[360px] border border-border bg-black/20 p-2 sm:p-4">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart
                  data={scalePts}
                  margin={{ top: 10, right: 50, bottom: 25, left: 10 }}
                >
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.025)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                    dataKey="label"
                    label={{
                      value: 'Matrix Size',
                      position: 'bottom',
                      offset: 10,
                      style: { fill: 'rgba(255,255,255,0.15)', fontSize: 10 },
                    }}
                    tick={{
                      fill: 'rgba(255,255,255,0.3)',
                      fontSize: 10,
                      fontFamily: 'monospace',
                    }}
                  />
                  <YAxis
                    axisLine={{ stroke: 'rgba(212,175,55,0.12)' }}
                    domain={[85, 95]}
                    label={{
                      value: 'Angle (°)',
                      angle: -90,
                      position: 'insideLeft',
                      offset: -5,
                      style: { fill: '#D4AF37', fontSize: 10 },
                    }}
                    tick={{
                      fill: '#D4AF37',
                      fontSize: 10,
                      fontFamily: 'monospace',
                    }}
                    yAxisId="a"
                  />
                  <YAxis
                    axisLine={{ stroke: 'rgba(255,255,255,0.04)' }}
                    domain={[0, 105]}
                    label={{
                      value: 'Dominance %',
                      angle: 90,
                      position: 'insideRight',
                      style: { fill: 'rgba(255,255,255,0.12)', fontSize: 10 },
                    }}
                    orientation="right"
                    tick={{
                      fill: 'rgba(255,255,255,0.18)',
                      fontSize: 10,
                      fontFamily: 'monospace',
                    }}
                    yAxisId="d"
                  />
                  <Tooltip
                    contentStyle={ttStyle}
                    formatter={v => [
                      typeof v === 'number' ? v.toFixed(2) : String(v),
                      '',
                    ]}
                    itemStyle={ttItemStyle}
                    labelStyle={ttLabelStyle}
                  />
                  <ReferenceLine
                    stroke="rgba(212,175,55,0.12)"
                    strokeDasharray="8 4"
                    y={90}
                    yAxisId="a"
                  />
                  <Line
                    dataKey="angle_deg"
                    dot={{
                      fill: '#D4AF37',
                      r: 5,
                      strokeWidth: 2,
                      stroke: '#0a0a0a',
                    }}
                    stroke="#D4AF37"
                    strokeWidth={2.5}
                    type="monotone"
                    yAxisId="a"
                  />
                  <Line
                    dataKey="dominance_pct"
                    dot={{ fill: 'rgba(255,255,255,0.15)', r: 3 }}
                    stroke="rgba(255,255,255,0.12)"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    type="monotone"
                    yAxisId="d"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-6 mt-2 justify-center text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-5 h-[2px] bg-gold rounded" />{' '}
                Angle (flat = preserved)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-5 h-[1px] border-b border-dashed border-white/20" />{' '}
                Dominance
              </span>
            </div>

            <TechDetail>
              <p>
                Block-average extraction: divide 128×128 into N×N blocks,
                average each block.
              </p>
              <p>
                Eigenvalue computed via NumPy linalg.eigvals at each extraction
                size.
              </p>
              <p>
                Random control: 3 random matrices without the mirror rule; their
                angles vary from 0° to 180° across sizes.
              </p>
              <p>
                Anna angle variation: only 0.3° across all 11 extraction sizes.
              </p>
            </TechDetail>
          </div>
        </FadeSection>

        {/* ════════════════════ EIGENVALUE MAP ════════════════════ */}
        <FadeSection
          {...fadeIn}
          className="py-10 sm:py-14 lg:py-18 px-4 sm:px-6 lg:px-8 border-x border-b border-border"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-xs text-gold/80 uppercase tracking-widest font-mono mb-2">
              Eigenvalues
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
              All 128 eigenvalues
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              A 128×128 matrix has 128 eigenvalues. The two gold dots at the
              extremes are the dominant conjugate pair; their magnitude is about
              2.6 times the next largest, so they carry most of the spectral
              weight.
            </p>

            <div className="mt-8 h-[300px] sm:h-[380px] lg:h-[440px] border border-border bg-black/20 p-2 sm:p-4">
              <ResponsiveContainer height="100%" width="100%">
                <ScatterChart
                  margin={{ top: 10, right: 20, bottom: 30, left: 50 }}
                >
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.02)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    axisLine={{ stroke: 'rgba(255,255,255,0.04)' }}
                    dataKey="real"
                    domain={[-1000, 1000]}
                    label={{
                      value: 'Real',
                      position: 'bottom',
                      offset: 12,
                      style: { fill: 'rgba(255,255,255,0.1)', fontSize: 10 },
                    }}
                    tick={{
                      fill: 'rgba(255,255,255,0.18)',
                      fontSize: 10,
                      fontFamily: 'monospace',
                    }}
                    type="number"
                  />
                  <YAxis
                    axisLine={{ stroke: 'rgba(255,255,255,0.04)' }}
                    dataKey="imag"
                    domain={[-2600, 2600]}
                    label={{
                      value: 'Imaginary',
                      angle: -90,
                      position: 'insideLeft',
                      offset: -10,
                      style: { fill: 'rgba(255,255,255,0.1)', fontSize: 10 },
                    }}
                    tick={{
                      fill: 'rgba(255,255,255,0.18)',
                      fontSize: 10,
                      fontFamily: 'monospace',
                    }}
                    type="number"
                  />
                  <Tooltip
                    contentStyle={ttStyle}
                    formatter={v => [
                      typeof v === 'number' ? v.toFixed(1) : String(v),
                      '',
                    ]}
                    itemStyle={ttItemStyle}
                    labelFormatter={() => ''}
                    labelStyle={ttLabelStyle}
                  />
                  <ReferenceLine stroke="rgba(255,255,255,0.04)" x={0} />
                  <ReferenceLine stroke="rgba(255,255,255,0.04)" y={0} />
                  <Scatter data={eigenPts}>
                    {eigenPts.map(e => (
                      <Cell
                        fill={e.isDom ? '#D4AF37' : 'rgba(255,255,255,0.15)'}
                        key={`ev-${e.real}-${e.imag}`}
                        r={e.isDom ? 10 : Math.max(2, e.magnitude / 250)}
                        stroke={e.isDom ? 'rgba(212,175,55,0.4)' : 'none'}
                        strokeWidth={e.isDom ? 4 : 0}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <TechDetail>
              <p>
                128 eigenvalues from numpy.linalg.eigvals on the full 128×128
                Anna Matrix (int8).
              </p>
              <p>
                Dominant pair: λ = -18.659 ± 2342.000i, |λ| = 2342.075, angle =
                90.456°.
              </p>
              <p>
                Spectral dominance: |λ₁|² × 2 / Σ|λᵢ|² = 40.4%. Next largest:
                |λ₃| = 884 (2.6× smaller).
              </p>
              <p>
                1,000 random matrices tested: 0 exceed 35% spectral dominance.
              </p>
            </TechDetail>
          </div>
        </FadeSection>

        {/* ════════════════════ FOOTER ════════════════════ */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 border-x border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="text-xs text-white/12 font-mono tracking-wider">
            April 2026 · Corrected September 2026
          </div>
          <Link
            className="text-xs text-gold/70 hover:text-gold/80 font-mono transition-colors"
            href="/docs/03-results/25-aigarth-research-lab"
          >
            Read the full research paper →
          </Link>
        </div>
      </div>
    </LazyMotion>
  )
}
