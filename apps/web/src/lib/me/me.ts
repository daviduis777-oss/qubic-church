import 'server-only'
import { getForum } from '@/lib/forum/live'
import type { ForumUser } from '@/lib/forum/auth'
import { allParticipants, getParticipant, type Participant } from '@/lib/bpp/store'
import { statsOf } from '@/lib/bpp/stats'
import { getNFTById } from '@/config/nfts'
import { earned, stageOf, type MedalId } from './medals'

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
  stage: ReturnType<typeof stageOf>
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

export async function personOf(user: Pick<ForumUser, 'handle' | 'name' | 'id'> & { auth: Person['auth'] }, p?: Participant | null): Promise<Person> {
  const forum = await getForum()
  const m = forum.memberByHandle(user.handle)
  const profile = forum.profileOf(user.handle)
  const articles = m ? forum.postsOf(m).length : 0
  const replies = m?.replies ?? 0
  const part = p === undefined ? await getParticipant(user.handle).catch(() => null) : p
  const stats = part ? statsOf(part.trades, part.start, part.joined) : null
  const annas = user.auth === 'qubic' ? await annasOf(user.id) : []
  const solutions = SOLUTIONS_LIVE ? { total: 0, epoch: 0, preview: false, byEpoch: [] } : previewSolutions(user.handle)
  const since = [part?.joined, m?.since].filter(Boolean).sort()[0] ?? null
  return {
    handle: user.handle,
    name: m?.name ?? user.name,
    auth: user.auth,
    id: user.auth === 'qubic' ? user.id : undefined,
    avatar: profile.avatar ?? m?.avatar,
    x: profile.x ?? m?.x,
    bio: forum.bioOf({ name: m?.name ?? user.name, handle: user.handle }),
    since,
    medals: earned({ bppJoined: since ?? undefined, articles, replies, annas: annas.length, solutions: SOLUTIONS_LIVE ? solutions.total : 0 }),
    solutions,
    stage: stageOf(solutions.total),
    crypt: { articles, replies, rank: m?.rank?.name },
    bpp: part ? { joined: part.joined, trades: stats?.trades ?? 0, winRate: stats && stats.trades ? stats.wins / stats.trades : null } : null,
    annas,
  }
}

/** Everyone with a key: BPP-9000 participants, plus forum members who signed in with a wallet or a tripcode. */
export async function people(): Promise<Person[]> {
  const forum = await getForum()
  const parts = await allParticipants().catch(() => [] as Participant[])
  const seen = new Set<string>()
  const out: Person[] = []
  for (const p of parts) {
    seen.add(p.handle.toLowerCase())
    out.push(await personOf({ handle: p.handle, name: p.name, auth: p.auth, id: p.id }, p))
  }
  for (const m of forum.members) {
    if (m.auth === 'x' || seen.has(m.handle.toLowerCase())) continue
    out.push(await personOf({ handle: m.handle, name: m.name, auth: m.auth, id: m.identity ?? '' }, null))
  }
  return out.sort((a, b) => b.solutions.total - a.solutions.total || b.medals.length - a.medals.length || (a.since ?? '').localeCompare(b.since ?? ''))
}
