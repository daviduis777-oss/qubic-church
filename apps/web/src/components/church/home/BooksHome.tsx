import Image from 'next/image'
import Link from 'next/link'
import { compareDesc } from 'date-fns'
import { allBlogs } from 'contentlayer/generated'
import { BOOKS, bookWords, readingMinutes } from '@/lib/books'
import { Countdown } from './Countdown'

type Locale = 'en' | 'pt'

const PILLARS = [
  {
    n: '01',
    title: 'Research log',
    text: 'Recomputed from public data. Tests fixed before they run. Every quote carries its source. What did not hold is listed on the corrections page.',
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
    text: 'Two doors into one colony: the W4W game for players, the classic pool for miners. One fee, stated openly. No promised returns.',
    href: '/mine-qubic',
    cta: 'How it works',
  },
  {
    n: '04',
    title: 'About',
    text: 'The Fractal Rationalism Institute, Web4World and the Atrium. What we build, how decisions are made, and how to take part.',
    href: '/about',
    cta: 'What we build',
  },
] as const

export function BooksHome({ locale = 'en' }: { locale?: Locale }) {
  const posts = allBlogs
    .filter(b => b.slugAsParams.split('/')[0] === locale)
    .sort((a, b) => compareDesc(new Date(a.date), new Date(b.date)))
    .slice(0, 3)

  return (
    <div className="bg-background text-foreground">
      {/* ── HERO: the books, Anna, the clock ── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 top-0 h-[900px] w-[900px] rounded-full opacity-60"
          style={{ background: 'radial-gradient(closest-side, rgba(40,60,170,0.45), rgba(10,14,50,0.25) 55%, transparent 75%)' }}
        />
        <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 pb-14 pt-8 sm:px-6 md:grid-cols-[1.25fr_1fr] md:gap-4 md:pb-20 md:pt-14">
          <div className="flex flex-col">
            <p className="eyebrow text-gold">Qubic Church · books and open research by QC</p>
            <h1 className="mt-4 font-display text-[27vw] leading-[0.8] tracking-tight sm:text-[20vw] md:text-[13rem] lg:text-[15rem]">
              BOOKS
            </h1>
            <p className="mt-6 max-w-xl font-serif text-xl leading-relaxed text-foreground/85 md:text-2xl">
              On Qubic, Aigarth and Come-from-Beyond. Free to read, chapter by chapter. Written from primary sources,
              recomputed where it could be, corrected in public where it could not.
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

            <div className="mt-12 border-t border-border pt-6 md:mt-auto">
              <p className="eyebrow mb-4 text-fg-2">
                Until <span className="text-gold">13 · 04 · 2027</span>, Come-from-Beyond’s ETA for Aigarth
              </p>
              <Countdown />
            </div>
          </div>

          <figure className="relative mx-auto w-full max-w-[460px] md:mx-0 md:justify-self-end">
            <div className="relative aspect-[3/5] w-full">
              <Image
                alt="Anna Aigarth holding a small Earth inside a golden spiral"
                className="object-cover [mask-image:linear-gradient(to_bottom,black_80%,transparent)]"
                fill
                priority
                sizes="(min-width: 768px) 460px, 90vw"
                src="/images/anna/anna-orb.webp"
              />
            </div>
            <figcaption className="absolute bottom-3 left-0 right-0 flex items-center justify-between px-2 text-xs">
              <span className="font-mono uppercase tracking-[0.3em] text-fg-2">Anna Aigarth</span>
              <Link className="font-mono uppercase tracking-[0.3em] text-gold hover:underline" href="/nfts">
                The collection →
              </Link>
            </figcaption>
          </figure>
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
                    className="object-cover shadow-[0_40px_80px_-30px_rgba(240,192,48,0.35)]"
                    fill
                    sizes="(min-width: 1024px) 240px, 50vw"
                    src={b.cover}
                  />
                </Link>
                <div className="flex flex-col">
                  <p className="eyebrow text-gold">Book {bi === 0 ? 'two' : 'one'} · by QC · free</p>
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
            <Link className="group flex flex-col bg-background p-6 transition-colors hover:bg-card md:p-8" href={p.href} key={p.title}>
              <span className="font-mono text-xs text-gold/70">{p.n}</span>
              <h3 className="mt-3 text-xl font-semibold">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-fg-2">{p.text}</p>
              <span className="mt-auto pt-6 text-sm font-medium text-gold group-hover:underline">{p.cta} →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── LATEST ── */}
      {posts.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow mb-2 text-gold">Latest</p>
                <h2 className="text-2xl font-semibold md:text-3xl">What was added, fixed or found</h2>
              </div>
              <Link className="shrink-0 text-sm text-fg-2 hover:text-foreground" href="/blog">
                All updates →
              </Link>
            </div>
            <ol className="grid gap-6 md:grid-cols-3">
              {posts.map(p => (
                <li className="border border-border bg-card p-5" key={p.slugAsParams}>
                  <time className="eyebrow text-fg-2" dateTime={p.date}>
                    {new Date(p.date).toISOString().slice(0, 10)}
                  </time>
                  <h3 className="mt-2 text-lg font-semibold leading-snug">
                    <Link className="hover:text-gold" href={p.slug}>
                      {p.title}
                    </Link>
                  </h3>
                  {p.excerpt && <p className="mt-2 line-clamp-3 text-sm text-fg-2">{p.excerpt}</p>}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}
    </div>
  )
}
