'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { PhaseWrapper } from '../shared/PhaseWrapper'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import { SourceCitation, SourceCitationGroup } from '../shared/SourceCitation'
import { Calendar, Link2, CheckCircle, HelpCircle, Bitcoin, ChevronDown } from 'lucide-react'

interface TimelineEvent {
  year: string
  event: string
  project: 'bitcoin' | 'nxt' | 'iota' | 'qubic'
  verified: boolean
  details: string
}

const timeline: TimelineEvent[] = [
  {
    year: '2009',
    event: 'Bitcoin Genesis Block mined',
    project: 'bitcoin',
    verified: true,
    details:
      'January 3, 2009 - Satoshi Nakamoto mines the first Bitcoin block, embedding the famous message: "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks"',
  },
  {
    year: '2010',
    event: 'Satoshi disappears',
    project: 'bitcoin',
    verified: true,
    details:
      'After years of active development and thousands of forum posts, Satoshi Nakamoto sends his final known message and vanishes from public life. No one has proven contact since.',
  },
  {
    year: '2013',
    event: 'CFB launches NXT blockchain',
    project: 'nxt',
    verified: true,
    details:
      'Come-from-Beyond emerges publicly with NXT - the first pure Proof-of-Stake blockchain. Revolutionary design that influenced countless projects. The timing: exactly 3 years after Satoshi disappeared.',
  },
  {
    year: '2015',
    event: 'CFB co-founds IOTA',
    project: 'iota',
    verified: true,
    details:
      'CFB co-founds IOTA with its Tangle technology - a blockless distributed ledger designed for IoT. Introduces ternary computing concepts that would later appear in Qubic.',
  },
  {
    year: '2022',
    event: 'CFB launches Qubic',
    project: 'qubic',
    verified: true,
    details:
      'CFB reveals Qubic - featuring a ternary AI called Anna, smart contracts, and mysterious mathematical patterns that seem to connect back to Bitcoin\'s earliest blocks.',
  },
]

const projectColors = {
  bitcoin: 'orange',
  nxt: 'blue',
  iota: 'cyan',
  qubic: 'purple',
}

export function Phase03_TheArchitect() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.3 })
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null)

  return (
    <PhaseWrapper
      id="architect"
      phaseNumber={3}
      title="The Architect"
      subtitle='Meet CFB - the mysterious figure known as "Come-from-Beyond"'
    >
      <div ref={ref} className="space-y-8">
        {/* CFB Identity Card */}
        <motion.div
          className="p-6 md:p-8 rounded-2xl bg-gradient-to-b from-[#050505] to-black/50 border border-[#D4AF37]/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <div className="w-24 h-24 md:w-32 md:h-32 mx-auto md:mx-0 rounded-full overflow-hidden bg-gradient-to-br from-[#D4AF37]/30 to-orange-500/30 border-2 border-white/20">
                <Image
                  src="/images/cfb-profile.webp"
                  alt="CFB - Come-from-Beyond"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-4 text-center md:text-left">
                <h3 className="text-xl font-bold text-white">Come-from-Beyond</h3>
                <p className="text-sm text-white/50 font-mono">CFB</p>
              </div>
            </div>

            <div className="md:w-2/3 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5">
                  <span className="text-xs text-white/40 block mb-1">Known Projects</span>
                  <span className="text-white font-semibold">NXT, IOTA, Qubic</span>
                </div>
                <div className="p-3 bg-white/5">
                  <span className="text-xs text-white/40 block mb-1">Public Since</span>
                  <span className="text-white font-semibold">2013</span>
                </div>
              </div>

              <p className="text-white/70 leading-relaxed">
                CFB is a legendary cryptographer who has created multiple blockchain innovations.
                Mathematical patterns in his work suggest he may have been involved with Bitcoin
                from the very beginning.
              </p>

              <div className="flex items-center gap-2 p-3 bg-[#D4AF37]/10 border border-orange-500/20">
                <HelpCircle className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <span className="text-sm text-orange-300/80">
                  <strong>The Question:</strong> Is CFB actually Satoshi Nakamoto?
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Interactive Timeline */}
        <motion.div
          className="p-6 rounded-2xl bg-white/5 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-white/90 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-white/60" />
            Timeline: From Bitcoin to Qubic
          </h3>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#D4AF37] via-[#D4AF37] to-[#D4AF37]" />

            <div className="space-y-3">
              {timeline.map((event, index) => {
                const color = projectColors[event.project]
                const isExpanded = expandedEvent === index

                return (
                  <motion.div
                    key={index}
                    className="relative pl-10"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: isInView ? 1 : 0, x: isInView ? 0 : -20 }}
                    transition={{ duration: 0.4, delay: 0.1 * index }}
                  >
                    {/* Timeline Dot */}
                    <div
                      className={`absolute left-2.5 top-4 w-3 h-3 rounded-full border-2 transition-transform duration-200 ${
                        isExpanded ? 'scale-125' : ''
                      } ${
                        color === 'orange'
                          ? 'bg-orange-500 border-orange-400'
                          : color === 'cyan'
                          ? 'bg-[#D4AF37] border-[#D4AF37]'
                          : color === 'purple'
                          ? 'bg-purple-500 border-purple-400'
                          : 'bg-[#D4AF37] border-blue-400'
                      }`}
                    />

                    <button
                      onClick={() => setExpandedEvent(isExpanded ? null : index)}
                      className={`w-full text-left p-4 transition-all duration-200 ${
                        isExpanded ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-white/50">{event.year}</span>
                          <span className="text-white/90">{event.event}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {event.verified && (
                            <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                          )}
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                          >
                            <ChevronDown className="w-4 h-4 text-white/40" />
                          </motion.div>
                        </div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-2">
                            <div className="p-3 bg-black/20 border-l-2 border-white/20">
                              <p className="text-sm text-white/70 leading-relaxed">
                                {event.details}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Evidence Summary */}
        <CollapsibleSection
          title="Evidence Connecting CFB to Bitcoin"
          icon={<Link2 className="w-4 h-4" />}
          badge="Key Evidence"
        >
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Bitcoin className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-medium text-white/90">Mathematical Signatures</span>
                </div>
                <p className="text-sm text-white/60">
                  The numbers 27, 47, 137, 283 appear in both Bitcoin's early blocks AND Qubic's
                  architecture
                </p>
              </div>
              <div className="p-4 bg-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-medium text-white/90">Timeline Gap</span>
                </div>
                <p className="text-sm text-white/60">
                  Satoshi disappeared in 2010. CFB emerged publicly in 2013 with NXT - enough time
                  to "rebrand"
                </p>
              </div>
            </div>
            <p className="text-xs text-white/40 italic">
              Note: These are correlations, not proof. The investigation continues...
            </p>
          </div>
        </CollapsibleSection>

        <SourceCitationGroup>
          <SourceCitation
            href="/docs/03-results/24-cfb-satoshi-connection"
            title="CFB-Satoshi Connection Analysis"
            tier={2}
          />
          <SourceCitation href="/docs/03-results/08-unified-theory" title="Unified Theory" tier={2} />
        </SourceCitationGroup>
      </div>
    </PhaseWrapper>
  )
}
