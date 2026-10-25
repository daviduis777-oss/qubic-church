import { NextResponse } from 'next/server'
import { modKeyOk } from '@/lib/forum/auth'
import { LABEL_APPROVED, LABEL_REJECTED, closePending, getPending, listPending, readJson, writeJson } from '@/lib/forum/github'
import { blocksFromText, slugify, summaryOf, wordCount } from '@/lib/forum/text'
import type { Article } from '@/lib/articles'

export const dynamic = 'force-dynamic'

export type Reply = { id: string; topic: string; date: string; author: string; handle: string; auth: 'qubic' | 'trip' | 'x'; identity?: string; text: string; xUrl?: string }

const ARTICLES_PATH = 'apps/web/src/data/articles/articles.json'
const REPLIES_PATH = 'apps/web/src/data/articles/replies.json'

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get('key')
  if (!modKeyOk(key)) return NextResponse.json({ error: 'no' }, { status: 401 })
  try {
    return NextResponse.json({ pending: await listPending() })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { key?: string; number?: number; action?: 'approve' | 'reject'; mariaRepost?: string; note?: string } | null
  if (!b || !modKeyOk(b.key)) return NextResponse.json({ error: 'no' }, { status: 401 })
  const n = Number(b.number)
  const item = await getPending(n)
  if (!item) return NextResponse.json({ error: 'not pending' }, { status: 404 })
  const p = item.data
  try {
    if (b.action === 'reject') {
      await closePending(n, LABEL_REJECTED, 'Not published.')
      return NextResponse.json({ ok: true })
    }
    if (p.kind === 'topic') {
      const { data: arts, sha } = await readJson<Article[]>(ARTICLES_PATH)
      let slug = slugify(p.title)
      const base = slug
      for (let i = 2; arts.some(a => a.slug === slug); i++) slug = `${base}-${i}`
      const blocks = blocksFromText(p.text, p.title)
      const entry: Article & { auth: string; identity?: string } = {
        slug,
        title: p.title,
        kicker: null,
        date: p.date,
        url: p.xUrl ?? `https://qubic.church/articles/${slug}`,
        author: p.author.name,
        handle: p.author.handle,
        guest: true,
        auth: p.author.auth,
        identity: p.author.auth === 'qubic' ? p.author.id : undefined,
        summary: summaryOf(blocks),
        words: wordCount(blocks),
        blocks,
      }
      if (b.mariaRepost) entry.mariaRepost = b.mariaRepost
      if (b.note) entry.note = b.note
      arts.unshift(entry)
      arts.sort((x, y) => y.date.localeCompare(x.date))
      await writeJson(ARTICLES_PATH, arts, sha, `forum: topic "${p.title.slice(0, 60)}" by ${p.author.name} (#${n})`)
      await closePending(n, LABEL_APPROVED, `Published: https://qubic.church/articles/${slug}`)
      return NextResponse.json({ ok: true, slug })
    }
    const { data: replies, sha } = await readJson<Reply[]>(REPLIES_PATH)
    const reply: Reply = {
      id: `${p.topic}-${n}`,
      topic: p.topic!,
      date: p.date,
      author: p.author.name,
      handle: p.author.handle,
      auth: p.author.auth,
      identity: p.author.auth === 'qubic' ? p.author.id : undefined,
      text: p.text,
      xUrl: p.xUrl,
    }
    replies.push(reply)
    await writeJson(REPLIES_PATH, replies, sha, `forum: reply by ${p.author.name} in ${p.topic} (#${n})`)
    await closePending(n, LABEL_APPROVED, `Published under https://qubic.church/articles/${p.topic}`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
