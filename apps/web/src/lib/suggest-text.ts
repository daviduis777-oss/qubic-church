import { SITE_URL } from '@/lib/books'
import { SITE_TYPES } from '@/lib/pool/report'

/* The Suggest page in words: the same text for people (server-rendered), for search and for AI assistants. */

export const SUGGEST_URL = `${SITE_URL}/suggest`
export const SUGGEST_MD_URL = `${SITE_URL}/text/suggest.md`
export const SUGGEST_TITLE = 'Suggest an idea, an update or a tool to Qubic Church'
export const SUGGEST_DESCRIPTION =
  'Tell Qubic Church what to build or fix: an idea, an outdated fact, a tool you would use, a review of the site or a bug. No account needed. We read every message.'

export const SUGGEST_FAQ = [
  {
    q: 'Who reads it?',
    a: 'The person who runs Qubic Church. Every message lands in one list and gets a status: seen, planned, in progress, done or declined.',
  },
  {
    q: 'Will you answer me?',
    a: 'Not every message gets a reply. Leave a Discord or X handle if you would like one, and we may write when your idea ships or if we have a question.',
  },
  {
    q: 'What is kept?',
    a: 'Your text, the handle if you gave one, the screenshot if you added one, the page you came from and a coarse device class like "mobile, iOS, Safari". Not your IP address: it is used only as a one-way hash to limit messages to five a day. Messages are kept for 180 days.',
  },
  {
    q: 'Is it safe to paste a wallet seed?',
    a: 'Never paste a seed anywhere. If one slips in, it is removed before the message is stored, and so are Qubic addresses.',
  },
]

export function suggestMarkdown() {
  return [
    `# ${SUGGEST_TITLE}`,
    '',
    `> ${SUGGEST_DESCRIPTION} Form: ${SUGGEST_URL}`,
    '',
    '## What you can send',
    '',
    ...SITE_TYPES.map(t => `- ${t.label}: ${t.ask}`),
    '',
    ...SUGGEST_FAQ.flatMap(f => [`## ${f.q}`, '', f.a, '']),
  ].join('\n')
}

export function suggestLd() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: SUGGEST_TITLE,
      url: SUGGEST_URL,
      description: SUGGEST_DESCRIPTION,
      isPartOf: { '@type': 'WebSite', name: 'Qubic Church', url: SITE_URL },
      potentialAction: { '@type': 'CommunicateAction', target: SUGGEST_URL, name: 'Send a suggestion' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: SUGGEST_FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ]
}
