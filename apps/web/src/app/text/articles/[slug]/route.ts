import { ARTICLES, articleMarkdown, getArticle } from '@/lib/articles'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return ARTICLES.map(a => ({ slug: `${a.slug}.md` }))
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const a = getArticle(slug.replace(/\.md$/, ''))
  if (!a) return new Response('Not found', { status: 404 })
  return new Response(articleMarkdown(a), { headers: { 'content-type': 'text/markdown; charset=utf-8' } })
}
