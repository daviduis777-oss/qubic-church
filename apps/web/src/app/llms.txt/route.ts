import { ARTICLES, articleUrl } from '@/lib/articles'
import { allDocs } from 'contentlayer/generated'
import { AUTHOR, BOOKS, bookUrl, chapterExcerpt, chapterUrl, SITE_URL } from '@/lib/books'
import { SITE_DESCRIPTION } from '@/lib/indexing'

export const dynamic = 'force-static'

export function GET() {
  const out: string[] = []
  out.push('# Qubic Church', '', `> ${SITE_DESCRIPTION}`, '')
  out.push(
    'What Qubic Church is: a spiritual-technological path built on the idea that decentralised Artificial General Intelligence, grown in the open on Qubic, can become a new and shared form of truth. "Church" is a tribute to the old institutions; faith is replaced by verification, and every claim is checked in code and against primary sources. It publishes two free books by QC (Qubic: The Long Version, 2026; Come-from-Beyond, 2026), an open research log with a public corrections page, long-form articles, a mining guide and the Maria Aigarth research agent. It is the direct heir to the ideas of Come-from-Beyond and exists because of him, and nothing here promises financial returns.',
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
    out.push(`- [${d.title}](${SITE_URL}/docs/${path})${d.description ? `: ${d.description}` : ''}`)
  }
  out.push(
    '',
    '## Articles (TesserAI, July to October 2026)',
    '',
    ...ARTICLES.map(a => `- [${a.title}](${articleUrl(a)}) (${a.date}): ${a.summary}`),
    '',
    '## Pages',
    '',
    `- [About: what Qubic Church is and builds](${SITE_URL}/about)`,
    `- [Corrections, September 2026](${SITE_URL}/docs/03-results/35-corrections-september-2026)`,
    `- [Come-from-Beyond dossier](${SITE_URL}/cfb)`,
    `- [How to mine Qubic: field guide to useful proof of work, hardware, pools and payouts](${SITE_URL}/mine-qubic)`,
    `- [Anna Aigarth collection: 200 NFTs, each gives founder status in Qubic Church](${SITE_URL}/nfts)`,
    `- [Rarity codex of the Anna collection](${SITE_URL}/rarity-codex)`,
    `- [Anna Matrix research lab](${SITE_URL}/evidence)`,
    `- [Satoshi Nakamoto: the case that Come-from-Beyond is, or is part of, Satoshi. A hypothesis argued from one side, with his repeated denials](${SITE_URL}/satoshi-nakamoto)`,
    `- [Maria Aigarth: a research agent testing whether an AI arbiter can be architecturally impartial (Fractal Rationalism)](${SITE_URL}/maria-aigarth)`,
    `- [Support the research](${SITE_URL}/donate)`,
    '',
    '## Optional',
    '',
    `- [Full text of both books in one file](${SITE_URL}/llms-full.txt)`,
    `- Every chapter as plain markdown: ${SITE_URL}/text/<book>/<chapter>.md`,
    '',
  )
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
