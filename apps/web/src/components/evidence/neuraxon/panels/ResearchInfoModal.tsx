'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Brain,
  Layers,
  AlertTriangle,
  Network,
  TrendingUp,
  RotateCcw,
  Zap,
  HelpCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResearchInfoModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SectionData {
  icon: React.ElementType
  title: string
  content: React.ReactNode
}

export function ResearchInfoModal({ isOpen, onClose }: ResearchInfoModalProps) {
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set([0]))

  const toggleSection = (index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const sections: SectionData[] = [
    {
      icon: HelpCircle,
      title: 'What Am I Looking At?',
      content: (
        <div className="space-y-2">
          <p className="text-xs text-white/60 leading-relaxed">
            This is a multi-layer 3D visualization of the Anna Matrix -- a 128x128 integer matrix
            at the heart of a ternary neural network research project. Five distinct layers are
            stacked together, each revealing a different dimension of the matrix's mathematical
            structure.
          </p>
          <p className="text-xs text-white/60 leading-relaxed">
            Toggle layers on and off with the control panel, click on elements for details,
            and use the camera presets to jump between viewpoints. Each layer represents
            months of computational analysis distilled into a single interactive scene.
          </p>
        </div>
      ),
    },
    {
      icon: Layers,
      title: 'Matrix Terrain (Layer 1)',
      content: (
        <div className="space-y-2">
          <p className="text-xs text-white/60 leading-relaxed">
            The base layer renders the full 128x128 Anna Matrix as a 3D heightmap.
            Each cell becomes a column whose height represents the cell value.
            Blue columns are negative values, gold columns are positive.
          </p>
          <div className="space-y-1.5 mt-2">
            <StatRow label="Dimensions" value="128 x 128 (16,384 cells)" />
            <StatRow label="Value Range" value="-128 to +127" />
            <StatRow label="Point Symmetry" value="99.58%" />
          </div>
          <div className="mt-2 bg-white/[0.03] border border-white/[0.06] p-2">
            <p className="text-[11px] text-white/40 leading-relaxed">
              <span className="text-[#D4AF37]/70 font-medium">Row Stratification: </span>
              The matrix has three functionally distinct row bands.
              Row 21 serves as the Input layer where external data enters.
              Row 68 is the Transform layer where 137 write operations occur.
              Row 96 is the Output layer where processed results exit.
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: AlertTriangle,
      title: 'Anomaly Markers (Layer 2)',
      content: (
        <div className="space-y-2">
          <p className="text-xs text-white/60 leading-relaxed">
            Of the 16,384 cells, the matrix exhibits near-perfect point symmetry:
            for almost every cell, M[r,c] + M[127-r, 127-c] = -1. Only 68 cells
            break this rule. These are the anomaly markers, shown as glowing indicators
            hovering above the terrain.
          </p>
          <div className="space-y-1.5 mt-2">
            <StatRow label="Anomaly Count" value="68 cells (34 pairs)" />
            <StatRow label="Key Columns" value="22/105 (13 anomalies) and 97/30 (14 anomalies)" />
            <StatRow label="Special Position" value="[22, 22]" />
          </div>
          <div className="mt-2 bg-white/[0.03] border border-white/[0.06] p-2">
            <p className="text-[11px] text-white/40 leading-relaxed">
              <span className="text-[#D4AF37]/70 font-medium">Why it matters: </span>
              The 34 paired positions form mirror-symmetric coordinates. Position [22,22] is
              the only cell where the value equals its mirror value. These breaks may encode
              structural information within the matrix's otherwise rigid symmetry.
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: Network,
      title: 'Bridge Network (Layer 3)',
      content: (
        <div className="space-y-2">
          <p className="text-xs text-white/60 leading-relaxed">
            The bridge layer maps Anna Matrix columns to real Bitcoin and Qubic addresses
            using K12 (KangarooTwelve) cryptographic hashing. Nodes float above the terrain,
            connected by lines representing verified mathematical relationships.
          </p>
          <div className="space-y-1.5 mt-2">
            <StatRow label="Total Nodes" value="165" />
            <StatRow label="Connections" value="95" />
            <StatRow label="Symmetric Pairs" value="36" />
            <StatRow label="Hash Function" value="K12 (KangarooTwelve)" />
          </div>
          <div className="mt-2 bg-white/[0.03] border border-white/[0.06] p-2">
            <p className="text-[11px] text-white/40 leading-relaxed">
              <span className="text-[#D4AF37]/70 font-medium">Cross-chain links: </span>
              Each node represents a matrix column that maps to a cryptographic identity.
              The network includes Bitcoin genesis addresses, Qubic identities, and
              special addresses like 1EXoDus. Click any node for its full details.
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: TrendingUp,
      title: 'Eigenvalue Spiral (Layer 4)',
      content: (
        <div className="space-y-2">
          <p className="text-xs text-white/60 leading-relaxed">
            The 128 eigenvalues of the Anna Matrix are plotted in the 3D complex plane
            as a spiral. Each point represents a fundamental oscillation mode. The
            horizontal axes show real and imaginary parts, while the vertical axis
            shows magnitude.
          </p>
          <div className="space-y-1.5 mt-2">
            <StatRow label="Eigenvalue Count" value="128" />
            <StatRow label="Dominant Angle" value="90.456 degrees" />
            <StatRow label="Spectral Dominance" value="40.4%" />
            <StatRow label="Scale Invariance" value="Preserved 2x2 to 128x128" />
          </div>
          <div className="mt-2 bg-white/[0.03] border border-white/[0.06] p-2">
            <p className="text-[11px] text-white/40 leading-relaxed">
              <span className="text-[#D4AF37]/70 font-medium">Key discovery: </span>
              The dominant eigenvalue sits at 90.456 degrees with 40.4% of the total
              spectral power -- meaning nearly half of the matrix's dynamics are governed
              by a single near-90-degree rotation. This angle is preserved when the matrix
              is scaled from 2x2 all the way to 128x128, a property unique to the Anna Matrix
              (0% of 5,000 random matrices tested show this).
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: RotateCcw,
      title: 'Period-4 Cycle (Layer 5)',
      content: (
        <div className="space-y-2">
          <p className="text-xs text-white/60 leading-relaxed">
            The 90-degree eigenvalue creates a period-4 behavioral cycle: the system
            returns to its starting state every 4 ticks. In artificial life simulations,
            this manifests as a repeating rhythm of cooperation and rest.
          </p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <PhaseTag label="COOP" color="bg-emerald-500/20 text-emerald-400/80 border-emerald-500/30" />
            <ChevronRight className="w-3 h-3 text-white/20" />
            <PhaseTag label="COOP" color="bg-emerald-500/20 text-emerald-400/80 border-emerald-500/30" />
            <ChevronRight className="w-3 h-3 text-white/20" />
            <PhaseTag label="REST" color="bg-blue-500/20 text-blue-400/80 border-blue-500/30" />
            <ChevronRight className="w-3 h-3 text-white/20" />
            <PhaseTag label="REST" color="bg-blue-500/20 text-blue-400/80 border-blue-500/30" />
          </div>
          <div className="space-y-1.5 mt-2">
            <StatRow label="Cooperation Rate" value="33.0% (+-0.1%)" />
            <StatRow label="Validation" value="10M ticks, multiple seeds" />
            <StatRow label="Random Matrix Rate" value="0% show period-4" />
          </div>
          <div className="mt-2 bg-white/[0.03] border border-white/[0.06] p-2">
            <p className="text-[11px] text-white/40 leading-relaxed">
              <span className="text-[#D4AF37]/70 font-medium">Structural attractor: </span>
              The 33% cooperation rate is not random -- it is a mathematical consequence
              of the eigenvalue structure. Two out of every four phases are cooperative,
              giving exactly 2/4 = 50% active phases, with measured cooperation at 33.0%
              across all tested seeds. This is Anna-specific: random matrices do not produce
              stable period-4 cycles.
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: Zap,
      title: 'Key Research Results',
      content: (
        <div className="space-y-2">
          <p className="text-xs text-white/60 leading-relaxed">
            Compared to random 128x128 matrices in identical artificial life simulations
            (1M ticks, controlled conditions), the Anna Matrix produces dramatically
            different population dynamics:
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <ResultCard label="Population Stability" value="4.3x" desc="vs random matrices" />
            <ResultCard label="Food Sharing" value="2.8x" desc="more than random" />
            <ResultCard label="Aggression" value="-46%" desc="reduction vs random" />
            <ResultCard label="Cooperation" value="33.0%" desc="5-seed ensemble" />
          </div>
          <div className="mt-2 bg-white/[0.03] border border-white/[0.06] p-2">
            <p className="text-[11px] text-white/40 leading-relaxed">
              <span className="text-[#D4AF37]/70 font-medium">Causal feedback loop: </span>
              Transfer entropy analysis of 10M-tick simulations reveals a complete causal chain:
              Energy drives Population, which drives Aggression, which triggers Cooperation,
              which enables Sharing, which restores Energy. Aggression drives cooperation
              83.8% of the time -- cooperation is reactive, emerging as a defense mechanism.
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: Brain,
      title: 'How to Navigate',
      content: (
        <div className="space-y-2">
          <ul className="space-y-1.5">
            <NavItem action="Drag" description="Orbit around the scene" />
            <NavItem action="Scroll" description="Zoom in and out" />
            <NavItem action="Click" description="Select elements for detailed information" />
            <NavItem action="Camera Presets" description="Jump to pre-configured viewpoints via the control panel" />
            <NavItem action="Layer Toggles" description="Show or hide individual layers in the control panel" />
            <NavItem action="Fullscreen" description="Expand the visualization to fill the screen" />
          </ul>
          <div className="mt-2 bg-white/[0.03] border border-white/[0.06] p-2">
            <p className="text-[11px] text-white/40 leading-relaxed">
              For the best experience, start with the Overview camera preset and enable
              layers one at a time to see how each dimension builds on the previous.
            </p>
          </div>
        </div>
      ),
    },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-[600px] max-h-[calc(100vh-32px)] md:max-h-[85vh] z-[101] flex flex-col overflow-hidden border border-white/[0.08]"
            style={{ backgroundColor: '#0a0a0a' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.08] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-[#D4AF37]/15 border border-[#D4AF37]/25">
                  <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Research Guide</h2>
                  <p className="text-[11px] text-white/40">Qortex 3D Visualization Layers</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div
              className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.15) transparent',
              }}
            >
              {sections.map((section, index) => {
                const Icon = section.icon
                const isExpanded = expanded.has(index)

                return (
                  <div key={index} className="border border-white/[0.06]">
                    {/* Section header (toggle) */}
                    <button
                      onClick={() => toggleSection(index)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors',
                        isExpanded
                          ? 'bg-white/[0.03]'
                          : 'hover:bg-white/[0.02]',
                      )}
                    >
                      {React.createElement(Icon, { className: 'w-3.5 h-3.5 text-[#D4AF37]/60 shrink-0' })}
                      <span className="text-sm font-medium text-[#D4AF37]/90 flex-1">
                        {section.title}
                      </span>
                      <ChevronDown
                        className={cn(
                          'w-3.5 h-3.5 text-white/25 shrink-0 transition-transform duration-200',
                          isExpanded && 'rotate-180',
                        )}
                      />
                    </button>

                    {/* Collapsible content */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 pt-1">
                            {section.content}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/[0.08] shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-white/25 font-mono">
                  5 layers -- 128x128 matrix -- 10M ticks validated
                </p>
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs font-medium bg-[#D4AF37]/15 text-[#D4AF37]/80 border border-[#D4AF37]/25 hover:bg-[#D4AF37]/25 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/* Helper Components                                                   */
/* ------------------------------------------------------------------ */

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-white/35">{label}</span>
      <span className="text-[11px] font-mono text-white/60">{value}</span>
    </div>
  )
}

function PhaseTag({ label, color }: { label: string; color: string }) {
  return (
    <span className={cn('px-2 py-0.5 text-[10px] font-mono border', color)}>
      {label}
    </span>
  )
}

function ResultCard({ label, value, desc }: { label: string; value: string; desc: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] p-2">
      <div className="text-[10px] text-white/30 uppercase tracking-wider">{label}</div>
      <div className="text-sm font-bold font-mono text-[#D4AF37]/80 mt-0.5">{value}</div>
      <div className="text-[10px] text-white/30 mt-0.5">{desc}</div>
    </div>
  )
}

function NavItem({ action, description }: { action: string; description: string }) {
  return (
    <li className="flex items-start gap-2 text-xs">
      <span className="text-[#D4AF37]/60 font-medium shrink-0 min-w-[80px]">{action}</span>
      <span className="text-white/50">{description}</span>
    </li>
  )
}
