'use client'

import { useRef, useState, useMemo } from 'react'
import { motion, useInView } from 'framer-motion'
import { PhaseWrapper } from '../shared/PhaseWrapper'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import { SourceCitation, SourceCitationGroup } from '../shared/SourceCitation'
import { Grid3X3, ZoomIn, Info, Layers } from 'lucide-react'

// Matrix visualization component
function MatrixExplorer() {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null)
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

  const specialRows = [
    { row: 21, name: 'Bitcoin Input Layer', color: 'orange' },
    { row: 68, name: 'Primary Cortex', color: 'purple' },
    { row: 96, name: 'Output Layer', color: 'green' },
  ]

  return (
    <div className="space-y-4">
      {/* Row selector */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-white/60">Jump to special row:</span>
        {specialRows.map((sr) => (
          <button
            key={sr.row}
            onClick={() => setSelectedRow(selectedRow === sr.row ? null : sr.row)}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              selectedRow === sr.row
                ? sr.color === 'orange'
                  ? 'bg-[#D4AF37]/30 text-[#D4AF37] border border-orange-500/50'
                  : sr.color === 'purple'
                  ? 'bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37]/30'
                  : 'bg-[#D4AF37]/30 text-[#D4AF37] border border-[#D4AF37]/30'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            Row {sr.row}: {sr.name}
          </button>
        ))}
      </div>

      {/* Matrix Grid */}
      <div className="p-4 bg-black/40 border border-white/10 overflow-x-auto">
        <div className="flex items-center gap-2 mb-3">
          <Grid3X3 className="w-4 h-4 text-white/60" />
          <span className="text-sm text-white/60">Anna Matrix (128x128 = 16,384 cells)</span>
        </div>

        <div
          className="inline-grid gap-px bg-white/5 p-1 "
          style={{ gridTemplateColumns: `repeat(${matrixSize}, ${cellSize}px)` }}
        >
          {matrix.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const actualRow = rowIndex * 8
              const isSelected = selectedRow !== null && actualRow === selectedRow
              const rowColor = specialRows.find((sr) => sr.row === actualRow)?.color

              return (
                <motion.div
                  key={`${rowIndex}-${colIndex}`}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? rowColor === 'orange'
                        ? 'bg-orange-500'
                        : rowColor === 'purple'
                        ? 'bg-purple-500'
                        : 'bg-[#D4AF37]'
                      : cell.isSpecialRow
                      ? 'bg-white/20'
                      : 'bg-white/5'
                  }`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    opacity: Math.abs(cell.value) / 128,
                  }}
                  onMouseEnter={() => setHoveredCell({ row: actualRow, col: colIndex * 8 })}
                  onMouseLeave={() => setHoveredCell(null)}
                  whileHover={{ scale: 1.2, zIndex: 10 }}
                />
              )
            })
          )}
        </div>

        {hoveredCell && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 p-2  bg-white/5 text-sm text-center"
          >
            Position: [{hoveredCell.row}, {hoveredCell.col}]
          </motion.div>
        )}
      </div>
    </div>
  )
}

export function Phase09_TheMatrix() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.3 })

  const memoryLayout = [
    { range: '0-20', function: 'Initialization', color: 'white/30' },
    { range: '21', function: 'Bitcoin Input Layer', color: 'orange' },
    { range: '22-67', function: 'Hidden Layer 1', color: 'white/20' },
    { range: '68', function: 'Primary Cortex (137 writers)', color: 'purple' },
    { range: '69-95', function: 'Hidden Layer 2', color: 'white/20' },
    { range: '96', function: 'Output Layer', color: 'green' },
    { range: '97-127', function: 'Buffer/Reserved', color: 'white/10' },
  ]

  return (
    <PhaseWrapper
      id="matrix"
      phaseNumber={9}
      title="The Matrix"
      subtitle="Inside Qubic's 128x128 neural architecture"
    >
      <div ref={ref} className="space-y-8">
        {/* Introduction */}
        <motion.div
          className="p-6 md:p-8 rounded-2xl bg-gradient-to-b from-[#050505]/80 to-black/50 border border-[#D4AF37]/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Grid3X3 className="w-6 h-6 text-[#D4AF37]" />
            <h3 className="text-xl font-bold text-white/90">The Anna Matrix</h3>
          </div>

          <p className="text-white/70 leading-relaxed mb-4">
            At the heart of Qubic is the{' '}
            <span className="text-[#D4AF37] font-semibold">Anna Matrix</span> - a 128x128 grid of
            16,384 cells that forms the neural tissue of Aigarth. Each row has a specific function:
          </p>

          {/* Memory Layout */}
          <div className="space-y-1">
            {memoryLayout.map((layer, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-2  ${
                  layer.color === 'orange'
                    ? 'bg-[#D4AF37]/10 border-l-2 border-orange-500'
                    : layer.color === 'purple'
                    ? 'bg-[#D4AF37]/10 border-l-2 border-[#D4AF37]'
                    : layer.color === 'green'
                    ? 'bg-[#D4AF37]/10 border-l-2 border-green-500'
                    : 'bg-white/5'
                }`}
              >
                <span className="font-mono text-xs text-white/50 w-20">Row {layer.range}</span>
                <span
                  className={`text-sm ${
                    layer.color === 'orange'
                      ? 'text-[#D4AF37]'
                      : layer.color === 'purple'
                      ? 'text-[#D4AF37]'
                      : layer.color === 'green'
                      ? 'text-[#D4AF37]'
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
          className="p-6 rounded-2xl bg-white/5 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
            <ZoomIn className="w-5 h-5 text-[#D4AF37]" />
            Interactive Matrix Explorer
          </h3>
          <MatrixExplorer />
        </motion.div>

        {/* Key Numbers */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="p-4 bg-white/5 border border-white/10 text-center">
            <div className="text-2xl font-mono font-bold text-white mb-1">128</div>
            <div className="text-xs text-white/50">Matrix dimension</div>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 text-center">
            <div className="text-2xl font-mono font-bold text-white mb-1">16,384</div>
            <div className="text-xs text-white/50">Total cells</div>
          </div>
          <div className="p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-center">
            <div className="text-2xl font-mono font-bold text-[#D4AF37] mb-1">137</div>
            <div className="text-xs text-white/50">Writers in Row 68</div>
          </div>
          <div className="p-4 bg-[#D4AF37]/10 border border-orange-500/20 text-center">
            <div className="text-2xl font-mono font-bold text-[#D4AF37] mb-1">2,692</div>
            <div className="text-xs text-white/50">Boot address</div>
          </div>
        </motion.div>

        <CollapsibleSection
          title="Row 21: The Bitcoin Connection"
          icon={<Layers className="w-4 h-4" />}
          badge="Key Finding"
        >
          <div className="space-y-3 text-sm text-white/70">
            <p>
              The boot address from the formula lands in{' '}
              <span className="text-[#D4AF37] font-semibold">Row 21</span>:
            </p>
            <div className="p-3 bg-black/30 font-mono text-xs">
              <div>625,284 mod 16,384 = 2,692</div>
              <div>2,692 / 128 = Row 21</div>
              <div>2,692 mod 128 = Column 4</div>
              <div className="text-[#D4AF37] mt-2">Boot address: [21, 4]</div>
            </div>
            <p>
              Row 21 is designated as the{' '}
              <span className="text-[#D4AF37]">Bitcoin Input Layer</span> - the entry point where
              Bitcoin blockchain data feeds into Anna's neural network.
            </p>
          </div>
        </CollapsibleSection>

        <SourceCitationGroup>
          <SourceCitation
            href="/docs/03-results/03-jinn-architecture"
            title="JINN Architecture"
            tier={2}
          />
          <SourceCitation
            href="/docs/03-results/01-bitcoin-bridge"
            title="The Data Bridge"
            tier={1}
          />
        </SourceCitationGroup>
      </div>
    </PhaseWrapper>
  )
}
