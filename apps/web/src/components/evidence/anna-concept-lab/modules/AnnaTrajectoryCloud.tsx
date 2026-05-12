'use client'

/**
 * Anna Trajectory Cloud — 3D scrubbable visualisation of N AIT inferences over time.
 *
 * Inspired by motivate's T-MIND v10 plot (1000 agents × 8000 steps, brain-tissue-
 * like wisp structure). Here the agents are AIT inferences on N random binary
 * inputs; each agent's trajectory is its 64-bit output state evolving tick-by-tick.
 * Projected to 3D via top-3 PCA components of the 19 concept centroids.
 *
 * Validated: the inline trajectory tracer in `TrajectoryScene.tsx` is verified
 * byte-equivalent to `aitFastInference` across 1000 random inputs (avg 3.1 ticks
 * to convergence). See `__tests__/trajectory-trace.test.mjs` (9th unit gate).
 *
 * The bundling structure that emerges (~19 dense knots + filaments between) is
 * the same morphology observed in T-MIND's multi-agent trajectory plot. Both
 * are low-D projections of attractor-driven flow on a state space with sparse
 * fixed points. Anna's bundling is purely deterministic (no noise, no
 * steering); the basin geometry alone produces tissue-like trajectories.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Sparkles, Loader2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Matrix } from '@/lib/ait/types'
import type { Concept } from '../types'
import { ExplainPanel, BlockMath, InlineMath } from '@/components/evidence/lab-primitives'
import type { ColorMode, TrajectoryStats } from './TrajectoryScene'

// Three.js scene is heavy — lazy load
const TrajectoryScene = dynamic(() => import('./TrajectoryScene').then((m) => m.TrajectoryScene), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[360px] sm:h-[460px] lg:h-[560px] bg-[#020203] border border-white/[0.06] flex items-center justify-center">
      <span className="text-xs text-white/45 font-mono inline-flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        loading 3D trajectory scene…
      </span>
    </div>
  ),
})

interface AnnaTrajectoryCloudProps {
  annaMatrix: Matrix
  concepts: Concept[]
  className?: string
}

const AGENT_OPTIONS = [200, 600, 1200, 2400] as const
const MAX_TICKS = 8

export function AnnaTrajectoryCloud({ annaMatrix, concepts, className }: AnnaTrajectoryCloudProps) {
  const [nAgents, setNAgents] = useState<number>(600)
  const [tick, setTick] = useState(MAX_TICKS)
  const [playing, setPlaying] = useState(true)
  const [showRandom, setShowRandom] = useState(false)
  const [colorMode, setColorMode] = useState<ColorMode>('by-concept')
  const [trailLength, setTrailLength] = useState(3)
  const [stats, setStats] = useState<TrajectoryStats | null>(null)
  const [hoveredConcept, setHoveredConcept] = useState<number | null>(null)
  const [pinnedConcept, setPinnedConcept] = useState<number | null>(null)
  const playFrameRef = useRef<number | null>(null)
  const lastTickTimeRef = useRef<number>(0)

  // Auto-play loop: increment tick every ~320 ms
  useEffect(() => {
    if (!playing) {
      if (playFrameRef.current !== null) cancelAnimationFrame(playFrameRef.current)
      return
    }
    const loop = (t: number) => {
      if (t - lastTickTimeRef.current > 320) {
        setTick((cur) => (cur >= MAX_TICKS ? 0 : cur + 1))
        lastTickTimeRef.current = t
      }
      playFrameRef.current = requestAnimationFrame(loop)
    }
    playFrameRef.current = requestAnimationFrame(loop)
    return () => {
      if (playFrameRef.current !== null) cancelAnimationFrame(playFrameRef.current)
    }
  }, [playing])

  const reset = useCallback(() => {
    setTick(0)
    setPlaying(true)
  }, [])

  const activeConcept = pinnedConcept ?? hoveredConcept

  // Live stats values
  const convergedAtTick = stats?.convergedByTick[tick] ?? 0
  const convergedPct = stats ? (convergedAtTick / stats.nAgents) * 100 : 0
  const meanHam = stats ? stats.meanHammingPerTick[tick] ?? 0 : 0
  const avgConvTick = stats?.avgConvergenceTick ?? 0

  // Inspector — show details when a concept is hovered or pinned
  const inspectorConcept = activeConcept !== null && concepts[activeConcept]
    ? concepts[activeConcept]
    : null

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div>
        <h3 className="text-base font-semibold tracking-wide text-[#D4AF37]/90 inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Anna Trajectory Cloud
        </h3>
        <p className="text-xs text-white/55 mt-0.5">
          {nAgents} agents (= random binary inputs) traced through Anna&apos;s AIT inference over{' '}
          {MAX_TICKS} ticks. Each output is projected to 3D via PCA fit on the 19 concept centroids.
          The 19 gold icosahedra mark Anna&apos;s 19 concept attractors — sized by basin population
          at the current tick.{' '}
          <strong className="text-[#D4AF37]/80">
            Trajectory tracer validated byte-equivalent to <code className="font-mono">aitFastInference</code> across 1 000 random inputs (
            <code className="font-mono">__tests__/trajectory-trace.test.mjs</code>).
          </strong>
        </p>
      </div>

      <ExplainPanel
        title="Why does this look like neural tissue?"
        defaultCollapsed={false}
        kid={
          <div className="space-y-2.5">
            <p>
              Imagine {nAgents} marbles starting at the same spot in 3D space. Each marble has a
              secret destination — one of <strong>19 valleys</strong>. As they roll, marbles
              that share a valley bundle into a stream; the streams converge into 19 dense knots.
              We draw a faint trail behind each marble so you can see where it just came from.
            </p>
            <p>
              The cloud looks like <strong>brain tissue</strong> because the same rule — &ldquo;many
              things flowing toward few destinations through narrow channels&rdquo; — is what makes
              real brain dendrites look like dendrites. Anna is sorting random inputs into 19
              categories; brain neurons sort signals into pathways. Same shape, different domain.
            </p>
            <p>
              Switch to <em>Random control</em> and you get a fuzzy ball — no bundling, no knots.
              That&apos;s the visual difference between Anna&apos;s structure and noise.
            </p>
          </div>
        }
        simple={
          <div className="space-y-2">
            <p>
              We sample {nAgents} random binary inputs, run each through Anna&apos;s AIT for up to{' '}
              {MAX_TICKS} ticks, capture the 64-bit output state at every tick, and project each tick
              to 3D via the top-3 PCA components of the 19-centroid covariance.
            </p>
            <p>
              The 19 gold icosahedra are concept attractors, sized by how many agents end up in their
              basin. Click one to focus only on agents that converged there; hover to inspect.
              Average ticks to convergence on Anna: ~3.1 (validated). Random control: no convergence,
              diffuse cloud.
            </p>
            <p>
              <strong>Why &ldquo;tissue-like&rdquo;:</strong> brain dendrites and AIT trajectories are
              both low-D projections of attractor-driven flow with sparse fixed points. The
              convergent-bundle morphology is generic — it comes from many initial conditions sharing
              a small number of stable destinations.
            </p>
          </div>
        }
        researcher={
          <div className="space-y-2">
            <p>
              Connects to a recent T-MIND v10 visualisation by motivate showing 1 000 multi-agent
              trajectories converging on targets, with brain-tissue-like wisp structure. Question
              raised: is this a Multi-Agent-Diffusion-with-Targets artefact, or something deeper?
            </p>
            <p>
              The Anna analogue: AIT inference is a deterministic dynamical system on a 128-D state
              space with input-clamping. Each input traces a trajectory toward one of 19 fixed-point
              attractors. Projected to 3D via PCA fit on the centroids, the trajectory cloud has the
              same convergent-bundle structure as T-MIND — but it is fully deterministic, with no
              noise and no active steering. The bundling is purely from the basin geometry.
            </p>
            <p>
              Implication: if both visualisations show the same morphology, attractor-driven flow
              produces tissue-like trajectory clouds <em>generically</em> when projected to low-D,
              regardless of whether the dynamics are stochastic (Brownian + drift) or deterministic
              (iterated linear-ternary map). The &ldquo;looks like brain&rdquo; observation is a
              property of attractor topology, not of any specific substrate.
            </p>
          </div>
        }
        math={
          <>
            <p>For each input <InlineMath math="u_i \in \{-1, +1\}^{64}" /> we record the trajectory:</p>
            <BlockMath math="\tau_i(t) = \text{AIT}_t(W, u_i) \in \{-1, 0, +1\}^{64}, \quad t = 0, 1, \dots, T = 8" />
            <p>3D projection via PCA on concept centroids:</p>
            <BlockMath math="\pi(o) = U_3^\top (o - \bar c), \quad U_3 = \text{top-3 eigenvectors of } \mathrm{cov}(\{\text{centroid}_k\}_{k=0}^{18})" />
            <p>Convergence rate (agents at a fixed point by tick t):</p>
            <BlockMath math="\rho(t) = \tfrac{1}{N} \cdot \#\big\{ i : \tau_i(t) = \tau_i(t-1) \big\}" />
            <p>
              Anna verified average <InlineMath math="\rho(3) > 0.95" />, <InlineMath math="\mathbb{E}[t_{\text{conv}}] \approx 3.1" /> (n=1000, see test gate).
              Trajectory tracer byte-equivalent to <code>aitFastInference</code> for all
              <InlineMath math="t \le 32" />.
            </p>
          </>
        }
      />

      {/* Controls row 1 — playback + dataset toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#D4AF37]/15 border border-[#D4AF37]/30 hover:bg-[#D4AF37]/25 text-[#D4AF37] text-xs font-medium"
        >
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {playing ? 'pause' : 'play'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 px-3 py-1.5 border border-white/10 hover:bg-white/5 text-white/65 text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          reset
        </button>

        <div className="flex bg-black/40 border border-white/15">
          <button
            type="button"
            onClick={() => { setShowRandom(false); setPinnedConcept(null) }}
            className={cn(
              'px-3 py-1.5 text-xs font-mono transition-colors',
              !showRandom ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-white/55 hover:text-white/85',
            )}
          >
            Anna
          </button>
          <button
            type="button"
            onClick={() => { setShowRandom(true); setPinnedConcept(null) }}
            className={cn(
              'px-3 py-1.5 text-xs font-mono border-l border-white/15 transition-colors',
              showRandom ? 'bg-rose-500/20 text-rose-300' : 'text-white/55 hover:text-white/85',
            )}
          >
            Random control
          </button>
        </div>

        <div className="flex bg-black/40 border border-white/15">
          <span className="px-2 py-1.5 text-[10px] font-mono text-white/45 border-r border-white/15 self-center">colour</span>
          {(['by-concept', 'by-input-hash', 'uniform-gold'] as ColorMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setColorMode(m)}
              className={cn(
                'px-2 py-1.5 text-[11px] font-mono border-l border-white/15 first:border-l-0 transition-colors',
                colorMode === m ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-white/55 hover:text-white/85',
              )}
            >
              {m === 'by-concept' ? 'concept' : m === 'by-input-hash' ? 'input' : 'gold'}
            </button>
          ))}
        </div>

        <div className="flex bg-black/40 border border-white/15">
          <span className="px-2 py-1.5 text-[10px] font-mono text-white/45 border-r border-white/15 self-center">N</span>
          {AGENT_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNAgents(n)}
              disabled={n === nAgents}
              className={cn(
                'px-2 py-1.5 text-[11px] font-mono border-l border-white/15 first:border-l-0 transition-colors',
                n === nAgents ? 'bg-[#D4AF37]/20 text-[#D4AF37] cursor-default' : 'text-white/55 hover:text-white/85',
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Controls row 2 — sliders */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-mono">
        <label className="flex items-center gap-2">
          <span className="text-white/55">tick</span>
          <input
            type="range"
            min={0}
            max={MAX_TICKS}
            value={tick}
            onChange={(e) => {
              setPlaying(false)
              setTick(parseInt(e.target.value, 10))
            }}
            className="w-32 sm:w-44 accent-[#D4AF37]"
          />
          <span className="text-[#D4AF37] w-6 text-right">{tick}</span>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-white/55">trail</span>
          <input
            type="range"
            min={0}
            max={6}
            value={trailLength}
            onChange={(e) => setTrailLength(parseInt(e.target.value, 10))}
            className="w-20 sm:w-28 accent-[#D4AF37]"
          />
          <span className="text-[#D4AF37] w-3 text-right">{trailLength}</span>
        </label>
        {pinnedConcept !== null && (
          <button
            type="button"
            onClick={() => setPinnedConcept(null)}
            className="ml-auto text-[10px] text-amber-300/85 hover:text-amber-300 underline decoration-dotted"
          >
            clear pinned concept #{concepts[pinnedConcept]?.conceptId ?? pinnedConcept}
          </button>
        )}
      </div>

      {/* 3D scene + side inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-3">
        <div className="relative w-full h-[360px] sm:h-[460px] lg:h-[560px] bg-[#020203] border border-white/[0.06] overflow-hidden">
          <TrajectoryScene
            annaMatrix={annaMatrix}
            concepts={concepts}
            nAgents={nAgents}
            maxTicks={MAX_TICKS}
            tick={tick}
            trailLength={trailLength}
            showRandom={showRandom}
            colorMode={colorMode}
            highlightedConcept={pinnedConcept ?? hoveredConcept}
            onStats={setStats}
            onHoverConcept={setHoveredConcept}
          />
          <div className="absolute top-3 left-3 text-[10px] font-mono uppercase tracking-wider pointer-events-none">
            <div className={cn(showRandom ? 'text-rose-400/85' : 'text-[#D4AF37]/85')}>
              {showRandom ? 'Random_int8 control' : 'Anna AIT inference'} · {nAgents} agents
            </div>
            <div className="text-white/45 mt-0.5">
              tick {tick} of {MAX_TICKS} · trail {trailLength} · colour: {colorMode.replace('-', ' ')}
            </div>
          </div>
          <div className="absolute bottom-3 right-3 text-[10px] text-white/40 font-mono pointer-events-none">
            drag rotate · scroll zoom · hover stars
          </div>

          {/* Hover tooltip overlay */}
          <AnimatePresence>
            {hoveredConcept !== null && !pinnedConcept && concepts[hoveredConcept] && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.12 }}
                className="absolute top-12 left-3 max-w-[280px] bg-[#0A0A0A]/90 border border-[#D4AF37]/35 px-3 py-2 text-xs pointer-events-none"
              >
                <div className="text-[#D4AF37] font-mono uppercase tracking-wider text-[10px]">
                  concept #{concepts[hoveredConcept]?.conceptId}
                </div>
                <div className="text-white/85 mt-0.5">
                  Phase N cluster size {concepts[hoveredConcept]?.clusterSize}
                  {concepts[hoveredConcept]?.isAntipodeOf !== null && (
                    <> · antipode of #{concepts[hoveredConcept]?.isAntipodeOf}</>
                  )}
                </div>
                <div className="text-white/55 mt-1 font-mono text-[10px]">
                  {stats?.perConceptCount[hoveredConcept] ?? 0} of {nAgents} agents converged here
                </div>
                <div className="text-white/40 text-[10px] mt-0.5 italic">click to pin/focus</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Inspector panel */}
        <div className="flex flex-col gap-2">
          {/* Live stats */}
          <div className="border border-white/[0.06] bg-[#0A0A0A] p-3 text-xs space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-white/55 font-mono">
              Live state @ tick {tick}
            </div>
            <StatLine label="Converged" value={`${convergedAtTick} / ${stats?.nAgents ?? nAgents}`} pct={convergedPct} accent="green" />
            <StatLine label="Mean H to centroid" value={`${meanHam.toFixed(1)} bits`} hint="0 = at attractor · 32 = chance" />
            <StatLine label="Avg t_conv" value={`${avgConvTick.toFixed(2)} ticks`} hint="empirical convergence time" />
            <StatLine label="Active basins" value={`${(stats?.perConceptCount.filter((c) => c > 0).length ?? 0)} / 19`} hint="non-empty concept basins" />
          </div>

          {/* Hover/pin inspector */}
          {inspectorConcept ? (
            <div className="border border-[#D4AF37]/30 bg-[#0A0A0A] p-3 text-xs space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-mono">
                Concept {pinnedConcept !== null ? '· pinned' : '· hover'}
              </div>
              <div className="text-white/90 font-mono">#{inspectorConcept.conceptId}</div>
              <div className="text-white/65">
                cluster size <span className="font-mono text-white/85">{inspectorConcept.clusterSize}</span>
              </div>
              {inspectorConcept.isAntipodeOf !== null && (
                <div className="text-white/65">
                  antipode of <span className="font-mono text-white/85">#{inspectorConcept.isAntipodeOf}</span>
                </div>
              )}
              <div className="text-white/65">
                agents here:{' '}
                <span className="font-mono text-emerald-300">
                  {stats?.perConceptCount[activeConcept!] ?? 0}
                </span>
              </div>
              {pinnedConcept === null && hoveredConcept !== null && (
                <button
                  type="button"
                  onClick={() => setPinnedConcept(hoveredConcept)}
                  className="mt-1 w-full px-2 py-1 border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] text-[11px] hover:bg-[#D4AF37]/20"
                >
                  pin & focus basin
                </button>
              )}
            </div>
          ) : (
            <div className="border border-white/[0.06] bg-[#0A0A0A] p-3 text-xs text-white/45 italic flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-white/35" />
              <span>Hover any of the 19 gold icosahedra to inspect a concept attractor.</span>
            </div>
          )}

          {/* Convergence sparkline */}
          {stats && (
            <div className="border border-white/[0.06] bg-[#0A0A0A] p-3">
              <div className="text-[10px] uppercase tracking-wider text-white/55 font-mono mb-1">
                Convergence curve
              </div>
              <ConvergenceSparkline
                series={stats.convergedByTick}
                total={stats.nAgents}
                tick={tick}
              />
              <div className="text-[10px] text-white/45 mt-1 font-mono">
                agents at fixed point ↑ · tick → · live cursor: t={tick}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom callout — varies by Anna / Random */}
      <div className={cn(
        'px-3 py-2 border text-xs leading-relaxed',
        showRandom
          ? 'bg-rose-500/[0.04] border-rose-500/20 text-rose-300/85'
          : 'bg-emerald-500/[0.04] border-emerald-500/20 text-emerald-300/85',
      )}>
        <strong className="text-white/95">What you&apos;re seeing:</strong>{' '}
        {showRandom ? (
          <>
            Random matrix — agents diffuse roughly uniformly through 3D space. The 19 gold
            icosahedra remain in their Phase-N positions but no agents converge to them
            (basin emptiness visible in the inspector: 0 agents at most concepts). This is the
            null-hypothesis baseline. The contrast with the Anna view is the headline finding.
          </>
        ) : (
          <>
            Anna — agents migrate from the origin (t = 0, all converged at the centre) toward
            Anna&apos;s 19 concept attractors. By tick 2–3, <strong>{convergedPct.toFixed(0)} %</strong>{' '}
            of agents have reached a fixed point. The fine filaments between knots are agents in
            transit (boundary inputs near a basin edge). The convergent-bundle morphology is the
            same shape observed in motivate&apos;s T-MIND v10 plot — but here it&apos;s purely
            deterministic, with no agent-agent interactions and no active steering.
          </>
        )}
      </div>
    </div>
  )
}

function StatLine({
  label, value, pct, hint, accent,
}: {
  label: string
  value: string
  pct?: number
  hint?: string
  accent?: 'green' | 'gold' | 'rose'
}) {
  const accentClass =
    accent === 'green' ? 'text-emerald-300' :
    accent === 'rose' ? 'text-rose-300' :
    accent === 'gold' ? 'text-[#D4AF37]' :
    'text-white/85'
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-white/55">{label}</span>
        <span className={cn('font-mono', accentClass)}>{value}</span>
      </div>
      {typeof pct === 'number' && (
        <div className="mt-0.5 h-1 bg-white/[0.04] overflow-hidden">
          <div
            className={cn('h-full', accent === 'green' ? 'bg-emerald-400/70' : 'bg-[#D4AF37]/70')}
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          />
        </div>
      )}
      {hint && <div className="text-[9px] text-white/35 italic">{hint}</div>}
    </div>
  )
}

function ConvergenceSparkline({
  series,
  total,
  tick,
}: {
  series: number[]
  total: number
  tick: number
}) {
  const W = 200
  const H = 56
  const n = series.length
  const maxV = total
  const path = series.map((v, i) => {
    const x = (i / Math.max(1, n - 1)) * W
    const y = H - (v / maxV) * H
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
  }).join(' ')
  const cursorX = (Math.min(tick, n - 1) / Math.max(1, n - 1)) * W
  const cursorY = H - ((series[Math.min(tick, n - 1)] ?? 0) / maxV) * H

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: H }}>
      <defs>
        <linearGradient id="conv-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(16,185,129)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* gridlines */}
      {[0.25, 0.5, 0.75].map((y) => (
        <line key={y} x1={0} y1={H * y} x2={W} y2={H * y} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
      ))}
      {/* fill */}
      <path d={`${path} L ${W} ${H} L 0 ${H} Z`} fill="url(#conv-fill)" />
      {/* curve */}
      <path d={path} fill="none" stroke="rgb(16,185,129)" strokeWidth={1.5} />
      {/* cursor */}
      <line x1={cursorX} y1={0} x2={cursorX} y2={H} stroke="#D4AF37" strokeWidth={1} strokeDasharray="3 2" />
      <circle cx={cursorX} cy={cursorY} r={3} fill="#D4AF37" stroke="#0A0A0A" strokeWidth={1} />
    </svg>
  )
}
