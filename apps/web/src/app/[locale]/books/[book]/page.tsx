import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { locales } from '@/config/i18n'
import {
  AUTHOR,
  BOOKS,
  bookUrl,
  bookWords,
  chapterExcerpt,
  chapterUrl,
  getBook,
  readingMinutes,
  SITE_URL,
} from '@/lib/books'

export function generateStaticParams() {
  return locales.flatMap(locale => BOOKS.map(b => ({ locale, book: b.slug })))
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; book: string }>
}): Promise<Metadata> {
  const { book: slug } = await props.params
  const b = getBook(slug)
  if (!b) return {}
  return {
    title: `${b.title} by QC: read online`,
    description: b.description,
    alternates: { canonical: bookUrl(b) },
    authors: [{ name: AUTHOR.name }],
    openGraph: {
      type: 'book',
      title: `${b.title} by QC`,
      description: b.description,
      url: bookUrl(b),
      images: [{ url: `${SITE_URL}${b.cover}` }],
    },
  }
}

export default async function BookPage(props: {
  params: Promise<{ locale: string; book: string }>
}) {
  const { locale, book: slug } = await props.params
  setRequestLocale(locale)
  const b = getBook(slug)
  if (!b) notFound()

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: b.title,
    alternativeHeadline: b.subtitle,
    description: b.description,
    url: bookUrl(b),
    image: `${SITE_URL}${b.cover}`,
    inLanguage: b.language,
    datePublished: b.published,
    isAccessibleForFree: true,
    bookFormat: 'https://schema.org/EBook',
    author: { '@type': 'Person', name: AUTHOR.name, description: AUTHOR.description },
    publisher: { '@type': 'Organization', name: 'Qubic Church', url: SITE_URL },
    about: [
      { '@type': 'Person', name: 'Come-from-Beyond', alternateName: 'Sergey Ivancheglo' },
      { '@type': 'Thing', name: 'Qubic' },
      { '@type': 'Thing', name: 'Aigarth' },
    ],
    encoding: { '@type': 'MediaObject', contentUrl: `${SITE_URL}${b.pdf}`, encodingFormat: 'application/pdf' },
    hasPart: b.chapters.map((c, i) => ({
      '@type': 'Chapter',
      position: i + 1,
      name: c.title,
      url: chapterUrl(b, c),
    })),
  }

  let lastPart: string | null = null

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-10 sm:px-6 md:pt-16">
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} type="application/ld+json" />
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-fg-2">
        <Link className="hover:text-foreground" href="/books">
          Books
        </Link>{' '}
        / <span className="text-foreground">{b.title}</span>
      </nav>

      <header className="grid gap-10 md:grid-cols-[minmax(220px,320px)_1fr] md:gap-14">
        <div className="relative mx-auto aspect-[2/3] w-56 shadow-[0_30px_80px_-20px_rgba(240,192,48,0.25)] md:mx-0 md:w-full">
          <Image alt={`${b.title} cover`} className="object-cover" fill priority sizes="320px" src={b.cover} />
        </div>
        <div>
          <p className="eyebrow text-gold">A book by QC · Qubic Church · {b.published.slice(0, 4)}</p>
          <h1 className="mt-3 font-display text-6xl leading-[0.9] md:text-8xl">{b.title}</h1>
          <p className="mt-4 text-xl text-fg-2">{b.subtitle}</p>
          <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-foreground/90">{b.description}</p>
          <p className="mt-6 text-sm text-fg-2">
            {b.chapters.length} sections · {bookWords(b).toLocaleString('en-US')} words · about{' '}
            {readingMinutes(bookWords(b))} min · free
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              className="inline-flex h-11 items-center border border-gold bg-gold/10 px-5 text-sm font-medium text-gold hover:bg-gold/20"
              href={`/books/${b.slug}/${b.chapters[0]?.slug ?? ''}`}
            >
              Start reading
            </Link>
            <a
              className="inline-flex h-11 items-center border border-border px-5 text-sm font-medium text-fg-2 hover:text-foreground"
              href={b.pdf}
            >
              Download PDF
            </a>
            <Link
              className="inline-flex h-11 items-center border border-border px-5 text-sm font-medium text-fg-2 hover:text-foreground"
              href="/donate"
            >
              Support the work
            </Link>
          </div>
        </div>
      </header>

      <section aria-labelledby="toc" className="mt-16">
        <h2 className="eyebrow mb-6 text-fg-2" id="toc">
          Contents
        </h2>
        <ol className="divide-y divide-border border-y border-border">
          {b.chapters.map(c => {
            const showPart = c.part && c.part !== lastPart
            lastPart = c.part ?? lastPart
            return (
              <li key={c.slug}>
                {showPart && <p className="eyebrow pb-2 pt-8 text-gold">{c.part}</p>}
                <Link
                  className="group grid gap-1 py-5 md:grid-cols-[9rem_1fr_6rem] md:items-baseline md:gap-6"
                  href={`/books/${b.slug}/${c.slug}`}
                >
                  <span className="font-mono text-xs uppercase tracking-widest text-fg-2">{c.n ? c.label : '·'}</span>
                  <span>
                    <span className="block text-xl font-semibold group-hover:text-gold">{c.title}</span>
                    <span className="mt-1 block text-sm text-fg-2">{chapterExcerpt(c, 160)}</span>
                  </span>
                  <span className="text-sm text-fg-2 md:text-right">{readingMinutes(c.words)} min</span>
                </Link>
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
