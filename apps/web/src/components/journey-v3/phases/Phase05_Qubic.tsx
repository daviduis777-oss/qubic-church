'use client'

import { PhaseWrapper } from '../shared/PhaseWrapper'
import { SourceCitation, SourceCitationGroup } from '../shared/SourceCitation'
import { Moments, OpenQuestion, Quote, type Moment } from '../shared/Story'

const MOMENTS: Moment[] = [
  {
    date: '25.09.2012',
    title: 'The word appears',
    text: (
      <>
        Months before NXT, he opens a forum thread called <span className="text-white/85">Qubic: Quorum-Based Coin</span>. Coins run by a quorum of nodes, no central
        authority, a protocol that can change itself. The thread number is <span className="font-mono text-gold">112676</span>.
      </>
    ),
    href: '/books/come-from-beyond/04-the-vanished-satoshi',
    hrefLabel: 'Come-from-Beyond, ch. 4',
  },
  {
    date: '13.04.2022',
    title: 'Qubic goes live',
    text: 'Ten years later the network launches: 676 computors form the quorum, epochs last one week, and mining is useful proof of work. The power the miners spend goes into growing neural networks.',
    href: '/books/qubic-the-long-version/06-676-voices',
    hrefLabel: 'Qubic: The Long Version, ch. 6',
  },
]

export function Phase05_Qubic() {
  return (
    <PhaseWrapper background="dark" id="qubic" phaseNumber={5} subtitle="Named in 2012, launched in 2022" title="Qubic">
      <div className="space-y-10">
        <Quote source="Come-from-Beyond, bitcointalk, 25.09.2012">
          Name &ldquo;Qubic&rdquo; came from acronym &ldquo;QBC&rdquo; which stands for &ldquo;Quorum-Based Coin&rdquo;.
        </Quote>

        <Moments items={MOMENTS} />

        <Quote source="Come-from-Beyond, bitcointalk, 26.09.2012">
          Perhaps u will laugh but I design this system to make the world better. U shouldn&rsquo;t trust me of coz. I&rsquo;ll publish source code, so anyone can audit it.
        </Quote>

        <OpenQuestion>
          676 is 26 squared, the size of the quorum. It was already in the address of the thread where the word Qubic first appeared, ten years before the network.
        </OpenQuestion>

        <SourceCitationGroup>
          <SourceCitation href="/books/come-from-beyond/04-the-vanished-satoshi" title="Come-from-Beyond, ch. 4" />
          <SourceCitation href="/books/qubic-the-long-version/06-676-voices" title="Qubic: The Long Version, ch. 6: 676 Voices" />
        </SourceCitationGroup>
      </div>
    </PhaseWrapper>
  )
}
