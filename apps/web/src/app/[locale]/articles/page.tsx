import type { Metadata } from 'next'
import { jsonLd } from '@/lib/json-ld'
import Link from 'next/link'
import { setRequestLocale } from 'next-intl/server'
import { SITE_URL } from '@/lib/books'
import { ARTICLES, articleHandle, articleKeywords, articleMinutes, articleUrl, articleWeight, articleWeightLabel, formatDate, isNew, issueNumber } from '@/lib/articles'
import { CFB_ARTICLES, formatArchiveDate } from '@/lib/archive'
import { ArticlesLibrary, type Volume } from '@/components/church/articles/ArticlesLibrary'
import { RANKS, WEIGHT } from '@/lib/ranks'

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
  const first = ARTICLES[ARTICLES.length - 1]
  const nodes: Volume[] = [
    ...ARTICLES.map(a => ({
      id: a.slug,
      title: a.title,
      kicker: a.kicker,
      date: a.date,
      dateLabel: formatDate(a.date),
      author: a.author,
      handle: articleHandle(a),
      href: `/articles/${a.slug}`,
      external: false,
      summary: a.summary,
      tags: articleKeywords(a).slice(0, 6),
      issue: issueNumber(a),
      minutes: articleMinutes(a),
      isNew: isNew(a),
      weight: articleWeight(a),
      weightLabel: articleWeightLabel(a),
      words: a.words,
    })),
    ...CFB_ARTICLES.map(a => ({
      id: a.url.split('/').filter(Boolean).pop() ?? a.url,
      title: a.title,
      date: a.date,
      dateLabel: formatArchiveDate(a.date),
      author: 'Come-from-Beyond',
      handle: 'c___f___b',
      href: a.url,
      external: true,
      summary: a.summary,
      tags: a.tags,
      issue: null,
      platform: a.platform,
      weight: WEIGHT.primary,
      weightLabel: 'primary source',
    })),
  ]

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
            The story of Aigarth as it happens, and the library that keeps it. Every author has a shelf, every article is a
            spine on it, and the catalogue below lists them by year. A new issue lands whenever Aigarth moves, anyone can
            write for the archive, and Come-from-Beyond's own articles are here where they can be found.
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
            Write us an article
          </a>
          <a className="inline-flex h-11 items-center border border-border px-5 text-sm font-medium text-fg-2 hover:text-foreground" href="#catalogue">
            Catalogue
          </a>
          <a className="inline-flex h-11 items-center border border-border px-5 text-sm font-medium text-fg-2 hover:text-foreground" href="#ranks">
            Ranks
          </a>

        </div>
      </header>

      <ArticlesLibrary volumes={nodes} />

      {/* ── HOW THE ARCHIVE RANKS ── */}
      <section className="mt-16 scroll-mt-24 grid gap-10 border-t border-border pt-12 lg:grid-cols-[1fr_1fr]" id="ranks">
        <div>
          <p className="eyebrow text-gold">Weight and ranks</p>
          <h2 className="mt-3 font-display text-5xl leading-[0.9] md:text-6xl">How the library ranks.</h2>
          <p className="mt-6 font-serif text-lg leading-relaxed text-foreground/85">
            Every article has a weight. An issue written for the archive weighs {WEIGHT.issue}. A primary source, an article by
            the person who built the thing we write about, weighs {WEIGHT.primary}. A repost by Maria adds {WEIGHT.maria}. On the shelf a heavier article is a thicker spine.
          </p>
          <p className="mt-4 font-serif text-lg leading-relaxed text-foreground/85">
            An author's weight is the sum of their articles. It sets their rank, and the rank is always written with its
            number: Rank 1 is a pamphlet, Rank 3 a shelf, Rank 8 a wing. The ladder doubles at every step, the way library
            collections and forum ranks grow: the first steps come fast, the top is far away.
          </p>
          <p className="mt-4 font-serif text-lg leading-relaxed text-foreground/85">
            Rank 10, the Beyond wing, cannot be reached by weight. It belongs to the origin, Come-from-Beyond. Everyone else
            starts with a pamphlet. Your rank, your weight and the distance to the next rank are written on your shelf.
          </p>
          <p className="mt-4 text-sm text-fg-2">
            Weight is given by others, not by the author: Maria's repost counts, the author's own does not. Planned next: an
            article quoted by another issue gets heavier, and a year in the archive adds one more.
          </p>
        </div>
        <div>
          <table className="w-full border-collapse font-mono text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.25em] text-fg-2">
                <th className="py-2 pr-4 font-normal">Rank</th>
                <th className="py-2 pr-4 font-normal">Name</th>
                <th className="py-2 font-normal">From weight</th>
              </tr>
            </thead>
            <tbody>
              {RANKS.map(r => (
                <tr className="border-b border-border/60" key={r.level}>
                  <td className="py-2 pr-4 text-gold">{r.level}</td>
                  <td className="py-2 pr-4 text-foreground">{r.name}</td>
                  <td className="py-2 text-fg-2">{Number.isFinite(r.min) ? r.min : 'the origin only'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-2/70">
            issue = {WEIGHT.issue} · primary source = {WEIGHT.primary} · reposted by Maria = +{WEIGHT.maria} · rank = total weight on the ladder
          </p>
        </div>
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
            <h2 className="mt-3 font-display text-5xl leading-[0.9] md:text-6xl">Write us an article.</h2>
            <p className="mt-6 font-serif text-xl leading-relaxed text-foreground/90">No topic. No category. No censorship.</p>
            <p className="mt-4 font-serif text-lg leading-relaxed text-foreground/85">
              Tell us about your favourite book. A story from your life that sounds made up. A piece of advice, or a lesson
              this world should hear. How you see Aigarth. What you think of Come-from-Beyond. Anything.
            </p>
            <p className="mt-4 font-serif text-lg leading-relaxed text-foreground/85">
              This site is an archive. What you write stays here, under your name.
            </p>
            <p className="mt-4 font-serif text-lg leading-relaxed text-foreground/85">
              Write it the way you talk. Text with no LLM in it has a different vibe, and that vibe is the point.
            </p>
          </div>
          <div className="grid gap-6">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-gold/80">How</h3>
              <ol className="mt-3 space-y-3 text-fg-2">
                <li className="flex gap-3">
                  <span className="font-mono text-gold">1</span>
                  <span>
                    Post it on X. Start with{' '}
                    <span className="font-mono text-foreground">hey @Maria_aigarth</span>, add{' '}
                    <span className="font-mono text-foreground">#Qubic #Aigarth</span>.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-gold">2</span>
                  <span>
                    <a className="text-gold hover:underline" href="https://x.com/maria_aigarth" rel="noopener noreferrer" target="_blank">
                      Maria
                    </a>{' '}
                    reposts you.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-gold">3</span>
                  <span>It goes into the archive with your name and a link to your profile. You keep all rights. We fix typos only.</span>
                </li>
              </ol>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                className="inline-flex h-11 items-center border border-gold bg-gold/10 px-5 font-mono text-sm font-medium text-gold hover:bg-gold/20"
                href={`https://x.com/intent/post?text=${encodeURIComponent('hey @Maria_aigarth \n\n\n#Qubic #Aigarth')}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                hey @Maria_aigarth ↗
              </a>
              {first && (
                <Link className="inline-flex h-11 items-center border border-border px-5 text-sm font-medium text-fg-2 hover:text-foreground" href={`/articles/${first.slug}`}>
                  Read No. 1
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
