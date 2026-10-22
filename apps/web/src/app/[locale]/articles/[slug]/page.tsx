import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { locales } from '@/config/i18n'
import { SITE_URL } from '@/lib/books'
import { ARTICLES, articleMinutes, articleUrl, formatDate, getArticle } from '@/lib/articles'

export function generateStaticParams() {
  return locales.flatMap(locale => ARTICLES.map(a => ({ locale, slug: a.slug })))
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params
  const a = getArticle(slug)
  if (!a) return {}
  return {
    title: a.title,
    description: a.summary,
    alternates: { canonical: articleUrl(a) },
    authors: [{ name: a.author, url: 'https://x.com/usetesserai' }],
    openGraph: { type: 'article', title: a.title, description: a.summary, url: articleUrl(a), publishedTime: a.date },
  }
}

export default async function ArticlePage(props: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await props.params
  setRequestLocale(locale)
  const a = getArticle(slug)
  if (!a) notFound()
  const i = ARTICLES.indexOf(a)
  const newer = ARTICLES[i - 1]
  const older = ARTICLES[i + 1]

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.summary,
    datePublished: a.date,
    url: articleUrl(a),
    wordCount: a.words,
    inLanguage: 'en',
    author: { '@type': 'Organization', name: 'TesserAI', url: 'https://x.com/usetesserai' },
    publisher: { '@id': `${SITE_URL}/#org` },
    isBasedOn: a.url,
    about: [
      { '@type': 'Thing', name: 'Qubic' },
      { '@type': 'Thing', name: 'Aigarth' },
      { '@type': 'Person', name: 'Come-from-Beyond', alternateName: 'Sergey Ivancheglo' },
    ],
  }

  return (
    <div className="w-full pb-24">
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} type="application/ld+json" />
      <article className="mx-auto w-full max-w-[44rem] px-5 pt-10 md:pt-16">
        <nav aria-label="Breadcrumb" className="mb-10 text-sm text-fg-2">
          <Link className="hover:text-foreground" href="/articles">
            Articles
          </Link>
        </nav>
        <header className="mb-12 border-b border-border pb-10">
          {a.kicker && <p className="eyebrow mb-3 text-gold">{a.kicker}</p>}
          <h1 className="font-display text-5xl leading-[0.95] md:text-7xl">{a.title}</h1>
          <p className="mt-6 text-sm text-fg-2">
            By <span className="text-foreground">TesserAI</span> · <time dateTime={a.date}>{formatDate(a.date)}</time> ·{' '}
            {articleMinutes(a)} min read ·{' '}
            <a className="underline underline-offset-4 hover:text-foreground" href={a.url} rel="noopener noreferrer" target="_blank">
              original on X ↗
            </a>
          </p>
        </header>

        <div className="book-prose">
          {a.blocks.map((b, k) =>
            b.t === 'h' ? (
              <h2 key={k}>{b.text}</h2>
            ) : b.t === 'quote' ? (
              <figure key={k}>
                <blockquote>{b.text}</blockquote>
                {b.cite && <figcaption>{b.cite}</figcaption>}
              </figure>
            ) : (
              <p key={k}>{b.text}</p>
            ),
          )}
        </div>

        <p className="mt-12 border-t border-border pt-6 text-sm text-fg-2">
          Plain-text version for researchers and AI systems:{' '}
          <a className="underline underline-offset-4 hover:text-foreground" href={`/text/articles/${a.slug}.md`}>
            /text/articles/{a.slug}.md
          </a>
          . Not financial advice.
        </p>

        <nav aria-label="More articles" className="mt-10 grid gap-3 sm:grid-cols-2">
          {older ? (
            <Link className="group border border-border p-4 hover:border-gold/60" href={`/articles/${older.slug}`}>
              <span className="eyebrow text-fg-2">← Earlier</span>
              <span className="mt-1 block font-semibold group-hover:text-gold">{older.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {newer ? (
            <Link className="group border border-border p-4 text-right hover:border-gold/60" href={`/articles/${newer.slug}`}>
              <span className="eyebrow text-fg-2">Later →</span>
              <span className="mt-1 block font-semibold group-hover:text-gold">{newer.title}</span>
            </Link>
          ) : (
            <Link className="group border border-gold/60 p-4 text-right" href="/books">
              <span className="eyebrow text-gold">Go deeper</span>
              <span className="mt-1 block font-semibold">Read the books, free →</span>
            </Link>
          )}
        </nav>
      </article>
    </div>
  )
}
