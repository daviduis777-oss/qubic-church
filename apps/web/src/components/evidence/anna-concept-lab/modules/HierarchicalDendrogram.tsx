'use client'

/**
 * Hierarchical Dendrogram — visualisation of Phase N's cophenet 0.68 finding.
 *
 * Computes pairwise Hamming distance between the 19 concept centroids, runs
 * single-linkage hierarchical clustering, and renders the resulting tree as
 * an SVG dendrogram with concepts at the leaves.
 *
 * Why this matters: cophenet 0.68 is one of the strongest Phase N
 * effect-size results (45σ vs random matrices). The dendrogram makes that
 * hierarchical structure visible — antipodal pairs cluster together first
 * (low merge height), then small super-clusters merge at higher heights.
 */
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Network } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Concept, ConceptNamingMap } from '../types'
import {
  hierarchicalCluster,
  pairwiseHamming,
  type DendrogramNode,
} from '@/components/evidence/cognitive-lab/evolution/clustering'
import { ExplainPanel, BlockMath, InlineMath } from '@/components/evidence/lab-primitives'

interface HierarchicalDendrogramProps {
  concepts: Concept[]
  namingMap?: ConceptNamingMap
  className?: string
}

interface LayoutNode {
  x: number
  y: number
  node: DendrogramNode
  isLeaf: boolean
}

const CONCEPT_PALETTE = [
  '#D4AF37', '#FBBF24', '#F97316', '#EF4444', '#EC4899', '#A855F7',
  '#8B5CF6', '#6366F1', '#3B82F6', '#0EA5E9', '#06B6D4', '#14B8A6',
  '#10B981', '#22C55E', '#84CC16', '#EAB308', '#F59E0B', '#FB7185',
  '#F472B6',
]

/** Walk the tree, assign leaves x-positions by traversal order. */
function layoutDendrogram(root: DendrogramNode, width: number, height: number, leftPad = 32, rightPad = 8, topPad = 12, bottomPad = 56): {
  positions: Map<number, LayoutNode>
  leafOrder: number[]
  maxHeight: number
} {
  const positions = new Map<number, LayoutNode>()
  const leafOrder: number[] = []

  function findLeaves(node: DendrogramNode): number[] {
    if (!node.left || !node.right) return [node.id]
    return [...findLeaves(node.left), ...findLeaves(node.right)]
  }
  const leaves = findLeaves(root)
  leafOrder.push(...leaves)
  const nLeaves = leaves.length
  const innerW = Math.max(50, width - leftPad - rightPad)
  const innerH = Math.max(40, height - topPad - bottomPad)

  // Find max merge height for y scaling
  function maxH(node: DendrogramNode): number {
    if (!node.left || !node.right) return 0
    return Math.max(node.height, maxH(node.left), maxH(node.right))
  }
  const totalH = Math.max(1, maxH(root))

  function place(node: DendrogramNode): { x: number; y: number; leftX?: number; rightX?: number } {
    if (!node.left || !node.right) {
      // Leaf
      const idx = leaves.indexOf(node.id)
      const x = leftPad + (nLeaves === 1 ? innerW / 2 : (idx / (nLeaves - 1)) * innerW)
      const y = topPad + innerH
      positions.set(node.id, { x, y, node, isLeaf: true })
      return { x, y }
    }
    const L = place(node.left)
    const R = place(node.right)
    const x = (L.x + R.x) / 2
    const y = topPad + innerH - (node.height / totalH) * innerH
    positions.set(node.id, { x, y, node, isLeaf: false })
    return { x, y, leftX: L.x, rightX: R.x }
  }
  place(root)
  return { positions, leafOrder, maxHeight: totalH }
}

export function HierarchicalDendrogram({ concepts, namingMap, className }: HierarchicalDendrogramProps) {
  const [hoveredConcept, setHoveredConcept] = useState<number | null>(null)
  const [selectedSubtree, setSelectedSubtree] = useState<number | null>(null)

  const { root, leafOrder, positions, maxHeight, antipodalLinks } = useMemo(() => {
    const centroids = concepts.map((c) => c.centroid)
    const D = pairwiseHamming(centroids)
    const root = hierarchicalCluster(D)
    const width = 760
    const height = 380
    const { positions, leafOrder, maxHeight } = layoutDendrogram(root, width, height)

    // Antipodal pair links — those concept pairs whose centroids differ in all 64 bits
    const antipodalLinks: Array<{ a: number; b: number }> = []
    for (let i = 0; i < concepts.length; i++) {
      const c = concepts[i]!
      if (c.isAntipodeOf !== null) {
        const j = concepts.findIndex((cc) => cc.conceptId === c.isAntipodeOf)
        if (j > i) antipodalLinks.push({ a: i, b: j })
      }
    }

    return { root, leafOrder, positions, maxHeight, antipodalLinks }
  }, [concepts])

  // Color leaves by concept index
  const colorFor = (idx: number) => CONCEPT_PALETTE[idx % CONCEPT_PALETTE.length]!

  // Determine which leaf ids belong to the currently-selected internal node's subtree
  const highlightedLeaves = useMemo(() => {
    if (selectedSubtree === null) return null
    const node = positions.get(selectedSubtree)
    if (!node) return null
    return new Set(node.node.members)
  }, [selectedSubtree, positions])

  // Width is bigger than viewport-fit on narrow screens — wrap in overflow-x-auto.
  const W = 760
  const H = 380

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div>
        <h3 className="text-base font-semibold tracking-wide text-[#D4AF37]/90 inline-flex items-center gap-2">
          <Network className="w-4 h-4" />
          Hierarchical Dendrogram
        </h3>
        <p className="text-xs text-white/55 mt-0.5">
          Single-linkage Hamming-distance clustering of the 19 concept centroids. Antipodal pairs
          merge at height 64 (bitwise opposites); related concepts merge at lower heights. The
          cophenet correlation between this tree and the original distance matrix is{' '}
          <strong className="text-[#D4AF37]">0.68</strong> for Anna vs ~0.13 for random matrices
          (Phase N, 45σ above noise).
        </p>
      </div>

      <ExplainPanel
        title="What is a dendrogram showing?"
        defaultCollapsed
        kid={
          <div className="space-y-2.5">
            <p>
              Imagine all 19 ideas standing in a line at the bottom. Pairs of ideas that are
              <strong> very similar</strong> get connected by short branches near the bottom. Pairs
              that are very different connect way up high.
            </p>
            <p>
              The tallest branches mean &ldquo;completely opposite ideas&rdquo; (Hamming distance 64
              — every switch flipped). Anna&apos;s opposites are real, not random — that&apos;s why
              we see those tall, clean pairs.
            </p>
            <p>
              Click any inner branch to highlight the ideas under it. You&apos;ll see Anna&apos;s
              concepts naturally group into about 4 family clusters.
            </p>
          </div>
        }
        simple={
          <div className="space-y-2">
            <p>
              Single-linkage agglomerative hierarchical clustering. We start with each of the 19
              concepts as its own cluster, then iteratively merge the closest two until everything
              is in one tree. Merge height = the Hamming distance at which the merge occurred.
            </p>
            <p>
              Anna&apos;s tree is tall and structured (cophenet 0.68 = the tree distances correlate
              well with the original pairwise distances). Random matrices give a flat tree where
              all distances collapse to ~half-max (cophenet 0.13).
            </p>
          </div>
        }
        researcher={
          <div className="space-y-2">
            <p>
              Verified Phase N V1: cophenet 0.6821 vs random_int8 baseline 0.1352 ± 0.0120 (n=20).
              z-score 45.55σ — well above the 5σ discovery threshold. Hierarchical structure
              implies meaningful similarity gradients between concepts, not just a flat 19-way
              partition.
            </p>
            <p>
              The 8 antipodal pairs (concepts at Hamming 64 from each other) tend to appear as
              isolated branches: they merge only at maximum height with the rest of the tree.
            </p>
          </div>
        }
        math={
          <>
            <p>Cophenetic distance between leaves i and j:</p>
            <BlockMath math="d_{\mathrm{coph}}(i, j) = \mathrm{height\ of\ lowest\ common\ ancestor\ of\ i\ and\ j\ in\ tree}" />
            <p>Cophenetic correlation:</p>
            <BlockMath math="\rho_{\mathrm{coph}} = \mathrm{corr}\!\big( \{d_H(i,j)\}, \{d_{\mathrm{coph}}(i,j)\} \big)" />
            <p>Anna: <InlineMath math="\rho_{\mathrm{coph}} = 0.6821" /> · random_int8 mean: <InlineMath math="0.1352" /> · z = 45.55σ.</p>
          </>
        }
      />

      <div className="border border-white/[0.06] bg-[#0A0A0A] p-3 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="block min-w-[640px]" style={{ width: '100%', height: 'auto' }}>
          {/* y-axis scale labels */}
          {[0, 16, 32, 48, 64].map((h) => {
            const y = 12 + (380 - 12 - 56) - (h / 64) * (380 - 12 - 56)
            return (
              <g key={h}>
                <line x1={28} x2={W - 8} y1={y} y2={y} stroke="rgba(255,255,255,0.04)" />
                <text x={4} y={y + 3} fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace">
                  {h}
                </text>
              </g>
            )
          })}

          {/* Tree branches */}
          {Array.from(positions.values()).map((p) => {
            if (p.isLeaf) return null
            const { node } = p
            if (!node.left || !node.right) return null
            const left = positions.get(node.left.id)!
            const right = positions.get(node.right.id)!
            const inSubtree = highlightedLeaves !== null && (
              node.members.every((m) => highlightedLeaves.has(m))
            )
            const stroke = inSubtree ? '#D4AF37' : 'rgba(212, 175, 55, 0.40)'
            const strokeWidth = inSubtree ? 2.5 : 1.2
            return (
              <g key={`edge-${node.id}`}>
                {/* Vertical to left child */}
                <line x1={left.x} y1={left.y} x2={left.x} y2={p.y} stroke={stroke} strokeWidth={strokeWidth} />
                {/* Vertical to right child */}
                <line x1={right.x} y1={right.y} x2={right.x} y2={p.y} stroke={stroke} strokeWidth={strokeWidth} />
                {/* Horizontal at merge height */}
                <line x1={left.x} y1={p.y} x2={right.x} y2={p.y} stroke={stroke} strokeWidth={strokeWidth} />
                {/* Clickable circle at merge */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={5}
                  fill={inSubtree ? '#D4AF37' : '#0A0A0A'}
                  stroke="#D4AF37"
                  strokeWidth={1}
                  className="cursor-pointer"
                  onClick={() => setSelectedSubtree(selectedSubtree === node.id ? null : node.id)}
                  aria-label={`subtree of ${node.members.length} concepts at height ${node.height}`}
                />
              </g>
            )
          })}

          {/* Leaves */}
          {leafOrder.map((leafId, idx) => {
            const p = positions.get(leafId)
            if (!p) return null
            const concept = concepts[leafId]
            if (!concept) return null
            const name = namingMap?.get(concept.conceptId)
            const label = name ? `${name.pairLabel}${name.polarity ?? ''}` : `#${concept.conceptId}`
            const colour = colorFor(idx)
            const isHovered = hoveredConcept === leafId
            const inHighlight = highlightedLeaves === null || highlightedLeaves.has(leafId)
            const yLabel = p.y + 22
            return (
              <g
                key={`leaf-${leafId}`}
                onMouseEnter={() => setHoveredConcept(leafId)}
                onMouseLeave={() => setHoveredConcept(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 4}
                  fill={colour}
                  opacity={inHighlight ? 1 : 0.25}
                  stroke={isHovered ? '#fff' : 'none'}
                  strokeWidth={1}
                />
                <text
                  x={p.x}
                  y={yLabel}
                  textAnchor="middle"
                  fill={inHighlight ? colour : 'rgba(255,255,255,0.25)'}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight={isHovered ? 700 : 400}
                >
                  {label}
                </text>
              </g>
            )
          })}

          {/* Hovered concept tooltip */}
          {hoveredConcept !== null && (() => {
            const p = positions.get(hoveredConcept)
            const concept = concepts[hoveredConcept]
            if (!p || !concept) return null
            const name = namingMap?.get(concept.conceptId)
            const label = name?.display ?? `Concept #${concept.conceptId}`
            return (
              <g pointerEvents="none">
                <rect x={p.x - 60} y={p.y - 36} width={120} height={20} rx={2} fill="#0A0A0A" stroke="#D4AF37" />
                <text x={p.x} y={p.y - 22} textAnchor="middle" fill="#D4AF37" fontSize="10" fontFamily="monospace">
                  {label} · n={concept.clusterSize}
                </text>
              </g>
            )
          })()}

          {/* y axis label */}
          <text x={2} y={H - 12} fill="rgba(255,255,255,0.45)" fontSize="10" fontFamily="monospace">
            ↑ merge height (Hamming distance, 0…64)
          </text>
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="border border-white/[0.06] bg-[#0A0A0A] p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/55 font-mono mb-1.5">
            Tree statistics
          </div>
          <div className="font-mono text-white/85 space-y-0.5">
            <div className="flex justify-between"><span className="text-white/55">Leaves</span><span>{concepts.length}</span></div>
            <div className="flex justify-between"><span className="text-white/55">Max merge height</span><span>{maxHeight}</span></div>
            <div className="flex justify-between"><span className="text-white/55">Antipodal pairs</span><span>{antipodalLinks.length}</span></div>
            <div className="flex justify-between"><span className="text-white/55">Phase N cophenet</span><span className="text-[#D4AF37]">0.68</span></div>
            <div className="flex justify-between"><span className="text-white/55">Random cophenet (mean)</span><span>0.135</span></div>
            <div className="flex justify-between"><span className="text-white/55">z vs random</span><span className="text-emerald-400">45.55σ</span></div>
          </div>
        </div>
        <div className="border border-white/[0.06] bg-[#0A0A0A] p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/55 font-mono mb-1.5">
            Click any merge point to highlight the subtree
          </div>
          {selectedSubtree !== null && positions.has(selectedSubtree) ? (
            <div className="text-xs text-white/85">
              Subtree of <strong className="text-[#D4AF37]">{positions.get(selectedSubtree)!.node.members.length}</strong> concepts;
              merge height <strong>{positions.get(selectedSubtree)!.node.height}</strong>.
              Members: {positions.get(selectedSubtree)!.node.members.map((m) => {
                const c = concepts[m]
                const name = namingMap?.get(c?.conceptId ?? -1)
                return name ? `${name.pairLabel}${name.polarity ?? ''}` : `#${c?.conceptId ?? '?'}`
              }).join(', ')}
              <button
                type="button"
                onClick={() => setSelectedSubtree(null)}
                className="ml-2 text-[10px] text-white/45 hover:text-white/85 underline"
              >
                clear
              </button>
            </div>
          ) : (
            <div className="text-[11px] text-white/50 italic">
              Each gold circle is a tree node — click to see its descendant concepts.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
