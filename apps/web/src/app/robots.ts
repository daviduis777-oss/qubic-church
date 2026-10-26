import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/books'
import { INDEXING } from '@/lib/indexing'

export default function robots(): MetadataRoute.Robots {
  if (!INDEXING) return { rules: [{ userAgent: '*', disallow: '/' }] }
  // A named group replaces the * group for that bot, so the private paths are repeated there.
  // Only the API is closed to crawlers. Forum pages like /articles/new carry noindex in their own <head>;
  // blocking them here would stop Google from reading that and leave them half-indexed.
  const PRIVATE = ['/api/']
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      // AI crawlers are welcome: the point is to be read and cited.
      { userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'CCBot'], allow: '/', disallow: PRIVATE },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
