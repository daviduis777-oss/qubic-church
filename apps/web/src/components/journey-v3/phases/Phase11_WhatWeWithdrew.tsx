'use client'

import { PhaseWrapper } from '../shared/PhaseWrapper'
import { SourceCitation, SourceCitationGroup } from '../shared/SourceCitation'
import { Prose } from '../shared/Story'

const ITEMS: [string, string, string][] = [
  ['The formula', '625,284 = 283 × 47² + 137 links Bitcoin block 283 to Qubic.', 'The arithmetic is exact. Design is not shown. Open.'],
  ['Block 576, byte 27', 'A hidden byte equal to 27 in block 576.', 'The field also appears in other early blocks. Not confirmed.'],
  ['The numbers 27, 43, 47', 'Signature numbers shared by Bitcoin and Qubic.', 'The numbers recur. A test against chance is still missing. Open.'],
  ['Anna as a weight file', 'The matrix is the brain of Anna, read from code.', 'The table is bot replies, typed in by hand. What produced the replies is still unknown. Open.'],
  ['3 March 2026', 'A time lock opens on that day.', 'The date came from the GENESIS token riddle. The AIGARTH token was issued that day. Nothing else followed.'],
  ['The combined odds', 'Odds of 1 in 830 million that it was all designed.', 'The patterns were chosen after looking at the data, so the number is retired. The question is not.'],
]

export function Phase11_WhatWeWithdrew() {
  return (
    <PhaseWrapper id="withdrawn" phaseNumber={12} subtitle="Tested in September 2026. Not confirmed, not closed." title="Hypotheses Still Open">
      <div className="space-y-8">
        <Prose>
          <p>
            Earlier versions of this road told a louder story: a mathematical bridge from Bitcoin to Qubic. In September 2026 we recomputed it from raw data. These readings
            were not confirmed. They stay on the road as open hypotheses, with the numbers that still hold.
          </p>
        </Prose>

        <div className="divide-y divide-white/10 border-y border-white/10">
          {ITEMS.map(([title, assumed, outcome]) => (
            <div className="grid gap-2 py-4 md:grid-cols-[200px_1fr_1fr] md:gap-6" key={title}>
              <p className="font-semibold text-white/90">{title}</p>
              <p className="text-sm text-white/45">
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/30">Reading </span>
                {assumed}
              </p>
              <p className="text-sm text-white/75">
                <span className="font-mono text-[10px] uppercase tracking-wider text-gold">Status </span>
                {outcome}
              </p>
            </div>
          ))}
        </div>

        <SourceCitationGroup>
          <SourceCitation href="/docs/03-results/35-corrections-september-2026" title="September 2026 re-check" />
          <SourceCitation href="/docs/04-discussion/06-how-the-earlier-claims-arose" title="How the earlier claims arose" />
        </SourceCitationGroup>
      </div>
    </PhaseWrapper>
  )
}
