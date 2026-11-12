import { AUTHOR, BOOKS, bookUrl, chapterMarkdown } from '@/lib/books'
import { SITE_DESCRIPTION } from '@/lib/indexing'
import { ARTICLES, articleMarkdown } from '@/lib/articles'
import { ANSWERS, answerUrl } from '@/lib/answers'
import { wenMarkdown } from '@/lib/when-text'

export const revalidate = 3600

export function GET() {
  const parts = [`# Qubic Church: full text of the books by ${AUTHOR.name}`, '', `> ${SITE_DESCRIPTION}`, '']
  const md = (t: string) => t.replace(/\[([^\]]+)\]\(\/([^)]*)\)/g, '[$1](https://qubic.church/$2)')
  parts.push('# Short answers', '')
  for (const a of ANSWERS) {
    parts.push(`## ${a.question}`, '', answerUrl(a), '', ...a.answer.map(md), '', ...a.facts.map(([k, v]) => `- ${k}: ${v}`), '')
    for (const s of a.sections) parts.push(`### ${s.h}`, '', ...s.p.map(md), '')
    parts.push(...a.faq.flatMap(([q, x]) => [`**${q}** ${md(x)}`, '']), `Sources: ${a.sources.map(x => x.href.startsWith('/') ? 'https://qubic.church' + x.href : x.href).join(', ')}`, '')
  }
  parts.push(wenMarkdown().replace(/^# /, '# '), '')
  for (const b of BOOKS) {
    parts.push(`# ${b.title}`, '', `By ${AUTHOR.name}. Qubic Church, ${b.published.slice(0, 4)}. Free. ${bookUrl(b)}`, '', b.description, '')
    for (const c of b.chapters) parts.push(chapterMarkdown(b, c))
  }
  parts.push('# Articles by TesserAI (@usetesserai), July to October 2026', '')
  for (const a of ARTICLES) parts.push(articleMarkdown(a))
  return new Response(parts.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
