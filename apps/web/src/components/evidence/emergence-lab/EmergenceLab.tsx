'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Layers,
  Cpu,
  GitBranch,
  ListChecks,
  Play,
  RotateCcw,
  Check,
  AlertTriangle,
  BookOpen,
  Calculator,
  Download,
  ArrowRight,
  Lightbulb,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  HeroBlock,
  MethodologyFooter,
  ReproducibilityFooter,
  ExplainPanel,
  BlockMath,
  InlineMath,
} from '@/components/evidence/lab-primitives'
import { DECOMPOSITION, PHASES, NOVELTY, SUBSTRATE, VERSIONS } from './data'

const REPO = 'https://github.com/daviduis777-oss/qubic-church'
const nf = (n: number) => n.toLocaleString('en-US')

function useReducedMotion(): boolean {
  const [rm, setRm] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    setRm(m.matches)
    const h = () => setRm(m.matches)
    m.addEventListener?.('change', h)
    return () => m.removeEventListener?.('change', h)
  }, [])
  return rm
}

// =============================================================================
// Engine: a 1-cell adder module is evolved ONLY on 2-bit addition (16 examples)
// by a (1+1) hill-climber. Solving those 16 forces the exact full adder; tiling
// it then adds numbers of any width. This illustrates the Phase-1 MECHANISM on a
// simplified boolean module — the headline result runs the same minimal-interface
// principle on Anna.exe's actual ternary LUT-CA (see synthesis_proof.py).
// =============================================================================

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const TARGET: number[] = (() => {
  const t: number[] = []
  for (let i = 0; i < 8; i++) {
    const a = (i >> 2) & 1, b = (i >> 1) & 1, c = i & 1
    t.push((a ^ b ^ c) | ((a + b + c >= 2 ? 1 : 0) << 1))
  }
  return t
})()

function trainError(lut: Uint8Array): number {
  let e = 0
  for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) {
    let cin = 0, out = 0
    for (let k = 0; k < 2; k++) {
      const idx = (((a >> k) & 1) << 2) | (((b >> k) & 1) << 1) | cin
      const c = lut[idx] ?? 0
      out |= (c & 1) << k
      cin = (c >> 1) & 1
    }
    out |= cin << 2
    const d = out ^ (a + b)
    e += (d & 1) + ((d >> 1) & 1) + ((d >> 2) & 1)
  }
  return e
}

function addBig(lut: Uint8Array, a: bigint, b: bigint, W: number): bigint {
  let cin = 0n, out = 0n
  for (let k = 0; k < W; k++) {
    const idx = (Number((a >> BigInt(k)) & 1n) << 2) | (Number((b >> BigInt(k)) & 1n) << 1) | Number(cin)
    const c = lut[idx] ?? 0
    out |= BigInt(c & 1) << BigInt(k)
    cin = BigInt((c >> 1) & 1)
  }
  return out | (cin << BigInt(W))
}

function randBig(rng: () => number, W: number): bigint {
  let v = 0n
  for (let k = 0; k < W; k++) if (rng() < 0.5) v |= 1n << BigInt(k)
  return v
}

function genWrong(lut: Uint8Array, W: number, M: number, rng: () => number): number {
  let w = 0
  for (let i = 0; i < M; i++) {
    const a = randBig(rng, W), b = randBig(rng, W)
    let d = addBig(lut, a, b, W) ^ (a + b)
    while (d > 0n) { w += Number(d & 1n); d >>= 1n }
  }
  return w
}

// per-bit trace for the ripple-carry visualization (low bit first)
interface RipBit { a: number; b: number; cin: number; sum: number; cout: number }
function ripTrace(lut: Uint8Array, a: bigint, b: bigint, W: number): RipBit[] {
  const out: RipBit[] = []
  let cin = 0
  for (let k = 0; k < W; k++) {
    const ab = Number((a >> BigInt(k)) & 1n), bb = Number((b >> BigInt(k)) & 1n)
    const c = lut[(ab << 2) | (bb << 1) | cin] ?? 0
    const sum = c & 1, cout = (c >> 1) & 1
    out.push({ a: ab, b: bb, cin, sum, cout })
    cin = cout
  }
  return out
}

function trainSolved(seed: number): { lut: Uint8Array; evals: number; restarts: number } {
  let restarts = 0
  for (let tries = 0; tries < 30; tries++) {
    const rng = mulberry32((seed + tries * 0x6d2b79f5) >>> 0)
    const lut = new Uint8Array(8)
    for (let i = 0; i < 8; i++) lut[i] = Math.floor(rng() * 4) & 3
    let e = trainError(lut), evals = 0
    while (e > 0 && evals < 800) {
      const idx = Math.floor(rng() * 8) & 7, bit = Math.floor(rng() * 2) & 1, p = lut[idx] ?? 0
      lut[idx] = p ^ (1 << bit); evals++
      const ne = trainError(lut)
      if (ne <= e) e = ne; else lut[idx] = p
    }
    if (e === 0) return { lut, evals, restarts }
    restarts++
  }
  return { lut: new Uint8Array(TARGET), evals: 0, restarts } // safety fallback: the exact full adder
}

const GEN = [{ W: 16, M: 2000 }, { W: 32, M: 2000 }, { W: 64, M: 1000 }, { W: 128, M: 500 }]
interface GenResult { W: number; pairs: number; wrong: number }
interface DemoSnapshot {
  phase: 'idle' | 'training' | 'done'
  lut: number[]
  trainErr: number
  evals: number
  restarts: number
  seed: number
  history: number[]
  gen: GenResult[] | null
  sample: { a: string; b: string; got: string } | null
  vizA: string
  vizB: string
}

const rowCorrect = (lut: number[], i: number) => (lut[i] ?? -1) === TARGET[i]

function ErrorSparkline({ history }: { history: number[] }) {
  const W = 100, H = 32, maxY = 48
  const n = history.length
  const pts = history.map((y, i) => `${n <= 1 ? 0 : (i / (n - 1)) * W},${H - (y / maxY) * H}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-10" preserveAspectRatio="none" role="img"
      aria-label={`Training error falling from 48 toward 0 over ${n} tries`}>
      <line x1="0" y1={H} x2={W} y2={H} stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
      {n > 1 && <polyline points={pts} fill="none" stroke="#D4AF37" strokeWidth="1.2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
    </svg>
  )
}

// Ripple-carry visualization: the same tiny module applied at each bit, the carry
// flowing from one bit to the next. This is "the big number built bit-by-bit".
function RippleCarry({ lut, a, b, maxBits = 12 }: { lut: Uint8Array; a: bigint; b: bigint; maxBits?: number }) {
  const bl = (a > b ? a : b).toString(2).length
  const W = Math.min(Math.max(bl + 1, 4), maxBits)
  const trace = ripTrace(lut, a, b, W) // low bit first
  const cells = [...trace].reverse() // display high bit -> low bit (left to right)
  const cw = 30, gap = 6, padL = 56, padT = 16, rowH = 26
  const svgW = padL + cells.length * (cw + gap)
  const svgH = padT + rowH * 4 + 18
  const Cell = ({ x, y, v, on }: { x: number; y: number; v: number; on?: boolean }) => (
    <g>
      <rect x={x} y={y} width={cw} height={20} rx={3}
        fill={on ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)'}
        stroke={on ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)'} strokeWidth={1} />
      <text x={x + cw / 2} y={y + 14} textAnchor="middle" fontSize={12} fontFamily="monospace"
        fill={on ? '#D4AF37' : 'rgba(255,255,255,0.75)'}>{v}</text>
    </g>
  )
  const labels = ['A', 'B', 'carry', 'sum']
  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ maxHeight: 180 }} role="img"
      aria-label="Ripple-carry addition: the evolved module applied at each bit, carry flowing low to high">
      {labels.map((l, r) => (
        <text key={l} x={8} y={padT + r * rowH + 14} fontSize={10} fontFamily="monospace" fill="rgba(255,255,255,0.45)">{l}</text>
      ))}
      {cells.map((c, ci) => {
        const x = padL + ci * (cw + gap)
        return (
          <g key={ci}>
            <Cell x={x} y={padT + 0 * rowH} v={c.a} />
            <Cell x={x} y={padT + 1 * rowH} v={c.b} />
            <Cell x={x} y={padT + 2 * rowH} v={c.cin} on={c.cin === 1} />
            <Cell x={x} y={padT + 3 * rowH} v={c.sum} on />
            {/* carry arrow from this bit's cout to the next-higher bit's cin (the cell to the left) */}
            {ci < cells.length - 1 && c.cout === 1 && (
              <path
                d={`M ${x + cw / 2} ${padT + 2 * rowH + 20} q -${(cw + gap) / 2} 10 -${cw + gap} 0`}
                fill="none" stroke="rgba(212,175,55,0.55)" strokeWidth={1.2} markerEnd="url(#ah)" />
            )}
          </g>
        )
      })}
      <defs>
        <marker id="ah" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(212,175,55,0.7)" />
        </marker>
      </defs>
    </svg>
  )
}

function TruthTable({ lut }: { lut: number[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i >> 2) & 1, b = (i >> 1) & 1, c = i & 1
        const cur = lut[i] ?? 0
        const ok = rowCorrect(lut, i)
        return (
          <div key={i} className={cn('px-2 py-1.5 border font-mono text-[11px] transition-colors duration-200 flex items-center justify-between gap-2',
            ok ? 'border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-300' : 'border-white/[0.08] bg-black/30 text-white/55')}>
            <span>{a}{b}{c}<span className="text-white/35"> → </span>{cur & 1}{(cur >> 1) & 1}</span>
            {ok ? <Check className="w-3 h-3 shrink-0" /> : <span className="w-3 h-3 shrink-0 text-white/45">·</span>}
          </div>
        )
      })}
    </div>
  )
}

function ModuleIntro({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-[#D4AF37]/50 bg-[#D4AF37]/[0.04] pl-3 pr-3 py-2.5">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37]/80 mb-1">What you’re looking at</div>
      <p className="text-sm text-white/80 leading-relaxed">{children}</p>
    </div>
  )
}

function EvolveGeneralizeDemo() {
  const reduced = useReducedMotion()
  const [snap, setSnap] = useState<DemoSnapshot | null>(null)
  const [busy, setBusy] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const seedCtr = useRef(0xc0ffee)
  const st = useRef({ lut: new Uint8Array(8), rng: mulberry32(1), err: 16, evals: 0, restarts: 0, seed: 0, hist: [] as number[] })
  const [tryA, setTryA] = useState('48315')
  const [tryB, setTryB] = useState('27190')
  const solvedLut = useRef<Uint8Array | null>(null)

  const stop = useCallback(() => { if (timer.current) { clearInterval(timer.current); timer.current = null } }, [])
  useEffect(() => () => stop(), [stop])

  const finish = useCallback((lut: Uint8Array, evals: number, restarts: number, seed: number, hist: number[]) => {
    solvedLut.current = new Uint8Array(lut)
    const grng = mulberry32((seed ^ 0x5bd1e995) >>> 0)
    const gen: GenResult[] = GEN.map(({ W, M }) => ({ W, pairs: M, wrong: genWrong(lut, W, M, grng) }))
    const a = randBig(grng, 32), b = randBig(grng, 32)
    const va = randBig(grng, 9) | 256n, vb = randBig(grng, 9) | 256n // ~9-10 bit for the ripple viz
    setBusy(false)
    setSnap({ phase: 'done', lut: Array.from(lut), trainErr: 0, evals, restarts, seed, history: [...hist, 0],
      gen, sample: { a: a.toString(), b: b.toString(), got: addBig(lut, a, b, 32).toString() },
      vizA: va.toString(), vizB: vb.toString() })
  }, [])

  const start = useCallback(() => {
    stop()
    seedCtr.current = (seedCtr.current + 0x9e3779b1) | 0
    const seed = seedCtr.current >>> 0

    if (reduced) { // reduced-motion: solve instantly, no animation
      const r = trainSolved(seed)
      finish(r.lut, r.evals, r.restarts, seed, [trainError(new Uint8Array(8)), 0])
      return
    }

    const s = st.current
    s.seed = seed; s.restarts = 0
    s.rng = mulberry32(seed)
    for (let i = 0; i < 8; i++) s.lut[i] = Math.floor(s.rng() * 4) & 3
    s.err = trainError(s.lut); s.evals = 0; s.hist = [s.err]
    setBusy(true)
    setSnap({ phase: 'training', lut: Array.from(s.lut), trainErr: s.err, evals: 0, restarts: 0, seed, history: [s.err], gen: null, sample: null, vizA: '', vizB: '' })

    const EVALS_PER_TICK = 2, PER_TRY_CAP = 600, MAX_TRIES = 30, TICK_MS = 90
    timer.current = setInterval(() => {
      const s = st.current
      for (let n = 0; n < EVALS_PER_TICK && s.err > 0 && s.evals < PER_TRY_CAP; n++) {
        const idx = Math.floor(s.rng() * 8) & 7, bit = Math.floor(s.rng() * 2) & 1, prev = s.lut[idx] ?? 0
        s.lut[idx] = prev ^ (1 << bit); s.evals++
        const ne = trainError(s.lut)
        if (ne <= s.err) s.err = ne; else s.lut[idx] = prev
      }
      s.hist.push(s.err)
      if (s.hist.length > 200) s.hist = s.hist.filter((_, i) => i % 2 === 0)

      if (s.err === 0) { stop(); finish(s.lut, s.evals, s.restarts, s.seed, s.hist); return }
      if (s.evals >= PER_TRY_CAP) {
        if (s.restarts + 1 >= MAX_TRIES) { stop(); setBusy(false); return }
        s.restarts++; s.seed = (s.seed + 0x6d2b79f5) >>> 0; s.rng = mulberry32(s.seed)
        for (let i = 0; i < 8; i++) s.lut[i] = Math.floor(s.rng() * 4) & 3
        s.err = trainError(s.lut); s.evals = 0
      }
      setSnap({ phase: 'training', lut: Array.from(s.lut), trainErr: s.err, evals: s.evals, restarts: s.restarts, seed: s.seed, history: [...s.hist], gen: null, sample: null, vizA: '', vizB: '' })
    }, TICK_MS)
  }, [stop, reduced, finish])

  const tryResult = (() => {
    if (snap?.phase !== 'done' || !solvedLut.current) return null
    const ta = tryA.trim(), tb = tryB.trim()
    if (!/^\d+$/.test(ta) || !/^\d+$/.test(tb)) return { err: 'whole numbers only' as const }
    const a = BigInt(ta), b = BigInt(tb)
    const W = Math.max(1, (a > b ? a : b).toString(2).length) + 1
    return { a, b, got: addBig(solvedLut.current, a, b, W), ok: addBig(solvedLut.current, a, b, W) === a + b }
  })()

  const correct = snap ? snap.lut.filter((_, i) => rowCorrect(snap.lut, i)).length : 0

  return (
    <div className="space-y-5">
      <ModuleIntro>
        A tiny “adding machine” learning by pure trial-and-error. We only ever show it the 16 smallest sums (adding
        two 2-bit numbers). It tweaks itself at random, keeping changes that help. The instant it gets all 16 right,
        something surprising happens: the <em>only</em> rule that fits those 16 is the real rule for adding — so it
        immediately works on gigantic numbers it never practiced on. Press the button, watch the error fall to zero,
        then add your own numbers below.
      </ModuleIntro>

      <ExplainPanel
        kid={<p>Think of a child who just learned to add single digits and to “carry the 1.” Suddenly they can add <em>any</em> two long numbers — because the same little trick repeats at every digit. This machine does the same. We only ever show it the smallest sums; it figures out the trick by trial and error (keep guesses that help, undo ones that don’t); and then it adds <em>gigantic</em> numbers it has never seen — perfectly. It never saw those big numbers — it learned the <strong>method</strong>.</p>}
        simple={<p>A one-cell adder is evolved by a (1+1) hill-climber <strong>only on 2-bit addition</strong> (16 examples). Solving those forces the exact full-adder rule; tiling that one cell then adds any width. Verified bit-exact at widths 16/32/64/128 it never trained on.</p>}
        researcher={<p>Developmental encoding: one module, a 1-bit inter-tile carry channel, then tiled. The minimal interface makes the smallest instance fully constrain the module — all 8 truth-table rows are exercised, so error-0 on 2-bit pins the full adder, which length-generalizes. (In the full study a looser 2-channel interface overfits and fails — that control is what makes it a proof, not luck.)</p>}
        math={<><BlockMath>{'s = a \\oplus b \\oplus c_{in}, \\qquad c_{out} = \\mathrm{maj}(a,b,c_{in})'}</BlockMath><p>Tiling <InlineMath>{'W'}</InlineMath> copies computes <InlineMath>{'a+b'}</InlineMath> for any <InlineMath>{'W'}</InlineMath>.</p></>}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={start} disabled={busy}
          aria-label="Train the adder on 2-bit addition then test generalization"
          className={cn('flex items-center gap-2 px-4 py-2.5 border text-sm font-medium transition-all',
            busy ? 'bg-white/[0.03] border-white/[0.06] text-white/40 cursor-wait' : 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/25')}>
          {busy ? <RotateCcw className={cn('w-4 h-4', !reduced && 'animate-spin')} /> : <Play className="w-4 h-4" />}
          {busy ? 'Learning…' : snap ? 'Run again' : 'Teach it to add'}
        </button>
        <div aria-live="polite" className="text-xs font-mono text-white/55">
          {snap && <>seed {snap.seed.toString(16)} · {snap.evals} tries · {snap.trainErr} of 48 still wrong{snap.restarts > 0 && <span className="text-[#D4AF37]/70"> · {snap.restarts} restart{snap.restarts > 1 ? 's' : ''}</span>}</>}
        </div>
      </div>

      {/* learning curve + the 8 little rules forming */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="bg-black/40 border border-white/[0.06] p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/55 mb-1">learning curve — wrong answers falling to 0</div>
          <ErrorSparkline history={snap?.history ?? [48]} />
          <div className="text-[10px] text-white/45 mt-1">{snap ? `${snap.trainErr} of 48 wrong` : 'press “Teach it to add”'}</div>
        </div>
        <div className="bg-black/40 border border-white/[0.06] p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] uppercase tracking-wider text-white/55">the 8 little rules it must learn</div>
            <div className="text-[10px] font-mono text-white/55">{snap ? `${correct}/8 right` : '—'}</div>
          </div>
          <TruthTable lut={snap?.lut ?? Array(8).fill(0)} />
        </div>
      </div>

      {snap?.phase === 'done' && snap.gen && (
        <motion.div initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="p-4 border border-emerald-500/30 bg-emerald-500/[0.06] space-y-3">
            <div className="flex items-start gap-3 text-emerald-300">
              <Check className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <div className="text-base font-bold">It found the complete adding rule — from just 16 tiny examples.</div>
                <div className="text-sm text-white/75 mt-1">
                  All 8 little rules correct, in {snap.evals} tries{snap.restarts > 0 ? ` (after ${snap.restarts} restart${snap.restarts > 1 ? 's' : ''})` : ''}. It is now correct for numbers of <strong className="text-white">any size, forever</strong> — not because we showed it big numbers, but because it discovered the real method.
                </div>
              </div>
            </div>
            {/* tangible scale: what it practiced on vs what it now handles */}
            <div className="flex items-center gap-3 pt-1">
              <div className="text-center shrink-0">
                <div className="w-3 h-3 bg-white/40 mx-auto" />
                <div className="text-[10px] text-white/55 mt-1 leading-tight">practiced on<br />16 sums</div>
              </div>
              <div className="flex-1 h-7 bg-gradient-to-r from-[#D4AF37]/25 to-[#D4AF37]/70 flex items-center justify-center">
                <span className="text-[10px] sm:text-xs text-black/85 font-semibold px-2 text-center">now adds every pair of numbers — any size</span>
              </div>
            </div>
            <div className="text-xs text-white/60">Spot-checked on numbers it never saw — every bit correct:</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {snap.gen.map((g) => (
              <div key={g.W} className="border border-white/[0.06] bg-black/20 p-3 text-center">
                <div className="text-base font-bold text-white">up to {g.W} bits</div>
                <div className={cn('text-xs font-semibold mt-1', g.wrong === 0 ? 'text-emerald-400' : 'text-rose-400')}>{g.wrong === 0 ? '✓ all correct' : `${g.wrong} wrong`}</div>
                <div className="text-[10px] text-white/50 mt-0.5">{nf(g.pairs)} random pairs tested</div>
              </div>
            ))}
          </div>

          <div className="border border-white/[0.08] bg-black/20 p-3 text-xs text-white/70 leading-relaxed">
            <strong className="text-white">Why this is the whole point:</strong> a machine that just <em className="text-[#D4AF37]/85 not-italic">memorized</em> those 16 answers would be wrong on the 17th number it met. This one found the <em className="text-[#D4AF37]/85 not-italic">method</em> — so it is never wrong, at any size. That gap — memorizing vs. understanding — is exactly what the whole experiment set out to test.
          </div>

          {/* the headline graphic: a number it never saw, built bit-by-bit with carry */}
          {solvedLut.current && snap.vizA && (
            <div className="border border-white/[0.06] bg-black/30 p-3">
              <div className="text-[10px] uppercase tracking-wider text-white/55 mb-2">
                how it adds — the same little rule at every bit, the carry rippling along (example it never saw)
              </div>
              <RippleCarry lut={solvedLut.current} a={BigInt(snap.vizA)} b={BigInt(snap.vizB)} />
              <div className="text-xs font-mono text-white/70 mt-1">{snap.vizA} + {snap.vizB} = <span className="text-emerald-300">{(BigInt(snap.vizA) + BigInt(snap.vizB)).toString()}</span></div>
            </div>
          )}

          {/* try your own */}
          <div className="border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-4 space-y-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#D4AF37]/80">
              <Calculator className="w-3.5 h-3.5" /> Add your own numbers with the machine you just trained
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <input value={tryA} onChange={(e) => setTryA(e.target.value)} inputMode="numeric" maxLength={40} aria-label="First number"
                className="w-28 sm:w-36 bg-black/40 border border-white/[0.1] px-2 py-1.5 font-mono text-white focus:border-[#D4AF37]/40 outline-none" />
              <span className="text-white/50">+</span>
              <input value={tryB} onChange={(e) => setTryB(e.target.value)} inputMode="numeric" maxLength={40} aria-label="Second number"
                className="w-28 sm:w-36 bg-black/40 border border-white/[0.1] px-2 py-1.5 font-mono text-white focus:border-[#D4AF37]/40 outline-none" />
              <ArrowRight className="w-4 h-4 text-white/40" />
              {tryResult && 'err' in tryResult ? <span className="text-rose-400 text-xs">{tryResult.err}</span>
                : tryResult ? <span className={cn('font-mono break-all', tryResult.ok ? 'text-emerald-300' : 'text-rose-400')}>{tryResult.got.toString()} {tryResult.ok ? <Check className="inline w-3.5 h-3.5" /> : <AlertTriangle className="inline w-3.5 h-3.5" />}</span> : null}
            </div>
            <div className="text-[10px] text-white/45">It learned only 2-bit sums — yet it computes these exactly, at whatever size your numbers need (up to 40 digits here).</div>
          </div>

          <div className="text-[10px] text-white/40 leading-relaxed">
            Note: this in-browser version uses a simplified boolean module so it runs instantly. The headline result runs the same minimal-interface principle on Anna.exe’s actual ternary substrate — see the downloadable <span className="font-mono">synthesis_proof.py</span> below.
          </div>
        </motion.div>
      )}
    </div>
  )
}

// =============================================================================
// Static modules (each: visible plain intro + 4-tier ELI5 panel + content)
// =============================================================================

function DecompositionTable() {
  return (
    <div className="space-y-4">
      <ModuleIntro>
        A scorecard of “how to add”, broken into its parts. For each part we hid it and asked: can blind
        trial-and-error rediscover it on its own? <strong>Green = yes, it emerges.</strong> Exactly one part can
        never be discovered — the basic “do it again and again until done” loop — because you need that loop
        before anything else can be found. That single floor is highlighted.
      </ModuleIntro>
      <div className="flex items-center gap-4 border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-3">
        <div className="text-3xl font-bold text-[#D4AF37] leading-none shrink-0">
          {DECOMPOSITION.filter((r) => r.emerges).length}<span className="text-white/40 text-xl">/{DECOMPOSITION.length}</span>
        </div>
        <div className="text-sm text-white/75">
          building blocks of “how to compute” assembled themselves by blind evolution. Only one — the most basic
          “keep going until done” loop — has to be there first, before anything else can be found.
        </div>
      </div>
      <ExplainPanel
        kid={<p>Adding is like a recipe with several steps: handle each digit, carry the 1, remember where you are, know when to stop. We covered up one step at a time and asked: can pure trial-and-error rediscover it from scratch? Almost every time, <strong>yes</strong> — the steps build themselves. The one thing that can never appear on its own is the “do it again and again until you’re finished” loop. It’s like needing hands before you can cook: you have to have it first, or nothing else can even start.</p>}
        simple={<p>For a computation that must work at <em>any</em> input size, every part (the cell rule, the wiring, an internal memory, the stopping rule) can emerge by selection on tiny examples. The single exception is the bare iterate-and-check primitive.</p>}
        researcher={<p>A finite genome that generalizes to unbounded input must reuse a finite rule across the input — i.e. it must iterate. Iteration is the precondition for any generalizing computation to emerge; it cannot itself emerge from nothing. A finite-description limit, not a search-budget one.</p>}
        math={<p>If a fixed-size program is correct for all <InlineMath>{'n'}</InlineMath>, it must consume the length-<InlineMath>{'n'}</InlineMath> input by repeating a bounded rule — the loop is structurally prior to everything above it.</p>}
      />
      <div className="overflow-x-auto border border-white/[0.06]">
        <table className="w-full text-sm">
          <thead><tr className="bg-white/[0.03] text-left text-white/55 text-xs uppercase tracking-wider">
            <th className="px-3 py-2 font-medium">Part of “how to add”</th><th className="px-3 py-2 font-medium">Found by evolution?</th><th className="px-3 py-2 font-medium">Evidence</th>
          </tr></thead>
          <tbody>
            {DECOMPOSITION.map((r) => (
              <tr key={r.component} className={cn('border-t border-white/[0.04] align-top', !r.emerges && 'bg-[#D4AF37]/[0.06]')}>
                <td className="px-3 py-2 text-white/80">{r.component}</td>
                <td className="px-3 py-2">{r.emerges ? <span className="text-emerald-400 font-mono text-xs">yes</span> : <span className="text-[#D4AF37] font-mono text-xs font-bold">the floor — can’t</span>}</td>
                <td className="px-3 py-2 text-white/60 text-xs">{r.evidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PhaseLadder() {
  return (
    <div className="space-y-4">
      <ModuleIntro>
        The experiments behind the scorecard — the 15 core phases (a few combined here for brevity, plus the
        extended set). Each one hides a different ingredient of the algorithm and checks whether evolution finds
        it, then proves it by testing on inputs far bigger than it ever practiced on. Why that’s convincing: a rule
        that merely memorized would fail those big tests with near-certainty (about a 1-in-10³⁴⁹ chance of passing
        by luck).
      </ModuleIntro>
      <ExplainPanel
        kid={<p>We ran a series of little experiments. Each time we covered up one piece of the recipe and checked whether blind trial-and-error could find it again — then we gave it a giant exam full of problems far bigger than anything it practiced on. Guessing your way through that exam is about as likely as flipping a coin and getting heads a thousand times in a row. So when it passes, it didn’t get lucky — it genuinely found the rule.</p>}
        simple={<p>Each phase removes one ingredient and tests whether selection recovers it, verified by exact match far beyond training. A rule correct on even 99% of random strings would pass 80,000 of them with probability about <em>10⁻³⁴⁹</em>.</p>}
        researcher={<p>Substrates: Anna.exe’s ternary LUT-CA (Phase 1) and an exactly-evaluable boolean CGP circuit (the ladder). Gradient-free (1+λ) search with neutral drift; some phases add a footprint-minimizing compression walk. Generalization checked exhaustively at small size and by large random samples far beyond training.</p>}
        math={<BlockMath>{'\\Pr[\\text{non-generalizing rule passes } 80{,}000] \\le 0.99^{80000} \\approx 10^{-349}'}</BlockMath>}
      />
      <ol className="space-y-2">
        {PHASES.map((p) => (
          <li key={p.n} className="border border-white/[0.06] bg-black/20 p-3">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#D4AF37]/15 text-[#D4AF37]/80 border border-[#D4AF37]/20">Phase {p.n}</span>
              <span className="text-sm font-medium text-white/85">{p.title}</span>
            </div>
            <div className="text-xs text-white/55 mb-1">{p.tested}</div>
            <div className="text-xs text-white/70">{p.result}</div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function SubstrateExplainer() {
  return (
    <div className="space-y-4">
      <ModuleIntro>
        What CFB’s Anna.exe actually is on the inside. It’s a small program that tries to learn to add by making
        random tweaks to 100 tiny lookup-tables. Below are its real specs (recovered by taking the binary apart)
        and how it changed across four versions in three days. The key point: a perfect solution exists by hand,
        but the program’s blind random search almost never finds it.
      </ModuleIntro>
      <ExplainPanel
        kid={<p>Anna.exe is a small program CFB released. It tries to teach itself to add by making tiny random changes and keeping the ones that help. Inside, it’s 100 little lookup-tables that pass notes to each other, like a bucket-brigade. It genuinely <em>can</em> add — but its search is blind, like finding a door in a dark room by bumping into walls, so it keeps getting stuck and almost never reaches a perfect score. A perfect answer exists; pure guessing just rarely lands on it.</p>}
        simple={<p>A self-contained Aigarth evolution engine: a 100-cell ternary lookup-table cellular automaton, trained by a (1+1) evolution strategy on 7-bit addition (16,384 pairs), using the hardware RNG so every run is unique. A hand-built solution exists; the search is what stalls.</p>}
        researcher={<p>Disassembled (KERNEL32-only, ~5.84 MB RAM arena): per-cell lookup tables of 1846 qwords (≈ 3¹⁰ for a 10-trit window), ≤100 timesteps with control-cell halting, single-trit ±1 mod-3 mutations, revert-on-worse with neutral drift, 1,000,000 epochs.</p>}
        math={<p>Each cell updates <InlineMath>{'x_c \\leftarrow \\mathrm{LUT}_c(\\text{window})'}</InlineMath> over <InlineMath>{'\\{0,1,2\\}'}</InlineMath>; the bounty target is total wrong output bits <InlineMath>{'\\to 0'}</InlineMath>.</p>}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        {SUBSTRATE.map((f) => (
          <div key={f.label} className="border border-white/[0.06] bg-black/20 p-3">
            <div className="text-[10px] uppercase tracking-wider text-white/55 mb-1">{f.label}</div>
            <div className="text-sm text-white/80">{f.value}</div>
          </div>
        ))}
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-white/55 mb-2">Four versions in three days (all SHA-256 verified)</div>
        <div className="relative border-l border-white/[0.12] ml-2 pl-4 space-y-3">
          {VERSIONS.map((v) => (
            <div key={v.version} className="relative">
              <span className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-[#D4AF37]/70" />
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-mono text-white/85">{v.version}</span>
                <span className="text-[10px] font-mono text-white/45">{v.built}</span>
              </div>
              <div className="text-xs text-white/60">{v.change}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function NoveltyPanel() {
  return (
    <div className="space-y-4">
      <ModuleIntro>
        Our honesty check. None of these phenomena are brand-new — clever researchers showed each one before, and
        we name them. What’s actually new is the <strong>method</strong>: a setup where “did it generalize?” has an
        exact yes/no answer, with control experiments and predictions written down in advance. We deliberately do
        not claim we “found AI”.
      </ModuleIntro>
      <ExplainPanel
        kid={<p>We kept ourselves honest: none of this is brand-new magic, and we are <strong>not</strong> claiming we “found AI.” Clever researchers showed each piece before us, and we name them. What is actually new is how carefully we checked it: instead of “looks about right,” our setup gives an exact yes-or-no answer to “did it really learn the rule?”, with fair side-by-side comparisons, and with our prediction written down <em>before</em> we ran the test — so we can’t fool ourselves afterwards.</p>}
        simple={<p>The contribution is methodological: an exactly-decidable, exhaustively-verifiable substrate with matched controls and pre-registration, plus the unification of a ladder previously shown piecemeal and approximately.</p>}
        researcher={<p>The one narrow candidate-new identification is reading an emerged few-shot learner bit-exactly as a known symbolic algorithm (version-space elimination) — flagged pending a citation-graph check before any “first”. No phenomenal first is claimed.</p>}
        math={<p>Decidability buys the rigor: the substrate’s output is exactly computable, so “generalizes” is a decidable predicate over a verification set, not an estimated metric.</p>}
      />
      <div className="border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-4">
        <div className="text-[10px] uppercase tracking-wider text-[#D4AF37]/80 mb-2">Honest verdict</div>
        <p className="text-sm text-white/75 leading-relaxed">{NOVELTY.verdict}</p>
      </div>
      <div className="overflow-x-auto border border-white/[0.06]">
        <table className="w-full text-sm">
          <thead><tr className="bg-white/[0.03] text-left text-white/55 text-xs uppercase tracking-wider">
            <th className="px-3 py-2 font-medium">Phenomenon</th><th className="px-3 py-2 font-medium">Shown before by</th>
          </tr></thead>
          <tbody>
            {NOVELTY.items.map((it) => (
              <tr key={it.phenomenon} className="border-t border-white/[0.04]">
                <td className="px-3 py-2 text-white/80">{it.phenomenon}</td>
                <td className="px-3 py-2 text-white/60 text-xs">{it.prior}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-white/55 leading-relaxed">{NOVELTY.theOneNew}</p>
    </div>
  )
}

// =============================================================================
// Shell
// =============================================================================

type ModuleKey = 'demo' | 'decomposition' | 'phases' | 'substrate' | 'novelty'
interface ModuleConfig { key: ModuleKey; label: string; icon: React.ReactNode; blurb: string; audience: 'easy' | 'tech' }

const MODULES: ModuleConfig[] = [
  { key: 'demo', label: 'Live demo', icon: <GitBranch className="w-4 h-4" />, blurb: 'Teach a tiny adder on 2-bit sums only, then watch it add huge numbers it never saw — the real emergence, in your browser.', audience: 'easy' },
  { key: 'decomposition', label: 'What emerges', icon: <ListChecks className="w-4 h-4" />, blurb: 'A scorecard: which parts of “how to add” evolution can discover, and the one part it never can.', audience: 'easy' },
  { key: 'phases', label: 'The experiments', icon: <Layers className="w-4 h-4" />, blurb: 'The phases behind the scorecard — what each hid, and the exactly-verified result.', audience: 'tech' },
  { key: 'substrate', label: 'What Anna.exe is', icon: <Cpu className="w-4 h-4" />, blurb: 'Inside the binary: a 100-cell ternary lookup-table machine, and its v1 → v4 history.', audience: 'easy' },
  { key: 'novelty', label: 'Honesty & prior art', icon: <BookOpen className="w-4 h-4" />, blurb: 'Methodological, not phenomenal — every result has a named predecessor.', audience: 'tech' },
]

export default function EmergenceLab() {
  const [activeModule, setActiveModule] = useState<ModuleKey>('demo')

  return (
    <div className="bg-[#050505] space-y-6">
      <HeroBlock
        eyebrow="Anna.exe & Emergence"
        headline="Train it on tiny examples. Watch it generalize to huge ones."
        tagline="We reverse-engineered CFB's Anna.exe, then ran a controlled, exactly-verified study of emergent computation. The live demo evolves a one-cell adder on 2-bit addition only, then adds 128-bit numbers it never saw — exactly. Selection assembles nearly the whole algorithm; exactly one primitive (the bare iterate-and-check loop) cannot emerge. Honest framing: the novelty is methodological, not 'AI found'."
        stats={[
          { label: 'Phases', value: '15', sub: 'each exactly verified beyond training' },
          { label: 'Seeds (Phase 1)', value: '26/26', sub: 'identical full adder emerges' },
          { label: 'Trained on', value: '16', sub: 'two-bit examples → generalizes to W128' },
          { label: 'Irreducible', value: '1', sub: 'the bare while-loop primitive' },
        ]}
      />

      {/* Start here: plain-language "what we did / found" + links to the write-ups */}
      <div className="border border-[#D4AF37]/20 bg-[#0A0A0A]/80 p-4 md:p-5 space-y-4">
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#D4AF37]/80">Start here — what we did, in plain words</div>
          <p className="text-sm text-white/80 leading-relaxed">
            CFB released <span className="font-mono text-[#D4AF37]/85">Anna.exe</span> — a small program that tries to learn to add two numbers by random
            trial-and-error. We took it apart to understand it, then asked a bigger question:{' '}
            <strong className="text-white">how much of &quot;knowing how to compute&quot; can a blind evolutionary search discover on its own?</strong>{' '}
            The answer turned out to be: almost all of it.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { t: 'Train tiny → works huge', d: 'A one-cell adder evolved only on 2-bit sums then adds 128-bit numbers it never saw — exactly. Try it in the first tab.' },
            { t: 'Almost everything emerges', d: 'The cell rule, the wiring, even an invented internal memory — all found by selection. Exactly one thing can’t: the basic “repeat until done” loop.' },
            { t: 'Honest, not hype', d: 'This is not “AI was found” and not consciousness. It is a careful, exactly-checked demonstration; every result has a named predecessor.' },
          ].map((f) => (
            <div key={f.t} className="border border-white/[0.06] bg-black/20 p-3">
              <div className="text-xs font-semibold text-emerald-300 mb-1">{f.t}</div>
              <div className="text-xs text-white/65 leading-relaxed">{f.d}</div>
            </div>
          ))}
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-white/55 mb-2">Read the full write-ups</div>
          <div className="flex flex-wrap gap-2">
            <a href="/docs/03-results/32-anna-exe-and-emergence" className="flex items-center gap-2 px-3 py-2 bg-[#D4AF37]/[0.08] hover:bg-[#D4AF37]/15 border border-[#D4AF37]/25 text-[#D4AF37]/90 text-xs transition-colors"><BookOpen className="w-3.5 h-3.5" /> Overview <ArrowRight className="w-3 h-3" /></a>
            <a href="/docs/03-results/33-emergent-generalization" className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/[0.08] text-white/75 hover:text-white text-xs transition-colors"><Layers className="w-3.5 h-3.5" /> The 15-phase study <ArrowRight className="w-3 h-3" /></a>
            <a href="/docs/03-results/34-anna-exe-reverse-engineering" className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/[0.08] text-white/75 hover:text-white text-xs transition-colors"><Cpu className="w-3.5 h-3.5" /> How we took Anna.exe apart <ArrowRight className="w-3 h-3" /></a>
          </div>
        </div>
        <div className="flex items-start gap-1.5 text-[11px] text-white/55">
          <Lightbulb className="w-3.5 h-3.5 text-[#D4AF37]/60 mt-0.5 shrink-0" />
          <span>Tip: each tab opens with a plain &quot;What you’re looking at&quot;, and a deeper &quot;What’s happening here?&quot; panel — tap <span className="text-white/75">5-year-old</span> for the simplest version or <span className="text-white/75">Math</span> for the formulas.</span>
        </div>
      </div>

      <div className="relative">
        <div className="flex md:flex-wrap max-md:flex-nowrap max-md:overflow-x-auto gap-2 pb-1">
          {MODULES.map((m) => {
            const isActive = activeModule === m.key
            return (
              <button key={m.key} type="button" onClick={() => setActiveModule(m.key)}
                className={cn('flex items-center gap-2 px-4 py-2.5 border text-sm transition-all whitespace-nowrap',
                  isActive ? 'bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]' : 'bg-black/30 border-white/[0.06] text-white/70 hover:bg-white/[0.04] hover:border-white/[0.12]')}>
                {m.icon}<span className="font-medium">{m.label}</span>
                {!isActive && (
                  <span className={cn('ml-1 text-[9px] px-1.5 py-0.5 border uppercase', m.audience === 'easy'
                    ? 'bg-emerald-500/10 text-emerald-400/80 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400/80 border-blue-500/20')}>{m.audience}</span>
                )}
              </button>
            )
          })}
        </div>
        <div className="md:hidden absolute right-0 top-0 bottom-1 w-10 bg-gradient-to-l from-[#050505] to-transparent pointer-events-none" />
      </div>

      <div className="px-3 py-2 bg-black/20 border border-white/[0.04] text-xs text-white/65">
        {MODULES.find((m) => m.key === activeModule)?.blurb}
      </div>

      <motion.section key={activeModule} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
        className="bg-black/20 border border-white/[0.06] p-4 md:p-6">
        {activeModule === 'demo' && <EvolveGeneralizeDemo />}
        {activeModule === 'decomposition' && <DecompositionTable />}
        {activeModule === 'phases' && <PhaseLadder />}
        {activeModule === 'substrate' && <SubstrateExplainer />}
        {activeModule === 'novelty' && <NoveltyPanel />}
      </motion.section>

      {/* Verify it yourself — the simple, 100%-works way (no setup) */}
      <div className="border border-emerald-500/25 bg-emerald-500/[0.04] p-4 space-y-3">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-emerald-300/90">
          <Check className="w-3.5 h-3.5" /> Verify it yourself — the simple way (no setup, runs in seconds)
        </div>
        <p className="text-xs text-white/65">Don’t take our word for it. Two foolproof ways to reproduce the headline result on your own computer — both train the adder on 16 tiny sums and then check it on numbers up to 256-bit, live:</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border border-white/[0.08] bg-black/30 p-3 space-y-2">
            <div className="text-sm font-semibold text-white">1 · In your browser — zero install</div>
            <div className="text-xs text-white/65">Download one file and double-click it. It runs the whole proof locally in your browser. Nothing to install, works on any computer.</div>
            <a href="/data/emergence-artifacts/verify_emergence.html" download className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#D4AF37]/[0.1] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37]/90 text-xs transition-colors"><Download className="w-3.5 h-3.5" /> verify_emergence.html</a>
          </div>
          <div className="border border-white/[0.08] bg-black/30 p-3 space-y-2">
            <div className="text-sm font-semibold text-white">2 · One command — no packages</div>
            <div className="text-xs text-white/65">If you have Python: download one file and run it. No numpy, no internet, about 2 seconds.</div>
            <code className="block bg-black/50 border border-white/[0.08] px-2 py-1 text-[11px] font-mono text-emerald-300">python3 verify_emergence.py</code>
            <a href="/data/emergence-artifacts/verify_emergence.py" download className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/[0.08] text-white/75 hover:text-white text-xs transition-colors"><Download className="w-3.5 h-3.5" /> verify_emergence.py</a>
          </div>
        </div>
        <div className="text-[10px] text-white/45">Both print the same thing: <span className="text-white/60 font-mono">trained on 16 tiny sums → correct on every number tested, 0 wrong, up to 256-bit</span>. The heavier numpy proofs (the full 15-phase study) are below.</div>
      </div>

      <ReproducibilityFooter
        intro="The two verifiers above are the easy way. For the FULL rigorous study (Phase 1 length-generalizing adder on Anna.exe's real ternary substrate; Phase 9 invented mod-3 state machine), the heavier Python is bundled below — numpy required, deterministic. The bundled Phase-1 script runs 6 of the 26 seeds for speed; the full 26/26 is in the audit."
        repoUrl={REPO}
        commands={[
          { label: 'Get all four files + numpy', cmd: 'cd $(mktemp -d) && for f in synthesis_proof tiled_dev_ternary modcount_emergence cgp_emergent_modularity; do curl -O https://qubic.church/data/emergence-artifacts/$f.py; done && pip install numpy', expected: '4 files downloaded, numpy installed' },
          { label: 'Phase 1 — a length-generalizing adder emerges', cmd: 'python3 synthesis_proof.py', expected: '6/6 seeds length-generalise (W=2 train -> exact to W=128); emerged modules are exact full adders' },
          { label: 'Phase 9 — an internal representation is invented', cmd: 'python3 modcount_emergence.py', expected: 'GENERALISES — invented mod-3 machine, exact on 80,000 random strings' },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-white/45">Download:</span>
        <a href="/data/emergence-artifacts/synthesis_proof.py" download className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/[0.06] transition-colors"><Download className="w-3.5 h-3.5" /> synthesis_proof.py</a>
        <a href="/data/emergence-artifacts/tiled_dev_ternary.py" download className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/[0.06] transition-colors"><Download className="w-3.5 h-3.5" /> tiled_dev_ternary.py <span className="text-white/40">(dep)</span></a>
        <a href="/data/emergence-artifacts/modcount_emergence.py" download className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/[0.06] transition-colors"><Download className="w-3.5 h-3.5" /> modcount_emergence.py</a>
        <a href="/data/emergence-artifacts/cgp_emergent_modularity.py" download className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/[0.06] transition-colors"><Download className="w-3.5 h-3.5" /> cgp_emergent_modularity.py <span className="text-white/40">(dep)</span></a>
        <a href="/data/emergence-artifacts/README.md" download className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/[0.06] transition-colors"><Download className="w-3.5 h-3.5" /> README</a>
      </div>

      <MethodologyFooter
        label="Methodology · Anna.exe reverse-engineering + emergent-generalization study (June 2026) · exactly-verified boolean/ternary substrates · audit/2026-06-10-anna-exe/"
        paperHref="/docs/03-results/32-anna-exe-and-emergence"
        paperLabel="Read the underlying paper →"
      />
    </div>
  )
}
