import type { Metadata } from 'next'
import { jsonLd } from '@/lib/json-ld'
import Link from 'next/link'
import { setRequestLocale } from 'next-intl/server'
import { SITE_URL } from '@/lib/books'
import { ARTICLES, articleMinutes, articleUrl, formatDate } from '@/lib/articles'

const TITLE = 'Articles: Qubic, Aigarth and Neuraxon, month by month'
const DESC =
  'Long-form articles by TesserAI on Qubic, Aigarth, Anna, BPP-9000 and the Neuraxon papers, July to October 2026, with dated quotes from Come-from-Beyond and the science team.'

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

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: TITLE,
    description: DESC,
    url: `${SITE_URL}/articles`,
    hasPart: ARTICLES.map(a => ({ '@type': 'Article', headline: a.title, url: articleUrl(a), datePublished: a.date })),
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-10 sm:px-6 md:pt-16">
      <script dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} type="application/ld+json" />
      <header className="grid gap-6 border-b border-border pb-12 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="eyebrow text-gold">Articles · by TesserAI · July to October 2026</p>
          <h1 className="mt-3 font-display text-7xl leading-[0.85] md:text-9xl">Articles</h1>
          <p className="mt-6 max-w-2xl font-serif text-xl leading-relaxed text-foreground/85">
            The story of Aigarth as it happened: Anna racing to zero, BPP-9000, the Neuraxon papers and ARC-AGI-3,
            and why randomness matters. Every quote carries its date and place.
          </p>
        </div>
        <a
          className="inline-flex h-11 items-center self-start border border-border px-5 text-sm font-medium text-fg-2 hover:text-foreground md:self-auto"
          href="https://x.com/usetesserai"
          rel="noopener noreferrer"
          target="_blank"
        >
          @usetesserai on X ↗
        </a>
      </header>

      {lead && (
        <Link className="group mt-12 block border border-border bg-card/60 p-6 backdrop-blur-sm hover:border-gold/60 md:p-10" href={`/articles/${lead.slug}`}>
          <p className="eyebrow text-gold">Latest · {formatDate(lead.date)}</p>
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
              <time className="eyebrow text-fg-2" dateTime={a.date}>
                {formatDate(a.date)}
              </time>
              {a.kicker && <span className="mt-2 font-mono text-xs uppercase tracking-[0.3em] text-gold/80">{a.kicker}</span>}
              <h2 className="mt-2 text-2xl font-semibold leading-snug group-hover:text-gold">{a.title}</h2>
              <p className="mt-3 line-clamp-3 text-fg-2">{a.summary}</p>
              <span className="mt-auto pt-5 text-sm text-fg-2">{articleMinutes(a)} min read</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
