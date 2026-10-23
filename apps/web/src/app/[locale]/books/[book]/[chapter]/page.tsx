import type { Metadata } from 'next'
import { jsonLd } from '@/lib/json-ld'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { locales } from '@/config/i18n'
import {
  AUTHOR,
  BOOKS,
  bookUrl,
  chapterExcerpt,
  chapterHeading,
  chapterUrl,
  getBook,
  getChapter,
  readingMinutes,
  SITE_URL,
} from '@/lib/books'
import { CiteBox } from '@/components/books/CiteBox'

export function generateStaticParams() {
  return locales.flatMap(locale =>
    BOOKS.flatMap(b => b.chapters.map(c => ({ locale, book: b.slug, chapter: c.slug }))),
  )
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; book: string; chapter: string }>
}): Promise<Metadata> {
  const { book: bs, chapter: cs } = await props.params
  const b = getBook(bs)
  const r = b && getChapter(b, cs)
  if (!b || !r) return {}
  const c = r.chapter
  const full = `${c.title} · ${b.title} by QC`
  const title = full.length <= 65 ? full : `${c.title} · ${b.title}`.length <= 65 ? `${c.title} · ${b.title}` : `${c.title} · QC`
  return {
    title,
    description: chapterExcerpt(c, 155),
    alternates: { canonical: chapterUrl(b, c) },
    authors: [{ name: AUTHOR.name }],
    openGraph: {
      type: 'article',
      title,
      description: chapterExcerpt(c, 155),
      url: chapterUrl(b, c),
      images: [{ url: `${SITE_URL}${b.cover}` }],
    },
  }
}

export default async function ChapterPage(props: {
  params: Promise<{ locale: string; book: string; chapter: string }>
}) {
  const { locale, book: bs, chapter: cs } = await props.params
  setRequestLocale(locale)
  const b = getBook(bs)
  const r = b && getChapter(b, cs)
  if (!b || !r) notFound()
  const { chapter: c, prev, next } = r

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Chapter',
    name: c.title,
    headline: chapterHeading(c),
    url: chapterUrl(b, c),
    position: c.n ?? b.chapters.indexOf(c) + 1,
    inLanguage: b.language,
    datePublished: b.published,
    wordCount: c.words,
    isAccessibleForFree: true,
    author: { '@type': 'Person', name: AUTHOR.name, description: AUTHOR.description },
    publisher: { '@type': 'Organization', name: 'Qubic Church', url: SITE_URL },
    isPartOf: { '@type': 'Book', name: b.title, url: bookUrl(b), author: { '@type': 'Person', name: AUTHOR.name } },
    description: chapterExcerpt(c, 300),
  }

  return (
    <div className="w-full pb-24">
      <script dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} type="application/ld+json" />
      <article className="mx-auto w-full max-w-[44rem] px-5 pt-10 md:pt-16">
        <nav aria-label="Breadcrumb" className="mb-10 text-sm text-fg-2">
          <Link className="hover:text-foreground" href="/books">
            Books
          </Link>{' '}
          /{' '}
          <Link className="hover:text-foreground" href={`/books/${b.slug}`}>
            {b.title}
          </Link>
        </nav>

        <header className="mb-12 border-b border-border pb-10">
          {c.part && <p className="eyebrow mb-3 text-gold">{c.part}</p>}
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-fg-2">{c.n ? c.label : b.title}</p>
          <h1 className="mt-3 font-display text-5xl leading-[0.95] md:text-7xl">{c.title}</h1>
          <p className="mt-6 text-sm text-fg-2">
            <span>
              From <em className="not-italic text-foreground">{b.title}</em> by{' '}
              <span className="text-foreground" rel="author">
                QC
              </span>
            </span>{' '}
            · Qubic Church, <time dateTime={b.published}>{b.published.slice(0, 4)}</time> · {readingMinutes(c.words)} min
            read
          </p>
        </header>

        <div className="book-prose">
          {c.blocks.map((x, i) =>
            x.t === 'h' ? (
              <h2 key={i}>{x.text}</h2>
            ) : x.t === 'quote' ? (
              <figure key={i}>
                <blockquote>{x.text}</blockquote>
                <figcaption>{x.cite}</figcaption>
              </figure>
            ) : (
              <p key={i}>{x.text}</p>
            ),
          )}
        </div>

        <CiteBox
          apa={`QC. (${b.published.slice(0, 4)}). ${c.title}. In ${b.title}. Qubic Church. ${chapterUrl(b, c)}`}
          md={`/text/${b.slug}/${c.slug}.md`}
        />

        <nav aria-label="Chapters" className="mt-12 grid gap-3 border-t border-border pt-8 sm:grid-cols-2">
          {prev ? (
            <Link className="group border border-border p-4 hover:border-gold/60" href={`/books/${b.slug}/${prev.slug}`}>
              <span className="eyebrow text-fg-2">← Previous</span>
              <span className="mt-1 block font-semibold group-hover:text-gold">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              className="group border border-border p-4 text-right hover:border-gold/60"
              href={`/books/${b.slug}/${next.slug}`}
            >
              <span className="eyebrow text-fg-2">Next →</span>
              <span className="mt-1 block font-semibold group-hover:text-gold">{next.title}</span>
            </Link>
          ) : (
            <Link className="group border border-gold/60 p-4 text-right" href="/donate">
              <span className="eyebrow text-gold">End of the book</span>
              <span className="mt-1 block font-semibold">The book is free. Support the next one →</span>
            </Link>
          )}
        </nav>
      </article>
    </div>
  )
}
