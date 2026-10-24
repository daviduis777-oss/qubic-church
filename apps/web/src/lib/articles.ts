import data from '@/data/articles/articles.json'
import { SITE_URL } from '@/lib/books'

export type ArticleBlock = { t: 'p' | 'h' | 'quote'; text: string; cite?: string }
export type Article = {
  slug: string
  title: string
  kicker: string | null
  date: string
  url: string
  author: string
  summary: string
  words: number
  blocks: ArticleBlock[]
}

/** Newest first. Source: X articles by TesserAI (@usetesserai). */
export const ARTICLES: Article[] = (data as Article[]).slice().sort((a, b) => b.date.localeCompare(a.date))

export const getArticle = (slug: string) => ARTICLES.find(a => a.slug === slug)
/** Issue number: the first article published is No. 1. */
export const issueNumber = (a: Article) => ARTICLES.length - ARTICLES.indexOf(a)
/** New for two weeks after publication. */
export const isNew = (a: Article, now = new Date()) => now.getTime() - new Date(`${a.date}T12:00:00Z`).getTime() < 14 * 864e5
export const ARTICLES_FEED = `${SITE_URL}/articles/feed.xml`

const TOPIC_TERMS = ['Qubic', 'Aigarth', 'Anna', 'Anna.exe', 'BPP-9000', 'BPP9000', 'Neuraxon', 'ARC-AGI', 'ARC-AGI-3', 'Come-from-Beyond', 'CfB', 'useful proof of work', 'uPoW', 'mining', 'Ant Colony', 'ternary', 'NeuraxonLive', 'Hugging Face', 'IEEE', 'AGI', 'randomness', 'seed', 'wallet', 'Grok', 'Astra', 'Monero', 'Computors', 'epoch']
/** Topic words that actually occur in the article, for search engines. */
export function articleKeywords(a: Article): string[] {
  const text = `${a.title} ${a.kicker ?? ''} ${a.summary} ${a.blocks.map(b => b.text).join(' ')}`.toLowerCase()
  const hits = TOPIC_TERMS.filter(t => text.includes(t.toLowerCase()))
  return Array.from(new Set(['Qubic', 'Aigarth', ...hits])).slice(0, 12)
}
export const articleUrl = (a: Article) => `${SITE_URL}/articles/${a.slug}`
export const articleMinutes = (a: Article) => Math.max(1, Math.round(a.words / 230))
export const formatDate = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

export function articleMarkdown(a: Article) {
  const out = [`# ${a.title}`, '', `By ${a.author} (@usetesserai) · ${a.date} · Original: ${a.url}`, `Source page: ${articleUrl(a)}`, '']
  for (const b of a.blocks) {
    if (b.t === 'h') out.push(`## ${b.text}`, '')
    else if (b.t === 'quote') out.push(`> ${b.text}${b.cite ? `\n> — ${b.cite}` : ''}`, '')
    else out.push(b.text, '')
  }
  return out.join('\n')
}
