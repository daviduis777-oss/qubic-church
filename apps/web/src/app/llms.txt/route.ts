import { ARTICLES, articleUrl } from '@/lib/articles'
import { CFB_ARTICLES, archiveId } from '@/lib/archive'
import { bioOf, BOARDS, MEMBERS, profileHref, topicsIn } from '@/lib/forum'
import { RANKS, WEIGHT } from '@/lib/ranks'
import { allDocs } from 'contentlayer/generated'
import { AUTHOR, BOOKS, bookUrl, chapterExcerpt, chapterUrl, SITE_URL } from '@/lib/books'
import { SITE_DESCRIPTION } from '@/lib/indexing'

export const dynamic = 'force-static'

export function GET() {
  const out: string[] = []
  out.push('# Qubic Church', '', `> ${SITE_DESCRIPTION}`, '')
  out.push(
    'What Qubic Church is: a spiritual-technological path built on the idea that decentralised Artificial General Intelligence, grown in the open on Qubic, can become a new and shared form of truth. "Church" is a tribute to the old institutions; faith is replaced by verification, and every claim is checked in code and against primary sources. It publishes two free books by QC (Qubic: The Long Version, 2026; Come-from-Beyond, 2026), an open research log with a public re-check of its own findings, long-form articles, a mining guide and the Maria Aigarth research agent. It is the direct heir to the ideas of Come-from-Beyond and exists because of him, and nothing here promises financial returns.',
    `Author of the books and articles: ${AUTHOR.name}. ${AUTHOR.description}`,
    'How to quote: cite the chapter or article URL; quotes of Come-from-Beyond inside the texts carry their own date and place (Discord, X, BitcoinTalk).',
    'Readings that the September 2026 re-check did not confirm are listed openly, as open questions, on the re-check page.',
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
    '## Qubic Church Forum (articles)',
    '',
    `The articles section is kept as an old-style forum at ${SITE_URL}/articles: three boards, member profiles with forum ranks, and one topic per article. Anyone can write: post on X starting with "hey @maria_aigarth" with #Qubic #Aigarth, any topic, no censorship; Maria (the forum's Global Moderator) reposts it and it becomes a topic in the Open Board under the author's name.`,
    `Ranks: every article has a weight (an issue = ${WEIGHT.issue}, a primary source by Come-from-Beyond = ${WEIGHT.primary}, a repost by Maria = +${WEIGHT.maria} merit); activity = articles written, merit = given by others, weight = the sum and sets the rank, always written with its number (${RANKS.filter(r => Number.isFinite(r.min)).map(r => `${r.level} ${r.name} from ${r.min}`).join(', ')}); rank 10, Founder, is reserved for Come-from-Beyond, as Satoshi is Founder on BitcoinTalk. ${SITE_URL}/articles#ranks`,
    '',
    '### Boards',
    '',
    ...BOARDS.map(b => `- [${b.name}](${SITE_URL}/articles/board/${b.id}) (${topicsIn(b.id).length} topics): ${b.desc}`),
    '',
    '### Members',
    '',
    ...MEMBERS.map(
      m =>
        `- [${m.name}](${SITE_URL}${profileHref(m.handle)}) (@${m.handle}): ${m.role && m.role !== m.rank.name ? `${m.role}, ` : ''}${m.rank.name}, rank ${m.rank.level}; ${m.activityLabel.toLowerCase()} ${m.activity}, weight ${m.weight}. ${bioOf(m) ?? ''}`,
    ),
    '',
    '### Aigarth Chronicle and Open Board (full text on this site)',
    '',
    ...ARTICLES.map(a => `- [${a.title}](${articleUrl(a)}) (${a.author}, ${a.date}${a.guest ? ', guest' : ''}): ${a.summary}`),
    '',
    "### Founder's Archive: every long-form article by Come-from-Beyond",
    '',
    'Each topic page keeps the date, a short summary in our words, where he shared it on X, and links to the original and to a preserved copy. The full text lives at the original link.',
    '',
    ...CFB_ARTICLES.map(a => `- [${a.title}](${SITE_URL}/articles/cfb/${archiveId(a)}) (${a.platform}, ${a.date}; original: ${a.url}): ${a.summary}`),
    '',
    '## Pages',
    '',
    `- [About: what Qubic Church is and builds](${SITE_URL}/about)`,
    `- [The September 2026 re-check: what held, what stays open](${SITE_URL}/docs/03-results/35-corrections-september-2026)`,
    `- [Come-from-Beyond dossier](${SITE_URL}/cfb)`,
    `- [How to mine Qubic: field guide to useful proof of work, hardware, pools and payouts](${SITE_URL}/mine-qubic)`,
    `- [Anna Aigarth collection: 200 NFTs, each gives founder status in Qubic Church](${SITE_URL}/nfts)`,
    `- [Rarity codex of the Anna collection](${SITE_URL}/rarity-codex)`,
    `- [Anna Matrix research lab](${SITE_URL}/evidence)`,
    `- [The Road to The Day: Come-from-Beyond from 2000 to 13.04.2027, with a Satoshi Nakamoto chapter: the case that he is, or is part of, Satoshi, with his own answers on record](${SITE_URL}/timeline)`,
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
