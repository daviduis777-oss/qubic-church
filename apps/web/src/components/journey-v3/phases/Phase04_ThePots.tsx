'use client'

import { PhaseWrapper } from '../shared/PhaseWrapper'
import { SourceCitation, SourceCitationGroup } from '../shared/SourceCitation'
import { Moments, OpenQuestion, Quote, type Moment } from '../shared/Story'

const MOMENTS: Moment[] = [
  {
    date: '2013',
    title: 'NXT: remove the bonfire',
    text: 'The first full proof-of-stake blockchain. The right to make the next block goes to those who hold a stake in the network, and nobody burns electricity to earn it. NXT is launched under a pseudonym, BCNext.',
  },
  {
    date: '2015',
    title: 'IOTA: remove the chain',
    text: 'No blocks and no chain. Every new transaction confirms two earlier ones, and the ledger grows as a web, the tangle. The arithmetic underneath is ternary: three states instead of two.',
  },
  {
    date: '2016',
    title: 'An AI that builds tools',
    text: 'He writes that IOTA’s hash function, Curl-P, was designed by a primitive AI of his own, and that an improved version is already working on the next one.',
  },
]

export function Phase04_ThePots() {
  return (
    <PhaseWrapper id="pots" phaseNumber={4} subtitle="2013 to 2016: every project a bigger pot for the same plant" title="NXT, IOTA and the Plant">
      <div className="space-y-10">
        <Moments items={MOMENTS} />

        <Quote source="Come-from-Beyond, “Time For A Paradigm Shift Has Come”, Medium, 2016">
          Imagine a pond with fish. The pond is our algorithm, the fish is vulnerabilities. Murky water wouldn&rsquo;t allow seeing if there is any fish, clear water would.
        </Quote>

        <OpenQuestion>Each project threw out something the world thought essential. The work kept pointing at artificial mind. Were the coins only pots?</OpenQuestion>

        <SourceCitationGroup>
          <SourceCitation href="/books/come-from-beyond/03-one-line-through-25-years" title="Come-from-Beyond, ch. 3" />
          <SourceCitation href="/books/qubic-the-long-version/05-three-projects-three-metamorphoses" title="Qubic: The Long Version, ch. 5" />
        </SourceCitationGroup>
      </div>
    </PhaseWrapper>
  )
}
