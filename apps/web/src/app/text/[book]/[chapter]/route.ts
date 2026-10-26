import { BOOKS, chapterMarkdown, chapterUrl, getBook, getChapter } from '@/lib/books'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return BOOKS.flatMap(b => b.chapters.map(c => ({ book: b.slug, chapter: `${c.slug}.md` })))
}

export async function GET(_req: Request, ctx: { params: Promise<{ book: string; chapter: string }> }) {
  const { book, chapter } = await ctx.params
  const b = getBook(book)
  const r = b && getChapter(b, chapter.replace(/\.md$/, ''))
  if (!b || !r) return new Response('Not found', { status: 404 })
  return new Response(`# ${b.title} (QC, Qubic Church)\n\n${chapterMarkdown(b, r.chapter)}`, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8', Link: `<${chapterUrl(b, r.chapter)}>; rel="canonical"` },
  })
}
