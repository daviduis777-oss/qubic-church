import { NextResponse } from 'next/server'
import { getSession } from '@/lib/forum/auth'
import { blocksFromDraft, blocksFromText } from '@/lib/forum/text'

export const dynamic = 'force-dynamic'

/** Import a post or X Article by URL. Text comes from the FxTwitter public API; the author keeps the words. */
export async function GET(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Login first.' }, { status: 401 })
  const url = new URL(req.url).searchParams.get('url') ?? ''
  const m = url.match(/^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status\/(\d+)/)
  if (!m) return NextResponse.json({ error: 'Paste a link like https://x.com/name/status/123' }, { status: 400 })
  const r = await fetch(`https://api.fxtwitter.com/${m[1]}/status/${m[2]}`, { headers: { 'User-Agent': 'qubic.church forum' }, cache: 'no-store' })
  if (!r.ok) return NextResponse.json({ error: `Could not fetch the post (${r.status}).` }, { status: 502 })
  const j = (await r.json()) as { tweet?: { text?: string; author?: { screen_name?: string; name?: string }; article?: { title?: string; content?: { blocks?: { text: string; type: string }[] } } } }
  const t = j.tweet
  if (!t) return NextResponse.json({ error: 'No post found.' }, { status: 404 })
  const article = t.article
  const blocks = article?.content?.blocks?.length ? blocksFromDraft(article.content.blocks) : blocksFromText(t.text ?? '')
  const text = blocks.map(b => (b.t === 'h' ? `## ${b.text}` : b.t === 'quote' ? `> ${b.text}${b.cite ? ` - ${b.cite}` : ''}` : b.text)).join('\n\n')
  return NextResponse.json({ title: article?.title ?? '', text, xHandle: t.author?.screen_name ?? m[1], xName: t.author?.name ?? '' })
}
