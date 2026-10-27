import { BPP_URL, bppMarkdown } from '@/lib/bpp/explainer'

export const dynamic = 'force-static'

export function GET() {
  return new Response(bppMarkdown(), { headers: { 'content-type': 'text/markdown; charset=utf-8', Link: `<${BPP_URL}>; rel="canonical"` } })
}
