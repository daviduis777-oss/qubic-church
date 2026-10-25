import 'server-only'
import { readJson, writeJson, type Pending } from './github'
import { blocksFromText, slugify, summaryOf, wordCount } from './text'
import type { Article } from '@/lib/articles'

/**
 * Publishing a post: one commit into the site's JSON data. Used by direct posting
 * (the default) and by the moderation queue (FORUM_MODERATION=queue).
 */
export const ARTICLES_PATH = 'apps/web/src/data/articles/articles.json'
export const REPLIES_PATH = 'apps/web/src/data/articles/replies.json'
export const MEMBERS_PATH = 'apps/web/src/data/articles/members.json'

export type Reply = { id: string; topic: string; date: string; author: string; handle: string; auth: 'qubic' | 'trip' | 'x'; identity?: string; text: string; xUrl?: string }
/** A link made by a moderator: this identity (or tripcode handle) posts as an existing member. */
export type Link = { identity?: string; handle?: string; member: string }
export type Known = { author: string; handle: string; auth: string; identity?: string }

export const moderationQueue = () => process.env.FORUM_MODERATION === 'queue'

/** Daily cap per identity when posting goes straight to the archive. */
export const DAILY_CAP = 5

export async function loadAll() {
  const [a, r, m] = await Promise.all([readJson<Article[]>(ARTICLES_PATH), readJson<Reply[]>(REPLIES_PATH), readJson<Link[]>(MEMBERS_PATH).catch(() => ({ data: [] as Link[], sha: '' }))])
  const known: Known[] = [
    { author: 'Come-from-Beyond', handle: 'c___f___b', auth: 'x' },
    { author: 'Maria', handle: 'maria_aigarth', auth: 'x' },
    ...a.data.map(x => ({ author: x.author, handle: x.handle ?? 'usetesserai', auth: x.auth ?? 'x', identity: x.identity })),
    ...r.data.map(x => ({ author: x.author, handle: x.handle, auth: x.auth, identity: x.identity })),
  ]
  return { articles: a, replies: r, links: m, known }
}

/**
 * Who this post is published as. A linked identity, or one seen before, keeps its member.
 * A moderator can link with `as`. A new identity cannot take the name of an existing member.
 */
export function resolveAuthor(author: Pending['author'], known: Known[], links: Link[], as?: string): { author: string; handle: string } | { error: string } {
  const identity = author.auth === 'qubic' ? author.id : undefined
  const byHandle = (h: string) => known.find(k => k.handle.toLowerCase() === h.toLowerCase())
  if (as) {
    const target = byHandle(as)
    if (!target) return { error: `No member with handle "${as}".` }
    return { author: target.author, handle: target.handle }
  }
  const link = links.find(l => (identity && l.identity === identity) || (l.handle && l.handle === author.handle))
  if (link) {
    const target = byHandle(link.member)
    if (target) return { author: target.author, handle: target.handle }
  }
  const seen = known.find(k => (identity && k.identity === identity) || k.handle === author.handle)
  if (seen) return { author: seen.author, handle: seen.handle }
  const taken = known.find(k => k.author.toLowerCase() === author.name.toLowerCase())
  if (taken) return { error: `The name "${taken.author}" belongs to a member already. Pick another name, or ask a moderator to link your login to that member.` }
  return { author: author.name, handle: author.handle }
}

export function postsToday(author: Pending['author'], known: Known[], articles: Article[], replies: Reply[], date: string): number {
  const identity = author.auth === 'qubic' ? author.id : undefined
  const mine = (x: { identity?: string; handle: string; date: string }) => x.date === date && ((identity && x.identity === identity) || x.handle === author.handle)
  return articles.filter(a => mine({ identity: a.identity, handle: a.handle ?? '', date: a.date })).length + replies.filter(mine).length
}

export async function publish(p: Pending, opts: { as?: string; mariaRepost?: string; note?: string; ref?: string } = {}): Promise<{ slug?: string; topic?: string; author: string; error?: string }> {
  const { articles, replies, links, known } = await loadAll()
  const who = resolveAuthor(p.author, known, links.data, opts.as)
  if ('error' in who) return { error: who.error, author: p.author.name }
  const tag = opts.ref ? ` (${opts.ref})` : ''
  if (p.kind === 'topic') {
    const arts = articles.data
    let slug = slugify(p.title)
    const base = slug
    for (let i = 2; arts.some(a => a.slug === slug); i++) slug = `${base}-${i}`
    const blocks = blocksFromText(p.text, p.title)
    const entry: Article = {
      slug,
      title: p.title,
      kicker: null,
      date: p.date,
      url: p.xUrl ?? `https://qubic.church/articles/${slug}`,
      author: who.author,
      handle: who.handle,
      guest: true,
      auth: p.author.auth,
      identity: p.author.auth === 'qubic' ? p.author.id : undefined,
      summary: summaryOf(blocks),
      words: wordCount(blocks),
      blocks,
    }
    if (opts.mariaRepost) entry.mariaRepost = opts.mariaRepost
    if (opts.note) entry.note = opts.note
    arts.unshift(entry)
    arts.sort((x, y) => y.date.localeCompare(x.date))
    await writeJson(ARTICLES_PATH, arts, articles.sha, `forum: topic "${p.title.slice(0, 60)}" by ${who.author}${tag}`)
    return { slug, author: who.author }
  }
  const reply: Reply = {
    id: `${p.topic}-${Date.now().toString(36)}`,
    topic: p.topic!,
    date: p.date,
    author: who.author,
    handle: who.handle,
    auth: p.author.auth,
    identity: p.author.auth === 'qubic' ? p.author.id : undefined,
    text: p.text,
    xUrl: p.xUrl,
  }
  replies.data.push(reply)
  await writeJson(REPLIES_PATH, replies.data, replies.sha, `forum: reply by ${who.author} in ${p.topic}${tag}`)
  return { topic: p.topic, author: who.author }
}

/** Remove a published topic (with its replies) or one reply. Moderation after the fact. */
export async function remove(target: { slug?: string; reply?: string }): Promise<{ removed: string }> {
  const { articles, replies } = await loadAll()
  if (target.slug) {
    const a = articles.data.find(x => x.slug === target.slug)
    if (!a) throw new Error('No such topic')
    if (!a.guest) throw new Error('Only forum posts can be removed here')
    await writeJson(ARTICLES_PATH, articles.data.filter(x => x.slug !== target.slug), articles.sha, `forum: remove topic "${a.title.slice(0, 60)}"`)
    const left = replies.data.filter(r => r.topic !== target.slug)
    if (left.length !== replies.data.length) {
      const fresh = await readJson<Reply[]>(REPLIES_PATH)
      await writeJson(REPLIES_PATH, left, fresh.sha, `forum: remove replies of "${a.title.slice(0, 40)}"`)
    }
    return { removed: a.title }
  }
  const r = replies.data.find(x => x.id === target.reply)
  if (!r) throw new Error('No such reply')
  await writeJson(REPLIES_PATH, replies.data.filter(x => x.id !== target.reply), replies.sha, `forum: remove reply by ${r.author} in ${r.topic}`)
  return { removed: `reply by ${r.author}` }
}

/** Link a login (identity or tripcode handle) to an existing member. */
export async function link(author: Pending['author'], member: string): Promise<{ member: string }> {
  const { links, known } = await loadAll()
  const target = known.find(k => k.handle.toLowerCase() === member.toLowerCase())
  if (!target) throw new Error(`No member with handle "${member}"`)
  const entry: Link = author.auth === 'qubic' ? { identity: author.id, member: target.handle } : { handle: author.handle, member: target.handle }
  const rest = links.data.filter(l => !(l.identity && l.identity === entry.identity) && !(l.handle && l.handle === entry.handle))
  const sha = links.sha || (await readJson<Link[]>(MEMBERS_PATH).catch(() => ({ sha: '' }))).sha
  await writeJson(MEMBERS_PATH, [...rest, entry], sha, `forum: link a login to ${target.handle}`)
  return { member: target.handle }
}
