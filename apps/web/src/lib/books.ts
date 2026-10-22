import cfb from '@/data/books/come-from-beyond.json'
import lv from '@/data/books/qubic-the-long-version.json'

export type Block =
  | { t: 'p'; text: string }
  | { t: 'h'; text: string }
  | { t: 'quote'; text: string; cite: string }

export type Chapter = {
  slug: string
  n: number | null
  label: string
  title: string
  part: string | null
  words: number
  blocks: Block[]
}

export type Book = {
  slug: string
  title: string
  subtitle: string
  pdf: string
  cover: string
  published: string
  language: string
  description: string
  author: string
  publisher: string
  chapters: Chapter[]
}

// Book one (2026-06) first, then book two (2026-08)
export const BOOKS: Book[] = [lv as Book, cfb as Book]

export const AUTHOR = {
  name: 'QC',
  description:
    'QC is the author name used by Qubic Church for its books and research on Qubic, Aigarth and Come-from-Beyond.',
}

export function getBook(slug: string) {
  return BOOKS.find(b => b.slug === slug)
}

export function getChapter(book: Book, slug: string) {
  const i = book.chapters.findIndex(c => c.slug === slug)
  if (i < 0) return null
  return {
    chapter: book.chapters[i] as Chapter,
    prev: book.chapters[i - 1] ?? null,
    next: book.chapters[i + 1] ?? null,
  }
}

export function chapterHeading(c: Chapter) {
  return c.n ? `${c.label}. ${c.title}` : c.title
}

export function chapterExcerpt(c: Chapter, len = 220) {
  const first = c.blocks.find(b => b.t === 'p' && b.text.length > 80)
  const t = first ? first.text : c.blocks.map(b => b.text).join(' ')
  return t.length > len ? `${t.slice(0, len).replace(/\s+\S*$/, '')}…` : t
}

export function readingMinutes(words: number) {
  return Math.max(1, Math.round(words / 230))
}

export function bookWords(b: Book) {
  return b.chapters.reduce((s, c) => s + c.words, 0)
}

export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://qubic.church').replace(/\/$/, '')

export const bookUrl = (b: Book) => `${SITE_URL}/books/${b.slug}`
export const chapterUrl = (b: Book, c: Chapter) => `${SITE_URL}/books/${b.slug}/${c.slug}`

/** Plain-text/markdown rendering used by llms-full.txt and the .md endpoints. */
export function chapterMarkdown(b: Book, c: Chapter) {
  const lines = [`## ${b.title} — ${chapterHeading(c)}`, '', `Source: ${chapterUrl(b, c)}`, `Author: QC · Publisher: Qubic Church · ${b.published.slice(0, 4)}`, '']
  for (const x of c.blocks) {
    if (x.t === 'h') lines.push(`### ${x.text}`, '')
    else if (x.t === 'quote') lines.push(`> ${x.text}`, `> — ${x.cite}`, '')
    else lines.push(x.text, '')
  }
  return lines.join('\n')
}
