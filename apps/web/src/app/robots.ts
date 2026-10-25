import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/books'
import { INDEXING } from '@/lib/indexing'

export default function robots(): MetadataRoute.Robots {
  if (!INDEXING) return { rules: [{ userAgent: '*', disallow: '/' }] }
  // A named group replaces the * group for that bot, so the private paths are repeated there.
  const PRIVATE = ['/api/', '/articles/mod', '/articles/new', '/articles/me']
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      // AI crawlers are welcome: the point is to be read and cited.
      { userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'CCBot'], allow: '/', disallow: PRIVATE },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
