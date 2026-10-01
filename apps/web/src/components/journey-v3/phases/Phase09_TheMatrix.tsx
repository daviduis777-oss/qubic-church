'use client'

import { useRef, useState, useMemo } from 'react'
import { motion, useInView } from 'framer-motion'
import { PhaseWrapper } from '../shared/PhaseWrapper'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import { SourceCitation, SourceCitationGroup } from '../shared/SourceCitation'
import { Grid3X3, ZoomIn, Info, Layers } from 'lucide-react'

// Matrix visualization component
const specialRows = [
  { row: 21, name: 'Row 21', color: 'orange' },
  { row: 68, name: 'Row 68', color: 'purple' },
  { row: 96, name: 'Row 96', color: 'green' },
]

function MatrixExplorer() {
  const [hoveredCell, setHoveredCell] = useState<{
    row: number
    col: number
  } | null>(null)
  const [selectedRow, setSelectedRow] = useState<number | null>(null)

  // Generate a simplified 16x16 view of the matrix
  const matrixSize = 16
  const cellSize = 20

  const matrix = useMemo(() => {
    return Array.from({ length: matrixSize }, (_, row) =>
      Array.from({ length: matrixSize }, (_, col) => {
        // Simulate matrix values based on patterns
        const actualRow = row * 8
        const actualCol = col * 8
        const isSpecialRow = [21, 68, 96].includes(actualRow)
        const value = Math.floor(Math.sin(row * col) * 128)
        return { value, isSpecialRow }
      })
    )
  }, [])

  return (
    <div className="space-y-4">
      {/* Row selector */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-white/60">Jump to special row:</span>
        {specialRows.map(sr => (
          <button
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              selectedRow === sr.row
                ? sr.color === 'orange'
                  ? 'bg-gold/30 text-gold border border-orange-500/50'
                  : sr.color === 'purple'
                    ? 'bg-gold/30 text-gold border border-gold/30'
                    : 'bg-gold/30 text-gold border border-gold/30'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
            key={sr.row}
            onClick={() =>
              setSelectedRow(selectedRow === sr.row ? null : sr.row)
            }
            type="button"
          >
            Row {sr.row}: {sr.name}
          </button>
        ))}
      </div>

      {/* Matrix Grid */}
      <div className="p-4 bg-black/40 border border-white/10 overflow-x-auto">
        <div className="flex items-center gap-2 mb-3">
          <Grid3X3 className="w-4 h-4 text-white/60" />
          <span className="text-sm text-white/60">
            Anna Matrix (128x128 = 16,384 cells)
          </span>
        </div>

        <div
          className="inline-grid gap-px bg-white/5 p-1 "
          style={{
            gridTemplateColumns: `repeat(${matrixSize}, ${cellSize}px)`,
          }}
        >
          {matrix.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const actualRow = rowIndex * 8
              const isSelected =
                selectedRow !== null && actualRow === selectedRow
              const rowColor = specialRows.find(
                sr => sr.row === actualRow
              )?.color

              return (
                <motion.div
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? rowColor === 'orange'
                        ? 'bg-orange-500'
                        : rowColor === 'purple'
                          ? 'bg-purple-500'
                          : 'bg-gold'
                      : cell.isSpecialRow
                        ? 'bg-white/20'
                        : 'bg-white/5'
                  }`}
                  key={`${rowIndex}-${colIndex}`}
                  onMouseEnter={() =>
                    setHoveredCell({ row: actualRow, col: colIndex * 8 })
                  }
                  onMouseLeave={() => setHoveredCell(null)}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    opacity: Math.abs(cell.value) / 128,
                  }}
                  whileHover={{ scale: 1.2, zIndex: 10 }}
                />
              )
            })
          )}
        </div>

        {hoveredCell && (
          <motion.div
            animate={{ opacity: 1 }}
            className="mt-3 p-2  bg-white/5 text-sm text-center"
            initial={{ opacity: 0 }}
          >
            Position: [{hoveredCell.row}, {hoveredCell.col}]
          </motion.div>
        )}
      </div>
    </div>
  )
}

const memoryLayout = [
  { range: '0-20', function: '"Initialization" (unproven)', color: 'white/30' },
  { range: '21', function: '"Input layer" (unproven)', color: 'orange' },
  {
    range: '22-67',
    function: '"Hidden layer 1" (unproven)',
    color: 'white/20',
  },
  { range: '68', function: '"Cortex" (unproven)', color: 'purple' },
  {
    range: '69-95',
    function: '"Hidden layer 2" (unproven)',
    color: 'white/20',
  },
  { range: '96', function: '"Output layer" (unproven)', color: 'green' },
  { range: '97-127', function: '"Buffer" (unproven)', color: 'white/10' },
]

export function Phase09_TheMatrix() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.3 })

  return (
    <PhaseWrapper
      id="matrix"
      phaseNumber={9}
      subtitle="Inside Qubic's 128x128 neural architecture"
      title="The Matrix"
    >
      <div className="space-y-8" ref={ref}>
        {/* Introduction */}
        <motion.div
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          className="p-6 md:p-8 rounded-2xl bg-gradient-to-b from-[#050505]/80 to-black/50 border border-gold/20"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Grid3X3 className="w-6 h-6 text-gold" />
            <h3 className="text-xl font-bold text-white/90">The Anna Matrix</h3>
          </div>

          <p className="text-white/70 leading-relaxed mb-4">
            At the heart of Qubic is the{' '}
            <span className="text-gold font-semibold">Anna Matrix</span>, a
            128x128 table of 16,384 cells. Earlier versions gave each row a
            function. That layout was a community interpretation and is
            unproven:
          </p>

          {/* Memory Layout */}
          <div className="space-y-1">
            {memoryLayout.map((layer, index) => (
              <div
                className={`flex items-center gap-3 p-2  ${
                  layer.color === 'orange'
                    ? 'bg-gold/10 border-l-2 border-orange-500'
                    : layer.color === 'purple'
                      ? 'bg-gold/10 border-l-2 border-gold'
                      : layer.color === 'green'
                        ? 'bg-gold/10 border-l-2 border-green-500'
                        : 'bg-white/5'
                }`}
                key={index}
              >
                <span className="font-mono text-xs text-white/50 w-20">
                  Row {layer.range}
                </span>
                <span
                  className={`text-sm ${
                    layer.color === 'orange'
                      ? 'text-gold'
                      : layer.color === 'purple'
                        ? 'text-gold'
                        : layer.color === 'green'
                          ? 'text-gold'
                          : 'text-white/60'
                  }`}
                >
                  {layer.function}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Matrix Explorer */}
        <motion.div
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          className="p-6 rounded-2xl bg-white/5 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
            <ZoomIn className="w-5 h-5 text-gold" />
            Interactive Matrix Explorer
          </h3>
          <MatrixExplorer />
        </motion.div>

        {/* Key Numbers */}
        <motion.div
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="p-4 bg-white/5 border border-white/10 text-center">
            <div className="text-2xl font-mono font-bold text-white mb-1">
              128
            </div>
            <div className="text-xs text-white/50">Matrix dimension</div>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 text-center">
            <div className="text-2xl font-mono font-bold text-white mb-1">
              16,384
            </div>
            <div className="text-xs text-white/50">Total cells</div>
          </div>
          <div className="p-4 bg-gold/10 border border-gold/20 text-center">
            <div className="text-2xl font-mono font-bold text-gold mb-1">
              16,316
            </div>
            <div className="text-xs text-white/50">
              Cells with M[i,j] + M[127-i,127-j] = -1
            </div>
          </div>
          <div className="p-4 bg-gold/10 border border-orange-500/20 text-center">
            <div className="text-2xl font-mono font-bold text-gold mb-1">
              2,692
            </div>
            <div className="text-xs text-white/50">Boot address</div>
          </div>
        </motion.div>

        <CollapsibleSection
          badge="Arithmetic"
          icon={<Layers className="w-4 h-4" />}
          title="Row 21: where the formula lands"
        >
          <div className="space-y-3 text-sm text-white/70">
            <p>
              The boot address from the formula lands in{' '}
              <span className="text-gold font-semibold">Row 21</span>:
            </p>
            <div className="p-3 bg-black/30 font-mono text-xs">
              <div>625,284 mod 16,384 = 2,692</div>
              <div>2,692 / 128 = Row 21</div>
              <div>2,692 mod 128 = Column 4</div>
              <div className="text-gold mt-2">Boot address: [21, 4]</div>
            </div>
            <p>
              The arithmetic is correct. Earlier versions called Row 21 an input
              layer for Bitcoin data. Nothing in the matrix or in the Aigarth
              code supports that label, and it has been withdrawn.
            </p>
          </div>
        </CollapsibleSection>

        <SourceCitationGroup>
          <SourceCitation
            href="/docs/03-results/01-matrix-symmetry"
            title="Matrix Symmetry"
          />
          <SourceCitation
            href="/docs/03-results/35-corrections-september-2026"
            title="Corrections (September 2026)"
          />
        </SourceCitationGroup>
      </div>
    </PhaseWrapper>
  )
}
