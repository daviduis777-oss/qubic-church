'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Brain,
  Layers,
  AlertTriangle,
  TrendingUp,
  RotateCcw,
  HelpCircle,
  ChevronDown,
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
    setExpanded(prev => {
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
            This is a multi-layer 3D visualization of the Anna Matrix -- a
            128x128 integer matrix at the heart of a ternary neural network
            research project. Four layers are stacked together, each revealing a
            different dimension of the matrix's mathematical structure.
          </p>
          <p className="text-xs text-white/60 leading-relaxed">
            Toggle layers on and off with the control panel, click on elements
            for details, and use the camera presets to jump between viewpoints.
            Each layer represents months of computational analysis distilled
            into a single interactive scene.
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
            The base layer renders the full 128x128 Anna Matrix as a 3D
            heightmap. Each cell becomes a column whose height represents the
            cell value. Blue columns are negative values, gold columns are
            positive.
          </p>
          <div className="space-y-1.5 mt-2">
            <StatRow label="Dimensions" value="128 x 128 (16,384 cells)" />
            <StatRow label="Value Range" value="-128 to +127" />
            <StatRow label="Point Symmetry" value="99.58%" />
          </div>
          <div className="mt-2 bg-white/[0.03] border border-border p-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-gold/70 font-medium">
                Row Stratification:{' '}
              </span>
              Earlier versions described rows 21, 68 and 96 as input, transform
              and output layers. That reading is unproven and has been
              withdrawn.
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
            Of the 16,384 cells, the matrix exhibits near-perfect point
            symmetry: for almost every cell, M[r,c] + M[127-r, 127-c] = -1. Only
            68 cells break this rule. These are the anomaly markers, shown as
            glowing indicators hovering above the terrain.
          </p>
          <div className="space-y-1.5 mt-2">
            <StatRow label="Anomaly Count" value="68 cells (34 pairs)" />
            <StatRow
              label="Key Columns"
              value="22/105 (13 anomalies) and 97/30 (14 anomalies)"
            />
            <StatRow label="Special Position" value="[22, 22]" />
          </div>
          <div className="mt-2 bg-white/[0.03] border border-border p-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-gold/70 font-medium">What they are: </span>
              The 68 cells sit in four short runs. Three look like our own
              transcription errors (a block pasted one row off, a swapped digit,
              a copied neighbour); the cause of the fourth is unclear.
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: TrendingUp,
      title: 'Eigenvalue Spiral (Layer 3)',
      content: (
        <div className="space-y-2">
          <p className="text-xs text-white/60 leading-relaxed">
            The 128 eigenvalues of the Anna Matrix are plotted in the 3D complex
            plane as a spiral. Each point represents a fundamental oscillation
            mode. The horizontal axes show real and imaginary parts, while the
            vertical axis shows magnitude.
          </p>
          <div className="space-y-1.5 mt-2">
            <StatRow label="Eigenvalue Count" value="128" />
            <StatRow label="Dominant Angle" value="90.456 degrees" />
            <StatRow label="Spectral Dominance" value="40.4%" />
            <StatRow
              label="Scale Invariance"
              value="Preserved 2x2 to 128x128"
            />
          </div>
          <div className="mt-2 bg-white/[0.03] border border-border p-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-gold/70 font-medium">Key discovery: </span>
              The dominant eigenvalue sits at 90.456 degrees with 40.4% of the
              total spectral power -- meaning nearly half of the matrix's
              dynamics are governed by a single near-90-degree rotation. This
              angle is preserved when the matrix is scaled from 2x2 all the way
              to 128x128, a property unique to the Anna Matrix (0% of 5,000
              random matrices tested show this).
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: RotateCcw,
      title: 'Period-4 Cycle (Layer 4)',
      content: (
        <div className="space-y-2">
          <p className="text-xs text-white/60 leading-relaxed">
            Under the direct ternary iteration T(v) = sign(M·v), every tested
            input ends in a cycle of length 4: the state returns to itself every
            4 steps. This layer shows that cycle.
          </p>
          <div className="space-y-1.5 mt-2">
            <StatRow
              label="T cycle period"
              value="4 (reported, 100K + 32K exhaustive)"
            />
            <StatRow
              label="Null reproduction"
              value="0/800 random nulls; Anna 200/200"
            />
          </div>
          <div className="mt-2 bg-white/[0.03] border border-border p-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-gold/70 font-medium">Scope: </span>
              Anna admits at least 2 period-4 cycles on the sampled inputs (see
              Chapter 30); that these are the only ones is a hypothesis. The
              separate input-clamped AIT operator behaves differently. Earlier
              readings of the cycle as a cooperation rhythm were withdrawn.
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
            <NavItem
              action="Click"
              description="Select elements for detailed information"
            />
            <NavItem
              action="Camera Presets"
              description="Jump to pre-configured viewpoints via the control panel"
            />
            <NavItem
              action="Layer Toggles"
              description="Show or hide individual layers in the control panel"
            />
            <NavItem
              action="Fullscreen"
              description="Expand the visualization to fill the screen"
            />
          </ul>
          <div className="mt-2 bg-white/[0.03] border border-border p-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              For the best experience, start with the Overview camera preset and
              enable layers one at a time to see how each dimension builds on
              the previous.
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
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-[600px] max-h-[calc(100vh-32px)] md:max-h-[85vh] z-[101] flex flex-col overflow-hidden border border-border"
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{ backgroundColor: '#0a0a0a' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-gold/15 border border-gold/25">
                  <HelpCircle className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Research Guide
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Qortex 3D Visualization Layers
                  </p>
                </div>
              </div>
              <button
                className="p-1.5 text-muted-foreground hover:text-white/60 transition-colors"
                onClick={onClose}
                type="button"
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
                  <div className="border border-border" key={index}>
                    {/* Section header (toggle) */}
                    <button
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors',
                        isExpanded ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'
                      )}
                      onClick={() => toggleSection(index)}
                      type="button"
                    >
                      {React.createElement(Icon, {
                        className: 'w-3.5 h-3.5 text-gold/80 shrink-0',
                      })}
                      <span className="text-sm font-medium text-gold/90 flex-1">
                        {section.title}
                      </span>
                      <ChevronDown
                        className={cn(
                          'w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform duration-200',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    </button>

                    {/* Collapsible content */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          animate={{ height: 'auto', opacity: 1 }}
                          className="overflow-hidden"
                          exit={{ height: 0, opacity: 0 }}
                          initial={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
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
            <div className="p-3 border-t border-border shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-mono">
                  5 layers -- 128x128 matrix -- 10M ticks validated
                </p>
                <button
                  className="px-3 py-1.5 text-xs font-medium bg-gold/15 text-gold/80 border border-gold/25 hover:bg-gold/25 transition-colors"
                  onClick={onClose}
                  type="button"
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
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-mono text-white/60">{value}</span>
    </div>
  )
}

function NavItem({
  action,
  description,
}: {
  action: string
  description: string
}) {
  return (
    <li className="flex items-start gap-2 text-xs">
      <span className="text-gold/80 font-medium shrink-0 min-w-[80px]">
        {action}
      </span>
      <span className="text-white/50">{description}</span>
    </li>
  )
}
