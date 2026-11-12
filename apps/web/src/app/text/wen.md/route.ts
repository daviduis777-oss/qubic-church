import { WEN_URL, wenMarkdown } from '@/lib/when-text'

export const revalidate = 3600

export function GET() {
  return new Response(wenMarkdown(), { headers: { 'content-type': 'text/markdown; charset=utf-8', Link: `<${WEN_URL}>; rel="canonical"` } })
}
