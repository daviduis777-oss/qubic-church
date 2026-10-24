import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { locales } from '@/config/i18n'
import { SITE_URL } from '@/lib/books'
import { jsonLd } from '@/lib/json-ld'
import { seoDescription, seoTitle, seoTitleText } from '@/lib/seo'
import { CFB_ARTICLES, archiveId, archivedUrl, formatArchiveDate, getArchiveEntry } from '@/lib/archive'

export function generateStaticParams() {
  return locales.flatMap(locale => CFB_ARTICLES.map(a => ({ locale, id: archiveId(a) })))
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params
  const a = getArchiveEntry(id)
  if (!a) return {}
  const url = `${SITE_URL}/articles/cfb/${id}`
  return {
    title: seoTitle(`${a.title} · Come-from-Beyond`),
    description: seoDescription(a.summary),
    alternates: { canonical: url },
    openGraph: { type: 'article', title: seoTitleText(a.title), description: seoDescription(a.summary), url },
  }
}

export default async function CfbArchivePage(props: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await props.params
  setRequestLocale(locale)
  const a = getArchiveEntry(id)
  if (!a) notFound()
  const i = CFB_ARTICLES.indexOf(a)
  const newer = CFB_ARTICLES[i - 1]
  const older = CFB_ARTICLES[i + 1]
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.summary,
    datePublished: a.date,
    url: a.url,
    mainEntityOfPage: `${SITE_URL}/articles/cfb/${id}`,
    author: { '@type': 'Person', name: 'Come-from-Beyond', url: 'https://x.com/c___f___b' },
    keywords: a.tags.join(', '),
    isPartOf: { '@type': 'Collection', name: 'Qubic Church: archive of Come-from-Beyond', url: `${SITE_URL}/articles` },
  }
  return (
    <div className="w-full pb-24">
      <script dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} type="application/ld+json" />
      <article className="mx-auto w-full max-w-[44rem] px-5 pt-10 md:pt-16">
        <nav aria-label="Breadcrumb" className="mb-10 text-sm text-fg-2">
          <Link className="hover:text-foreground" href="/articles">
            Articles
          </Link>
          <span className="mx-2 text-fg-2/60">/</span>
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#7dd3fc]">Come-from-Beyond · archive</span>
        </nav>
        <p className="eyebrow text-[#7dd3fc]">
          {formatArchiveDate(a.date)} · {a.platform} · primary source · weight 3
        </p>
        <h1 className="mt-3 font-display text-5xl leading-[0.95] md:text-6xl">{a.title}</h1>
        <p className="mt-4 text-sm text-fg-2">
          By{' '}
          <a className="text-foreground underline underline-offset-4 hover:text-gold" href="https://x.com/c___f___b" rel="noopener noreferrer">
            Come-from-Beyond
          </a>{' '}
          <span className="text-fg-2/70">@c___f___b</span>
        </p>

        <p className="mt-8 font-serif text-xl leading-relaxed text-foreground/90">{a.summary}</p>
        {a.tags.length > 0 && <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-2/70">{a.tags.join(' · ')}</p>}

        <div className="mt-8 flex flex-wrap gap-2">
          <a className="inline-flex h-12 items-center border border-gold bg-gold/10 px-6 text-sm font-medium text-gold hover:bg-gold/20" href={a.url} rel="noopener noreferrer">
            Read the full article on {a.platform}
          </a>
          <a className="inline-flex h-12 items-center border border-border px-6 text-sm font-medium text-fg-2 hover:text-foreground" href={archivedUrl(a.url)} rel="noopener noreferrer">
            Archived copy
          </a>
        </div>

        {a.shared && a.shared.length > 0 && (
          <section className="mt-10 border-t border-border pt-6">
            <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-fg-2">He shared it on X</h2>
            <ul className="mt-3 space-y-2">
              {a.shared.map(s => (
                <li key={s.url}>
                  <a className="text-foreground underline underline-offset-4 hover:text-gold" href={s.url} rel="noopener noreferrer">
                    {formatArchiveDate(s.date)}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-10 border-t border-border pt-6 text-sm text-fg-2">
          The text belongs to Come-from-Beyond and lives at the original link. This page keeps its date, a short summary in our
          words, and a preserved copy, so it can always be found.
        </p>

        <nav aria-label="More from the archive" className="mt-10 grid gap-3 sm:grid-cols-2">
          {older ? (
            <Link className="group border border-border p-4 hover:border-gold/60" href={`/articles/cfb/${archiveId(older)}`}>
              <span className="eyebrow text-fg-2">← Earlier</span>
              <span className="mt-1 block font-semibold group-hover:text-gold">{older.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {newer && (
            <Link className="group border border-border p-4 text-right hover:border-gold/60" href={`/articles/cfb/${archiveId(newer)}`}>
              <span className="eyebrow text-fg-2">Later →</span>
              <span className="mt-1 block font-semibold group-hover:text-gold">{newer.title}</span>
            </Link>
          )}
        </nav>
      </article>
    </div>
  )
}
