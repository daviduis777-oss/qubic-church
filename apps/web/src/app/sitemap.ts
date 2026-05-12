import type { MetadataRoute } from 'next'

type Sitemap = MetadataRoute.Sitemap

// Site is intentionally not indexed (robots.txt Disallow /, layout meta robots noindex).
// Sitemap is therefore empty — no URLs to advertise to search engines.
export default function sitemap(): Sitemap {
  return []
}
