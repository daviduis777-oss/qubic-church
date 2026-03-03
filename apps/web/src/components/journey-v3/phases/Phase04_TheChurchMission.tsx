'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { PhaseWrapper } from '../shared/PhaseWrapper'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import { SourceCitation, SourceCitationGroup } from '../shared/SourceCitation'
import { Target, Search, FileText, Users, Scale, ShieldCheck } from 'lucide-react'

// Confidence meter component
function ConfidenceMeter({ value, label }: { value: number; label: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <span className="text-white/90 font-mono">{value}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            value >= 80
              ? 'bg-[#D4AF37]'
              : value >= 60
              ? 'bg-[#D4AF37]'
              : value >= 40
              ? 'bg-orange-500'
              : 'bg-red-500'
          }`}
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

const researchPrinciples = [
  {
    icon: Search,
    title: 'Open Investigation',
    description: 'All research is public and verifiable. Anyone can check our work.',
  },
  {
    icon: Scale,
    title: 'Evidence-Based',
    description: 'We classify evidence into tiers: Verified, Supported, and Hypothetical.',
  },
  {
    icon: FileText,
    title: 'Full Transparency',
    description: 'Our data, scripts, and methodology are all open source.',
  },
  {
    icon: ShieldCheck,
    title: 'Academic Rigor',
    description: 'Statistical analysis with p-values and confidence intervals.',
  },
]

export function Phase04_TheChurchMission() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.3 })
  const [activeTab, setActiveTab] = useState<'mission' | 'tiers'>('mission')

  return (
    <PhaseWrapper
      id="church-mission"
      phaseNumber={4}
      title="The Church Mission"
      subtitle="An independent research collective investigating the Bitcoin-Qubic connection"
    >
      <div ref={ref} className="space-y-8">
        {/* Mission Statement */}
        <motion.div
          className="p-6 md:p-8 rounded-2xl bg-gradient-to-b from-[#050505]/80 to-[#050505]/80 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-[#D4AF37]" />
            <h3 className="text-xl font-bold text-white/90">Our Mission</h3>
          </div>
          <p className="text-lg text-white/70 leading-relaxed mb-6">
            To investigate, document, and verify the mathematical connections between Bitcoin and
            Qubic through rigorous academic research - and share all findings openly with the
            community.
          </p>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('mission')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'mission'
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/20'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              Principles
            </button>
            <button
              onClick={() => setActiveTab('tiers')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'tiers'
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/20'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              Evidence Tiers
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'mission' && (
            <div className="grid md:grid-cols-2 gap-4">
              {researchPrinciples.map((principle, index) => {
                const Icon = principle.icon
                return (
                  <motion.div
                    key={index}
                    className="p-4 bg-white/5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 10 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-white/60" />
                      <span className="font-medium text-white/90">{principle.title}</span>
                    </div>
                    <p className="text-sm text-white/60">{principle.description}</p>
                  </motion.div>
                )
              })}
            </div>
          )}

          {activeTab === 'tiers' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#D4AF37]/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5  text-xs bg-[#D4AF37]/30 text-[#D4AF37]">
                    Tier 1
                  </span>
                  <span className="font-medium text-white/90">Mathematically Verified</span>
                </div>
                <p className="text-sm text-white/60">
                  Calculator-verifiable facts. Anyone can reproduce these results. Example: 283 x
                  47^2 + 137 = 625,284
                </p>
              </div>
              <div className="p-4 bg-[#D4AF37]/10 border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5  text-xs bg-[#D4AF37]/30 text-[#D4AF37]">
                    Tier 2
                  </span>
                  <span className="font-medium text-white/90">Statistically Supported</span>
                </div>
                <p className="text-sm text-white/60">
                  Patterns with statistical significance (p &lt; 0.05). Multiple independent data
                  points support the hypothesis.
                </p>
              </div>
              <div className="p-4 bg-[#D4AF37]/10 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5  text-xs bg-[#D4AF37]/30 text-[#D4AF37]">
                    Tier 3
                  </span>
                  <span className="font-medium text-white/90">Hypothetical</span>
                </div>
                <p className="text-sm text-white/60">
                  Reasonable hypotheses based on observed patterns, but requiring more evidence to
                  confirm.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Current Confidence Levels */}
        <motion.div
          className="p-6 rounded-2xl bg-white/5 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-white/90 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-white/60" />
            Research Confidence Levels
          </h3>

          <div className="space-y-4">
            <ConfidenceMeter value={99} label="Mathematical Formula Correctness" />
            <ConfidenceMeter value={90} label="Block 576 Anomaly" />
            <ConfidenceMeter value={85} label="Anna Bot Neural Architecture" />
            <ConfidenceMeter value={70} label="CFB-Satoshi Connection" />
            <ConfidenceMeter value={60} label="Time-Lock March 2026 Event" />
          </div>

          <p className="text-xs text-white/40 mt-4 italic">
            Confidence levels based on evidence quality and reproducibility. Updated January 2026.
          </p>
        </motion.div>

        <CollapsibleSection title="What we do NOT claim" icon={<ShieldCheck className="w-4 h-4" />}>
          <ul className="space-y-2 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <span className="text-red-400">-</span>
              We do NOT claim CFB is definitively Satoshi
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400">-</span>
              We do NOT claim the time-lock will definitely activate
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400">-</span>
              We do NOT provide financial advice
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400">-</span>
              We do NOT guarantee any outcomes
            </li>
          </ul>
          <p className="text-xs text-white/40 mt-4">
            We present evidence and let you draw your own conclusions. Always do your own research.
          </p>
        </CollapsibleSection>

        <SourceCitationGroup>
          <SourceCitation href="/docs/01-introduction/01-overview" title="Project Overview" tier={1} />
          <SourceCitation href="/archives" title="Full Research Archive" />
        </SourceCitationGroup>
      </div>
    </PhaseWrapper>
  )
}
