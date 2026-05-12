'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Grid3X3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hammingDistance } from '@/lib/ait'
import type { Concept, ConceptNamingMap } from '../types'
import { BitToggleRow } from '../components/BitToggleRow'
import { ExplainPanel } from '@/components/evidence/lab-primitives'
import { EXPLAIN_SIMILARITY } from '../components/explainContent'

export interface ConceptSimilarityMatrixProps {
  concepts: Concept[]
  namingMap?: ConceptNamingMap
  className?: string
}

const CELL_PX = 28

export function ConceptSimilarityMatrix({
  concepts,
  namingMap,
  className,
}: ConceptSimilarityMatrixProps) {
  const [selectedPair, setSelectedPair] = useState<[number, number] | null>(null)

  const matrix = useMemo(() => {
    const out: number[][] = []
    for (let i = 0; i < concepts.length; i++) {
      const row: number[] = []
      const ci = new Int8Array(concepts[i]!.centroid)
      for (let j = 0; j < concepts.length; j++) {
        const cj = new Int8Array(concepts[j]!.centroid)
        row.push(hammingDistance(ci, cj))
      }
      out.push(row)
    }
    return out
  }, [concepts])

  const colorFor = (d: number): string => {
    const t = d / 64
    const lightness = 8 + t * 65 // 8% (dark) -> 73% (bright)
    return `hsl(45, 85%, ${lightness}%)`
  }

  const labelFor = (i: number): string => {
    const c = concepts[i]
    if (!c) return ''
    const name = namingMap?.get(c.conceptId)
    return name ? `${name.pairLabel}${name.polarity ?? ''}` : `#${c.conceptId}`
  }

  const selectedI = selectedPair?.[0] ?? null
  const selectedJ = selectedPair?.[1] ?? null
  const selectedDist =
    selectedI !== null && selectedJ !== null ? matrix[selectedI]?.[selectedJ] ?? null : null

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div>
        <h3 className="text-base font-semibold tracking-wide text-[#D4AF37]/90 inline-flex items-center gap-2">
          <Grid3X3 className="w-4 h-4" />
          Concept Similarity Matrix
        </h3>
        <p className="text-xs text-white/55 mt-0.5">
          Pairwise Hamming distance between concept centroids. Antipodal pairs show as hot 64-bit cells off the diagonal.
        </p>
      </div>

      <ExplainPanel
        kid={EXPLAIN_SIMILARITY.kid}
        simple={EXPLAIN_SIMILARITY.simple}
        researcher={EXPLAIN_SIMILARITY.researcher}
        math={EXPLAIN_SIMILARITY.math}
        title="How to read this matrix?"
        defaultCollapsed
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-black/30 border border-white/[0.06] p-3 overflow-x-auto">
          <div
            className="inline-grid gap-px"
            style={{ gridTemplateColumns: `auto repeat(${concepts.length}, ${CELL_PX}px)` }}
          >
            <div />
            {concepts.map((_, j) => (
              <div
                key={`top-${j}`}
                className="text-[9px] text-white/55 font-mono text-center self-end pb-0.5"
              >
                {labelFor(j)}
              </div>
            ))}
            {matrix.map((row, i) => (
              <div key={`row-${i}`} className="contents">
                <div className="text-[9px] text-white/55 font-mono pr-1 self-center">
                  {labelFor(i)}
                </div>
                {row.map((d, j) => (
                  <button
                    type="button"
                    key={`cell-${i}-${j}`}
                    onClick={() => setSelectedPair([i, j])}
                    title={`${labelFor(i)} ↔ ${labelFor(j)}: ${d}/64`}
                    aria-label={`distance ${labelFor(i)} to ${labelFor(j)} is ${d} bits`}
                    className={cn(
                      'transition-all',
                      selectedI === i && selectedJ === j && 'ring-2 ring-[#D4AF37]',
                    )}
                    style={{
                      width: CELL_PX,
                      height: CELL_PX,
                      backgroundColor: colorFor(d),
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div>
          {selectedPair && selectedI !== null && selectedJ !== null && selectedDist !== null ? (
            <motion.div
              key={`pair-${selectedI}-${selectedJ}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 p-3 bg-black/30 border border-[#D4AF37]/30"
            >
              <div className="text-xs text-white/55">
                {labelFor(selectedI)} ↔ {labelFor(selectedJ)}
              </div>
              <div className="text-2xl font-mono text-[#D4AF37]">{selectedDist}/64 bits differ</div>
              <div className="text-[11px] text-white/55">
                {selectedDist === 0 && '(same concept)'}
                {selectedDist === 64 && '(antipodal — every bit flipped)'}
                {selectedDist > 0 && selectedDist < 64 && `(${(100 * selectedDist / 64).toFixed(0)} % of bits differ)`}
              </div>
              <div className="space-y-1 mt-2">
                <div className="text-[9px] text-white/45 font-mono">{labelFor(selectedI)} centroid</div>
                <BitToggleRow
                  bits={new Int8Array(concepts[selectedI]!.centroid)}
                  readonly
                  layout="4x16"
                  cellSize="sm"
                />
              </div>
              <div className="space-y-1">
                <div className="text-[9px] text-white/45 font-mono">{labelFor(selectedJ)} centroid</div>
                <BitToggleRow
                  bits={new Int8Array(concepts[selectedJ]!.centroid)}
                  readonly
                  layout="4x16"
                  cellSize="sm"
                />
              </div>
            </motion.div>
          ) : (
            <div className="text-xs text-white/45 italic p-4 bg-black/20 border border-white/[0.04]">
              Click any cell to compare two concepts. Antipodal pairs (64/64 distance) show as the brightest cells.
            </div>
          )}
        </div>
      </div>

      {/* SR-only data table for accessibility */}
      <table className="sr-only">
        <caption>Pairwise Hamming distances between 19 concept centroids</caption>
        <thead>
          <tr>
            <th>Pair</th>
            {concepts.map((_, j) => (
              <th key={`th-${j}`}>{labelFor(j)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={`sr-${i}`}>
              <th>{labelFor(i)}</th>
              {row.map((d, j) => (
                <td key={`sr-cell-${i}-${j}`}>{d}/64</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
