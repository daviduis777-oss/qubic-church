import { NextResponse } from 'next/server'
import { getSession, modKeyOk } from '@/lib/forum/auth'
import { LABEL_APPROVED, LABEL_REJECTED, closePending, getPending, listPending } from '@/lib/forum/github'
import { link, loadAll, moderationQueue, publish, remove } from '@/lib/forum/publish'

export const dynamic = 'force-dynamic'

/** Queue (when FORUM_MODERATION=queue), recent forum posts, and links. */
export async function GET(req: Request) {
  const key = req.headers.get('x-mod-key')
  if (!modKeyOk(key)) return NextResponse.json({ error: 'no' }, { status: 401 })
  try {
    const { articles, replies, links } = await loadAll()
    const me = await getSession()
    return NextResponse.json({
      queue: moderationQueue(),
      pending: moderationQueue() ? await listPending() : [],
      topics: articles.data.filter(a => a.guest).slice(0, 30).map(a => ({ slug: a.slug, title: a.title, author: a.author, handle: a.handle, auth: a.auth, date: a.date })),
      replies: replies.data.slice(-30).reverse().map(r => ({ id: r.id, topic: r.topic, author: r.author, handle: r.handle, date: r.date, text: r.text.slice(0, 140) })),
      links: links.data,
      me,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

type Body = { key?: string; action?: 'approve' | 'reject' | 'remove' | 'link'; number?: number; mariaRepost?: string; note?: string; as?: string; slug?: string; reply?: string; member?: string }

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as Body | null
  if (!b || !modKeyOk(b.key ?? req.headers.get('x-mod-key'))) return NextResponse.json({ error: 'no' }, { status: 401 })
  try {
    if (b.action === 'remove') return NextResponse.json({ ok: true, ...(await remove({ slug: b.slug, reply: b.reply })) })
    if (b.action === 'link') {
      const me = await getSession()
      if (!me) return NextResponse.json({ error: 'Login on the forum first, then link.' }, { status: 401 })
      return NextResponse.json({ ok: true, ...(await link(me, (b.member ?? '').trim())) })
    }
    const n = Number(b.number)
    const item = await getPending(n)
    if (!item) return NextResponse.json({ error: 'not pending' }, { status: 404 })
    if (b.action === 'reject') {
      await closePending(n, LABEL_REJECTED, 'Not published.')
      return NextResponse.json({ ok: true })
    }
    const out = await publish(item.data, { as: b.as?.trim() || undefined, mariaRepost: b.mariaRepost, note: b.note, ref: `#${n}` })
    if (out.error) return NextResponse.json({ error: out.error }, { status: 409 })
    await closePending(n, LABEL_APPROVED, out.slug ? `Published: https://qubic.church/articles/${out.slug}` : `Published under https://qubic.church/articles/${out.topic}`)
    return NextResponse.json({ ok: true, slug: out.slug })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
