import type { MetadataRoute } from 'next'
import { allBlogs, allDocs } from 'contentlayer/generated'
import { BOOKS, SITE_URL } from '@/lib/books'
import { INDEXING } from '@/lib/indexing'
import { ARTICLES } from '@/lib/articles'

export default function sitemap(): MetadataRoute.Sitemap {
  if (!INDEXING) return []
  // lastModified only where a real date exists; build time is not a modification date
  const page = (path: string, priority: number, lastModified?: Date | string) => ({
    url: `${SITE_URL}${path || '/'}`,
    ...(lastModified ? { lastModified } : {}),
    priority,
  })
  return [
    page('', 1),
    page('/about', 0.9),
    page('/books', 0.9),
    ...BOOKS.flatMap(b => [
      page(`/books/${b.slug}`, 0.9, b.published),
      ...b.chapters.map(c => page(`/books/${b.slug}/${c.slug}`, 0.8, b.published)),
    ]),
    page('/docs', 0.8),
    ...allDocs
      .filter(d => d.slugAsParams.startsWith('en/') && !d.noindex)
      .map(d => page(`/docs/${d.slugAsParams.replace(/^en\/?/, '')}`, 0.7)),
    page('/blog', 0.6),
    ...allBlogs
      .filter(p => p.slugAsParams.startsWith('en/'))
      .map(p => page(`/blog/${p.slugAsParams.replace(/^en\/?/, '')}`, 0.6, p.date)),
    page('/cfb', 0.7),
    page('/nfts', 0.5),
    page('/mine-qubic', 0.5),
    page('/donate', 0.4),
    page('/articles', 0.8),
    ...ARTICLES.map(a => page(`/articles/${a.slug}`, 0.7, a.date)),
    page('/maria-aigarth', 0.7),
    page('/rarity-codex', 0.5),
    page('/evidence', 0.6),
    page('/timeline', 0.5),
  ]
}
