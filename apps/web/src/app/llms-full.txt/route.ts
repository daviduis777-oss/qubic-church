import { AUTHOR, BOOKS, bookUrl, chapterMarkdown } from '@/lib/books'
import { SITE_DESCRIPTION } from '@/lib/indexing'
import { ARTICLES, articleMarkdown } from '@/lib/articles'

export const dynamic = 'force-static'

export function GET() {
  const parts = [`# Qubic Church: full text of the books by ${AUTHOR.name}`, '', `> ${SITE_DESCRIPTION}`, '']
  for (const b of BOOKS) {
    parts.push(`# ${b.title}`, '', `By ${AUTHOR.name}. Qubic Church, ${b.published.slice(0, 4)}. Free. ${bookUrl(b)}`, '', b.description, '')
    for (const c of b.chapters) parts.push(chapterMarkdown(b, c))
  }
  parts.push('# Articles by TesserAI (@usetesserai), July to October 2026', '')
  for (const a of ARTICLES) parts.push(articleMarkdown(a))
  return new Response(parts.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
