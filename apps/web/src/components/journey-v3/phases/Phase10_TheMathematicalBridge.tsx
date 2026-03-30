'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { PhaseWrapper } from '../shared/PhaseWrapper'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import { SourceCitation, SourceCitationGroup } from '../shared/SourceCitation'
import { Layers, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'

interface EvidenceItem {
  title: string
  description: string
  tier: 1 | 2 | 3
  pValue?: string
  verified: boolean
}

const evidencePyramid: EvidenceItem[] = [
  {
    title: 'The Magic Formula',
    description: 'A simple math equation connects Bitcoin block 283 to Qubic. Anyone can verify with a calculator!',
    tier: 1,
    verified: true,
  },
  {
    title: 'The Hidden Number 27',
    description: 'Block 576 contains a hidden extra byte that equals 27 - a signature number that appears everywhere in CFB\'s work',
    tier: 1,
    verified: true,
  },
  {
    title: 'Timestamp Fingerprint',
    description: 'Bitcoin\'s "pre-Genesis" timestamp contains a number (43) that\'s core to Qubic\'s design',
    tier: 1,
    pValue: 'Very unlikely by chance',
    verified: true,
  },
  {
    title: 'Matching Checksums',
    description: 'Numbers from Bitcoin blocks divisible by 27 add up to match a specific byte in the Genesis block',
    tier: 1,
    pValue: 'Extremely unlikely by chance',
    verified: true,
  },
  {
    title: 'Anna\'s Patterns',
    description: 'Qubic\'s AI gave 897 responses that form a clear pattern - this would never happen randomly',
    tier: 1,
    verified: true,
  },
  {
    title: 'Data Flow Architecture',
    description: 'Three specific rows in the Anna Matrix (21, 68, 96) show a consistent design pattern',
    tier: 2,
    verified: true,
  },
  {
    title: 'CFB-Satoshi Timeline',
    description: 'Multiple connections between CFB\'s known work and Satoshi\'s patterns',
    tier: 2,
    verified: true,
  },
  {
    title: 'March 2026 Prediction',
    description: 'Mathematical patterns in the time-lock mechanism point to a date in March 2026',
    tier: 3,
    verified: false,
  },
]

export function Phase10_TheMathematicalBridge() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.3 })

  const tierColors = {
    1: { bg: 'bg-[#D4AF37]/10', border: 'border-[#D4AF37]/20', text: 'text-[#D4AF37]' },
    2: { bg: 'bg-[#D4AF37]/10', border: 'border-[#D4AF37]/20', text: 'text-[#D4AF37]' },
    3: { bg: 'bg-[#D4AF37]/10', border: 'border-[#D4AF37]/20', text: 'text-[#D4AF37]' },
  }

  return (
    <PhaseWrapper
      id="bridge"
      phaseNumber={10}
      title="The Mathematical Bridge"
      subtitle="All evidence converges to a single conclusion"
    >
      <div ref={ref} className="space-y-8">
        {/* Summary Statistics */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-4 bg-[#D4AF37]/10 border border-green-500/20 text-center">
            <div className="text-2xl font-bold text-[#D4AF37] mb-1">5</div>
            <div className="text-xs text-white/60">Tier 1 Findings</div>
          </div>
          <div className="p-4 bg-[#D4AF37]/10 border border-yellow-500/20 text-center">
            <div className="text-2xl font-bold text-[#D4AF37] mb-1">2</div>
            <div className="text-xs text-white/60">Tier 2 Findings</div>
          </div>
          <div className="p-4 bg-[#D4AF37]/10 border border-orange-500/20 text-center">
            <div className="text-2xl font-bold text-[#D4AF37] mb-1">1</div>
            <div className="text-xs text-white/60">Tier 3 Hypothesis</div>
          </div>
          <div className="p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-center">
            <div className="text-2xl font-bold text-[#D4AF37] mb-1">99.6%</div>
            <div className="text-xs text-white/60">Probability Designed</div>
          </div>
        </motion.div>

        {/* Evidence Pyramid */}
        <motion.div
          className="p-6 md:p-8 rounded-2xl bg-gradient-to-b from-[#050505]/80 to-black/50 border border-[#D4AF37]/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Layers className="w-6 h-6 text-[#D4AF37]" />
            <h3 className="text-xl font-bold text-white/90">Evidence Pyramid</h3>
          </div>

          <div className="space-y-3">
            {evidencePyramid.map((evidence, index) => {
              const colors = tierColors[evidence.tier]
              return (
                <motion.div
                  key={index}
                  className={`p-4 ${colors.bg} border ${colors.border}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: isInView ? 1 : 0, x: isInView ? 0 : -20 }}
                  transition={{ duration: 0.3, delay: 0.05 * index }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5  text-xs font-medium ${colors.bg} ${colors.text}`}
                        >
                          Tier {evidence.tier}
                        </span>
                        {evidence.pValue && (
                          <span className="text-xs text-white/40 font-mono">{evidence.pValue}</span>
                        )}
                      </div>
                      <h4 className="font-semibold text-white/90 text-sm">{evidence.title}</h4>
                      <p className="text-xs text-white/60 mt-1">{evidence.description}</p>
                    </div>
                    <div className="shrink-0">
                      {evidence.verified ? (
                        <CheckCircle className="w-5 h-5 text-[#D4AF37]" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-[#D4AF37]" />
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Combined Probability */}
        <motion.div
          className="p-6 rounded-2xl bg-white/5 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-white/60" />
            What Are The Odds?
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-black/30">
              <div className="text-xs text-white/40 mb-1">Careful Estimate</div>
              <div className="font-mono text-xl text-white mb-1">1 in 29,000</div>
              <div className="text-xs text-white/50">
                Even if some patterns are related, odds are still very low
              </div>
            </div>
            <div className="p-4 bg-black/30">
              <div className="text-xs text-white/40 mb-1">If All Separate</div>
              <div className="font-mono text-xl text-white mb-1">1 in 830 million</div>
              <div className="text-xs text-white/50">If each pattern is completely independent</div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/20">
            <div className="text-sm text-purple-300/80">
              <strong>Bottom Line:</strong> When we add up all the evidence, there's a{' '}
              <span className="text-[#D4AF37] font-bold">99.6%</span> chance these patterns were
              intentionally created - not just random coincidences.
            </div>
          </div>
        </motion.div>

        <CollapsibleSection
          title="What would falsify this?"
          icon={<AlertTriangle className="w-4 h-4" />}
        >
          <div className="space-y-3 text-sm text-white/70">
            <p>Scientific claims must be falsifiable. Here's what would disprove our findings:</p>
            <ul className="space-y-2 ml-4 list-disc">
              <li>Pre-Genesis timestamp from a different (verifiable) source</li>
              <li>Block 576 Extra Byte appearing in other early blocks</li>
              <li>Matrix values differing in other Qubic versions</li>
              <li>Alternative explanation for the number 27 across all CFB projects</li>
              <li>March 2026 passing with no notable events</li>
            </ul>
            <p className="text-white/50 italic mt-2">
              We remain open to evidence that contradicts our hypothesis.
            </p>
          </div>
        </CollapsibleSection>

        <SourceCitationGroup>
          <SourceCitation
            href="/docs/03-results/01-bitcoin-bridge"
            title="Complete Bridge Analysis"
            tier={1}
          />
          <SourceCitation
            href="/docs/03-results/08-unified-theory"
            title="Unified Theory"
            tier={2}
          />
        </SourceCitationGroup>
      </div>
    </PhaseWrapper>
  )
}
