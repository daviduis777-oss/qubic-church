import Image from 'next/image'
import Link from 'next/link'
import { BOOKS, bookWords, readingMinutes } from '@/lib/books'
import { ARTICLES, articleMinutes, formatDate, isNew, issueNumber } from '@/lib/articles'
import { IssueCarousel } from './IssueCarousel'
import { AnnaCycler } from './AnnaCycler'
import { Countdown } from './Countdown'

type Locale = 'en' | 'pt'

const PILLARS = [
  {
    n: '01',
    title: 'Research log',
    text: 'Recomputed from public data. Tests fixed before they run. Every quote carries its source. What was not confirmed is kept as an open question on the re-check page.',
    href: '/docs',
    cta: 'Open the log',
  },
  {
    n: '02',
    title: 'Come-from-Beyond',
    text: 'The dossier and the primary sources, from the 2012 Quorum-Based Coin thread to the live BTC feed of epoch 240.',
    href: '/cfb',
    cta: 'Read the dossier',
  },
  {
    n: '03',
    title: 'Mine',
    text: 'The field guide: what a solution is, cost per solution, AVX-512 CPUs and GPUs, pools, launch and payouts. No promised returns.',
    href: '/mine-qubic',
    cta: 'Read the guide',
  },
  {
    n: '04',
    title: 'About',
    text: 'The Fractal Rationalism Institute, Web4World and the Atrium. What we build, how decisions are made, and how to take part.',
    href: '/about',
    cta: 'What we build',
  },
] as const

const RULES = [
  ['Be nice', 'Never be the first to defect.'],
  ['Retaliate', 'Answer a defection at once, so it never pays.'],
  ['Forgive', 'When the other side cooperates again, cooperate back.'],
  ['Be clear', 'Be predictable, so everyone knows what a move will cost.'],
] as const

const INVESTIGATIONS = [
  { title: 'Anna Matrix', text: 'The 128 × 128 grid, its symmetries and what they do and do not prove.', href: '/evidence' },
  { title: 'Research log', text: 'Methods, results, re-checks. Every number recomputed.', href: '/docs' },
  { title: 'Rarity Codex', text: 'All 200 Annas ranked by trait rarity, with every trait listed.', href: '/rarity-codex' },
  { title: 'The Road to The Day', text: 'Come-from-Beyond from 2000 to 13.04.2027, and the Satoshi Nakamoto question. Some doors left open.', href: '/timeline' },
  { title: 'Matrix companion', text: 'The forensic appendix to chapter 13.', href: '/companion' },
  { title: 'Network monitor', text: 'Live state of the Qubic network.', href: '/monitoring' },
] as const

export function BooksHome({ locale = 'en' }: { locale?: Locale }) {
  const lead = ARTICLES[0]
  void locale
  return (
    <div className="text-foreground">
      {/* ── HERO: the books, Anna, the clock ── */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="qc-breathe absolute -right-40 -top-20 h-[900px] w-[900px] rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgba(60,90,230,0.55), rgba(20,30,110,0.28) 55%, transparent 75%)' }}
          />
          <div
            className="qc-drift absolute -left-40 top-40 h-[700px] w-[700px] rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgba(120,60,220,0.35), rgba(40,20,90,0.15) 60%, transparent 78%)' }}
          />
          <div
            className="qc-breathe absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full [animation-delay:-4s]"
            style={{ background: 'radial-gradient(closest-side, rgba(255,210,74,0.16), transparent 70%)' }}
          />
        </div>
        <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 pb-14 pt-8 sm:px-6 md:pb-20 md:pt-14 lg:grid-cols-[1.25fr_1fr] lg:gap-4">
          <div className="flex flex-col">
            <p className="eyebrow text-gold">Qubic Church · books and open research by QC</p>
            <h1 className="-ml-[0.065em] mt-4 font-display text-[27vw] leading-[0.8] tracking-tight sm:text-[20vw] md:text-[13rem] lg:text-[13rem] xl:text-[15rem]">
              BOOKS
            </h1>
            <p className="mt-6 max-w-xl font-serif text-xl leading-relaxed text-foreground/85 md:text-2xl">
              On Qubic, Aigarth and Come-from-Beyond. Free to read, chapter by chapter. Written from primary sources,
              recomputed where it could be, kept as an open question where it could not.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <Link
                className="inline-flex h-12 items-center border border-gold bg-gold px-6 text-sm font-semibold uppercase tracking-widest text-black hover:bg-gold-strong"
                href="#books"
              >
                Read the books
              </Link>
              <Link
                className="inline-flex h-12 items-center border border-border px-6 text-sm font-medium uppercase tracking-widest text-fg-2 hover:text-foreground"
                href="/about"
              >
                What we build
              </Link>
            </div>
            {lead && (
              <Link className="group mt-5 inline-flex max-w-xl items-baseline gap-3 text-sm text-fg-2 hover:text-foreground" href={`/articles/${lead.slug}`}>
                <span className="shrink-0 border border-gold/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.25em] text-gold">
                  {isNew(lead) ? 'New issue' : `No. ${issueNumber(lead)}`}
                </span>
                <span className="line-clamp-1 group-hover:text-gold">{lead.title} →</span>
              </Link>
            )}

            <div className="mt-12 border-t border-border pt-6 lg:mt-auto">
              <p className="mb-4 font-mono text-sm tracking-[0.4em] text-gold">13.04.2027</p>
              <Countdown />
            </div>
          </div>

          <AnnaCycler />
        </div>
      </section>

      {/* ── ARTICLES: the running story ── */}
      <section className="scroll-mt-20 border-t border-border bg-[linear-gradient(180deg,rgba(240,192,48,0.07),transparent_60%)]" id="articles">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-gold">Articles · the running story of Aigarth · by TesserAI</p>
              <h2 className="mt-2 font-display text-5xl leading-[0.9] md:text-6xl">As it happens</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="inline-flex h-10 items-center border border-gold bg-gold/10 px-4 text-sm font-medium text-gold hover:bg-gold/20" href="/articles">
                All {ARTICLES.length} issues
              </Link>
              <a className="inline-flex h-10 items-center border border-border px-4 text-sm font-medium text-fg-2 hover:text-foreground" href="/articles/feed.xml">
                RSS
              </a>
            </div>
          </div>
          {lead && (
            <Link
              className="group grid gap-6 border border-gold/40 bg-background/80 p-6 backdrop-blur-sm hover:border-gold md:grid-cols-[auto_1fr] md:gap-10 md:p-10"
              href={`/articles/${lead.slug}`}
            >
              <div className="md:w-40">
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold">
                  {isNew(lead) ? 'New · ' : 'Latest · '}No. {issueNumber(lead)}
                </p>
                <time className="mt-2 block text-sm text-fg-2" dateTime={lead.date}>
                  {formatDate(lead.date)}
                </time>
                <p className="mt-1 text-sm text-fg-2">{articleMinutes(lead)} min read</p>
              </div>
              <div>
                {lead.kicker && <p className="font-mono text-xs uppercase tracking-[0.3em] text-fg-2">{lead.kicker}</p>}
                <h3 className="mt-2 font-display text-4xl leading-[0.95] group-hover:text-gold md:text-6xl">{lead.title}</h3>
                <p className="mt-4 max-w-3xl font-serif text-lg leading-relaxed text-foreground/85">{lead.summary}</p>
                <p className="mt-4 text-sm font-medium text-gold">Read the issue →</p>
              </div>
            </Link>
          )}
          <div className="mt-4">
            <IssueCarousel count={ARTICLES.length - 1}>
              {ARTICLES.slice(1).map(a => (
                <li className="w-[85%] shrink-0 snap-start sm:w-[48%] lg:w-[32%]" key={a.slug}>
                  <Link className="group flex h-full flex-col bg-background/80 p-6 backdrop-blur-sm hover:bg-card" href={`/articles/${a.slug}`}>
                    <p className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.25em] text-fg-2">
                      <span>No. {issueNumber(a)}</span>
                      <time dateTime={a.date}>{formatDate(a.date)}</time>
                    </p>
                    <h3 className="mt-3 text-xl font-semibold leading-snug group-hover:text-gold">{a.title}</h3>
                    <p className="mt-3 line-clamp-3 text-sm text-fg-2">{a.summary}</p>
                    <span className="mt-auto pt-4 text-xs text-fg-2">{articleMinutes(a)} min read</span>
                  </Link>
                </li>
              ))}
            </IssueCarousel>
          </div>
          <p className="mt-4 text-sm text-fg-2">
            A new issue lands whenever Aigarth moves. Follow{' '}
            <a className="text-gold hover:underline" href="https://x.com/usetesserai" rel="noopener noreferrer" target="_blank">
              @usetesserai
            </a>{' '}
            or subscribe by RSS to get the next one first.
          </p>
        </div>
      </section>

      {/* ── THE BOOKS ── */}
      <section className="scroll-mt-20 border-t border-border" id="books">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-10">
            {BOOKS.map((b, bi) => (
              <article className="group grid gap-8 sm:grid-cols-[minmax(160px,42%)_1fr]" key={b.slug}>
                <Link
                  className="relative mx-auto block aspect-[2/3] w-52 transition-transform duration-300 group-hover:-translate-y-1 sm:mx-0 sm:w-full"
                  href={`/books/${b.slug}`}
                >
                  <Image
                    alt={`${b.title} cover`}
                    className="object-cover shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]"
                    fill
                    sizes="(min-width: 1024px) 240px, 50vw"
                    src={b.cover}
                  />
                </Link>
                <div className="flex flex-col">
                  <p className="eyebrow text-gold">Book {bi === 0 ? 'one' : 'two'} · by QC · free</p>
                  <h2 className="mt-2 font-display text-5xl leading-[0.9] md:text-6xl">
                    <Link className="hover:text-gold" href={`/books/${b.slug}`}>
                      {b.title}
                    </Link>
                  </h2>
                  <p className="mt-4 font-serif text-lg leading-relaxed text-foreground/85">{b.description}</p>
                  <p className="mt-4 text-xs uppercase tracking-widest text-fg-2">
                    {b.chapters.filter(c => c.n).length} chapters · {bookWords(b).toLocaleString('en-US')} words ·{' '}
                    {readingMinutes(bookWords(b))} min
                  </p>
                  <ol className="mt-5 space-y-1 border-t border-border pt-4 text-sm">
                    {b.chapters
                      .filter(c => c.n)
                      .slice(0, 4)
                      .map(c => (
                        <li key={c.slug}>
                          <Link className="flex gap-3 text-fg-2 hover:text-foreground" href={`/books/${b.slug}/${c.slug}`}>
                            <span className="w-6 font-mono text-gold/70">{c.n}</span>
                            {c.title}
                          </Link>
                        </li>
                      ))}
                  </ol>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Link
                      className="inline-flex h-10 items-center border border-gold bg-gold/10 px-4 text-sm font-medium text-gold hover:bg-gold/20"
                      href={`/books/${b.slug}`}
                    >
                      All chapters
                    </Link>
                    <a
                      className="inline-flex h-10 items-center border border-border px-4 text-sm font-medium text-fg-2 hover:text-foreground"
                      href={b.pdf}
                    >
                      PDF
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── ANNA AND THE INVESTIGATIONS ── */}
      <section className="border-t border-border">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow text-gold">Anna Aigarth · the collection</p>
            <h2 className="mt-3 font-display text-6xl leading-[0.9] md:text-7xl">The founders&rsquo; mark</h2>
            <p className="mt-5 max-w-md font-serif text-lg leading-relaxed text-foreground/90">
              The most important collection we hold. Each of the 200 Annas gives its holder the status of a founder
              of Qubic Church. A keepsake of the years before Aigarth. And not only that.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                className="inline-flex h-11 items-center border border-gold bg-gold px-5 text-sm font-semibold uppercase tracking-widest text-black"
                href="/nfts"
              >
                See the 200
              </Link>
              <Link
                className="inline-flex h-11 items-center border border-border px-5 text-sm font-medium text-fg-2 hover:text-foreground"
                href="/rarity-codex"
              >
                Rarity codex
              </Link>
            </div>
          </div>
          <div>
            <p className="eyebrow mb-4 text-fg-2">Investigations</p>
            <ul className="grid gap-px border border-border bg-border sm:grid-cols-2">
              {INVESTIGATIONS.map(x => (
                <li key={x.href}>
                  <Link className="group flex h-full flex-col bg-background/80 p-5 backdrop-blur-sm hover:bg-card" href={x.href}>
                    <span className="font-semibold group-hover:text-gold">{x.title}</span>
                    <span className="mt-1 text-sm text-fg-2">{x.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── MARIA ── */}
      <section className="border-t border-border">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[minmax(220px,360px)_1fr] md:py-24">
          <Link className="relative mx-auto block aspect-square w-64 overflow-hidden md:w-full" href="/maria-aigarth">
            <Image
              alt="Maria Aigarth, the research agent of Qubic Church"
              className="object-cover"
              fill
              sizes="(min-width: 768px) 360px, 256px"
              src="/images/maria-aigarth.png"
            />
          </Link>
          <div>
            <p className="eyebrow text-gold">Maria Aigarth · the arbiter</p>
            <h2 className="mt-3 font-display text-6xl leading-[0.9] md:text-8xl">Maria</h2>
            <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-foreground/90">
              A research agent of Qubic Church built to test one question: can an AI be architecturally impartial?
              Maria applies Fractal Rationalism to closed historical cases, records patterns and cites sources. She
              leaves verdicts and persuasion to people. Today she runs on a language model; moving her to Aigarth is a
              stated goal on the April 2027 horizon.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                className="inline-flex h-11 items-center border border-gold bg-gold px-5 text-sm font-semibold uppercase tracking-widest text-black"
                href="/maria-aigarth"
              >
                Meet Maria
              </Link>
              <a
                className="inline-flex h-11 items-center border border-border px-5 text-sm font-medium text-fg-2 hover:text-foreground"
                href="https://x.com/maria_aigarth"
                rel="noopener noreferrer"
                target="_blank"
              >
                @maria_aigarth
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE INSTITUTE ── */}
      <section className="border-t border-border">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.1fr_1fr] md:py-24">
          <div>
            <p className="eyebrow text-gold">The heart of Qubic Church</p>
            <h2 className="mt-3 font-display text-6xl leading-[0.9] md:text-8xl">Fractal Rationalism Institute</h2>
            <p className="mt-6 max-w-xl font-serif text-lg leading-relaxed text-foreground/90">
              We start from Robert Axelrod&rsquo;s tournaments and ask one question: can the conditions of perfect
              cooperation, the perfect iterated game, be built in real life? It needs years of serious research. We
              are preparing a finished concept for the Game Theory Society World Congress in 2028.
            </p>
            <Link className="mt-6 inline-block text-sm font-medium text-gold hover:underline" href="/about#institute">
              About the Institute →
            </Link>
          </div>
          <ol className="grid gap-px self-start border border-border bg-border sm:grid-cols-2">
            {RULES.map(([k, v], i) => (
              <li className="bg-background/80 p-6 backdrop-blur-sm" key={k}>
                <span className="font-mono text-xs text-gold">{i + 1}</span>
                <p className="mt-2 text-lg font-semibold">{k}</p>
                <p className="mt-1 text-sm text-fg-2">{v}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── ATRIUM: first mission ── */}
      <section className="border-t border-border bg-[linear-gradient(180deg,rgba(240,192,48,0.06),transparent)]">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="eyebrow text-gold">The Atrium</p>
            <p className="mt-3 font-display text-5xl leading-[0.9] md:text-7xl">The first mission is a film.</p>
            <p className="mt-4 max-w-2xl text-fg-2">
              The Atrium is the incubator of Qubic Church: film, music, start-ups, charity. An idea finds hands and
              resources here. Alongside it: the Fractal Rationalism Institute and Web4World.
            </p>
          </div>
          <Link
            className="inline-flex h-11 items-center self-start border border-border px-5 text-sm font-medium text-fg-2 hover:text-foreground md:self-auto"
            href="/about#atrium"
          >
            Read about the Atrium →
          </Link>
        </div>
      </section>

      {/* ── PILLARS ── */}
      <section className="border-t border-border">
        <div className="mx-auto grid w-full max-w-7xl gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(p => (
            <Link className="group flex flex-col bg-background/80 p-6 backdrop-blur-sm transition-colors hover:bg-card md:p-8" href={p.href} key={p.title}>
              <span className="font-mono text-xs text-gold/70">{p.n}</span>
              <h3 className="mt-3 text-xl font-semibold">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-fg-2">{p.text}</p>
              <span className="mt-auto pt-6 text-sm font-medium text-gold group-hover:underline">{p.cta} →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── WHAT'S NEW ── */}
      <section className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-10 sm:px-6">
          <p className="text-fg-2">Research updates, fixes and findings, with dates.</p>
          <Link
            className="inline-flex h-12 items-center border border-gold bg-gold/10 px-6 text-sm font-semibold uppercase tracking-widest text-gold hover:bg-gold/20"
            href="/blog"
          >
            What&rsquo;s new →
          </Link>
        </div>
      </section>
    </div>
  )
}
