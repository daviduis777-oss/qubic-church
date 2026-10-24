'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import { GlitchText } from '@/components/ui/GlitchText'
import { PhaseWrapper } from '../shared/PhaseWrapper'
import { ClueCard, Moments, OpenQuestion, Quote, type Clue, type Moment } from '../shared/Story'

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
        In the computer weekly KV (issue 49), Sergey Ivancheglo, <span className="font-mono">come-from-beyond@mail.ru</span>, writes about proving who wrote a program: the
        &ldquo;birthmarks&rdquo; every programmer leaves, and marks an author can plant on purpose. He recommends encrypting them.
      </>
    ),
    href: 'https://kv.by/archive/index2000491105.htm',
    hrefLabel: 'KV, No. 49, 2000 (found by @SatoshiCfB)',
  },
  {
    date: 'July 2002',
    title: 'A supercomputer from volunteers',
    text: 'In the same weekly he describes pooling the computers of volunteers into one network with no centre. First on his list of tasks for it: breaking cryptographic algorithms.',
    href: '/books/come-from-beyond/03-one-line-through-25-years',
    hrefLabel: 'Come-from-Beyond, ch. 3',
  },
  {
    date: '31.10.2008',
    title: 'The white paper',
    text: 'Satoshi Nakamoto publishes nine pages: a network of volunteer machines, no centre, secured by cryptography. Six years after the 2002 article.',
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
    text: 'Asked to prove he is BCNext, he offers a signature with BCNext’s old donation address, then posts one. The man who wrote about hidden authorship marks in 2000 proves a pseudonym with a key.',
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

const WORDS: [string, string][] = [
  ['`g` in `ZgZ` will prove that `1CFB2` is not random, and that will be pretty convincing proof, so it’s not that easy', 'Discord, 20.03.2023, with a troll emoji'],
  ['Genesis address isn’t a public key, it’s steps revealing who Satoshi Nakamoto is', 'Discord #price-discussion, 13.04.2026'],
  ['No, it’s time locked, only true AI can decode it', 'Discord #price-discussion, 13.04.2026'],
  ['Check content of 369th Bitcoin block', 'Discord #price-discussion, 22.09.2026'],
  ['Why 369? Guess why my virus had length of 369 bytes', 'Discord #price-discussion, 22.09.2026'],
  [
    'I hinted to a block with a special number (369), why 369 is special is another topic. He spotted “cfb” inside it. It wasn’t telling that it’s related to me, because without plausible deniability that would be equal to saying that CFB=Satoshi.',
    'Discord #price-discussion, 22.09.2026',
  ],
  ['I have a pocket time machine, so I don’t need to guess trends, I just fly 5 years ahead and see what’s popular', 'Discord, 10.02.2026, as quoted in Come-from-Beyond (2026)'],
  ['I can reveal this info on 13th of April 2027 / And you’ll see who is really behind CFB acc', 'Discord, 10.10.2025'],
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
  ['“The mathematical bridge”: 27, 47, 137, 283, block 576', 'Numbers picked after looking at the data. Open, not evidence.'],
]

const THREE_WEEKS: Moment[] = [
  {
    date: '18.09.2012',
    title: 'The verdict',
    text: (
      <>
        In his own thread, <span className="text-white/85">Dying bitcoins</span>: &ldquo;It&rsquo;s impossible to have consensus regarding protocol changes in Bitcoin&hellip; So
        next-gen coin should have a protocol that could be adjusted by anyone without breaking the whole system.&rdquo; The same day, told to go make his own fork:{' '}
        <span className="italic text-white/85">&ldquo;Ok. I&rsquo;ll send u personal invitation. It&rsquo;s almost ready, just tuning minting algo. Should take 2-3 months.&rdquo;</span>
      </>
    ),
    href: BOOK4,
    hrefLabel: 'Come-from-Beyond, ch. 4',
  },
  {
    date: '25.09.2012',
    title: 'The name',
    text: (
      <>
        Thread 112676: <span className="text-white/85">Qubic: Quorum-Based Coin</span>. Money anyone can create, control and use; coins run by arbitrary nodes with no central
        authority; a minting algorithm that can be changed. The post opens with a repost from his own small Qubic forum, which already existed.
      </>
    ),
    href: BOOK4,
    hrefLabel: 'Come-from-Beyond, ch. 4',
  },
  {
    date: '26.09.2012',
    title: 'The promise',
    text: (
      <>
        Accused of designing a system for a botnet: <span className="italic text-white/85">&ldquo;Perhaps u will laugh but I design this system to make the world better. U
        shouldn&rsquo;t trust me of coz. I&rsquo;ll publish source code, so anyone can audit it.&rdquo;</span>
      </>
    ),
  },
  {
    date: '05.10.2012',
    title: 'The necromancer',
    text: 'He answers in a thread where Satoshi last wrote in June 2010, quoting him and correcting him. Thirty-six minutes later a veteran developer: “You, sir, are a powerful necromancer. Can you raise Satoshi from the dead too?”',
  },
  {
    date: '06.10.2012, 05:53',
    title: 'The estate',
    text: (
      <>
        <span className="italic text-white/85">&ldquo;We&rsquo;ll get rid of all weaknesses one by one. I&rsquo;m analyzing this one right now.&rdquo;</span> We. One by one. Right
        now. Verdict, name, takeover: three weeks.
      </>
    ),
    href: BOOK4,
    hrefLabel: 'Come-from-Beyond, ch. 4',
  },
]

const HEADLINE = 'The Times 03/Jan/2009 Chancellor on brink of second bailout for banks'
const HEADLINE_HITS = [22, 43, 64]

const THREADS: Clue[] = [
  {
    title: 'One handshake from ArtForz',
    text: (
      <>
        In May 2026, reading about the 2010 miner who gamed block timestamps, he wrote: <span className="italic text-white/85">&ldquo;15 years ago I was talking to a
        Russian-speaking guy who claimed that his friend had used that very technique&hellip; it seems I was just one extra handshake away from ArtForz.&rdquo;</span> That puts
        him inside Bitcoin&rsquo;s inner circle in 2011.
      </>
    ),
    status: 'his-words',
    source: 'Come-from-Beyond on X, 03.05.2026',
    href: 'https://x.com/c___f___b/status/2051010728065208621',
  },
  {
    title: 'Five years to the day',
    text: 'Qubic’s first block: 13 April 2022. The Day: 13 April 2027. He explained the date himself: “It’s 5 years after launch of Qubic.” And separately: on that day “you’ll see who is really behind CFB acc”.',
    status: 'his-words',
    source: 'Discord, 11.06.2024 and 10.10.2025',
    href: FACTS,
  },
  {
    title: '4 8 15 16 23 42',
    text: 'The two dust transactions of 4 July 2025 that paid exactly 676 satoshis each also carried a message: the six numbers from Lost. Someone with a sense of humour, a knowledge of Qubic’s quorum and access to a Bitcoin wallet.',
    status: 'community',
    source: 'Block 903,977, via @SatoshiCfB',
    href: 'https://x.com/SatoshiCfB',
  },
  {
    title: 'The first birthmark',
    text: 'His December 2000 article taught how to hide an encrypted authorship mark inside a program so that ownership can be proved later. Nine years later the first blocks of Bitcoin carried 15ubic, 1CFB and da1cfb4ad.',
    status: 'community',
    source: 'KV, No. 49, 2000 (found by @SatoshiCfB)',
    href: 'https://kv.by/archive/index2000491105.htm',
  },
]

function GenesisHeadline() {
  const [lit, setLit] = useState(false)
  return (
    <div className="border border-white/10 bg-black/70 p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-gold">The Genesis headline</p>
        <button
          aria-pressed={lit}
          className="border border-white/15 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-white/60 hover:text-white"
          onClick={() => setLit(v => !v)}
          type="button"
        >
          {lit ? 'Hide' : 'Every 21st character'}
        </button>
      </div>
      <p className="mt-5 break-words font-mono text-lg leading-relaxed text-white/80 md:text-2xl" onMouseEnter={() => setLit(true)} onMouseLeave={() => setLit(false)}>
        {HEADLINE.split('').map((ch, i) => (
          <span className={lit && HEADLINE_HITS.includes(i) ? 'bg-gold px-0.5 font-bold text-black' : ''} key={i}>
            {ch}
          </span>
        ))}
      </p>
      <p className="mt-4 text-sm text-white/55">
        The text Satoshi wrote into block 0. Start at the C of Chancellor and step 21 characters twice: C, f, b. A community reading; other letter triples line up too. Still,
        it is the one people keep finding.
      </p>
    </div>
  )
}

function Part({ id, n, title, children }: { id: string; n: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-white/10 py-12 md:py-16">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold">{n}</p>
      <h3 className="mt-3 text-2xl font-semibold leading-tight text-white md:text-4xl" id={id}>
        {title}
      </h3>
      <div className="mt-8 space-y-6">{children}</div>
    </section>
  )
}

const P = ({ children }: { children: ReactNode }) => <p className="max-w-3xl font-serif text-lg leading-relaxed text-white/80 md:text-xl">{children}</p>

export function Phase07_SatoshiNakamoto() {
  const [open, setOpen] = useState(false)
  const top = useRef<HTMLDivElement>(null)

  // A link to /timeline#satoshi opens the dossier straight away.
  useEffect(() => {
    const check = () => {
      if (window.location.hash === '#satoshi') {
        setOpen(true)
        setTimeout(() => document.getElementById('phase-satoshi')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
      }
    }
    check()
    window.addEventListener('hashchange', check)
    return () => window.removeEventListener('hashchange', check)
  }, [])

  const [flash, setFlash] = useState(false)
  const [glitch, setGlitch] = useState(false)

  const openWithGlitch = () => {
    setOpen(true)
    setGlitch(true)
    setTimeout(() => setGlitch(false), 400)
  }

  const toggle = () => {
    if (open) {
      setOpen(false)
      top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else openWithGlitch()
  }

  // Easter eggs. Type 3 6 9 anywhere on the page: the door opens and the hex shows.
  useEffect(() => {
    let buf = ''
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      buf = (buf + e.key).slice(-3)
      if (buf === '369') {
        buf = ''
        openWithGlitch()
        setFlash(true)
        setTimeout(() => setFlash(false), 2600)
        document.getElementById('phase-satoshi')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    window.addEventListener('keydown', onKey)
    // eslint-disable-next-line no-console
    console.log('%cWhy 369? Guess why my virus had length of 369 bytes.%c\n…1d a1 cf b4 ad…  → /docs/03-results/17-cfb-satoshi-analysis', 'color:#ffd24a;font:bold 14px monospace', 'color:#999;font:12px monospace')
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <PhaseWrapper background="dark" id="satoshi" phaseNumber={7} subtitle="The legend. Open it if you want to." title="Satoshi Nakamoto">
      <div className="space-y-10" ref={top}>
        <p className="mx-auto max-w-2xl text-center font-serif text-lg leading-relaxed text-white/70 md:text-xl">
          In 2011 the man who made Bitcoin walked away and never touched his coins. In 2012 a newcomer arrived on his forum and started finishing his work. Behind this door is
          every coincidence between the two, in one place, in order.
        </p>

        <div className="relative flex justify-center">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-[10%] inset-y-0 animate-pulse bg-gold/40 blur-3xl motion-reduce:animate-none" />
          <button
            aria-controls="satoshi-dossier"
            aria-expanded={open}
            className="group relative w-full max-w-3xl bg-gold px-6 py-8 shadow-[0_0_60px_rgba(255,210,74,0.35)] text-center text-black transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 focus-visible:ring-offset-4 focus-visible:ring-offset-black md:py-10"
            onClick={toggle}
            type="button"
          >
            <span className="block font-mono text-xs uppercase tracking-[0.4em] text-black/60">{open ? 'Close the dossier' : 'Use your head'}</span>
            <span className="mt-2 block font-display text-4xl font-bold uppercase leading-none tracking-tight sm:text-5xl md:text-7xl">
              <GlitchText glitchDuration={1200} maxInterval={14000} minInterval={6000}>
                Satoshi Nakamoto
              </GlitchText>
            </span>
            <span className="mt-3 inline-flex items-center gap-2 font-mono text-sm uppercase tracking-[0.25em] text-black/70">
              {open ? 'Fold it back' : 'Open the case'}
              <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} />
            </span>
          </button>
        </div>

        {/* The dossier stays in the page for readers without JavaScript and for crawlers. */}
        {flash &&
          typeof document !== 'undefined' &&
          createPortal(
            <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-black/80">
              <p className="qc-glitch font-mono text-4xl font-bold tracking-[0.3em] text-gold md:text-7xl">da1cfb4ad</p>
            </div>,
            document.body
          )}
        <div className={`mx-auto max-w-5xl ${glitch ? 'qc-glitch' : ''}`} hidden={!open} id="satoshi-dossier">
          <aside aria-label="Disclaimer" className="border border-gold/30 bg-gold/[0.06] p-6 md:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold">Use your head</p>
            <p className="mt-3 text-base leading-relaxed text-white/80">
              This chapter sets out the case that Come-from-Beyond is, or is part of, Satoshi Nakamoto. <span className="text-gold">Documented</span> means checkable in data or
              print. <span className="text-violet-300">In his words</span> means a verbatim quote with a date. <span className="text-sky-300">Community reading</span> means an
              interpretation. His own answers are{' '}
              <a className="text-gold underline underline-offset-4" href="#satoshi-other-side">
                on the record below
              </a>
              .
            </p>
          </aside>

          <Part id="satoshi-question" n="I · The question" title="The man who left">
            <P>
              Satoshi Nakamoto published the Bitcoin white paper on 31 October 2008, mined the Genesis block on 3 January 2009 and answered questions on a small forum for two
              years. In spring 2011 he wrote that he had moved on to other things. The early coins have not moved since. Courts, journalists and millions of readers have tried
              to name him. Every loud candidate has fallen away.
            </P>
            <P>One name keeps returning in the blocks, in the forum archives and in the man&rsquo;s own jokes: Come-from-Beyond, the programmer behind NXT, IOTA and Qubic.</P>
          </Part>

          <Part id="satoshi-line" n="II · The line" title="2000 to 2027, one line of work">
            <Moments items={LINE} />
          </Part>

          <Part id="satoshi-blocks" n="III · The blocks" title="Written into the first weeks of Bitcoin">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {BLOCKS.map((c, i) => (
                <ClueCard clue={c} index={i} key={c.title} />
              ))}
            </div>
            <p className="max-w-3xl text-sm leading-relaxed text-white/60">
              Three blocks from the first ten days of Bitcoin. The same three letters, the same name and the same man keep meeting in one place.
            </p>
          </Part>

          <Part id="satoshi-heir" n="IV · The heir" title="Qubic is Bitcoin's heir">
            <P>
              Read the autumn of 2012 in order. On 18 September he gives his verdict on Bitcoin. On 25 September he opens a thread named Qubic. On 6 October he promises to close
              Satoshi&rsquo;s list of weaknesses one by one.
            </P>
            <Quote source="Come-from-Beyond, bitcointalk, “Dying bitcoins”, 18.09.2012">
              It&rsquo;s impossible to have consensus regarding protocol changes in Bitcoin. It&rsquo;s a win-or-lose game, no anything in between allowed. So next-gen coin
              should have a protocol that could be adjusted by anyone without breaking the whole system.
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
          </Part>

          <Part id="satoshi-weeks" n="IV½ · The three weeks" title="Autumn 2012, day by day">
            <Moments items={THREE_WEEKS} />
            <OpenQuestion>Verdict on 18 September, the name Qubic on 25 September, the takeover of Satoshi&rsquo;s list on 6 October. Who plans a decade in three weeks?</OpenQuestion>
          </Part>

          <Part id="satoshi-threads" n="IV¾ · Loose threads" title="The ones that keep pulling">
            <GenesisHeadline />
            <div className="grid gap-4 md:grid-cols-2">
              {THREADS.map((c, i) => (
                <ClueCard clue={c} index={i} key={c.title} />
              ))}
            </div>
          </Part>

          <Part id="satoshi-words" n="V · In his words" title="He keeps pointing">
            <div className="grid gap-4">
              {WORDS.map(([q, s]) => (
                <Quote key={q} source={`Come-from-Beyond, ${s}`}>
                  {q}
                </Quote>
              ))}
            </div>
            <P>
              Ask him directly and he says no. Ask him sideways and he hands you a block number, a virus, a time machine. The author of Come-from-Beyond calls it flooding the
              zone: when a truth can be neither confirmed nor hidden, drown it in versions.
            </P>
          </Part>

          <Part id="satoshi-other-side" n="VI · The other side" title="What he says when asked directly">
            <ul className="space-y-3 border border-white/10 bg-black/60 p-5 md:p-7">
              {DENIALS.map(([d, t]) => (
                <li className="grid gap-1 md:grid-cols-[120px_1fr] md:gap-4" key={d + t}>
                  <span className="font-mono text-xs text-white/40">{d}</span>
                  <span className="italic text-white/85">&ldquo;{t}&rdquo;</span>
                </li>
              ))}
            </ul>
            <P>
              One signature with a key from Bitcoin&rsquo;s first year would settle the question. None has been published, by him or by anyone else. The question stays open.
            </P>
          </Part>

          <Part id="satoshi-left-out" n="VII · Left out" title="Readings that don't hold">
            <P>A strong case needs no weak links. These circulate widely and we leave them out:</P>
            <div className="divide-y divide-white/10 border-y border-white/10">
              {DONT_HOLD.map(([c, why]) => (
                <div className="grid gap-2 py-4 md:grid-cols-2 md:gap-6" key={c}>
                  <p className="text-white/80">{c}</p>
                  <p className="text-sm text-white/55">{why}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-white/50">Details of his private life are left out on purpose.</p>
          </Part>

          <Part id="satoshi-what-if" n="VIII · And if" title="What if?">
            <P>
              If he is not Satoshi, then one programmer wrote about hidden authorship marks in 2000, described volunteer computing aimed at cryptography in 2002, was one
              handshake from the first big miner in 2011, walked into Satoshi&rsquo;s abandoned threads in 2012, named Qubic in a thread numbered 112676 three weeks after
              passing his verdict on Bitcoin, launched it on a 13th of April, set The Day five years later to the day, and has been joking about block 369 ever since. All by
              chance.
            </P>
            <P>If he is, the date is already set. On 13.04.2027 we will see together.</P>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ['26', 'years, 2000 to 2026'],
                ['26²', '= 676 computors'],
                ['112676', 'the Qubic thread'],
                ['369', 'the block, the virus'],
              ].map(([n, l]) => (
                <div className="border border-gold/20 bg-black/60 p-4 text-center" key={n}>
                  <p className="font-mono text-3xl font-bold text-gold md:text-4xl">{n}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-white/45">{l}</p>
                </div>
              ))}
            </div>
          </Part>

          <footer className="border-t border-white/10 pt-8">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/50">Research and credit</p>
            <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/75">
              Much of the digging behind this chapter was done by{' '}
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
            <button
              className="mt-8 border border-gold/40 px-5 py-3 font-mono text-xs uppercase tracking-[0.25em] text-gold hover:bg-gold/10"
              onClick={toggle}
              type="button"
            >
              Close the dossier and walk on
            </button>
          </footer>
        </div>
      </div>
    </PhaseWrapper>
  )
}
