'use client'

import { PhaseWrapper } from '../shared/PhaseWrapper'
import { SourceCitation, SourceCitationGroup } from '../shared/SourceCitation'
import { Prose } from '../shared/Story'

const ITEMS: [string, string, string][] = [
  ['The formula', '625,284 = 283 × 47² + 137 linked Bitcoin block 283 to Qubic.', 'The arithmetic is exact. The numbers were picked after the fact.'],
  ['Block 576, byte 27', 'A hidden byte equal to 27 in block 576.', 'An ordinary field, found in other early blocks too. Withdrawn.'],
  ['The numbers 27, 43, 47', 'Signature numbers shared by Bitcoin and Qubic.', 'Chosen after looking at the data. Withdrawn.'],
  ['Anna as a weight file', 'The matrix was the brain of Anna, read from code.', 'It is a table of bot replies, typed in by hand, with a few typing errors.'],
  ['3 March 2026', 'A time lock would open on that day.', 'The date came from a community token riddle. Nothing happened.'],
  ['Odds of 1 in 830 million', 'Combined odds that it was all designed.', 'They multiplied patterns chosen after the fact, so they measured nothing.'],
]

export function Phase11_WhatWeWithdrew() {
  return (
    <PhaseWrapper id="withdrawn" phaseNumber={11} subtitle="The road also has dead ends. We marked ours." title="What We Got Wrong">
      <div className="space-y-8">
        <Prose>
          <p>
            Earlier versions of this page told a louder story: a mathematical bridge from Bitcoin to Qubic. In September 2026 we recomputed everything from raw data. These
            claims did not survive, and we say so here, on the same road.
          </p>
        </Prose>

        <div className="divide-y divide-white/10 border-y border-white/10">
          {ITEMS.map(([title, assumed, outcome]) => (
            <div className="grid gap-2 py-4 md:grid-cols-[200px_1fr_1fr] md:gap-6" key={title}>
              <p className="font-semibold text-white/90">{title}</p>
              <p className="text-sm text-white/45">
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/30">Assumed </span>
                {assumed}
              </p>
              <p className="text-sm text-white/75">
                <span className="font-mono text-[10px] uppercase tracking-wider text-gold">Found </span>
                {outcome}
              </p>
            </div>
          ))}
        </div>

        <SourceCitationGroup>
          <SourceCitation href="/docs/03-results/35-corrections-september-2026" title="Corrections, September 2026" />
          <SourceCitation href="/docs/04-discussion/06-how-the-earlier-claims-arose" title="How the earlier claims arose" />
        </SourceCitationGroup>
      </div>
    </PhaseWrapper>
  )
}
