'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { PhaseWrapper } from '../shared/PhaseWrapper'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import { SourceCitation, SourceCitationGroup } from '../shared/SourceCitation'
import { Layers, AlertTriangle, TrendingUp } from 'lucide-react'

type Status =
  | 'withdrawn'
  | 'coincidence'
  | 'reframed'
  | 'unproven'
  | 'hypothesis'
  | 'failed'

interface EvidenceItem {
  title: string
  assumed: string
  outcome: string
  status: Status
}

const statusLabels: Record<Status, string> = {
  withdrawn: 'Withdrawn',
  coincidence: 'Arithmetic only',
  reframed: 'Explained',
  unproven: 'Unproven',
  hypothesis: 'Hypothesis',
  failed: 'Failed',
}

const evidencePyramid: EvidenceItem[] = [
  {
    title: 'The Formula',
    assumed: 'A simple equation connects Bitcoin block 283 to Qubic.',
    outcome:
      'The arithmetic (625,284 = 283 x 47² + 137) is correct, but nothing shows it was designed. It is an arithmetic coincidence.',
    status: 'coincidence',
  },
  {
    title: 'Block 576, byte 27',
    assumed: 'Block 576 contains a unique hidden extra byte equal to 27.',
    outcome:
      'The byte is an ordinary field and not unique among early blocks. Withdrawn (BTC-019).',
    status: 'withdrawn',
  },
  {
    title: 'The "43" timestamp',
    assumed: 'A "pre-Genesis" timestamp contains the number 43, core to Qubic.',
    outcome: 'The reading does not hold. Withdrawn (BTC-002).',
    status: 'withdrawn',
  },
  {
    title: 'Checksums divisible by 27',
    assumed:
      'Block numbers divisible by 27 add up to a byte in the Genesis block.',
    outcome: 'The numbers were selected after the fact. Withdrawn (BTC-004).',
    status: 'withdrawn',
  },
  {
    title: "Anna's 897 responses",
    assumed: 'The responses form a pattern that would never happen randomly.',
    outcome:
      'The published table is a compilation of bot replies that follow a coordinate lookup (M30). The pattern comes from how it was built.',
    status: 'reframed',
  },
  {
    title: 'Rows 21, 68 and 96',
    assumed: 'Three matrix rows show a designed data-flow pattern.',
    outcome: 'No test separates this from chance. Unproven.',
    status: 'unproven',
  },
  {
    title: 'CFB and Satoshi',
    assumed: "CFB's work and Satoshi's patterns are connected.",
    outcome: 'This remains a hypothesis. CFB has denied it repeatedly.',
    status: 'hypothesis',
  },
  {
    title: 'March 2026 prediction',
    assumed: 'A time-lock pointed to March 3, 2026.',
    outcome:
      'The date came from misreading a CFB message. Nothing happened. The prediction failed.',
    status: 'failed',
  },
]

const statusCounts = evidencePyramid.reduce<Record<Status, number>>(
  (acc, e) => ({ ...acc, [e.status]: acc[e.status] + 1 }),
  {
    withdrawn: 0,
    coincidence: 0,
    reframed: 0,
    unproven: 0,
    hypothesis: 0,
    failed: 0,
  }
)

export function Phase10_TheMathematicalBridge() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0.3 })

  return (
    <PhaseWrapper
      id="bridge"
      phaseNumber={10}
      subtitle="What we assumed, and what held up"
      title="The Bridge Claims, Revisited"
    >
      <div className="space-y-8" ref={ref}>
        {/* Summary Statistics */}
        <motion.div
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-4 bg-gold/10 border border-green-500/20 text-center">
            <div className="text-2xl font-bold text-gold mb-1">
              {statusCounts.withdrawn}
            </div>
            <div className="text-xs text-white/60">Withdrawn</div>
          </div>
          <div className="p-4 bg-gold/10 border border-yellow-500/20 text-center">
            <div className="text-2xl font-bold text-gold mb-1">
              {statusCounts.failed}
            </div>
            <div className="text-xs text-white/60">Failed prediction</div>
          </div>
          <div className="p-4 bg-gold/10 border border-orange-500/20 text-center">
            <div className="text-2xl font-bold text-gold mb-1">
              {statusCounts.unproven + statusCounts.hypothesis}
            </div>
            <div className="text-xs text-white/60">Unproven or hypothesis</div>
          </div>
          <div className="p-4 bg-gold/10 border border-gold/20 text-center">
            <div className="text-2xl font-bold text-gold mb-1">0</div>
            <div className="text-xs text-white/60">Confirmed as designed</div>
          </div>
        </motion.div>

        {/* Evidence Pyramid */}
        <motion.div
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          className="p-6 md:p-8 rounded-2xl bg-gradient-to-b from-[#050505]/80 to-black/50 border border-gold/20"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Layers className="w-6 h-6 text-gold" />
            <h3 className="text-xl font-bold text-white/90">
              What we assumed, and what held up
            </h3>
          </div>

          <div className="space-y-3">
            {evidencePyramid.map((evidence, index) => {
              return (
                <motion.div
                  animate={{ opacity: isInView ? 1 : 0, x: isInView ? 0 : -20 }}
                  className="p-4 bg-gold/10 border border-gold/20"
                  initial={{ opacity: 0, x: -20 }}
                  key={index}
                  transition={{ duration: 0.3, delay: 0.05 * index }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5  text-xs font-medium bg-gold/10 text-gold">
                          {statusLabels[evidence.status]}
                        </span>
                      </div>
                      <h4 className="font-semibold text-white/90 text-sm">
                        {evidence.title}
                      </h4>
                      <p className="text-xs text-white/50 mt-1">
                        Assumed: {evidence.assumed}
                      </p>
                      <p className="text-xs text-white/70 mt-1">
                        {evidence.outcome}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <AlertTriangle className="w-5 h-5 text-gold" />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Combined Probability */}
        <motion.div
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          className="p-6 rounded-2xl bg-white/5 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-white/60" />
            Why the old odds were wrong
          </h3>

          <div className="space-y-3 text-sm text-white/70">
            <p>
              Earlier versions showed odds such as "1 in 830 million" and a
              "99.6% probability designed". Those numbers multiplied patterns
              that were picked after looking at the data, so they measured
              nothing. They have been withdrawn.
            </p>
          </div>
        </motion.div>

        <CollapsibleSection
          icon={<AlertTriangle className="w-4 h-4" />}
          title="What would falsify this?"
        >
          <div className="space-y-3 text-sm text-white/70">
            <p>
              Scientific claims must be falsifiable. Several of the tests below
              have now been run, and the original claims failed them:
            </p>
            <ul className="space-y-2 ml-4 list-disc">
              <li>
                Pre-Genesis timestamp from a different (verifiable) source
              </li>
              <li>Block 576 Extra Byte appearing in other early blocks</li>
              <li>Matrix values differing in other Qubic versions</li>
              <li>
                Alternative explanation for the number 27 across all CFB
                projects
              </li>
              <li>March 2026 passing with no notable events (this happened)</li>
            </ul>
            <p className="text-white/50 italic mt-2">
              Details are on the corrections page.
            </p>
          </div>
        </CollapsibleSection>

        <SourceCitationGroup>
          <SourceCitation
            href="/docs/03-results/35-corrections-september-2026"
            title="Corrections (September 2026)"
          />
        </SourceCitationGroup>
      </div>
    </PhaseWrapper>
  )
}
