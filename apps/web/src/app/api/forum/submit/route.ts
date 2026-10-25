import { NextResponse } from 'next/server'
import { getSession } from '@/lib/forum/auth'
import { countPendingBy, createPending, type Pending } from '@/lib/forum/github'
import { DAILY_CAP, loadAll, moderationQueue, postsToday, publish } from '@/lib/forum/publish'
import { ARTICLES } from '@/lib/articles'

export const dynamic = 'force-dynamic'

const MAX_TEXT = 15000
const MAX_TITLE = 120

export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Login first.' }, { status: 401 })
  const b = (await req.json().catch(() => null)) as Record<string, string> | null
  if (!b) return NextResponse.json({ error: 'bad request' }, { status: 400 })
  const kind = b.kind === 'reply' ? 'reply' : 'topic'
  const text = (b.text ?? '').replace(/\r/g, '').trim()
  const title = (b.title ?? '').replace(/\s+/g, ' ').trim()
  if (text.length < (kind === 'reply' ? 2 : 200)) return NextResponse.json({ error: kind === 'reply' ? 'Write something.' : 'A topic needs at least 200 characters. Short notes belong on X.' }, { status: 400 })
  if (text.length > MAX_TEXT) return NextResponse.json({ error: `Too long: ${MAX_TEXT} characters is the limit.` }, { status: 400 })
  if (kind === 'topic' && (title.length < 4 || title.length > MAX_TITLE)) return NextResponse.json({ error: 'A title, 4 to 120 characters.' }, { status: 400 })
  const xUrl = (b.xUrl ?? '').trim()
  if (xUrl && !/^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/[A-Za-z0-9_]{1,15}\/status\/\d+/.test(xUrl)) return NextResponse.json({ error: 'The X link looks wrong.' }, { status: 400 })

  const post: Pending = {
    kind,
    title: kind === 'reply' ? `Re: ${ARTICLES.find(a => a.slug === b.topic)?.title ?? ''}` : title,
    text,
    board: 'open',
    topic: kind === 'reply' ? b.topic : undefined,
    xUrl: xUrl || undefined,
    author: user,
    date: new Date().toISOString().slice(0, 10),
  }
  try {
    if (moderationQueue()) {
      if ((await countPendingBy(user.id)) >= 3) return NextResponse.json({ error: 'You already have 3 posts waiting for a moderator. Give them a moment.' }, { status: 429 })
      const issue = await createPending(post)
      return NextResponse.json({ ok: true, queue: issue.number })
    }
    const { articles, replies, links, known } = await loadAll()
    if (kind === 'reply' && !articles.data.some(a => a.slug === b.topic)) return NextResponse.json({ error: 'That topic is gone.' }, { status: 400 })
    if (postsToday(user, known, links.data, articles.data, replies.data, post.date) >= DAILY_CAP) return NextResponse.json({ error: `${DAILY_CAP} posts a day is the limit. Tomorrow is another day.` }, { status: 429 })
    const out = await publish(post)
    if (out.error) return NextResponse.json({ error: out.error }, { status: 409 })
    return NextResponse.json({ ok: true, published: true, slug: out.slug, topic: out.topic, author: out.author })
  } catch (e) {
    return NextResponse.json({ error: `Could not publish: ${(e as Error).message.slice(0, 160)}` }, { status: 500 })
  }
}
