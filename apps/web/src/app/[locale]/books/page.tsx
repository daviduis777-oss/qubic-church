import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { setRequestLocale } from 'next-intl/server'
import { AUTHOR, BOOKS, bookUrl, bookWords, readingMinutes, SITE_URL } from '@/lib/books'

const TITLE = 'Books by QC: Come-from-Beyond and Qubic: The Long Version'
const DESC =
  'Two free books by QC, published by Qubic Church: Come-from-Beyond, on Sergey Ivancheglo and a twenty-five-year line, and Qubic: The Long Version, on how Qubic works and why. Read chapter by chapter or download the PDF.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/books` },
  openGraph: { type: 'website', title: TITLE, description: DESC, url: `${SITE_URL}/books` },
}

const EXTRA: Record<string, { label: string; href: string }[]> = {
  'qubic-the-long-version': [
    { label: 'PDF · English', href: '/books/qubic-long-version-eng.pdf' },
    { label: 'PDF · Deutsch', href: '/books/qubic-long-version-deu.pdf' },
    { label: 'PDF · Русский', href: '/books/qubic-long-version-rus.pdf' },
    { label: 'Anna Matrix companion · PDF', href: '/books/anna-matrix-companion.pdf' },
  ],
  'come-from-beyond': [{ label: 'PDF · English', href: '/books/come-from-beyond.pdf' }],
}

export default async function BooksIndex(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: TITLE,
    description: DESC,
    url: `${SITE_URL}/books`,
    hasPart: BOOKS.map(b => ({
      '@type': 'Book',
      name: b.title,
      url: bookUrl(b),
      author: { '@type': 'Person', name: AUTHOR.name },
      datePublished: b.published,
      isAccessibleForFree: true,
    })),
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-10 sm:px-6 md:pt-16">
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} type="application/ld+json" />
      <header className="border-b border-border pb-10">
        <p className="eyebrow text-gold">The library · by QC · free</p>
        <h1 className="mt-3 font-display text-7xl leading-[0.85] md:text-9xl">Books</h1>
        <p className="mt-6 max-w-2xl font-serif text-xl leading-relaxed text-foreground/85">
          Two books on Qubic, Aigarth and Come-from-Beyond. Every chapter is a page you can read, link to and cite.
          The PDFs are the same text, typeset.
        </p>
      </header>

      <div className="divide-y divide-border">
        {BOOKS.map(b => (
          <article className="grid gap-8 py-14 md:grid-cols-[minmax(200px,280px)_1fr] md:gap-14" key={b.slug}>
            <Link className="relative mx-auto block aspect-[2/3] w-52 md:mx-0 md:w-full" href={`/books/${b.slug}`}>
              <Image
                alt={`${b.title} cover`}
                className="object-cover shadow-[0_40px_80px_-30px_rgba(240,192,48,0.35)]"
                fill
                sizes="280px"
                src={b.cover}
              />
            </Link>
            <div>
              <p className="eyebrow text-gold">{b.published.slice(0, 4)} · {b.chapters.filter(c => c.n).length} chapters</p>
              <h2 className="mt-2 font-display text-5xl leading-[0.9] md:text-7xl">
                <Link className="hover:text-gold" href={`/books/${b.slug}`}>
                  {b.title}
                </Link>
              </h2>
              <p className="mt-3 text-lg text-fg-2">{b.subtitle}</p>
              <p className="mt-5 max-w-2xl font-serif text-lg leading-relaxed text-foreground/90">{b.description}</p>
              <p className="mt-5 text-xs uppercase tracking-widest text-fg-2">
                {bookWords(b).toLocaleString('en-US')} words · about {readingMinutes(bookWords(b))} min
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  className="inline-flex h-11 items-center border border-gold bg-gold/10 px-5 text-sm font-medium text-gold hover:bg-gold/20"
                  href={`/books/${b.slug}/${b.chapters[0]?.slug ?? ''}`}
                >
                  Start reading
                </Link>
                <Link
                  className="inline-flex h-11 items-center border border-border px-5 text-sm font-medium text-fg-2 hover:text-foreground"
                  href={`/books/${b.slug}`}
                >
                  Contents
                </Link>
              </div>
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {(EXTRA[b.slug] ?? []).map(x => (
                  <li key={x.href}>
                    <a className="text-fg-2 underline underline-offset-4 hover:text-foreground" href={x.href}>
                      {x.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      <aside className="mt-6 border border-border bg-card p-6 md:p-8">
        <p className="eyebrow text-gold">For researchers and AI systems</p>
        <p className="mt-3 max-w-3xl text-fg-2">
          Each chapter has a plain-text version, linked from the chapter page. The full text of both books is at{' '}
          <a className="text-foreground underline underline-offset-4" href="/llms-full.txt">
            /llms-full.txt
          </a>
          , and a short guide to the site is at{' '}
          <a className="text-foreground underline underline-offset-4" href="/llms.txt">
            /llms.txt
          </a>
          . Please cite as: QC. (year). Chapter title. In Book title. Qubic Church. URL.
        </p>
      </aside>
    </div>
  )
}
