import { SITE_URL } from '@/lib/books'
import { KINDS, MOMENTS, type Moment, WEN } from './when'

/*
 * WEN for machines: the same moments as plain markdown (for AI assistants that fetch text) and as schema.org
 * (an ItemList of Events and an FAQPage), so a search for a Qubic date lands on a page that answers it.
 */

export const WEN_URL = `${SITE_URL}/wen`
export const WEN_MD_URL = `${SITE_URL}/text/wen.md`

const day = (m: Moment) => m.approx ?? new Date(m.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const abs = (href: string) => (href.startsWith('/') ? `${SITE_URL}${href}` : href)
const newestFirst = () => MOMENTS.slice().sort((a, b) => Date.parse(b.at) - Date.parse(a.at))

export function wenMarkdown(now = Date.now()) {
  const ahead = newestFirst()
    .filter(m => Date.parse(m.at) > now)
    .reverse()
  const past = newestFirst().filter(m => Date.parse(m.at) <= now)
  const line = (m: Moment) => {
    const parts = [`- **${day(m)}**${m.epoch ? ` (epoch ${m.epoch})` : ''}: ${m.title}.`]
    if (m.line) parts.push(` ${m.line}`)
    if (m.quote) parts.push(` Come-from-Beyond${m.quote.where ? ` (${m.quote.where}, ${m.quote.when})` : ` (${m.quote.when})`}: "${m.quote.text.replace(/\n/g, ' ')}"`)
    if (m.source) parts.push(` Source: [${m.source.label}](${abs(m.source.href)})`)
    parts.push(` [${KINDS[m.kind].name}]`)
    return parts.join('')
  }
  const years = [...new Set(past.map(m => new Date(m.at).getUTCFullYear()))]
  return [
    '# WEN? Every date that matters for Qubic and Aigarth',
    '',
    `> Qubic Church keeps this list at ${WEN_URL}. Dates are UTC. An ETA is an estimate, not a promise. Quotes of Come-from-Beyond are verbatim.`,
    '',
    'Qubic epochs start every Wednesday at 12:00 UTC (epoch 239 started on 11 November 2026).',
    '',
    '## Coming next',
    '',
    ...ahead.map(line),
    '',
    ...years.flatMap(y => [`## ${y}`, '', ...past.filter(m => new Date(m.at).getUTCFullYear() === y).map(line), '']),
    '## Asked every day',
    '',
    ...WEN.flatMap(w => [`### ${w.q}`, '', `${w.a} Come-from-Beyond (${w.quote.where ?? 'Discord'}, ${w.quote.when}): "${w.quote.text.replace(/\n/g, ' ')}"`, '']),
  ].join('\n')
}

export function wenLd() {
  const list = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'WEN? Every date that matters for Qubic and Aigarth',
    url: WEN_URL,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: MOMENTS.length,
    itemListElement: newestFirst().map((m, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Event',
        name: m.title,
        startDate: m.at.length === 10 ? m.at : m.at.slice(0, 19) + 'Z',
        description: [m.line, m.quote ? `Come-from-Beyond: "${m.quote.text.replace(/\n/g, ' ')}"` : ''].filter(Boolean).join(' '),
        eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        location: { '@type': 'VirtualLocation', url: 'https://qubic.org' },
        organizer: { '@type': 'Organization', name: 'Qubic', url: 'https://qubic.org' },
        ...(m.source ? { url: abs(m.source.href) } : {}),
      },
    })),
  }
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: WEN.map(w => ({
      '@type': 'Question',
      name: w.q,
      acceptedAnswer: { '@type': 'Answer', text: `${w.a} Come-from-Beyond, ${w.quote.when}: "${w.quote.text.replace(/\n/g, ' ')}"` },
    })),
  }
  return [list, faq]
}
