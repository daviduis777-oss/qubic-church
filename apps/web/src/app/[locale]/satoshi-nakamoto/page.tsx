import type { Metadata } from 'next'
import Link from 'next/link'
import { setRequestLocale } from 'next-intl/server'
import { DisclaimerGate } from '@/components/journey-v3/shared/DisclaimerGate'
import { ClueCard, Moments, Quote, type Clue, type Moment } from '@/components/journey-v3/shared/Story'
import { jsonLd } from '@/lib/json-ld'
import { SITE_URL } from '@/lib/books'

const TITLE = 'Satoshi Nakamoto: the case for Come-from-Beyond'
const DESC =
  'A hypothesis laid out in full: every dated fact, block and quote suggesting that Come-from-Beyond is, or is part of, Satoshi Nakamoto. With his denials. Think for yourself.'

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: `${SITE_URL}/satoshi-nakamoto` },
  openGraph: { type: 'article', title: TITLE, description: DESC, url: `${SITE_URL}/satoshi-nakamoto` },
}

const CH17 = '/docs/03-results/17-cfb-satoshi-analysis'
const FACTS = '/docs/05-appendices/02-foundation-facts'
const DISCORD = '/docs/05-appendices/04-discord-archive'
const BOOK4 = '/books/come-from-beyond/04-the-vanished-satoshi'

const LINE: Moment[] = [
  {
    date: 'December 2000',
    title: 'Hidden marks in code',
    text: (
      <>
        In the Minsk weekly KV (issue 49), Sergey Ivancheglo, <span className="font-mono">come-from-beyond@mail.ru</span>, writes about proving authorship of a program: the
        &ldquo;birthmarks&rdquo; every programmer leaves, and marks an author can plant on purpose. He recommends encrypting them.
      </>
    ),
    href: 'https://kv.by/archive/index2000491105.htm',
    hrefLabel: 'KV, No. 49, 2000 (found by @SatoshiCfB)',
  },
  {
    date: 'July 2002',
    title: 'A supercomputer from volunteers',
    text: 'In a Minsk computer newspaper he describes pooling the computers of volunteers into one network with no centre. First on his list of tasks for it: breaking cryptographic algorithms.',
    href: '/books/come-from-beyond/03-one-line-through-25-years',
    hrefLabel: 'Come-from-Beyond, ch. 3',
  },
  {
    date: '31.10.2008',
    title: 'The white paper',
    text: 'Satoshi Nakamoto publishes nine pages: a network of volunteer machines, no centre, secured by cryptography. Six years after the Minsk article.',
  },
  {
    date: '9 to 13.01.2009',
    title: 'Three blocks',
    text: (
      <>
        Block 4 pays an address beginning <span className="font-mono text-gold">15ubic</span>. Block 264 pays <span className="font-mono text-gold">1CFB</span>&hellip;. Block 369
        carries the hex string <span className="font-mono text-gold">da1cfb4ad</span>. Blocks 264 and 369 belong to the Patoshi set, the early blocks attributed to one miner.
      </>
    ),
    href: CH17,
    hrefLabel: 'CFB and Satoshi: the blocks',
  },
  {
    date: '23.04.2011',
    title: 'Satoshi leaves',
    text: (
      <>
        His last known email: <span className="italic text-white/85">&ldquo;I&rsquo;ve moved on to other things. It&rsquo;s in good hands with Gavin and everyone.&rdquo;</span> The
        coins of the first year never move.
      </>
    ),
  },
  {
    date: 'September 2012',
    title: 'A newcomer reads the will',
    text: 'Come-from-Beyond walks the Bitcoin wiki’s list of weaknesses and answers in Satoshi’s dead threads, one by one. A veteran calls him a necromancer. In the same weeks he names his next coin: Qubic.',
    href: BOOK4,
    hrefLabel: 'Come-from-Beyond, ch. 4',
  },
  {
    date: '2013',
    title: 'BCNext',
    text: 'NXT, the first full proof-of-stake blockchain, launches under the pseudonym BCNext. Read it as Bitcoin Next, or don’t.',
  },
  {
    date: '20.11.2017',
    title: 'A signature',
    text: (
      <>
        Asked to prove he is BCNext, he offers a signature with BCNext&rsquo;s old donation address, then posts one. The man who wrote about hidden authorship marks in 2000
        proves a pseudonym with a key.
      </>
    ),
    href: 'https://x.com/c___f___b/status/932555646305697794',
    hrefLabel: 'Come-from-Beyond on X, 20.11.2017',
  },
  {
    date: '13.04.2022',
    title: 'Qubic',
    text: 'The network he named in 2012 goes live: a quorum of 676, useful proof of work, miners growing an artificial mind.',
  },
  {
    date: '13.04.2027',
    title: 'The Day',
    text: 'Five years after the launch. The date he keeps naming, and the day he says we will see who is behind the CFB account.',
    href: '/timeline',
    hrefLabel: 'The Road to The Day',
  },
]

const BLOCKS: Clue[] = [
  {
    title: 'Block 4: 15ubic',
    text: 'Mined on 9 January 2009, the fifth block ever. The address it pays begins 15ubic. Three years later the word Qubic appears on a forum, written by Come-from-Beyond.',
    status: 'documented',
    source: 'Verified facts',
    href: FACTS,
  },
  {
    title: 'Block 264: 1CFB',
    text: 'Mined on 13 January 2009. It pays 50 BTC to 1CFBdvaiZgZPTZERqnezAtDQJuGHKoHSzg, an address with no digit after the leading 1. CFB is how he signs.',
    status: 'documented',
    source: 'CFB and Satoshi, the blocks',
    href: CH17,
  },
  {
    title: 'Block 369: da1cfb4ad',
    text: 'Mined the same day. Its public key holds the hex digits da 1 cfb 4 ad. He pointed people to this block himself, then named a virus he once wrote: Hobo.369.',
    status: 'documented',
    source: 'CFB and Satoshi, the blocks',
    href: CH17,
  },
  {
    title: 'The Patoshi set',
    text: 'Blocks 264 and 369 both belong to the set of early blocks researchers attribute to a single dominant miner, widely thought to be Satoshi.',
    status: 'documented',
    source: 'CFB and Satoshi, primary sources',
    href: CH17,
  },
  {
    title: 'Notices to old wallets',
    text: 'In July 2025 and May 2026, the 1CFB and 15ubic addresses received on-chain notices from parties claiming dormant early wallets. Neither address has moved.',
    status: 'documented',
    source: 'Bitcoin transactions, via @SatoshiCfB',
    href: 'https://x.com/SatoshiCfB',
  },
  {
    title: 'A fee of 676',
    text: 'On 4 July 2025 two transactions sent dust to dormant 10,000 BTC wallets, each paying a fee of exactly 676 satoshis, the size of the Qubic quorum. The sender is unknown.',
    status: 'community',
    source: 'Block 903,977, via @SatoshiCfB',
    href: 'https://x.com/SatoshiCfB',
  },
]

const WORDS: [string, string, string?][] = [
  ['“`g` in `ZgZ` will prove that `1CFB2` is not random, and that will be pretty convincing proof, so it’s not that easy”', 'Discord, 20.03.2023, with a troll emoji'],
  ['“Genesis address isn’t a public key, it’s steps revealing who Satoshi Nakamoto is”', 'Discord #price-discussion, 13.04.2026'],
  ['“No, it’s time locked, only true AI can decode it”', 'Discord #price-discussion, 13.04.2026'],
  ['“Check content of 369th Bitcoin block”', 'Discord #price-discussion, 22.09.2026'],
  ['“Why 369? Guess why my virus had length of 369 bytes”', 'Discord #price-discussion, 22.09.2026'],
  [
    '“I hinted to a block with a special number (369), why 369 is special is another topic. He spotted “cfb” inside it. It wasn’t telling that it’s related to me, because without plausible deniability that would be equal to saying that CFB=Satoshi.”',
    'Discord #price-discussion, 22.09.2026',
  ],
  ['“I have a pocket time machine, so I don’t need to guess trends, I just fly 5 years ahead and see what’s popular”', 'Discord, 10.02.2026, as quoted in Come-from-Beyond (2026)'],
  ['“I can reveal this info on 13th of April 2027” / “And you’ll see who is really behind CFB acc”', 'Discord, 10.10.2025'],
]

const DENIALS: [string, string][] = [
  ['20.03.2023', 'Anyway, ownership of that address doesn’t prove to be Satoshi, just early Bitcoin miner'],
  ['25.12.2024', 'It’s all nice guys, but I’m not Satoshi. End of story.'],
  ['23.04.2026', 'I’m not Satoshi. Not even that CFB which was posting in cyberpunk forum.'],
  ['22.09.2026', 'I’m not Satoshi'],
  ['22.09.2026', 'No. It’s just a coincidence. Ask ChatGPT chance to spot “cfb”, it’s pretty high'],
]

const DONT_HOLD: [string, string][] = [
  ['“15 means Q in base58, so 15ubic spells Qubic”', 'In base58 the leading 1 is a version byte, and 5 is an ordinary digit. The prefix is striking on its own; the decoding is not real.'],
  ['“He holds 800,000 BTC”', 'Nothing supports it, and nobody should repeat it about a living person.'],
  ['“Satoshi emailed about joining the cypherpunks at 14”, “the 100 push-ups email”', 'No such emails are known.'],
  ['“Satoshi cut a name out of The Times headline”', 'The print front page read exactly as the Genesis block does.'],
  ['“The mathematical bridge”: 27, 47, 137, 283, block 576', 'Numbers picked after looking at the data. We withdrew these ourselves in September 2026.'],
]

function Section({ id, n, title, children }: { id: string; n: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-white/10 py-14 md:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold">{n}</p>
      <h2 className="mt-3 text-3xl font-semibold leading-tight text-white md:text-5xl" id={id}>
        {title}
      </h2>
      <div className="mt-8 space-y-6">{children}</div>
    </section>
  )
}

const P = ({ children }: { children: React.ReactNode }) => <p className="max-w-3xl font-serif text-lg leading-relaxed text-white/80 md:text-xl">{children}</p>

export default async function SatoshiPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: TITLE,
    description: DESC,
    url: `${SITE_URL}/satoshi-nakamoto`,
    author: { '@type': 'Organization', name: 'Qubic Church', url: SITE_URL },
    about: [
      { '@type': 'Person', name: 'Satoshi Nakamoto' },
      { '@type': 'Person', name: 'Sergey Ivancheglo', alternateName: 'Come-from-Beyond' },
    ],
    abstract:
      'A hypothesis, not a finding: the dated facts, blocks and quotes that lead some researchers to think Come-from-Beyond is, or is part of, Satoshi Nakamoto, together with his repeated denials.',
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <script dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} type="application/ld+json" />
      <DisclaimerGate eyebrow="Think for yourself" linkHref="#other-side" linkLabel="Read his denials first" storageKey="qc-satoshi-disclaimer" title="Satoshi Nakamoto">
        <p>This page argues one side on purpose. It sets out the case that Come-from-Beyond is, or is part of, Satoshi Nakamoto, as strongly as the facts allow.</p>
        <p>It proves nothing. Coincidences come from chance and from looking hard enough. Come-from-Beyond has denied being Satoshi many times, and every denial is on this page.</p>
        <p>Every item is labelled and sourced. Check them, and make up your own mind.</p>
      </DisclaimerGate>

      <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-28 sm:px-6 md:pt-36">
        <header>
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-gold">A hypothesis, in full</p>
          <h1 className="mt-5 font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight md:text-8xl">Satoshi Nakamoto</h1>
          <p className="mt-8 max-w-3xl font-serif text-xl leading-relaxed text-white/80 md:text-2xl">
            In 2011 the man who made Bitcoin walked away and never touched his coins. In 2012 a newcomer arrived on his forum and started finishing his work. This page puts every
            coincidence between the two in one place, in order.
          </p>
        </header>

        <aside aria-label="Disclaimer" className="mt-12 border border-gold/30 bg-gold/[0.06] p-6 md:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold">Think for yourself</p>
          <p className="mt-3 text-base leading-relaxed text-white/80">
            This is a hypothesis, argued from one side. It proves nothing. Come-from-Beyond has said many times that he is not Satoshi; his words are{' '}
            <a className="text-gold underline underline-offset-4" href="#other-side">
              below
            </a>
            . Labels: <span className="text-gold">Documented</span> means checkable in data or print. <span className="text-violet-300">In his words</span> means a verbatim quote
            with a date. <span className="text-sky-300">Community reading</span> means an interpretation. Nothing here is financial advice or a claim about anyone&rsquo;s coins.
          </p>
        </aside>

        <Section id="question" n="01 · The question" title="The man who left">
          <P>
            Satoshi Nakamoto published the Bitcoin white paper on 31 October 2008, mined the Genesis block on 3 January 2009 and answered questions on a small forum for two years.
            In spring 2011 he wrote that he had moved on to other things. The early coins have not moved since. Courts, journalists and millions of readers have tried to name
            him. Every loud candidate has fallen away.
          </P>
          <P>
            One name keeps returning in the blocks, in the forum archives and in the man&rsquo;s own jokes: Come-from-Beyond, the Minsk programmer behind NXT, IOTA and Qubic.
          </P>
        </Section>

        <Section id="line" n="02 · The line" title="2000 to 2027, one line of work">
          <Moments items={LINE} />
        </Section>

        <Section id="blocks" n="03 · The blocks" title="Written into the first weeks of Bitcoin">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {BLOCKS.map((c, i) => (
              <ClueCard clue={c} index={i} key={c.title} />
            ))}
          </div>
          <p className="max-w-3xl text-sm leading-relaxed text-white/50">
            Chance plays its part: among 21,953 early keys, 17 addresses begin with 1CF where chance predicts 16.5, and a prefix like 15ubic is expected somewhere among
            thousands. What is harder to wave away is that the same three letters, the same name and the same man keep meeting in one place.
          </p>
        </Section>

        <Section id="heir" n="04 · The heir" title="Qubic is Bitcoin's heir">
          <P>
            Read the autumn of 2012 in order. On 18 September he gives his verdict on Bitcoin. On 25 September he opens a thread named Qubic. On 6 October he promises to close
            Satoshi&rsquo;s list of weaknesses one by one.
          </P>
          <Quote source="Come-from-Beyond, bitcointalk, “Dying bitcoins”, 18.09.2012">
            It&rsquo;s impossible to have consensus regarding protocol changes in Bitcoin. It&rsquo;s a win-or-lose game, no anything in between allowed. So next-gen coin should
            have a protocol that could be adjusted by anyone without breaking the whole system.
          </Quote>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['The bonfire', 'Burns electricity on meaningless hashes.', 'Spends the same power training neural networks: useful proof of work.'],
              ['The frozen protocol', 'Cannot change without a war.', 'Run by a quorum of 676 that can change the rules.'],
              ['The volunteers', 'Satoshi gathered strangers’ machines to secure money.', 'Gathers them to grow a mind, as the 2002 article proposed.'],
            ].map(([t, a, b]) => (
              <div className="border border-white/10 bg-white/[0.03] p-5" key={t}>
                <p className="font-semibold text-white/90">{t}</p>
                <p className="mt-2 text-sm text-white/50">Bitcoin: {a}</p>
                <p className="mt-2 text-sm text-white/80">Qubic: {b}</p>
              </div>
            ))}
          </div>
          <P>
            Whoever Satoshi was, Qubic is the direct heir to his unfinished list. It was named on Satoshi&rsquo;s own forum, in the thread numbered 112676, ten years before 676
            computors started voting.
          </P>
        </Section>

        <Section id="words" n="05 · In his words" title="He keeps pointing">
          <div className="grid gap-4">
            {WORDS.map(([q, s]) => (
              <Quote key={q} source={`Come-from-Beyond, ${s}`}>
                {q.replace(/^“|”$/g, '')}
              </Quote>
            ))}
          </div>
          <P>
            Ask him directly and he says no. Ask him sideways and he hands you a block number, a virus, a time machine. The author of Come-from-Beyond calls it flooding the zone:
            when a truth can be neither confirmed nor hidden, drown it in versions. That reading is ours. The quotes are his.
          </P>
        </Section>

        <Section id="other-side" n="06 · The other side" title="What he says when asked directly">
          <ul className="space-y-3 border border-white/10 bg-black/60 p-5 md:p-7">
            {DENIALS.map(([d, t]) => (
              <li className="grid gap-1 md:grid-cols-[120px_1fr] md:gap-4" key={d + t}>
                <span className="font-mono text-xs text-white/40">{d}</span>
                <span className="italic text-white/85">&ldquo;{t}&rdquo;</span>
              </li>
            ))}
          </ul>
          <P>
            No message signed with a key from Bitcoin&rsquo;s first year has been published by him or by anyone else. That one signature would settle the question. Until then it
            stays open.
          </P>
        </Section>

        <Section id="dont-hold" n="07 · Left out" title="Readings that don't hold">
          <P>A strong case does not need weak links. These circulate widely and we leave them out, with the reason:</P>
          <div className="divide-y divide-white/10 border-y border-white/10">
            {DONT_HOLD.map(([c, why]) => (
              <div className="grid gap-2 py-4 md:grid-cols-2 md:gap-6" key={c}>
                <p className="text-white/80">{c}</p>
                <p className="text-sm text-white/55">{why}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-white/50">Details of his private life are left out on purpose.</p>
        </Section>

        <Section id="ending" n="08 · And if" title="What if?">
          <P>
            If he is not Satoshi, then one man in Minsk wrote about hidden authorship marks in 2000, described volunteer computing aimed at cryptography in 2002, walked into
            Satoshi&rsquo;s abandoned threads in 2012, named Qubic in a thread numbered 112676, and has been joking about block 369 ever since. All by chance.
          </P>
          <P>If he is, the date is already set. On 13.04.2027 we will see together.</P>
        </Section>

        <footer className="border-t border-white/10 pt-10">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/50">Research and credit</p>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/75">
            Much of the digging behind this page was done by{' '}
            <a className="text-gold underline underline-offset-4" href="https://x.com/SatoshiCfB" rel="noopener noreferrer" target="_blank">
              @SatoshiCfB
            </a>
            , who has been collecting this case in the open since January 2025. Our own checks are in{' '}
            <Link className="text-gold underline underline-offset-4" href={CH17}>
              CFB and Satoshi: what the primary sources say
            </Link>
            , the{' '}
            <Link className="text-gold underline underline-offset-4" href={DISCORD}>
              Discord archive with message IDs
            </Link>
            , the{' '}
            <Link className="text-gold underline underline-offset-4" href={FACTS}>
              verified facts
            </Link>{' '}
            and the book{' '}
            <Link className="text-gold underline underline-offset-4" href="/books/come-from-beyond">
              Come-from-Beyond
            </Link>
            .
          </p>
        </footer>
      </div>
    </div>
  )
}
