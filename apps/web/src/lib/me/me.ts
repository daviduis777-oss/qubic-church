import 'server-only'
import { getForum } from '@/lib/forum/live'
import type { ForumUser } from '@/lib/forum/auth'
import { allParticipants, getParticipant, type Participant } from '@/lib/bpp/store'
import { statsOf } from '@/lib/bpp/stats'
import { getNFTById } from '@/config/nfts'
import { loadAll, resolveAuthor } from '@/lib/forum/publish'
import { earned, powerOf, type MedalId } from './medals'

/*
 * The cabinet's data: one person across the ecosystem, read on the server.
 * Useful solutions come from the pool (CODED partner stats) once it reports per worker; until then they are a preview.
 */

export type Anna = { id: number; rank: number; image: string; rarity: string }
export type Person = {
  handle: string
  name: string
  auth: 'qubic' | 'trip' | 'x'
  id?: string
  avatar?: string
  x?: string
  bio?: string
  since: string | null
  medals: MedalId[]
  solutions: { total: number; epoch: number; preview: boolean; byEpoch: { epoch: number; n: number }[] }
  power: ReturnType<typeof powerOf>
  crypt: { articles: number; replies: number; rank?: string }
  bpp: { joined: string; trades: number; winRate: number | null } | null
  annas: Anna[]
}

const SOLUTIONS_LIVE = false

/** A stable made-up count for the preview, so the page can be judged before the pool reports. */
function previewSolutions(handle: string) {
  let h = 2166136261
  for (const c of handle.toLowerCase()) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  const base = (h >>> 0) % 260
  const byEpoch = [236, 237, 238, 239].map((epoch, i) => ({ epoch, n: Math.round((base / 4) * (0.6 + 0.25 * i)) }))
  return { total: byEpoch.reduce((a, b) => a + b.n, 0), epoch: byEpoch[byEpoch.length - 1]!.n, preview: true, byEpoch }
}

async function annasOf(id?: string): Promise<Anna[]> {
  if (!id || id.length !== 60) return []
  try {
    const r = await fetch(`https://api.qubicbay.io/owner/${id}/nfts`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) })
    if (!r.ok) return []
    const j = (await r.json()) as { nfts?: { nftId: number }[] }
    return (j.nfts ?? [])
      .map(n => getNFTById(n.nftId))
      .filter(Boolean)
      .map(n => ({ id: n!.id, rank: n!.rank, image: n!.image, rarity: n!.rarity }))
  } catch {
    return []
  }
}

type Login = Pick<ForumUser, 'handle' | 'name' | 'id'> & { auth: Person['auth'] }

/**
 * A login's member in the forum. A wallet or tripcode login linked to a member (TesserAI's wallet is @usetesserai)
 * keeps its own handle in the session, while its posts, profile and picture live under the member's handle.
 */
export async function forumHandles(): Promise<(u: Login) => string> {
  try {
    const { known, links } = await loadAll()
    return u => {
      if (u.auth === 'x') return u.handle
      const w = resolveAuthor({ auth: u.auth, id: u.id ?? '', name: u.name, handle: u.handle }, known, links.data)
      return 'error' in w ? u.handle : w.handle
    }
  } catch {
    return u => u.handle
  }
}

export async function personOf(user: Login, p?: Participant | null, forumHandle?: string): Promise<Person> {
  const forum = await getForum()
  const fh = forumHandle ?? user.handle
  const m = forum.memberByHandle(fh)
  const profile = forum.profileOf(fh)
  const articles = m ? forum.postsOf(m).length : 0
  const replies = m?.replies ?? 0
  const part = p === undefined ? await getParticipant(user.handle).catch(() => null) : p
  const stats = part ? statsOf(part.trades, part.start, part.joined) : null
  const annas = user.auth === 'qubic' ? await annasOf(user.id) : []
  const solutions = SOLUTIONS_LIVE ? { total: 0, epoch: 0, preview: false, byEpoch: [] } : previewSolutions(user.handle)
  const since = [part?.joined, m?.since].filter(Boolean).sort()[0] ?? null
  const medals = earned({ bppJoined: since ?? undefined, articles, replies, annas: annas.length, solutions: SOLUTIONS_LIVE ? solutions.total : 0 })
  return {
    handle: m?.handle ?? fh,
    name: m?.name ?? user.name,
    auth: user.auth,
    id: user.auth === 'qubic' ? user.id : undefined,
    avatar: profile.avatar ?? m?.avatar,
    x: profile.x ?? m?.x,
    bio: forum.bioOf({ name: m?.name ?? user.name, handle: m?.handle ?? fh }),
    since,
    medals,
    solutions,
    power: powerOf({ solutions: solutions.total, medals: medals.length, articles, replies, trades: stats?.trades ?? 0 }),
    crypt: { articles, replies, rank: m?.rank?.name },
    bpp: part ? { joined: part.joined, trades: stats?.trades ?? 0, winRate: stats && stats.trades ? stats.wins / stats.trades : null } : null,
    annas,
  }
}

/** Everyone with a key: BPP-9000 participants, plus forum members who signed in with a wallet or a tripcode. */
export async function people(): Promise<Person[]> {
  const forum = await getForum()
  const parts = await allParticipants().catch(() => [] as Participant[])
  const fhOf = await forumHandles()
  const seen = new Set<string>()
  const out: Person[] = []
  for (const p of parts) {
    const login = { handle: p.handle, name: p.name, auth: p.auth, id: p.id }
    const fh = fhOf(login)
    if (seen.has(fh.toLowerCase())) continue
    seen.add(fh.toLowerCase())
    seen.add(p.handle.toLowerCase())
    out.push(await personOf(login, p, fh))
  }
  for (const m of forum.members) {
    if (m.auth === 'x' || seen.has(m.handle.toLowerCase())) continue
    out.push(await personOf({ handle: m.handle, name: m.name, auth: m.auth, id: m.identity ?? '' }, null))
  }
  return out.sort((a, b) => b.power.total - a.power.total || (a.since ?? '').localeCompare(b.since ?? ''))
}

/** What one person may see of the others. No names, no handles, no keys. */
export type Circle = {
  count: number
  /** solutions are still the preview, not the pool */
  preview: boolean
  /** people who found a useful solution this epoch */
  active: number
  /** one entry per person, a level index each, in a stable shuffled order; `me` is the viewer's place in it */
  stars: number[]
  me: number
  /** share of people with less power than the viewer, 0..1 */
  brighter: number
  /** the next person up: how far ahead and at what level */
  above: { gap: number; level: string } | null
  below: { gap: number; level: string } | null
}

export function circleOf(all: Person[], handle: string): Circle {
  const sorted = all.slice().sort((a, b) => b.power.total - a.power.total)
  const i = sorted.findIndex(p => p.handle.toLowerCase() === handle.toLowerCase())
  const mine = i >= 0 ? sorted[i]!.power.total : 0
  const hash = (s: string) => {
    let h = 2166136261
    for (const c of s.toLowerCase()) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
    return h >>> 0
  }
  const order = all.slice().sort((a, b) => hash(a.handle) - hash(b.handle))
  const up = i > 0 ? sorted.slice(0, i).reverse().find(p => p.power.total > mine) : undefined
  const down = i >= 0 ? sorted.slice(i + 1).find(p => p.power.total < mine) : undefined
  return {
    count: all.length,
    preview: all.some(p => p.solutions.preview),
    active: all.filter(p => p.solutions.epoch > 0).length,
    stars: order.map(p => p.power.level.index),
    me: order.findIndex(p => p.handle.toLowerCase() === handle.toLowerCase()),
    brighter: all.length > 1 ? all.filter(p => p.power.total < mine).length / (all.length - 1) : 0,
    above: up ? { gap: up.power.total - mine, level: up.power.level.name } : null,
    below: down ? { gap: mine - down.power.total, level: down.power.level.name } : null,
  }
}
