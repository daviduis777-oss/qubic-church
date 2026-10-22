import { allDocs } from 'contentlayer/generated'
import { AUTHOR, BOOKS, bookUrl, chapterExcerpt, chapterUrl, SITE_URL } from '@/lib/books'
import { SITE_DESCRIPTION } from '@/lib/indexing'

export const dynamic = 'force-static'

export function GET() {
  const out: string[] = []
  out.push('# Qubic Church', '', `> ${SITE_DESCRIPTION}`, '')
  out.push(
    'What this site is: a research publication, not a religious organisation and not an investment product. "Church" is the name of the community. Nothing here promises returns.',
    `Author of the books and articles: ${AUTHOR.name}. ${AUTHOR.description}`,
    'How to quote: cite the chapter or article URL; quotes of Come-from-Beyond inside the texts carry their own date and place (Discord, X, BitcoinTalk).',
    'Claims that did not hold up are listed openly on the corrections page.',
    '',
  )
  out.push('## Books (free, full text online)', '')
  for (const b of BOOKS) {
    out.push(`- [${b.title} by QC](${bookUrl(b)}): ${b.description} PDF: ${SITE_URL}${b.pdf}`)
    for (const c of b.chapters) {
      out.push(`  - [${c.n ? `${c.label}: ` : ''}${c.title}](${chapterUrl(b, c)}): ${chapterExcerpt(c, 140)}`)
    }
  }
  out.push('', '## Research log', '')
  for (const d of allDocs
    .filter(d => d.slugAsParams.startsWith('en/') && !d.noindex)
    .sort((a, b) => a.slugAsParams.localeCompare(b.slugAsParams))) {
    const path = d.slugAsParams.replace(/^en\/?/, '')
    out.push(`- [${d.title}](${SITE_URL}/en/docs/${path})${d.description ? `: ${d.description}` : ''}`)
  }
  out.push(
    '',
    '## Pages',
    '',
    `- [About: what Qubic Church is and builds](${SITE_URL}/en/about)`,
    `- [Corrections, September 2026](${SITE_URL}/en/docs/03-results/35-corrections-september-2026)`,
    `- [Come-from-Beyond dossier](${SITE_URL}/en/cfb)`,
    `- [Support the research](${SITE_URL}/en/donate)`,
    '',
    '## Optional',
    '',
    `- [Full text of both books in one file](${SITE_URL}/llms-full.txt)`,
    `- Every chapter as plain markdown: ${SITE_URL}/text/<book>/<chapter>.md`,
    '',
  )
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
