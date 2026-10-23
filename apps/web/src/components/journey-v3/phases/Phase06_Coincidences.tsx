'use client'

import { PhaseWrapper } from '../shared/PhaseWrapper'
import { SourceCitation, SourceCitationGroup } from '../shared/SourceCitation'
import { ClueCard, OpenQuestion, Quote, type Clue } from '../shared/Story'

const CH17 = '/docs/03-results/17-cfb-satoshi-analysis'
const FACTS = '/docs/05-appendices/02-foundation-facts'

const CLUES: Clue[] = [
  {
    title: 'Block 264',
    text: (
      <>
        Mined on 13 January 2009, ten days after Genesis, it pays 50 BTC to an address that begins{' '}
        <span className="break-all font-mono text-white/80"><span className="text-gold">1CFB</span>dvaiZgZPTZERqnezAtDQJuGHKoHSzg</span>. The block belongs to the Patoshi set, the early blocks most researchers
        attribute to a single miner.
      </>
    ),
    status: 'documented',
    source: 'Verified facts',
    href: FACTS,
  },
  {
    title: 'ZgZ',
    text: (
      <>
        Asked about that address, he wrote: <span className="italic text-white/85">&ldquo;`g` in `ZgZ` will prove that `1CFB2` is not random, and that will be pretty
        convincing proof, so it&rsquo;s not that easy&rdquo;</span>, with a troll emoji. Discord, 20.03.2023.
      </>
    ),
    status: 'his-words',
    source: 'CFB and Satoshi, primary sources',
    href: CH17,
  },
  {
    title: 'Block 4',
    text: (
      <>
        The fifth block ever, mined on 9 January 2009, pays an address that begins <span className="font-mono text-gold">15ubic</span>. The word Qubic first appears on a
        forum three years later.
      </>
    ),
    status: 'documented',
    source: 'Verified facts',
    href: FACTS,
  },
  {
    title: 'Block 369',
    text: (
      <>
        Mined on 13 January 2009, the same day as block 264, and also in the Patoshi set. On 22.09.2026 he told a member: <span className="italic text-white/85">&ldquo;Check content of 369th Bitcoin block&rdquo;</span>. Then:{' '}
        <span className="font-mono text-gold">da1cfb4ad</span>, <span className="font-mono text-gold">&gt;1CFB&lt;</span>,{' '}
        <span className="italic text-white/85">&ldquo;in Pascal&rdquo;</span>.
      </>
    ),
    status: 'his-words',
    source: 'Discord #price-discussion, 22.09.2026',
    href: CH17,
  },
  {
    title: 'Hobo.369',
    text: (
      <>
        Minutes later: <span className="italic text-white/85">&ldquo;Why 369? Guess why my virus had length of 369 bytes&rdquo;</span>, and then two words,{' '}
        <span className="font-mono text-gold">Hobo.369</span>. In June 2025 he had mentioned creating a virus by that name.
      </>
    ),
    status: 'his-words',
    source: 'Discord, 29.06.2025 and 22.09.2026',
    href: CH17,
  },
  {
    title: 'The Genesis key',
    text: (
      <>
        On 13.04.2026: <span className="italic text-white/85">&ldquo;Genesis address isn&rsquo;t a public key, it&rsquo;s steps revealing who Satoshi Nakamoto is&rdquo;</span>,
        then <span className="italic text-white/85">&ldquo;No, it&rsquo;s time locked, only true AI can decode it&rdquo;</span>. Technically, it is a valid public key.
      </>
    ),
    status: 'his-words',
    source: 'Discord #price-discussion, 13.04.2026',
    href: CH17,
  },
]

const DENIALS: [string, string][] = [
  ['20.03.2023', 'Anyway, ownership of that address doesn’t prove to be Satoshi, just early Bitcoin miner'],
  ['25.12.2024', 'It’s all nice guys, but I’m not Satoshi. End of story.'],
  ['23.04.2026', 'I’m not Satoshi. Not even that CFB which was posting in cyberpunk forum.'],
  ['22.09.2026', 'I’m not Satoshi'],
  ['22.09.2026', 'No. It’s just a coincidence. Ask ChatGPT chance to spot “cfb”, it’s pretty high'],
]

export function Phase06_Coincidences() {
  return (
    <PhaseWrapper background="dark" id="coincidences" phaseNumber={6} subtitle="Things that are on the record and still refuse to sit still" title="Strange Coincidences">
      <div className="space-y-10">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CLUES.map((c, i) => (
            <ClueCard clue={c} index={i} key={c.title} />
          ))}
        </div>

        <Quote source="Come-from-Beyond, Discord #price-discussion, 22.09.2026">
          I hinted to a block with a special number (369), why 369 is special is another topic. He spotted &ldquo;cfb&rdquo; inside it. It wasn&rsquo;t telling that it&rsquo;s
          related to me, because without plausible deniability that would be equal to saying that CFB=Satoshi.
        </Quote>

        <section aria-labelledby="denials" className="border border-white/10 bg-black/60 p-5 md:p-7">
          <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-white/50" id="denials">
            What he says when asked directly
          </h3>
          <ul className="mt-4 space-y-3">
            {DENIALS.map(([d, t]) => (
              <li className="grid gap-1 md:grid-cols-[110px_1fr] md:gap-4" key={d + t}>
                <span className="font-mono text-xs text-white/40">{d}</span>
                <span className="italic text-white/80">&ldquo;{t}&rdquo;</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-white/50">
            Chance plays a part too: among 21,953 early Bitcoin keys, 17 addresses begin with 1CF, and chance alone predicts 16.5. A message signed with an early key would
            settle the question. None has been published.
          </p>
        </section>

        <OpenQuestion>He denies it plainly and often. He also keeps pointing at the blocks. Which of the two is the message?</OpenQuestion>

        <SourceCitationGroup>
          <SourceCitation href={CH17} title="CFB and Satoshi: what the primary sources say" />
          <SourceCitation href="/docs/05-appendices/04-discord-archive" title="Discord archive, with message IDs" />
          <SourceCitation href={FACTS} title="Verified facts" />
        </SourceCitationGroup>
      </div>
    </PhaseWrapper>
  )
}
