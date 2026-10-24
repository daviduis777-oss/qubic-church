import { ARTICLES, articleMarkdown, articleUrl } from '@/lib/articles'
import { SITE_URL } from '@/lib/books'

export const dynamic = 'force-static'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** RSS feed of the articles, newest first. */
export function GET() {
  const items = ARTICLES.map(
    a => `  <item>
    <title>${esc(a.title)}</title>
    <link>${articleUrl(a)}</link>
    <guid isPermaLink="true">${articleUrl(a)}</guid>
    <pubDate>${new Date(`${a.date}T12:00:00Z`).toUTCString()}</pubDate>
    <author>${esc(a.author)}</author>
    <description>${esc(a.summary)}</description>
    <content:encoded><![CDATA[${articleMarkdown(a).replace(/]]>/g, ']]]]><![CDATA[>')}]]></content:encoded>
  </item>`
  ).join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Qubic Church: Articles</title>
  <link>${SITE_URL}/articles</link>
  <atom:link href="${SITE_URL}/articles/feed.xml" rel="self" type="application/rss+xml" />
  <description>Long-form articles on Qubic, Aigarth, Anna and Neuraxon, as it happens. By TesserAI.</description>
  <language>en</language>
${items}
</channel>
</rss>`
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } })
}
