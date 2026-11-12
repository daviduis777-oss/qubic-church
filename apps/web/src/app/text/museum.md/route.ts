import { MUSEUM_URL, museumMarkdown } from '@/lib/museum-text'

export const revalidate = 3600

export function GET() {
  return new Response(museumMarkdown(), { headers: { 'content-type': 'text/markdown; charset=utf-8', Link: `<${MUSEUM_URL}>; rel="canonical"` } })
}
