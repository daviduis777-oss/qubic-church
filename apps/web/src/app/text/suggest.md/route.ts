import { SUGGEST_URL, suggestMarkdown } from '@/lib/suggest-text'

export const revalidate = 3600

export function GET() {
  return new Response(suggestMarkdown(), { headers: { 'content-type': 'text/markdown; charset=utf-8', Link: `<${SUGGEST_URL}>; rel="canonical"` } })
}
