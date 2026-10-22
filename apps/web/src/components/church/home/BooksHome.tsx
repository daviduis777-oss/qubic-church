import Image from 'next/image'
import Link from 'next/link'
import { compareDesc } from 'date-fns'
import { allBlogs } from 'contentlayer/generated'

type Locale = 'en' | 'pt'

const BOOKS = [
  {
    key: 'long-version',
    title: 'Qubic: The Long Version',
    subtitle:
      'How a useful proof of work, 676 computors and one evolving network fit together. The long way round, with sources.',
    cover: '/books/covers/qubic-long-version-cover.png',
    read: '/books#long-version',
    pdf: '/books/qubic-long-version-eng.pdf',
    meta: 'Book one · EN / DE / RU · free',
    year: '2026',
  },
  {
    key: 'come-from-beyond',
    title: 'Come-from-Beyond',
    subtitle:
      'One line through 25 years: Minsk 2002, BitcoinTalk 2012, NXT, IOTA, Qubic, Anna Zero. Every quote with its date.',
    cover: '/books/covers/come-from-beyond-cover.png',
    read: '/books#come-from-beyond',
    pdf: '/books/come-from-beyond.pdf',
    meta: 'Book two · EN · free · 11 chapters',
    year: '2026',
  },
] as const

const PILLARS = [
  {
    title: 'Research',
    text: 'Recomputed from public data. Tests fixed before they run. Every quote carries its source. What did not hold is listed on the corrections page.',
    href: '/docs',
    cta: 'Open the research log',
  },
  {
    title: 'Come-from-Beyond',
    text: 'A dossier, a timeline and the primary sources, from the 2012 Quorum-Based Coin thread to the live BTC feed of epoch 240.',
    href: '/cfb',
    cta: 'Read the dossier',
  },
  {
    title: 'Mine',
    text: 'Two doors into the same colony: the W4W game for players, the classic pool for miners. One fee, stated openly. No promised returns.',
    href: '/mine-qubic',
    cta: 'How mining works',
  },
  {
    title: 'Anna',
    text: 'The 200-piece collection and its rarity codex. On chain, migratable, royalties preserved.',
    href: '/nfts',
    cta: 'See the collection',
  },
] as const

export function BooksHome({ locale = 'en' }: { locale?: Locale }) {
  const posts = allBlogs
    .filter(b => b.slugAsParams.split('/')[0] === locale)
    .sort((a, b) => compareDesc(new Date(a.date), new Date(b.date)))
    .slice(0, 3)

  return (
    <main className="bg-background text-foreground">
      {/* HERO: the books */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 md:pt-16">
        <p className="eyebrow mb-6 text-gold">
          Qubic Church · an open research log on Qubic, Aigarth and Come-from-Beyond
        </p>
        <h1 className="font-display text-[22vw] leading-[0.85] tracking-tight text-foreground sm:text-[16vw] md:text-[12rem]">
          BOOKS
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-fg-2 md:text-xl">
          Two books, free to read and download. Written from primary sources,
          recomputed where it could be recomputed, corrected in public where it
          could not.
        </p>

        <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-12">
          {BOOKS.map(b => (
            <article
              key={b.key}
              className="group grid grid-cols-[minmax(120px,40%)_1fr] gap-6 border border-border bg-card p-5 md:p-7"
              itemScope
              itemType="https://schema.org/Book"
            >
              <Link href={b.read} className="relative block aspect-[2/3] overflow-hidden">
                <Image
                  alt={`${b.title} cover`}
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  fill
                  itemProp="image"
                  sizes="(min-width: 768px) 20vw, 40vw"
                  src={b.cover}
                />
              </Link>
              <div className="flex flex-col">
                <p className="eyebrow text-fg-2">{b.meta}</p>
                <h2
                  className="mt-2 text-2xl font-semibold leading-tight md:text-3xl"
                  itemProp="name"
                >
                  {b.title}
                </h2>
                <p className="mt-3 text-sm text-fg-2 md:text-base" itemProp="description">
                  {b.subtitle}
                </p>
                <meta itemProp="datePublished" content={b.year} />
                <meta itemProp="publisher" content="Qubic Church" />
                <div className="mt-auto flex flex-wrap gap-2 pt-6">
                  <Link
                    className="inline-flex h-10 items-center border border-gold bg-gold/10 px-4 text-sm font-medium text-gold hover:bg-gold/20"
                    href={b.read}
                  >
                    Read online
                  </Link>
                  <a
                    className="inline-flex h-10 items-center border border-border px-4 text-sm font-medium text-fg-2 hover:text-foreground"
                    href={b.pdf}
                    itemProp="url"
                  >
                    Download PDF
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* PILLARS */}
      <section className="border-t border-border">
        <div className="mx-auto grid w-full max-w-7xl gap-px bg-border px-0 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(p => (
            <Link
              key={p.title}
              className="group flex flex-col bg-background p-6 transition-colors hover:bg-card md:p-8"
              href={p.href}
            >
              <h3 className="text-xl font-semibold">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-fg-2">{p.text}</p>
              <span className="mt-auto pt-6 text-sm font-medium text-gold group-hover:underline">
                {p.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* LATEST */}
      {posts.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="eyebrow mb-2 text-gold">Latest</p>
                <h2 className="text-2xl font-semibold md:text-3xl">
                  What was added, fixed or found
                </h2>
              </div>
              <Link className="text-sm text-fg-2 hover:text-foreground" href="/blog">
                All updates →
              </Link>
            </div>
            <ol className="grid gap-6 md:grid-cols-3">
              {posts.map(p => (
                <li key={p.slugAsParams} className="border border-border bg-card p-5">
                  <time className="eyebrow text-fg-2" dateTime={p.date}>
                    {new Date(p.date).toISOString().slice(0, 10)}
                  </time>
                  <h3 className="mt-2 text-lg font-semibold leading-snug">
                    <Link href={p.slug}>{p.title}</Link>
                  </h3>
                  {p.excerpt && (
                    <p className="mt-2 line-clamp-3 text-sm text-fg-2">{p.excerpt}</p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* DATE */}
      <section className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-14 sm:px-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-2 text-gold">The date we are watching</p>
            <p className="font-display text-5xl leading-none md:text-7xl">13 · 04 · 2027</p>
            <p className="mt-3 max-w-xl text-sm text-fg-2">
              Five years from the start of real mining. Come-from-Beyond’s own
              ETA for Aigarth. Before that: the live BTC feed in epoch 240,
              18 November 2026. We will log what the network sees.
            </p>
          </div>
          <div className="flex gap-2">
            <a
              className="inline-flex h-10 items-center border border-gold bg-gold/10 px-4 text-sm font-medium text-gold hover:bg-gold/20"
              href="https://discord.gg/qubicchurch"
              rel="noreferrer"
              target="_blank"
            >
              Join the Discord
            </a>
            <a
              className="inline-flex h-10 items-center border border-border px-4 text-sm font-medium text-fg-2 hover:text-foreground"
              href="https://x.com/QubicChurch"
              rel="noreferrer"
              target="_blank"
            >
              @QubicChurch
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
