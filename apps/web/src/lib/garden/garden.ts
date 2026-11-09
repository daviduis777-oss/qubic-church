import 'server-only'
import { EXPLORER, type ExplorerReconstruction, type ExplorerSolution } from '@/lib/bpp/brains-view'
import { kvGetJson, kvSetJson } from '@/lib/bpp/store'
import { epochStart } from '@/lib/pool/epoch'
import { type Birth, type EpochGarden, type Gardener, type Gen, type Lineage, type Plot, isIdentity, perMinute } from './garden-view'

/**
 * The Garden, server side: everything comes from the Jetski ANN Explorer's public API and is cached in KV.
 * A brain never changes once verified, so a generation is cached for good; the epoch summary for a few minutes.
 */
const API = `${EXPLORER}/api/v1`
/** how many of the newest brains the ticker and the rate look at */
const NEWEST = 60
/** identities looked up per summary (one explorer call each) */
const GARDENERS = 24
/** generations walked per lineage call; a hop is two explorer calls */
export const HOPS = 24

async function get<T>(path: string, revalidate = 0): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    ...(revalidate ? { next: { revalidate } } : { cache: 'no-store' }),
    signal: AbortSignal.timeout(12000),
    headers: { accept: 'application/json' },
  })
  if (!r.ok) throw new Error(`explorer ${r.status} ${path}`)
  return (await r.json()) as T
}

const ms = (t: unknown): number | null => {
  const n = typeof t === 'string' || typeof t === 'number' ? Number(t) : NaN
  return Number.isFinite(n) && n > 0 ? n : null
}

type EpochItem = { epoch: number; algoFamily: string; solutions: number }

async function currentEpoch(): Promise<EpochItem> {
  const ep = await get<{ items: EpochItem[] }>('/epochs', 300)
  const cur = ep.items.filter(e => e.algoFamily === 'bpp9000').sort((a, b) => b.epoch - a.epoch)[0]
  if (!cur) throw new Error('no epoch')
  return cur
}

/* ---------------- generations ---------------- */

const GEN_KEY = (hash: string) => `garden:gen:${hash}`

/** One brain with its parent, from the explorer or the cache. */
export async function generation(hash: string): Promise<Gen> {
  const kept = await kvGetJson<Gen>(GEN_KEY(hash))
  if (kept) return kept
  const [s, r] = await Promise.all([get<ExplorerSolution>(`/solutions/${hash}`), get<ExplorerReconstruction>(`/solutions/${hash}/reconstruction`)])
  const col = r.antColony as (ExplorerReconstruction['antColony'] & { parentIsRoot?: boolean }) | undefined
  const g: Gen = {
    hash,
    depth: col?.depth ?? 1,
    score: typeof r.score === 'number' ? r.score : (s.verification?.score ?? 0),
    ts: ms(s.timestamp),
    tick: s.tickNumber ?? null,
    gardener: s.computorId,
    parent: col?.parentIsRoot ? null : (col?.parent?.solutionHash ?? null),
  }
  await kvSetJson(GEN_KEY(hash), g)
  return g
}

const LIN_KEY = (hash: string) => `garden:lineage:${hash}`

/**
 * The lineage of a brain, walked `hops` generations further per call: a full walk is one hop per generation and
 * a deep brain has well over a hundred, so the page asks again until `done`. A finished lineage is kept for good.
 */
export async function lineage(top: string, hops = HOPS): Promise<Lineage> {
  const kept = await kvGetJson<Lineage>(LIN_KEY(top))
  if (kept?.done) return kept
  const gens: Gen[] = kept?.gens ?? []
  let next: string | null = gens.length ? gens[gens.length - 1]!.parent : top
  let walked = 0
  while (next && walked < hops) {
    const g = await generation(next)
    gens.push(g)
    next = g.parent && g.depth > 1 ? g.parent : null
    walked++
  }
  const out: Lineage = { top, gens, done: !next }
  await kvSetJson(LIN_KEY(top), out, out.done ? undefined : 3600)
  return out
}

/* ---------------- the epoch ---------------- */

const EPOCH_KEY = (e: number) => `garden:epoch:${e}`
const EPOCH_TTL = 300

type Computor = {
  id?: string
  solutions?: number
  epochParticipation?: { epoch: number; solutions: number; firstTimestamp?: string | number; lastTimestamp?: string | number }[]
}

const computor = (id: string) => get<Computor>(`/computors/${id}`, 600).catch(() => null)

export async function epochGarden(): Promise<EpochGarden> {
  const cur = await currentEpoch()
  const kept = await kvGetJson<EpochGarden>(EPOCH_KEY(cur.epoch))
  if (kept && Date.now() - new Date(kept.fetchedAt).getTime() < EPOCH_TTL * 1000) return { ...kept, grown: cur.solutions }

  const [newest, top] = await Promise.all([
    get<{ items: ExplorerSolution[] }>(`/solutions?algorithm=BPP9000&epoch=${cur.epoch}&status=verified&limit=${NEWEST}`),
    get<{ items: ExplorerSolution[] }>(`/solutions?algorithm=BPP9000&epoch=${cur.epoch}&status=verified&sort=score&order=asc&limit=100`),
  ])
  const verified = (xs: ExplorerSolution[]) => xs.filter(s => typeof s.verification?.score === 'number')
  const fresh = verified(newest.items)
  const ranked = verified(top.items)

  // the newest dozen with their generation, each a cached lookup after the first time
  const births: Birth[] = await Promise.all(
    fresh.slice(0, 12).map(async s => {
      const g = await generation(s.hash).catch(() => null)
      return { hash: s.hash, gardener: s.computorId, score: s.verification!.score!, ts: ms(s.timestamp), tick: s.tickNumber ?? null, depth: g?.depth ?? null }
    }),
  )

  // gardeners: the identities behind the 100 best brains, with their own count of brains this epoch
  const bestOf = new Map<string, ExplorerSolution>()
  for (const s of ranked) if (!bestOf.has(s.computorId)) bestOf.set(s.computorId, s)
  const ids = [...bestOf.keys()].slice(0, GARDENERS)
  const records = await Promise.all(ids.map(computor))
  const gardeners: Gardener[] = ids
    .map((id, i) => {
      const part = records[i]?.epochParticipation?.find(p => p.epoch === cur.epoch)
      const b = bestOf.get(id)!
      return {
        id,
        grown: part?.solutions ?? 0,
        best: b.verification!.score!,
        bestHash: b.hash,
        firstAt: ms(part?.firstTimestamp),
        lastAt: ms(part?.lastTimestamp),
      }
    })
    .sort((a, b) => b.grown - a.grown || a.best! - b.best!)

  const b0 = ranked[0]
  const out: EpochGarden = {
    epoch: cur.epoch,
    start: epochStart(cur.epoch).getTime(),
    end: epochStart(cur.epoch + 1).getTime(),
    grown: cur.solutions,
    perMinute: perMinute(fresh.map(s => ms(s.timestamp))),
    births,
    best: b0 ? { hash: b0.hash, gardener: b0.computorId, score: b0.verification!.score!, ts: ms(b0.timestamp) } : null,
    gardeners,
    rankedFrom: bestOf.size,
    fetchedAt: new Date().toISOString(),
  }
  await kvSetJson(EPOCH_KEY(cur.epoch), out, 86_400)
  return out
}

/* ---------------- one gardener's plot ---------------- */

export async function plot(id: string): Promise<Plot | null> {
  if (!isIdentity(id)) return null
  const [cur, rec] = await Promise.all([currentEpoch(), computor(id)])
  if (!rec) return null
  const epochs = (rec.epochParticipation ?? [])
    .map(p => ({ epoch: p.epoch, grown: p.solutions, firstAt: ms(p.firstTimestamp), lastAt: ms(p.lastTimestamp) }))
    .sort((a, b) => a.epoch - b.epoch)
  const top = await get<{ items: ExplorerSolution[] }>(`/solutions?algorithm=BPP9000&epoch=${cur.epoch}&status=verified&sort=score&order=asc&limit=100`, 300).catch(() => null)
  const i = top?.items.findIndex(s => s.computorId === id) ?? -1
  const s = i >= 0 ? top!.items[i]! : null
  return {
    id,
    grown: rec.solutions ?? epochs.reduce((a, p) => a + p.grown, 0),
    epochs,
    best: s ? { hash: s.hash, score: s.verification!.score!, rank: i + 1 } : null,
    epoch: cur.epoch,
  }
}
