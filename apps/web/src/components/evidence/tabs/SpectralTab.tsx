'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ReferenceLine, Cell,
} from 'recharts'
import { Maximize2, Minimize2, ChevronDown, Pause, Play } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// ─── Types ───
interface SpectralData {
  eigenvalues: { real: number; imag: number; magnitude: number; angle_deg: number }[]
  dominant: { real: number; imag: number; angle_deg: number; magnitude: number; dominance_pct: number }
  scale_invariance: { size: number; angle_deg: number; dominance_pct: number; magnitude: number }[]
  period4: { energies: number[]; behaviors: string[] }
  essence_2x2: number[][]
  matrix_stats: { trace: number; sum: number; zeros: number; antisymmetry_pct: number; spectral_radius: number }
}

// ─── Typing effect ───
function TypedText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  useEffect(() => {
    if (!started) return
    let i = 0
    const iv = setInterval(() => {
      if (i <= text.length) { setDisplayed(text.slice(0, i)); i++ }
      else clearInterval(iv)
    }, 35)
    return () => clearInterval(iv)
  }, [text, started])

  return (
    <span className={className}>
      {displayed}
      {displayed.length < text.length && started && (
        <span className="inline-block w-[2px] h-[1em] bg-[#D4AF37] ml-0.5 animate-pulse" />
      )}
    </span>
  )
}

// ─── Counter animation ───
function CountUp({ target, suffix = '', prefix = '', duration = 1500, className }: {
  target: number; suffix?: string; prefix?: string; duration?: number; className?: string
}) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        function tick(now: number) {
          const t = Math.min(1, (now - start) / duration)
          const ease = 1 - Math.pow(1 - t, 3)
          setValue(Math.round(target * ease))
          if (t < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return <div ref={ref} className={className}>{prefix}{value.toLocaleString()}{suffix}</div>
}

// ─── Expandable detail ───
function TechDetail({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[10px] text-[#D4AF37]/30 hover:text-[#D4AF37]/60 font-mono uppercase tracking-wider transition-colors"
      >
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
        {open ? 'Hide' : 'Show'} technical details
      </button>
      {open && (
        <m.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 text-[11px] font-mono text-white/20 leading-relaxed border-l-2 border-[#D4AF37]/10 pl-3 space-y-1"
        >
          {children}
        </m.div>
      )}
    </div>
  )
}

// ─── Section wrapper with scroll reveal ───
const FadeSection = m.section
const fadeIn = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-50px' }, transition: { duration: 0.6, ease: 'easeOut' as const } }

// ─── Animated canvas ───
function RotationCanvas({ data, paused }: { data: SpectralData; paused: boolean }) {
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
      const W = sizeRef.current.w, H = sizeRef.current.h
      if (W === 0 || H === 0) { requestAnimationFrame(draw); return }
      const cx = W / 2, cy = H / 2
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
      for (let x = cx % gs; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
      for (let y = cy % gs; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

      // Rings
      for (let r = 1; r <= 4; r++) {
        ctx.beginPath(); ctx.arc(cx, cy, radius * r * 0.3, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(212,175,55,${0.02 + r * 0.015})`; ctx.lineWidth = 0.5; ctx.stroke()
      }

      // Main orbit
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(212,175,55,0.2)'; ctx.lineWidth = 1.5; ctx.stroke()

      // Axes
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 0.5; ctx.setLineDash([5, 5])
      ctx.beginPath(); ctx.moveTo(cx - radius * 1.4, cy); ctx.lineTo(cx + radius * 1.4, cy); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, cy - radius * 1.4); ctx.lineTo(cx, cy + radius * 1.4); ctx.stroke()
      ctx.setLineDash([])

      // 90° arc
      const arcR = radius * 0.38
      ctx.beginPath(); ctx.arc(cx, cy, arcR, 0, -Math.PI / 2, true)
      ctx.strokeStyle = 'rgba(212,175,55,0.7)'; ctx.lineWidth = 2.5; ctx.stroke()
      // Arrow
      const aX = cx + Math.cos(-Math.PI / 2) * arcR, aY = cy + Math.sin(-Math.PI / 2) * arcR
      ctx.fillStyle = 'rgba(212,175,55,0.9)'
      ctx.beginPath(); ctx.moveTo(aX, aY); ctx.lineTo(aX + 6, aY + 8); ctx.lineTo(aX - 5, aY + 4); ctx.fill()

      // Angle label
      const fs = Math.max(14, radius * 0.1)
      ctx.font = `bold ${fs}px monospace`; ctx.fillStyle = '#D4AF37'; ctx.textAlign = 'center'
      ctx.fillText('90.456°', cx + arcR * 0.5, cy - arcR * 0.5)

      // Small eigenvalue dots
      const maxMag = data.dominant.magnitude
      for (const ev of data.eigenvalues) {
        if (ev.magnitude > maxMag * 0.95) continue
        const ex = cx + (ev.real / maxMag) * radius * 0.88
        const ey = cy - (ev.imag / maxMag) * radius * 0.88
        ctx.beginPath(); ctx.arc(ex, ey, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill()
      }

      // Period-4 rotating states
      const phase = (frame * 0.01) % (Math.PI * 2)
      const sc = [
        { fill: '#34d399', glow: 'rgba(52,211,153,0.25)', label: 'COOPERATE' },
        { fill: 'rgba(52,211,153,0.45)', glow: 'rgba(52,211,153,0.1)', label: 'COOPERATE' },
        { fill: '#94a3b8', glow: 'rgba(148,163,184,0.25)', label: 'REST' },
        { fill: 'rgba(148,163,184,0.45)', glow: 'rgba(148,163,184,0.1)', label: 'REST' },
      ]

      for (let i = 3; i >= 0; i--) {
        const a = phase + (i * Math.PI / 2)
        const sx = cx + Math.cos(a) * radius, sy = cy - Math.sin(a) * radius
        const c = sc[i]!, active = i === 0
        const dr = active ? Math.max(9, radius * 0.045) : Math.max(5, radius * 0.025)

        if (active) {
          const g = ctx.createRadialGradient(sx, sy, dr, sx, sy, dr * 5)
          g.addColorStop(0, c.glow); g.addColorStop(1, 'transparent')
          ctx.beginPath(); ctx.arc(sx, sy, dr * 5, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill()
        }
        ctx.beginPath(); ctx.arc(sx, sy, dr, 0, Math.PI * 2); ctx.fillStyle = c.fill; ctx.fill()

        if (active || i === 2) {
          const ls = Math.max(10, radius * 0.04)
          ctx.font = `${active ? 'bold ' : ''}${ls}px monospace`
          ctx.fillStyle = active ? c.fill : 'rgba(255,255,255,0.2)'; ctx.textAlign = 'center'
          ctx.fillText(c.label, sx, sy + dr + ls + 5)
          ctx.font = `${ls * 0.8}px monospace`; ctx.fillStyle = 'rgba(255,255,255,0.12)'
          ctx.fillText(`E=${data.period4.energies[i]}`, sx, sy + dr + ls * 2 + 5)
        }
      }

      // Dominant pair
      for (const sign of [1, -1]) {
        const dx = cx + (data.dominant.real / maxMag) * radius * 0.88
        const dy = cy - (data.dominant.imag * sign / maxMag) * radius * 0.88
        const pr = 5 + Math.sin(frame * 0.04) * 2
        const dg = ctx.createRadialGradient(dx, dy, 2, dx, dy, pr * 3)
        dg.addColorStop(0, 'rgba(212,175,55,0.5)'); dg.addColorStop(0.4, 'rgba(212,175,55,0.08)'); dg.addColorStop(1, 'transparent')
        ctx.beginPath(); ctx.arc(dx, dy, pr * 3, 0, Math.PI * 2); ctx.fillStyle = dg; ctx.fill()
        ctx.beginPath(); ctx.arc(dx, dy, 4, 0, Math.PI * 2); ctx.fillStyle = '#D4AF37'; ctx.fill()

        if (sign === 1) {
          const lfs = Math.max(10, radius * 0.04)
          ctx.font = `bold ${lfs}px monospace`; ctx.fillStyle = '#D4AF37'; ctx.textAlign = 'left'
          ctx.fillText(`|λ| = ${data.dominant.magnitude.toLocaleString()}`, dx + 14, dy - 3)
          ctx.font = `${lfs * 0.8}px monospace`; ctx.fillStyle = 'rgba(212,175,55,0.4)'
          ctx.fillText(`angle = ${data.dominant.angle_deg}°`, dx + 14, dy + lfs + 1)
        }
      }

      if (!pausedRef.current) frameRef.current++
      if (mountRef.current) requestAnimationFrame(draw)
    }
    requestAnimationFrame(draw)
    return () => { mountRef.current = false; window.removeEventListener('resize', resize) }
  }, [data])

  return <canvas ref={canvasRef} className="w-full h-full" />
}

// ─── Cycle animation ───
function Cycle({ behaviors, energies }: { behaviors: string[]; energies: number[] }) {
  const [step, setStep] = useState(0)
  useEffect(() => { const iv = setInterval(() => setStep(s => (s + 1) % 4), 1100); return () => clearInterval(iv) }, [])
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-3">
      {behaviors.map((b, i) => {
        const coop = b === 'COOP'
        const active = i === step
        return (
          <m.div key={`cycle-${b}-${i}`} animate={{ scale: active ? 1.04 : 1 }} transition={{ type: 'spring', stiffness: 300 }}
            className={cn(
              'relative overflow-hidden border p-2 sm:p-5 lg:p-6 text-center transition-colors duration-300',
              coop ? active ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-emerald-500/[0.04] border-emerald-500/10'
                   : active ? 'bg-slate-400/20 border-slate-400/50' : 'bg-slate-400/[0.04] border-slate-400/10',
            )}>
            {active && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-pulse" />}
            <div className="relative">
              <div className={cn('text-xs sm:text-lg lg:text-2xl font-bold font-mono truncate', coop ? 'text-emerald-400' : 'text-slate-400')}>
                {coop ? 'Coop' : 'Rest'}
              </div>
              <div className="text-[10px] text-white/20 font-mono mt-1">Energy {energies[i]}</div>
            </div>
          </m.div>
        )
      })}
    </div>
  )
}

// ─── Comparison bar ───
function CompBar({ label, explain, anna, random, factor }: { label: string; explain: string; anna: number; random: number; factor: string }) {
  const max = Math.max(anna, random) * 1.15
  return (
    <div className="py-4 border-b border-white/[0.04] last:border-0">
      <div className="flex items-baseline justify-between mb-1.5">
        <div><span className="text-xs sm:text-sm text-white/60">{label}</span><span className="text-[10px] text-white/20 ml-2 hidden sm:inline">{explain}</span></div>
        <span className="text-sm sm:text-base font-mono text-[#D4AF37] font-bold">{factor}</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2"><span className="text-[10px] text-emerald-400/50 w-10 font-mono shrink-0">Anna</span><div className="flex-1 h-4 bg-white/[0.02] overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500/30 to-emerald-500/60 rounded-r-sm transition-all duration-1000" style={{ width: `${(anna / max) * 100}%` }} /></div><span className="text-[10px] text-white/25 w-14 text-right font-mono shrink-0">{anna.toLocaleString()}</span></div>
        <div className="flex items-center gap-2"><span className="text-[10px] text-white/20 w-10 font-mono shrink-0">Rand</span><div className="flex-1 h-4 bg-white/[0.02] overflow-hidden"><div className="h-full bg-gradient-to-r from-white/5 to-white/15 rounded-r-sm transition-all duration-1000" style={{ width: `${(random / max) * 100}%` }} /></div><span className="text-[10px] text-white/15 w-14 text-right font-mono shrink-0">{random.toLocaleString()}</span></div>
      </div>
    </div>
  )
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
    fetch('/data/anna-spectral-data.json').then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!heroRef.current) return
    if (!document.fullscreenElement) { heroRef.current.requestFullscreen?.(); setFullscreen(true) }
    else { document.exitFullscreen?.(); setFullscreen(false) }
  }, [])

  useEffect(() => {
    const handler = () => { if (!document.fullscreenElement) setFullscreen(false) }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const eigenPts = useMemo(() => data?.eigenvalues.map((e, i) => ({ real: e.real, imag: e.imag, magnitude: e.magnitude, isDom: i < 2 })) ?? [], [data])
  const scalePts = useMemo(() => data?.scale_invariance.map(s => ({ ...s, label: `${s.size}` })) ?? [], [data])

  const ttStyle = { backgroundColor: '#0a0a0a', border: '1px solid rgba(212,175,55,0.3)', fontSize: 11, fontFamily: 'monospace', color: '#e5e5e5' }
  const ttLabelStyle = { color: 'rgba(212,175,55,0.6)' }
  const ttItemStyle = { color: '#e5e5e5' }

  if (loading || !data) return (
    <div className="w-full h-[500px] bg-[#050505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border border-[#D4AF37]/30 animate-spin" style={{ animationDuration: '2s' }} />
        <span className="text-white/20 text-xs font-mono tracking-[0.3em]">LOADING</span>
      </div>
    </div>
  )

  return (
    <LazyMotion features={domAnimation}>
    <div className="bg-[#050505] overflow-x-hidden">

      {/* ════════════════════ HERO ════════════════════ */}
      <FadeSection {...fadeIn}>
        <div ref={heroRef} className={cn('relative border border-white/[0.06] overflow-hidden', fullscreen ? 'bg-[#050505]' : '')}>
          {/* Canvas */}
          <div className={cn('relative', fullscreen ? 'h-screen' : 'h-[55vh] sm:h-[60vh] lg:h-[70vh]')}>
            <RotationCanvas data={data} paused={paused} />

            {/* Controls overlay */}
            <div className="absolute top-3 right-3 flex gap-2 z-10">
              <button onClick={() => setPaused(!paused)} className="p-2 bg-black/40 backdrop-blur-sm border border-white/10 hover:border-[#D4AF37]/30 transition-colors" aria-label={paused ? 'Play' : 'Pause'}>
                {paused ? <Play className="w-4 h-4 text-white/50" /> : <Pause className="w-4 h-4 text-white/50" />}
              </button>
              <button onClick={toggleFullscreen} className="p-2 bg-black/40 backdrop-blur-sm border border-white/10 hover:border-[#D4AF37]/30 transition-colors" aria-label="Toggle fullscreen">
                {fullscreen ? <Minimize2 className="w-4 h-4 text-white/50" /> : <Maximize2 className="w-4 h-4 text-white/50" />}
              </button>
            </div>

            {/* Text overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent p-5 sm:p-8 lg:p-10">
              <div className="text-[10px] text-[#D4AF37]/50 uppercase tracking-[0.3em] font-mono mb-2">Core Discovery</div>
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-tight max-w-2xl">
                <TypedText text="A single mathematical property makes artificial creatures cooperate." delay={500} />
              </h2>
              <p className="text-white/30 text-xs sm:text-sm mt-2 max-w-xl leading-relaxed">
                Anna&apos;s dominant eigenvalue rotates at 90.456° (a near-perfect quarter-turn) and controls 40% of the spectral magnitude. Under direct ternary iteration T(v) = sign(M·v), this produces exactly 2 period-4 cycles, verified across 100K random samples and 32K exhaustive HW≤2 inputs. Under the separate input-clamped AIT operator (the production scanner), period-4 does not transfer — that regime gives 16K period-1 fixed points instead.
              </p>
            </div>
          </div>

          {/* Stat bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-white/[0.04]">
            {[
              { val: '90.456°', label: 'Rotation Angle', note: '0.5% from perfect quarter-turn' },
              { val: data.dominant.magnitude.toLocaleString(), label: 'Signal Strength', note: '2.7× stronger than random' },
              { val: `${data.dominant.dominance_pct}%`, label: 'System Control', note: '0 of 1,000 random matrices match' },
              { val: 'Period-4', label: 'Cycle structure (T operator)', note: '2 cycles · 100K random + 32K exhaustive · 0/800 in random nulls' },
            ].map(({ val, label, note }) => (
              <div key={label} className="p-4 sm:p-5 lg:p-6 text-center border-r border-white/[0.04] last:border-0 border-b lg:border-b-0 border-white/[0.04]">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold font-mono text-[#D4AF37]">{val}</div>
                <div className="text-[10px] sm:text-xs text-white/40 uppercase tracking-wider mt-1.5">{label}</div>
                <div className="text-[10px] text-white/15 mt-1 hidden sm:block">{note}</div>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ════════════════════ THE RHYTHM ════════════════════ */}
      <FadeSection {...fadeIn} className="py-10 sm:py-14 lg:py-18 px-4 sm:px-6 lg:px-8 border-x border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-[10px] text-[#D4AF37]/50 uppercase tracking-[0.2em] font-mono mb-2">Emergent Behavior</div>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">The Cooperation Rhythm</h3>
          <p className="text-white/35 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            Under direct ternary iteration T(v) = sign(M·v), Anna admits exactly 2 period-4 cycles
            with sums (-42, +50, +38, -56) and (+42, -50, -38, +56). Verified on 100K random
            samples + 32K exhaustive HW≤2; reproduced on 200/200 Anna nulls vs 1/800 random nulls.
            The companion paper maps these 4 phases onto a {'{'}cooperate, cooperate, rest, rest{'}'}
            behavioural sequence. The ALife cooperation rate (~33%) is a separate empirical
            measurement from a single 10M-tick seed=7 run.
          </p>

          <div className="mt-8 sm:mt-10">
            <Cycle behaviors={data.period4.behaviors} energies={data.period4.energies} />
          </div>

          <div className="mt-4 text-center text-[10px] text-white/15 font-mono tracking-wider">
            50% cooperation base rate &middot; Reduced to 33% with environmental noise &middot; Zero aggression in the cycle
          </div>

          <TechDetail>
            <p>Behavioral sequence derived from sign(A × state) iteration on int64 arithmetic.</p>
            <p>Social output dims 15-17: sum &gt; 0 = cooperate. Rest output dims 24-26: sum &gt; 0 = rest.</p>
            <p>COOP ticks: Social raw = [+2629, +924, +3415]. REST ticks: Social raw = [-2451, -716, -2909].</p>
            <p>Binary flip of ALL social dimensions simultaneously. 0 uncertain neurons.</p>
          </TechDetail>
        </div>
      </FadeSection>

      {/* ════════════════════ SCALE INVARIANCE ════════════════════ */}
      <FadeSection {...fadeIn} className="py-10 sm:py-14 lg:py-18 px-4 sm:px-6 lg:px-8 border border-white/[0.06] border-t-0">
        <div className="max-w-5xl mx-auto">
          <div className="text-[10px] text-[#D4AF37]/50 uppercase tracking-[0.2em] font-mono mb-2">Fractal Property</div>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">The Same Pattern at Every Scale</h3>
          <p className="text-white/35 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            Compress the matrix to 2×2 or expand it to 128×128 — the 90-degree rotation is always there. Like a hologram where every fragment contains the whole picture. Random matrices show chaotic, unpredictable angles at different scales.
          </p>

          <div className="mt-8 h-[260px] sm:h-[320px] lg:h-[360px] border border-white/[0.04] bg-black/20 p-2 sm:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scalePts} margin={{ top: 10, right: 50, bottom: 25, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.025)" />
                <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} label={{ value: 'Matrix Size', position: 'bottom', offset: 10, style: { fill: 'rgba(255,255,255,0.15)', fontSize: 10 } }} />
                <YAxis yAxisId="a" domain={[85, 95]} tick={{ fill: '#D4AF37', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: 'rgba(212,175,55,0.12)' }} label={{ value: 'Angle (°)', angle: -90, position: 'insideLeft', offset: -5, style: { fill: '#D4AF37', fontSize: 10 } }} />
                <YAxis yAxisId="d" orientation="right" domain={[0, 105]} tick={{ fill: 'rgba(255,255,255,0.18)', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} label={{ value: 'Dominance %', angle: 90, position: 'insideRight', style: { fill: 'rgba(255,255,255,0.12)', fontSize: 10 } }} />
                <Tooltip contentStyle={ttStyle} labelStyle={ttLabelStyle} itemStyle={ttItemStyle} formatter={(v) => [typeof v === 'number' ? v.toFixed(2) : String(v), '']} />
                <ReferenceLine yAxisId="a" y={90} stroke="rgba(212,175,55,0.12)" strokeDasharray="8 4" />
                <Line yAxisId="a" type="monotone" dataKey="angle_deg" stroke="#D4AF37" strokeWidth={2.5} dot={{ fill: '#D4AF37', r: 5, strokeWidth: 2, stroke: '#0a0a0a' }} />
                <Line yAxisId="d" type="monotone" dataKey="dominance_pct" stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="4 4" dot={{ fill: 'rgba(255,255,255,0.15)', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-6 mt-2 justify-center text-[10px] font-mono text-white/15">
            <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-[2px] bg-[#D4AF37] rounded" /> Angle (flat = preserved)</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-[1px] border-b border-dashed border-white/20" /> Dominance</span>
          </div>

          <TechDetail>
            <p>Block-average extraction: divide 128×128 into N×N blocks, average each block.</p>
            <p>Eigenvalue computed via NumPy linalg.eigvals at each extraction size.</p>
            <p>Random control: 3 random matrices tested — angles jump from 0° to 180° across scales.</p>
            <p>Anna angle variation: only 0.3° across all 11 extraction sizes.</p>
          </TechDetail>
        </div>
      </FadeSection>

      {/* ════════════════════ EIGENVALUE MAP ════════════════════ */}
      <FadeSection {...fadeIn} className="py-10 sm:py-14 lg:py-18 px-4 sm:px-6 lg:px-8 border-x border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-[10px] text-[#D4AF37]/50 uppercase tracking-[0.2em] font-mono mb-2">Mathematical DNA</div>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">128 Numbers That Define Everything</h3>
          <p className="text-white/35 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            Every matrix has 128 eigenvalues — numbers that encode its complete mathematical identity. The two golden dots at the extremes are the dominant pair. They are so much larger than everything else that they alone dictate how the system behaves.
          </p>

          <div className="mt-8 h-[300px] sm:h-[380px] lg:h-[440px] border border-white/[0.04] bg-black/20 p-2 sm:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                <XAxis dataKey="real" type="number" domain={[-1000, 1000]} tick={{ fill: 'rgba(255,255,255,0.18)', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} label={{ value: 'Real', position: 'bottom', offset: 12, style: { fill: 'rgba(255,255,255,0.1)', fontSize: 10 } }} />
                <YAxis dataKey="imag" type="number" domain={[-2600, 2600]} tick={{ fill: 'rgba(255,255,255,0.18)', fontSize: 10, fontFamily: 'monospace' }} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} label={{ value: 'Imaginary', angle: -90, position: 'insideLeft', offset: -10, style: { fill: 'rgba(255,255,255,0.1)', fontSize: 10 } }} />
                <Tooltip contentStyle={ttStyle} labelStyle={ttLabelStyle} itemStyle={ttItemStyle} formatter={(v) => [typeof v === 'number' ? v.toFixed(1) : String(v), '']} labelFormatter={() => ''} />
                <ReferenceLine x={0} stroke="rgba(255,255,255,0.04)" />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.04)" />
                <Scatter data={eigenPts}>
                  {eigenPts.map((e) => <Cell key={`ev-${e.real}-${e.imag}`} fill={e.isDom ? '#D4AF37' : 'rgba(255,255,255,0.15)'} r={e.isDom ? 10 : Math.max(2, e.magnitude / 250)} stroke={e.isDom ? 'rgba(212,175,55,0.4)' : 'none'} strokeWidth={e.isDom ? 4 : 0} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <TechDetail>
            <p>128 eigenvalues from numpy.linalg.eigvals on the full 128×128 Anna Matrix (int8).</p>
            <p>Dominant pair: λ = -18.659 ± 2342.000i, |λ| = 2342.075, angle = 90.456°.</p>
            <p>Spectral dominance: |λ₁|² × 2 / Σ|λᵢ|² = 40.4%. Next largest: |λ₃| = 884 (2.6× smaller).</p>
            <p>1,000 random matrices tested: 0 exceed 35% spectral dominance.</p>
          </TechDetail>
        </div>
      </FadeSection>

      {/* ════════════════════ ANNA vs RANDOM ════════════════════ */}
      <FadeSection {...fadeIn} className="py-10 sm:py-14 lg:py-18 px-4 sm:px-6 lg:px-8 border-x border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-[10px] text-[#D4AF37]/50 uppercase tracking-[0.2em] font-mono mb-2">The Proof</div>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">Anna vs Random: Same Rules, Different Worlds</h3>
          <p className="text-white/35 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            We ran the exact same artificial life simulation twice — once with the Anna Matrix, once with a random matrix. Same rules, same starting conditions. One million time steps. The results speak for themselves.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 mt-8">
            <div className="lg:col-span-3">
              <CompBar label="Population" explain="How many creatures survive" anna={2759} random={1692} factor="1.6×" />
              <CompBar label="Stability" explain="Population consistency" anna={34} random={8} factor="4.3×" />
              <CompBar label="Food Sharing" explain="Altruistic acts per tick" anna={123} random={43} factor="2.8×" />
              <CompBar label="Peace" explain="Inverse aggression rate" anna={86} random={74} factor="−46% aggr." />
            </div>
            <div className="lg:col-span-2 bg-gradient-to-br from-[#D4AF37]/[0.05] to-transparent border border-[#D4AF37]/15 p-5 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-[#D4AF37]/40 uppercase tracking-[0.2em] font-mono">Bottom Line</div>
                <h4 className="text-white font-bold text-base sm:text-lg mt-3 leading-snug">Anna builds cooperative societies.</h4>
                <p className="text-white/30 text-xs sm:text-sm mt-3 leading-relaxed">Random matrices produce chaotic populations with boom-bust cycles. Anna produces stable communities that share food and avoid conflict.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6 pt-4 border-t border-[#D4AF37]/10 text-center">
                {[{ v: 5, l: 'Seeds' }, { v: 1, l: 'M ticks' }, { v: 33, l: '% coop' }].map(({ v, l }) => (
                  <div key={l}><CountUp target={v} className="text-sm sm:text-base font-mono text-[#D4AF37] font-bold" /><div className="text-[9px] text-white/20">{l}</div></div>
                ))}
                <div><div className="text-sm sm:text-base font-mono text-white font-bold">±0.1%</div><div className="text-[9px] text-white/20">CV 0.3%</div></div>
              </div>
            </div>
          </div>

          <TechDetail>
            <p>anna_neuraxon simulation, Objective-C with BLAS (Accelerate.framework), Apple Silicon M4.</p>
            <p>Random matrix: seed 2026, int8 uniform [-128, 127], same dimensions 128×128.</p>
            <p>5 seeds (42, 7, 13, 256, 1337) × 1M ticks each: mean cooperation 33.04 % ± 0.07 %. Individual seed means: 33.01 / 33.07 / 32.96 / 33.14 / 33.04 %. CV = 0.21 %. See <code>ensemble_1m_seed*.jsonl</code> (5 files).</p>
            <p>Stability gap grows over time: 2.7× at 100K → 6.0× at 500K ticks.</p>
          </TechDetail>
        </div>
      </FadeSection>

      {/* ════════════════════ FOOTER ════════════════════ */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 border-x border-b border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="text-[10px] text-white/12 font-mono tracking-wider">April 2026 · All findings independently verified · All errors corrected transparently</div>
        <Link href="/docs/03-results/25-aigarth-research-lab" className="text-[10px] text-[#D4AF37]/25 hover:text-[#D4AF37]/60 font-mono transition-colors">Read the full research paper →</Link>
      </div>
    </div>
    </LazyMotion>
  )
}
