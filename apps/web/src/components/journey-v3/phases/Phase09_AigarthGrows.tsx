'use client'

import { PhaseWrapper } from '../shared/PhaseWrapper'
import { SourceCitation, SourceCitationGroup } from '../shared/SourceCitation'
import { Moments, OpenQuestion, Quote, type Moment } from '../shared/Story'

const MOMENTS: Moment[] = [
  {
    date: '04.12.2024',
    title: 'Intelligent Tissue',
    text: 'The Aigarth team announces the end of phase one: promising architectures for an intelligent tissue have been found, and training begins on the network.',
  },
  {
    date: 'August 2025',
    title: 'The code goes public',
    text: (
      <>
        The repository <span className="font-mono text-white/85">Aigarth/aigarth-it</span> appears, with a unit whose input and output match Anna&rsquo;s sums exactly.
      </>
    ),
    href: '/docs/03-results/36-where-the-anna-matrix-comes-from',
    hrefLabel: 'Where the Anna Matrix comes from',
  },
  {
    date: 'May to July 2026',
    title: 'Science on stage',
    text: 'Neuraxon, the research line of the Qubic science team, wins Best Paper in Berlin and Best Oral Presentation in Osaka, and is presented at AGI-26 in San Francisco.',
    href: '/articles/2026-for-qubic',
    hrefLabel: 'Article: 2026 for Qubic',
  },
  {
    date: '06.07.2026',
    title: 'Zero',
    text: 'Home computers racing a program called Anna.exe drive the error to zero on all seven tests. A grown network, not a hand-built one, solves its task without a single mistake.',
    href: '/articles/bpp-9000-first-product-of-aigarth',
    hrefLabel: 'Article: BPP-9000',
  },
  {
    date: '26.08.2026',
    title: 'The colony remembers',
    text: 'Epoch 228. Every miner’s best network becomes the parent of the next generation, and what the network learns now survives the week. BPP-9000, the first product, predicts the direction of Bitcoin hour by hour.',
    href: '/articles/bpp-9000-first-product-of-aigarth',
    hrefLabel: 'Article: BPP-9000',
  },
]

export function Phase09_AigarthGrows() {
  return (
    <PhaseWrapper id="aigarth" phaseNumber={9} subtitle="2024 to 2026: the plant comes up" title="Aigarth Grows">
      <div className="space-y-10">
        <Moments items={MOMENTS} />

        <Quote source="Come-from-Beyond, Discord, 06.07.2026">It&rsquo;s not a milestone. It&rsquo;s much bigger.</Quote>

        <OpenQuestion>A mind grown from noise by selection, on the machines of miners. The man who described volunteer computing in 2002 is now asking for exactly that.</OpenQuestion>

        <SourceCitationGroup>
          <SourceCitation href="/articles" title="Articles by TesserAI" />
          <SourceCitation href="/books/qubic-the-long-version/11-what-aigarth-is" title="Qubic: The Long Version, ch. 11: What Aigarth Is" />
        </SourceCitationGroup>
      </div>
    </PhaseWrapper>
  )
}
