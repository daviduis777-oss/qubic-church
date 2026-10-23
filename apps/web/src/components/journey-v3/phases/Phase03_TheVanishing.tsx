'use client'

import { PhaseWrapper } from '../shared/PhaseWrapper'
import { SourceCitation, SourceCitationGroup } from '../shared/SourceCitation'
import { Moments, OpenQuestion, Quote, type Moment } from '../shared/Story'

const MOMENTS: Moment[] = [
  {
    date: '31.10.2008',
    title: 'Nine pages',
    text: 'Someone calling himself Satoshi Nakamoto sends a short paper to a cryptography mailing list: money that needs no bank and no permission.',
  },
  {
    date: '03.01.2009',
    title: 'The Genesis block',
    text: (
      <>
        The first block carries a newspaper headline: <span className="italic text-white/85">The Times 03/Jan/2009 Chancellor on brink of second bailout for banks</span>.
      </>
    ),
  },
  {
    date: 'December 2010',
    title: 'The last forum post',
    text: 'Satoshi stops posting on the Bitcoin forum. A few emails follow in the spring of 2011, then nothing. The coins mined in the first year stay where they are.',
  },
  {
    date: '05.10.2012',
    title: 'The necromancer',
    text: (
      <>
        A newcomer named Come-from-Beyond starts answering in Satoshi&rsquo;s threads, silent since 2010, quoting him and correcting him as if the conversation had never
        stopped. A forum veteran replies within 36 minutes:{' '}
        <span className="italic text-white/85">&ldquo;You, sir, are a powerful necromancer. Can you raise Satoshi from the dead too?&rdquo;</span>
      </>
    ),
    href: '/books/come-from-beyond/04-the-vanished-satoshi',
    hrefLabel: 'Come-from-Beyond, ch. 4',
  },
]

export function Phase03_TheVanishing() {
  return (
    <PhaseWrapper background="dark" id="vanishing" phaseNumber={3} subtitle="2008 to 2012: one man leaves, another walks in" title="The Vanishing">
      <div className="space-y-10">
        <Quote source="Satoshi Nakamoto, email to Mike Hearn, 23.04.2011">I&rsquo;ve moved on to other things. It&rsquo;s in good hands with Gavin and everyone.</Quote>

        <Moments items={MOMENTS} />

        <Quote source="Come-from-Beyond, bitcointalk, 06.10.2012">We&rsquo;ll get rid of all weaknesses one by one. I&rsquo;m analyzing this one right now.</Quote>

        <OpenQuestion>
          He was walking the Bitcoin wiki&rsquo;s list of weaknesses, item by item, raising each dead thread where Satoshi had once promised a fix. Who takes over an
          estate like that?
        </OpenQuestion>

        <SourceCitationGroup>
          <SourceCitation href="/books/come-from-beyond/04-the-vanished-satoshi" title="Come-from-Beyond, ch. 4: The Vanished Satoshi" />
        </SourceCitationGroup>
      </div>
    </PhaseWrapper>
  )
}
