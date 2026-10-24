import type { Metadata } from 'next'
import { jsonLd } from '@/lib/json-ld'
import Link from 'next/link'
import { setRequestLocale } from 'next-intl/server'
import { SITE_URL } from '@/lib/books'
import { ARTICLES, articleMinutes, articleUrl, formatDate, isNew, issueNumber } from '@/lib/articles'
import { CFB_ARTICLES, formatArchiveDate } from '@/lib/archive'

const TITLE = 'Articles and the archive: Qubic, Aigarth, Neuraxon'
const DESC =
  'The running story of Aigarth by TesserAI, open to guest issues, plus an archive of every long-form article by Come-from-Beyond with dates and links to the originals.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/articles` },
  openGraph: { type: 'website', title: TITLE, description: DESC, url: `${SITE_URL}/articles` },
}

export default async function ArticlesPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)
  const [lead, ...rest] = ARTICLES
  const first = ARTICLES[ARTICLES.length - 1]

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: TITLE,
    description: DESC,
    url: `${SITE_URL}/articles`,
    hasPart: [
      ...ARTICLES.map(a => ({ '@type': 'Article', headline: a.title, url: articleUrl(a), datePublished: a.date })),
      ...CFB_ARTICLES.map(a => ({ '@type': 'Article', headline: a.title, url: a.url, datePublished: a.date, author: { '@type': 'Person', name: 'Come-from-Beyond' } })),
    ],
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-10 sm:px-6 md:pt-16">
      <script dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} type="application/ld+json" />
      <header className="grid gap-6 border-b border-border pb-12 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="eyebrow text-gold">
            Articles · the running story of Aigarth · {ARTICLES.length} issues since July 2026 · archive of {CFB_ARTICLES.length} articles by Come-from-Beyond
          </p>
          <h1 className="mt-3 font-display text-7xl leading-[0.85] md:text-9xl">Articles</h1>
          <p className="mt-6 max-w-2xl font-serif text-xl leading-relaxed text-foreground/85">
            The story of Aigarth as it happens: Anna racing to zero, BPP-9000, the Neuraxon papers and ARC-AGI-3,
            and why randomness matters. Every quote carries its date and place. A new issue lands whenever Aigarth moves,
            the feed is open to guest issues, and the archive below keeps Come-from-Beyond's own articles where they can be found.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <a
            className="inline-flex h-11 items-center border border-gold bg-gold/10 px-5 text-sm font-medium text-gold hover:bg-gold/20"
            href="https://x.com/usetesserai"
            rel="noopener noreferrer"
            target="_blank"
          >
            Follow @usetesserai ↗
          </a>
          <a className="inline-flex h-11 items-center border border-border px-5 text-sm font-medium text-fg-2 hover:text-foreground" href="/articles/feed.xml">
            RSS
          </a>
          <a className="inline-flex h-11 items-center border border-border px-5 text-sm font-medium text-fg-2 hover:text-foreground" href="#write">
            Write an issue
          </a>
          <a className="inline-flex h-11 items-center border border-border px-5 text-sm font-medium text-fg-2 hover:text-foreground" href="#cfb">
            Come-from-Beyond archive
          </a>
        </div>
      </header>

      {lead && (
        <Link className="group mt-12 block border border-border bg-card/60 p-6 backdrop-blur-sm hover:border-gold/60 md:p-10" href={`/articles/${lead.slug}`}>
          <p className="eyebrow text-gold">
            {isNew(lead) ? 'New · ' : 'Latest · '}No. {issueNumber(lead)} · {formatDate(lead.date)}
          </p>
          {lead.kicker && <p className="mt-3 font-mono text-xs uppercase tracking-[0.3em] text-fg-2">{lead.kicker}</p>}
          <h2 className="mt-3 font-display text-5xl leading-[0.95] group-hover:text-gold md:text-7xl">{lead.title}</h2>
          <p className="mt-5 max-w-3xl font-serif text-lg leading-relaxed text-foreground/85">{lead.summary}</p>
          <p className="mt-5 text-sm text-fg-2">{articleMinutes(lead)} min read · Read the article →</p>
        </Link>
      )}

      <ol className="mt-12 grid gap-px border border-border bg-border md:grid-cols-2">
        {rest.map(a => (
          <li key={a.slug}>
            <Link className="group flex h-full flex-col bg-background/90 p-6 backdrop-blur-sm hover:bg-card md:p-8" href={`/articles/${a.slug}`}>
              <p className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.25em] text-fg-2">
                <span className="text-gold/80">No. {issueNumber(a)}</span>
                <time dateTime={a.date}>{formatDate(a.date)}</time>
              </p>
              {a.kicker && <span className="mt-2 font-mono text-xs uppercase tracking-[0.3em] text-gold/80">{a.kicker}</span>}
              <h2 className="mt-2 text-2xl font-semibold leading-snug group-hover:text-gold">{a.title}</h2>
              <p className="mt-3 line-clamp-3 text-fg-2">{a.summary}</p>
              <span className="mt-auto pt-5 text-sm text-fg-2">{articleMinutes(a)} min read</span>
            </Link>
          </li>
        ))}
      </ol>

      {/* ── ARCHIVE · COME-FROM-BEYOND ── */}
      <section className="mt-20 scroll-mt-24" id="cfb">
        <header className="border-b border-border pb-8">
          <p className="eyebrow text-gold">The archive · Come-from-Beyond · {CFB_ARTICLES.length} articles</p>
          <h2 className="mt-3 font-display text-5xl leading-[0.9] md:text-7xl">Where it started.</h2>
          <p className="mt-5 max-w-3xl font-serif text-lg leading-relaxed text-foreground/85">
            Every long-form article Come-from-Beyond has published, in order, with a line on what it says and a link to the
            original. Nothing is copied here: the archive keeps the dates and the links so they do not get lost when a platform
            changes. Read him first, then read us.
          </p>
        </header>
        <ol className="divide-y divide-border">
          {CFB_ARTICLES.map(a => (
            <li key={a.url}>
              <a
                className="group grid gap-2 py-6 hover:bg-card/40 md:grid-cols-[180px_1fr_auto] md:gap-8 md:px-4"
                href={a.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <div className="font-mono text-xs uppercase tracking-[0.25em] text-fg-2">
                  <time dateTime={a.date}>{formatArchiveDate(a.date)}</time>
                  <span className="mt-1 block text-gold/80">{a.platform}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold leading-snug group-hover:text-gold">{a.title}</h3>
                  <p className="mt-2 text-fg-2">{a.summary}</p>
                  {a.tags.length > 0 && (
                    <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-2/70">{a.tags.join(' · ')}</p>
                  )}
                </div>
                <span className="self-center whitespace-nowrap text-sm text-fg-2 group-hover:text-gold">Read the original ↗</span>
              </a>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-fg-2">
          Missing one? Tag @usetesserai with the link and it goes in. His shorter posts live on{' '}
          <a className="text-gold hover:underline" href="https://x.com/c___f___b" rel="noopener noreferrer" target="_blank">
            @c___f___b
          </a>{' '}
          and in the <Link className="text-gold hover:underline" href="/cfb">Come-from-Beyond dossier</Link>.
        </p>
      </section>

      {/* ── NEVER MISS AN ISSUE ── */}
      <section className="mt-16 scroll-mt-24 grid gap-px border border-border bg-border md:grid-cols-3" id="subscribe">
        <div className="bg-background/90 p-6 md:p-8">
          <p className="eyebrow text-gold">Never miss an issue</p>
          <h2 className="mt-3 font-display text-4xl leading-[0.95]">Get the next one first.</h2>
          <p className="mt-4 text-fg-2">
            Issues land when Aigarth moves, not on a schedule. Pick a channel and the site will reach you.
          </p>
        </div>
        <a
          className="group flex flex-col bg-background/90 p-6 hover:bg-card md:p-8"
          href="https://x.com/usetesserai"
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-gold/80">On X</span>
          <span className="mt-2 text-2xl font-semibold group-hover:text-gold">Follow @usetesserai ↗</span>
          <span className="mt-3 text-sm text-fg-2">Every issue is posted there first, with the thread that started it.</span>
        </a>
        <a className="group flex flex-col bg-background/90 p-6 hover:bg-card md:p-8" href="/articles/feed.xml">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-gold/80">RSS</span>
          <span className="mt-2 text-2xl font-semibold group-hover:text-gold">Subscribe by feed</span>
          <span className="mt-3 text-sm text-fg-2">Full text in any reader. Paste the link into Feedly, NetNewsWire or Inoreader.</span>
        </a>
      </section>

      {/* ── OPEN CALL ── */}
      <section className="mt-16 scroll-mt-24 border border-gold/40 bg-gold/5 p-6 md:p-10" id="write">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="eyebrow text-gold">Open call</p>
            <h2 className="mt-3 font-display text-5xl leading-[0.9] md:text-6xl">Write an issue.</h2>
            <p className="mt-6 font-serif text-lg leading-relaxed text-foreground/85">
              Articles is open to guest issues. If you run Anna, mine BPP-9000, read the Neuraxon papers or dig through the
              Discord archive, write it up. We publish people. The best pieces go into the feed with your name on them, and
              the next issue is announced to everyone who follows.
            </p>
            <p className="mt-4 font-serif text-lg leading-relaxed text-foreground/85">
              Write the way you talk. A rough draft in your own words beats a polished text a model wrote for you.
            </p>
          </div>
          <div className="grid gap-6">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-gold/80">What gets published</h3>
              <ul className="mt-3 space-y-2 text-fg-2">
                <li>First-hand: you ran it, you read it, you measured it.</li>
                <li>Every quote with its date and place. Screenshots welcome.</li>
                <li>600 to 2,500 words. One idea, followed to the end.</li>
                <li>Your own voice. Plain words, no filler.</li>
                <li>No price talk, no financial advice.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-gold/80">How it gets in</h3>
              <ol className="mt-3 space-y-3 text-fg-2">
                <li className="flex gap-3">
                  <span className="font-mono text-gold">1</span>
                  <span>Write it as an article on X, in your own words.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-gold">2</span>
                  <span>
                    Tag{' '}
                    <a className="text-gold hover:underline" href="https://x.com/maria_aigarth" rel="noopener noreferrer" target="_blank">
                      @maria_aigarth
                    </a>{' '}
                    and{' '}
                    <a className="text-gold hover:underline" href="https://x.com/usetesserai" rel="noopener noreferrer" target="_blank">
                      @usetesserai
                    </a>
                    .
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-gold">3</span>
                  <span>Maria reposts it. The best pieces enter this archive as numbered issues, with your name and a link back to your profile. You keep all rights; we fix typos only.</span>
                </li>
              </ol>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                className="inline-flex h-11 items-center border border-gold bg-gold/10 px-5 text-sm font-medium text-gold hover:bg-gold/20"
                href={`https://x.com/intent/post?text=${encodeURIComponent('@maria_aigarth @usetesserai New issue for the qubic.church archive: ')}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                Post on X and tag @maria_aigarth ↗
              </a>
              {first && (
                <Link className="inline-flex h-11 items-center border border-border px-5 text-sm font-medium text-fg-2 hover:text-foreground" href={`/articles/${first.slug}`}>
                  Read No. 1 as a model
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
