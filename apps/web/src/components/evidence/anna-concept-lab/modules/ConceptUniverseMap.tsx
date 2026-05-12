'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Compass } from 'lucide-react'

import type { Concept, ConceptNamingMap } from '../types'
import { BitToggleRow } from '../components/BitToggleRow'
import { ExplainPanel } from '@/components/evidence/lab-primitives'
import { EXPLAIN_CONCEPT_UNIVERSE } from '../components/explainContent'

/**
 * Module 4 — Concept Universe Map.
 *
 * Interactive 2D scatter of all 19 concept centroids via PCA.
 * Antipodal pairs connected by lines.
 * Click a concept → see centroid + size + family details.
 */

interface ConceptWithPCA extends Concept {
  pcaX: number
  pcaY: number
}

interface ConceptsWithPCAFile {
  concepts: Array<{
    concept_id: number
    centroid: number[]
    cluster_size: number
    pos_count: number
    family: number
    is_antipode_of: number | null
    pca_x: number
    pca_y: number
  }>
  pca_explained_variance: number[]
}

export function ConceptUniverseMap({
  namingMap,
  className,
}: {
  namingMap?: ConceptNamingMap
  className?: string
}) {
  const [data, setData] = useState<{ concepts: ConceptWithPCA[]; var: number[] } | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(0) // start with concept 0 selected
  const [hoverId, setHoverId] = useState<number | null>(null)

  useEffect(() => {
    fetch('/data/phase_n/concepts_with_pca.json')
      .then((r) => r.json() as Promise<ConceptsWithPCAFile>)
      .then((d) => {
        const concepts: ConceptWithPCA[] = d.concepts.map((c) => ({
          conceptId: c.concept_id,
          centroid: c.centroid,
          clusterSize: c.cluster_size,
          posCount: c.pos_count,
          family: c.family,
          isAntipodeOf: c.is_antipode_of,
          pcaX: c.pca_x,
          pcaY: c.pca_y,
        }))
        setData({ concepts, var: d.pca_explained_variance })
      })
  }, [])

  const selected = useMemo(() => {
    if (!data || selectedId === null) return null
    return data.concepts.find((c) => c.conceptId === selectedId) ?? null
  }, [data, selectedId])

  const antipode = useMemo(() => {
    if (!data || !selected || selected.isAntipodeOf === null) return null
    return data.concepts.find((c) => c.conceptId === selected.isAntipodeOf) ?? null
  }, [data, selected])

  if (!data) {
    return (
      <div className="text-xs text-white/40 italic p-4">Loading concept map...</div>
    )
  }

  // Map size + padding
  const SIZE = 480
  const PAD = 40
  const usable = SIZE - 2 * PAD
  const toX = (x: number) => PAD + ((x + 1) / 2) * usable
  const toY = (y: number) => PAD + ((1 - (y + 1) / 2)) * usable

  // Determine dot size based on cluster size (log scale 8..28 px)
  const sizes = data.concepts.map((c) => c.clusterSize)
  const minSize = Math.min(...sizes)
  const maxSize = Math.max(...sizes)
  const dotRadius = (s: number) => {
    const t = (Math.log(s) - Math.log(minSize)) / (Math.log(maxSize) - Math.log(minSize) || 1)
    return 6 + t * 16
  }

  // Apply jitter to colliding dots: many concepts cluster around PCA (1, ?)
  const POS_COLLISION_PX = 22
  const positions = new Map<number, { x: number; y: number }>()
  data.concepts.forEach((c) => positions.set(c.conceptId, { x: toX(c.pcaX), y: toY(c.pcaY) }))
  for (const c of data.concepts) {
    const cp = positions.get(c.conceptId)
    if (!cp) continue
    for (const o of data.concepts) {
      if (o.conceptId <= c.conceptId) continue
      const op = positions.get(o.conceptId)
      if (!op) continue
      const dist = Math.hypot(cp.x - op.x, cp.y - op.y)
      if (dist < POS_COLLISION_PX) {
        const angle = (o.conceptId * 137) % 360
        const rad = (angle * Math.PI) / 180
        positions.set(o.conceptId, {
          x: op.x + Math.cos(rad) * (POS_COLLISION_PX - dist + 4),
          y: op.y + Math.sin(rad) * (POS_COLLISION_PX - dist + 4),
        })
      }
    }
  }

  // Hover-clear focus set (focused = hovered + its antipode, if any)
  const focusedIds = new Set<number>()
  if (hoverId !== null) {
    focusedIds.add(hoverId)
    const hovered = data.concepts.find((c) => c.conceptId === hoverId)
    if (hovered?.isAntipodeOf !== null && hovered?.isAntipodeOf !== undefined) {
      focusedIds.add(hovered.isAntipodeOf)
    }
  }
  const isHovering = hoverId !== null

  const labelOf = (cid: number): string => {
    const name = namingMap?.get(cid)
    if (!name) return `${cid}`
    return name.polarity ? `${name.pairLabel}${name.polarity}` : name.pairLabel
  }

  const familyColors: Record<number, string> = {
    0: '#D4AF37',
    1: '#10b981',
    2: '#3b82f6',
    3: '#a78bfa',
    4: '#fb923c',
    5: '#f43f5e',
    6: '#06b6d4',
    7: '#84cc16',
    8: '#ec4899',
    9: '#facc15',
    10: '#22d3ee',
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div>
        <h3 className="text-base font-semibold tracking-wide text-[#D4AF37]/90 inline-flex items-center gap-2">
          <Compass className="w-4 h-4" />
          Concept Universe Map
        </h3>
        <p className="text-xs text-white/50 mt-0.5">
          All 19 of Anna&apos;s concept attractors in 2D (PCA).
          Lines connect antipodal pairs. Dot size = cluster size.
          Click any concept to inspect.
        </p>
      </div>

      <ExplainPanel
        kid={EXPLAIN_CONCEPT_UNIVERSE.kid}
        simple={EXPLAIN_CONCEPT_UNIVERSE.simple}
        researcher={EXPLAIN_CONCEPT_UNIVERSE.researcher}
        math={EXPLAIN_CONCEPT_UNIVERSE.math}
        title="What is this map showing?"
        defaultCollapsed
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Map */}
        <div className="bg-black/30 border border-white/[0.06] p-4">
          <svg
            width="100%"
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            xmlns="http://www.w3.org/2000/svg"
            className="select-none"
            role="img"
            aria-label="Concept Universe Map: 19 concept attractors in 2D PCA space, 8 antipodal pairs connected by lines"
          >
            <title>Concept Universe Map</title>
            <desc>
              {`Each dot represents one of Anna's 19 concept attractors. Dot size reflects cluster size; lines connect antipodal pairs. PC1 explains ${(data.var[0] !== undefined ? data.var[0]! * 100 : 0).toFixed(1)}% of variance, PC2 ${(data.var[1] !== undefined ? data.var[1]! * 100 : 0).toFixed(1)}%.`}
            </desc>
            {/* Grid lines */}
            <line
              x1={PAD}
              y1={SIZE / 2}
              x2={SIZE - PAD}
              y2={SIZE / 2}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
              strokeDasharray="2 4"
            />
            <line
              x1={SIZE / 2}
              y1={PAD}
              x2={SIZE / 2}
              y2={SIZE - PAD}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
              strokeDasharray="2 4"
            />
            {/* Origin label */}
            <text x={SIZE / 2 + 4} y={SIZE / 2 - 4} fill="rgba(255,255,255,0.2)" fontSize={9} fontFamily="monospace">
              0
            </text>

            {/* Antipodal lines */}
            {data.concepts.map((c) => {
              if (c.isAntipodeOf === null || c.conceptId > c.isAntipodeOf) return null
              const partner = data.concepts.find((p) => p.conceptId === c.isAntipodeOf)
              if (!partner) return null
              const cp = positions.get(c.conceptId)
              const pp = positions.get(partner.conceptId)
              if (!cp || !pp) return null
              const isHi =
                hoverId === c.conceptId ||
                hoverId === c.isAntipodeOf ||
                selectedId === c.conceptId ||
                selectedId === c.isAntipodeOf
              return (
                <line
                  key={`line-${c.conceptId}`}
                  x1={cp.x}
                  y1={cp.y}
                  x2={pp.x}
                  y2={pp.y}
                  stroke={isHi ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.08)'}
                  strokeWidth={isHi ? 1.5 : 1}
                  strokeDasharray={isHi ? '0' : '2 3'}
                />
              )
            })}

            {/* Dots */}
            {data.concepts.map((c) => {
              const pos = positions.get(c.conceptId) ?? { x: toX(c.pcaX), y: toY(c.pcaY) }
              const r = dotRadius(c.clusterSize)
              const color = familyColors[c.family] ?? '#fff'
              const isSelected = selectedId === c.conceptId
              const isHover = hoverId === c.conceptId
              const isFocused = isHovering ? focusedIds.has(c.conceptId) : true
              const fillOpacity = !isHovering
                ? isSelected
                  ? 0.85
                  : 0.55
                : isFocused
                  ? 0.9
                  : 0.15
              return (
                <g key={`pt-${c.conceptId}`}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r}
                    fill={color}
                    fillOpacity={fillOpacity}
                    stroke={isSelected ? '#fff' : isHover ? color : 'transparent'}
                    strokeWidth={isSelected ? 2 : isHover ? 1 : 0}
                    style={{ cursor: 'pointer', transition: 'fill-opacity 0.15s' }}
                    onMouseEnter={() => setHoverId(c.conceptId)}
                    onMouseLeave={() => setHoverId(null)}
                    onClick={() => setSelectedId(c.conceptId)}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 3}
                    textAnchor="middle"
                    fill={isSelected ? '#000' : 'rgba(255,255,255,0.95)'}
                    fontSize={Math.max(8, r - 4)}
                    fontFamily="monospace"
                    fontWeight={isSelected ? 700 : 600}
                    pointerEvents="none"
                    opacity={!isHovering || isFocused ? 1 : 0.3}
                  >
                    {labelOf(c.conceptId)}
                  </text>
                </g>
              )
            })}
          </svg>
          <div className="mt-2 text-[10px] text-white/40 font-mono flex justify-between">
            <span>PC1: {(data.var[0]! * 100).toFixed(1)}% variance</span>
            <span>PC2: {(data.var[1]! * 100).toFixed(1)}% variance</span>
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex flex-col gap-3">
          {selected ? (
            <>
              <motion.div
                key={selected.conceptId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-black/30 border border-[#D4AF37]/30 bg-[#D4AF37]/[0.04]"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-[#D4AF37]">
                      {namingMap?.get(selected.conceptId)?.display ?? `#${selected.conceptId}`}
                    </span>
                    <span className="text-[10px] text-white/50 font-mono">
                      #{selected.conceptId} · family {selected.family}
                    </span>
                  </div>
                  <div className="text-xs text-white/60">
                    cluster size <span className="text-[#D4AF37]">{selected.clusterSize}</span>
                  </div>
                </div>

                <div className="text-[10px] text-white/50 font-mono mb-1">centroid (64 bits)</div>
                <BitToggleRow bits={selected.centroid} readonly layout="4x16" cellSize="md" />

                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div>
                    <div className="text-[10px] text-white/40">positive bits</div>
                    <div className="text-white/85">{selected.posCount}/64</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40">antipode</div>
                    <div className="text-white/85">
                      {selected.isAntipodeOf !== null
                        ? namingMap?.get(selected.isAntipodeOf)?.display ?? `#${selected.isAntipodeOf}`
                        : 'singleton (no antipode)'}
                    </div>
                  </div>
                </div>
              </motion.div>

              {antipode && (
                <motion.div
                  key={antipode.conceptId}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-black/30 border border-rose-500/30"
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-bold text-rose-400">
                        ↔ {namingMap?.get(antipode.conceptId)?.display ?? `#${antipode.conceptId}`}
                      </span>
                      <span className="text-[10px] text-white/50">
                        antipodal partner · #{antipode.conceptId}
                      </span>
                    </div>
                    <div className="text-xs text-white/60">
                      size <span>{antipode.clusterSize}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-white/50 font-mono mb-1">centroid (64 bits)</div>
                  <BitToggleRow bits={antipode.centroid} readonly layout="4x16" cellSize="md" />
                </motion.div>
              )}

              <div className="px-3 py-2 bg-black/30 border border-white/[0.06] text-[11px] text-white/55 leading-relaxed">
                Anna&apos;s antipodal antisymmetry produces 8 antipodal pairs (centroids 64/64 mirrored)
                plus 3 singletons — 19 concepts total. The 8 pairs span the PC1 axis (81.7% of variance),
                showing the concept space is essentially 1-dimensional with a binary primary axis.
              </div>
            </>
          ) : (
            <div className="text-xs text-white/50 italic">Click a concept on the map.</div>
          )}
        </div>
      </div>

      {/* Screen-reader-only data table for accessibility */}
      <table className="sr-only">
        <caption>19 concept centroids and their antipodal partners</caption>
        <thead>
          <tr>
            <th>Pair</th>
            <th>Concept ID</th>
            <th>Cluster size</th>
            <th>Family</th>
            <th>Antipode</th>
          </tr>
        </thead>
        <tbody>
          {data.concepts.map((c) => {
            const name = namingMap?.get(c.conceptId)
            return (
              <tr key={`sr-${c.conceptId}`}>
                <td>{name?.display ?? '-'}</td>
                <td>#{c.conceptId}</td>
                <td>{c.clusterSize}</td>
                <td>{c.family}</td>
                <td>
                  {c.isAntipodeOf !== null
                    ? namingMap?.get(c.isAntipodeOf)?.display ?? `#${c.isAntipodeOf}`
                    : 'singleton'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
