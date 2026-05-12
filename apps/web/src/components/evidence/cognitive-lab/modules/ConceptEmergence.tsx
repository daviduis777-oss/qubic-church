'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, RotateCcw, Sparkles } from 'lucide-react'
import { signWeights } from '@/lib/ait'
import { aitFastInference, packSignMatrix } from '../evolution/ait-fast'
import { mulberry32 } from '../evolution/rng'
import { computePCABasis, projectOntoBasis, type PCABasis } from '../evolution/pca'
import { checkStability } from '../evolution/concept-discovery'
import { cn } from '@/lib/utils'
import { ExplainPanel } from '@/components/evidence/lab-primitives'
import { EXPLAIN_CONCEPT_EMERGENCE } from '../components/explainContent'

/**
 * Concept Emergence: sample N random binary inputs, run AIT, classify each
 * input by its nearest concept centroid (from Phase N's empirically-discovered
 * 19 attractors), plot in 2D PCA-projected output space. Anna shows clear
 * 19-color clustering = task-conditional classification structure. Random matrix:
 * uniform scatter = no concepts.
 *
 * Important framing: the 19 centroids are LOADED here (from phase_n/concepts.json),
 * not discovered from the data. For the from-data discovery question, see the
 * ClusterDiscovery module — which shows that under Hamming-silhouette, Anna's
 * stable outputs peak at k=2 (antipode-pair split) and the 19-attractor count is
 * recovered hierarchically (Dendrogram module), not by silhouette peak.
 */

export interface ConceptEmergenceProps {
  annaMatrix: Int8Array
  className?: string
}

interface ConceptCentroid {
  concept_id: number
  centroid: number[]
  cluster_size: number
  family: number
  is_antipode_of: number | null
  pca_x: number
  pca_y: number
}

interface ConceptsWithPCAFile {
  concepts: ConceptCentroid[]
  pca_explained_variance: number[]
}

interface ClassifiedSample {
  conceptId: number | null
  pcaX: number
  pcaY: number
  family: number
  stable: boolean
  avalanche: number
}

const N_SAMPLES = 2000
const CANVAS_SIZE = 540

// 19 distinct, accessible colors
const CONCEPT_COLORS = [
  '#D4AF37', '#FBBF24', '#F97316', '#EF4444', '#EC4899', '#A855F7',
  '#8B5CF6', '#6366F1', '#3B82F6', '#0EA5E9', '#06B6D4', '#14B8A6',
  '#10B981', '#22C55E', '#84CC16', '#EAB308', '#F59E0B', '#FB7185',
  '#F472B6',
]

function hammingDistance(a: number[], b: Int8Array): number {
  let d = 0
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++
  return d
}

function nearestConcept(output: Int8Array, concepts: ConceptCentroid[]): number {
  let best = 0
  let bestDist = Infinity
  for (let k = 0; k < concepts.length; k++) {
    const d = hammingDistance(concepts[k]!.centroid, output)
    if (d < bestDist) {
      bestDist = d
      best = k
    }
  }
  return best
}

function generateRandomControl(): Int8Array {
  const r = mulberry32(0xfeed)
  const w = new Int8Array(16384)
  for (let i = 0; i < 16384; i++) w[i] = r() < 0.5 ? -1 : 1
  return w
}

export function ConceptEmergence({ annaMatrix, className }: ConceptEmergenceProps) {
  const [concepts, setConcepts] = useState<ConceptCentroid[] | null>(null)
  const [classifiedAnna, setClassifiedAnna] = useState<ClassifiedSample[] | null>(null)
  const [classifiedRandom, setClassifiedRandom] = useState<ClassifiedSample[] | null>(null)
  const [pcaBasis, setPcaBasis] = useState<PCABasis | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showRandom, setShowRandom] = useState(false)
  const [showOnlyStable, setShowOnlyStable] = useState(false)
  const [running, setRunning] = useState(false)
  const [hoveredConcept, setHoveredConcept] = useState<number | null>(null)

  // Load concepts data once
  useEffect(() => {
    fetch('/data/phase_n/concepts_with_pca.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<ConceptsWithPCAFile>
      })
      .then((d) => setConcepts(d.concepts))
      .catch((err) => setLoadError(err.message || String(err)))
  }, [])

  // Generate samples once concepts are loaded (Anna)
  const runClassification = useCallback(() => {
    if (!concepts) return
    setRunning(true)
    setTimeout(() => {
      const W_anna = packSignMatrix(signWeights(annaMatrix))
      const W_rand = packSignMatrix(signWeights(generateRandomControl()))
      const r = mulberry32(7)

      // Real PCA basis from Anna's 19 concept centroids
      const basis = computePCABasis(concepts.map((c) => c.centroid), 2)

      const annaSamples: ClassifiedSample[] = []
      const randomSamples: ClassifiedSample[] = []

      for (let s = 0; s < N_SAMPLES; s++) {
        const u = new Int8Array(64)
        for (let i = 0; i < 64; i++) u[i] = r() < 0.5 ? -1 : 1

        // Stability filter: avg avalanche under 4 single-bit perturbations.
        // STABLE (avalanche < 4) = legitimate concept-basin member;
        // BOUNDARY (≥ 4) = sorted into nearest concept but unreliable.
        const annaStability = checkStability(W_anna, u, 4, 4.0)
        const randomStability = checkStability(W_rand, u, 4, 4.0)

        const annaConceptIdx = nearestConcept(annaStability.output, concepts)
        const randomConceptIdx = nearestConcept(randomStability.output, concepts)

        const annaProj = projectOntoBasis(annaStability.output, basis)
        const randomProj = projectOntoBasis(randomStability.output, basis)
        const annaX = annaProj[0]!, annaY = annaProj[1]!
        const randomX = randomProj[0]!, randomY = randomProj[1]!

        annaSamples.push({
          conceptId: annaConceptIdx,
          pcaX: annaX + (r() - 0.5) * 0.4,
          pcaY: annaY + (r() - 0.5) * 0.4,
          family: concepts[annaConceptIdx]?.family ?? 0,
          stable: annaStability.stable,
          avalanche: annaStability.avalanche,
        })
        randomSamples.push({
          conceptId: null,
          pcaX: randomX + (r() - 0.5) * 0.4,
          pcaY: randomY + (r() - 0.5) * 0.4,
          family: 0,
          stable: randomStability.stable,
          avalanche: randomStability.avalanche,
        })
      }

      setPcaBasis(basis)
      setClassifiedAnna(annaSamples)
      setClassifiedRandom(randomSamples)
      setRunning(false)
    }, 50)
  }, [concepts, annaMatrix])

  // Run automatically once concepts loaded
  useEffect(() => {
    if (concepts && !classifiedAnna) runClassification()
  }, [concepts, classifiedAnna, runClassification])

  const samples = showRandom ? classifiedRandom : classifiedAnna

  if (loadError) {
    return (
      <div className="p-4 border border-rose-500/30 bg-rose-500/[0.04] text-xs text-rose-400">
        Failed to load concept data: {loadError}
      </div>
    )
  }

  const conceptStats = useMemo(() => {
    if (!classifiedAnna || !concepts) return null
    const counts = new Map<number, number>()
    const stableCounts = new Map<number, number>()
    for (const s of classifiedAnna) {
      if (s.conceptId !== null) {
        counts.set(s.conceptId, (counts.get(s.conceptId) ?? 0) + 1)
        if (s.stable) stableCounts.set(s.conceptId, (stableCounts.get(s.conceptId) ?? 0) + 1)
      }
    }
    return concepts
      .map((c, idx) => ({
        idx,
        conceptId: c.concept_id,
        family: c.family,
        count: counts.get(idx) ?? 0,
        stableCount: stableCounts.get(idx) ?? 0,
        clusterSize: c.cluster_size,
      }))
      .sort((a, b) => b.stableCount - a.stableCount || b.count - a.count)
  }, [classifiedAnna, concepts])

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div>
        <h3 className="text-base font-semibold tracking-wide text-[#D4AF37]/90 inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Concept Emergence
        </h3>
        <p className="text-xs text-white/55 mt-0.5">
          The clearest evidence of emergence we have: feed {N_SAMPLES.toLocaleString()} random
          binary inputs through Anna&apos;s AIT, classify each by its nearest concept attractor,
          plot in 2D. Anna&apos;s outputs cluster into 19 colored regions automatically.
          Random matrix outputs scatter uniformly — <em>no</em> emergent categories.
        </p>
      </div>

      <ExplainPanel
        kid={EXPLAIN_CONCEPT_EMERGENCE.kid}
        simple={EXPLAIN_CONCEPT_EMERGENCE.simple}
        researcher={EXPLAIN_CONCEPT_EMERGENCE.researcher}
        math={EXPLAIN_CONCEPT_EMERGENCE.math}
        title="What is concept emergence?"
      />

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={runClassification}
          disabled={running || !concepts}
          className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/15 border border-[#D4AF37]/30 disabled:opacity-50 hover:bg-[#D4AF37]/25 text-[#D4AF37] font-medium text-sm"
        >
          <Play className="w-4 h-4" />
          {running ? 'Classifying…' : `Sample ${N_SAMPLES} inputs`}
        </button>

        <div className="flex bg-black/40 border border-white/15">
          <button
            type="button"
            onClick={() => setShowRandom(false)}
            className={cn(
              'px-3 py-1.5 text-xs font-mono transition-colors',
              !showRandom ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-white/55 hover:text-white/85',
            )}
          >
            Anna
          </button>
          <button
            type="button"
            onClick={() => setShowRandom(true)}
            className={cn(
              'px-3 py-1.5 text-xs font-mono border-l border-white/15 transition-colors',
              showRandom ? 'bg-rose-500/20 text-rose-300' : 'text-white/55 hover:text-white/85',
            )}
          >
            Random control
          </button>
        </div>

        <label className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/15 cursor-pointer text-xs font-mono">
          <input
            type="checkbox"
            checked={showOnlyStable}
            onChange={(e) => setShowOnlyStable(e.target.checked)}
            className="accent-[#D4AF37]"
          />
          <span className={cn(showOnlyStable ? 'text-[#D4AF37]' : 'text-white/55')}>
            only stable basins
          </span>
        </label>
      </div>

      {/* Main scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-3">
        <div className="border border-white/[0.06] bg-[#0A0A0A] p-2 relative">
          <ConceptScatter
            samples={samples}
            concepts={concepts}
            hoveredConcept={hoveredConcept}
            isAnna={!showRandom}
            showOnlyStable={showOnlyStable}
          />
          <div className="absolute top-3 left-3 text-[10px] font-mono uppercase tracking-wider">
            <div className={cn(showRandom ? 'text-rose-400/85' : 'text-[#D4AF37]/85')}>
              {showRandom ? 'Random matrix · no emergent structure' : `Anna · ${classifiedAnna ? new Set(classifiedAnna.filter((s) => s.stable).map((s) => s.conceptId)).size : 0} stable concepts populated`}
            </div>
            <div className="text-white/45 mt-0.5">
              {samples?.length ?? 0} inputs · {samples ? samples.filter((s) => s.stable).length : 0} stable · real PCA on 19 centroids
            </div>
          </div>
          <div className="absolute bottom-3 right-3 text-[10px] text-white/45 font-mono">
            hover legend → highlight concept
          </div>
        </div>

        {/* Concept legend */}
        <div className="border border-white/[0.06] bg-[#0A0A0A] p-3 max-h-[540px] overflow-y-auto">
          <div className="text-[10px] uppercase tracking-wider text-white/55 font-mono mb-2">
            19 concepts · stable / total
          </div>
          {conceptStats ? (
            <div className="space-y-1">
              {conceptStats.map((s) => {
                const color = CONCEPT_COLORS[s.idx % CONCEPT_COLORS.length]!
                return (
                  <button
                    key={s.idx}
                    type="button"
                    onMouseEnter={() => setHoveredConcept(s.idx)}
                    onMouseLeave={() => setHoveredConcept(null)}
                    className={cn(
                      'w-full flex items-center gap-2 px-1.5 py-1 hover:bg-white/[0.04] transition-colors text-left',
                      hoveredConcept === s.idx && 'bg-white/[0.06]',
                    )}
                  >
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
                    />
                    <span className="text-[10px] font-mono text-white/85">#{s.conceptId}</span>
                    <span className="text-[10px] text-white/45 ml-auto font-mono">
                      {s.stableCount}<span className="text-white/30"> / {s.count}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="text-[10px] text-white/40 italic">Sampling...</div>
          )}
        </div>
      </div>

      <div className="px-3 py-2 bg-emerald-500/[0.03] border border-emerald-500/15 text-xs text-emerald-300/80 leading-relaxed">
        <strong className="text-emerald-300">How to read this plot:</strong> Each dot is one of
        2,000 random binary inputs run through Anna&apos;s AIT. Bright dots are <em>stable basins</em>
        (avalanche &lt; 4 bits under single-bit perturbation, ~7 % of all inputs per Phase N M3); these
        cluster tightly around the 19 concept centroids. Dim dots are boundary inputs that AIT
        sorts into the nearest concept but which would shift under tiny input changes. Random matrix:
        no clusters — uniform spread. Real 2D PCA basis computed from Anna&apos;s 19 centroids.
        <br />
        <strong className="text-emerald-300/90 mt-1 inline-block">This is classification by lookup</strong>,
        not discovery. To see whether the count 19 itself is recoverable from raw data without prior
        knowledge of the centroids, see the <em>Cluster Discovery</em> module in Anna Concept Lab —
        it runs k-means at k = 2..32 and reports where the silhouette peaks.
      </div>
    </div>
  )
}

interface ConceptScatterProps {
  samples: ClassifiedSample[] | null
  concepts: ConceptCentroid[] | null
  hoveredConcept: number | null
  isAnna: boolean
  showOnlyStable: boolean
}

function ConceptScatter({ samples, concepts, hoveredConcept, isAnna, showOnlyStable }: ConceptScatterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1))
    cv.width = CANVAS_SIZE * dpr
    cv.height = CANVAS_SIZE * dpr
    cv.style.width = `${CANVAS_SIZE}px`
    cv.style.height = `${CANVAS_SIZE}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#020203'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    if (!samples || samples.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)'
      ctx.font = '12px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('Sampling…', CANVAS_SIZE / 2, CANVAS_SIZE / 2)
      return
    }

    // Soft grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    for (let i = 1; i < 8; i++) {
      const x = (i / 8) * CANVAS_SIZE
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_SIZE); ctx.stroke()
      const y = (i / 8) * CANVAS_SIZE
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_SIZE, y); ctx.stroke()
    }

    // Compute scatter bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const s of samples) {
      if (s.pcaX < minX) minX = s.pcaX
      if (s.pcaX > maxX) maxX = s.pcaX
      if (s.pcaY < minY) minY = s.pcaY
      if (s.pcaY > maxY) maxY = s.pcaY
    }
    const pad = 0.15
    const rangeX = Math.max(0.5, maxX - minX) * (1 + pad * 2)
    const rangeY = Math.max(0.5, maxY - minY) * (1 + pad * 2)
    const cX = (minX + maxX) / 2
    const cY = (minY + maxY) / 2

    const toX = (x: number) => CANVAS_SIZE / 2 + ((x - cX) / rangeX) * CANVAS_SIZE * 0.85
    const toY = (y: number) => CANVAS_SIZE / 2 - ((y - cY) / rangeY) * CANVAS_SIZE * 0.85

    // Plot samples — stable inputs at full alpha, boundary inputs dimmed.
    // Per Phase N M3: ~7 % of inputs are stable basins (legitimate concept members);
    // the rest are boundary inputs that randomly fall into nearest concept under classification.
    for (const s of samples) {
      if (showOnlyStable && !s.stable) continue
      const x = toX(s.pcaX)
      const y = toY(s.pcaY)
      let color: string
      let alpha: number
      let r: number
      if (isAnna && s.conceptId !== null) {
        color = CONCEPT_COLORS[s.conceptId % CONCEPT_COLORS.length]!
        const dimOther = hoveredConcept !== null && hoveredConcept !== s.conceptId
        const isStable = s.stable
        // Stable: full alpha, larger radius. Boundary: very dim, small.
        alpha = dimOther ? 0.04 : (isStable ? 0.85 : 0.10)
        r = dimOther ? 1.0 : (isStable ? 2.2 : 1.2)
      } else {
        color = 'rgba(180, 70, 90, 1)'
        alpha = s.stable ? 0.55 : 0.10
        r = s.stable ? 1.6 : 1.0
      }
      ctx.fillStyle = color
      ctx.globalAlpha = alpha
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // Plot concept centroids on top (gold rings)
    if (isAnna && concepts) {
      for (let i = 0; i < concepts.length; i++) {
        const c = concepts[i]!
        const x = toX(c.pca_x)
        const y = toY(c.pca_y)
        const isHovered = hoveredConcept === i
        const color = CONCEPT_COLORS[i % CONCEPT_COLORS.length]!
        ctx.strokeStyle = color
        ctx.lineWidth = isHovered ? 3 : 1.5
        ctx.beginPath()
        ctx.arc(x, y, isHovered ? 12 : 7, 0, Math.PI * 2)
        ctx.stroke()
        // ID label
        ctx.fillStyle = isHovered ? color : 'rgba(255,255,255,0.6)'
        ctx.font = isHovered ? 'bold 11px monospace' : '9px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(`#${c.concept_id}`, x, y + 3)
      }
    }
  }, [samples, concepts, hoveredConcept, isAnna, showOnlyStable])

  return <canvas ref={canvasRef} className="block max-w-full" />
}

