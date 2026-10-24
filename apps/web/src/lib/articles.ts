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
