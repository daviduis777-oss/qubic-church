import 'server-only'
import { kvGetJson, kvSetJson } from './store'

/*
 * The race to 55%: each epoch's best BPP-9000 score (errors over 8760 hourly windows) against the qualification
 * mark Come-from-Beyond set, 0.45 x 8760 = 3942 errors. Read from the public Jetski Pool tracker feed, at most once
 * a minute (the route is cached at the CDN). Each improvement of the best score is kept, so the page can draw how
 * the record fell through the epoch.
 */

export const WINDOWS = 8760
export const GOAL = Math.round(0.45 * WINDOWS) // 3942 errors = 55% right
export const COIN = WINDOWS / 2 // 4380 errors = a coin flip
export const SOURCE_URL = 'https://qubic.jetskipool.ai/tracker'
const FEED = 'https://qubic.jetskipool.ai/api/qubic_data.json'

export type RacePoint = { t: string; best: number }
export type Race = {
  epoch: number
  start: string
  end: string
  best: number
  avg: number
  worst: number
  scored: number
  ids: number
  computors: number
  top: { id: string; errors: number; computor: boolean }[]
  history: RacePoint[]
  lastEpoch: { epoch: number; best: number } | null
  at: string
}

type Feed = {
  epoch?: { number?: number; start?: string; end?: string }
  network?: { minScore?: number; avgScore?: number; maxScore?: number; scoredIds?: number; totalIds?: number; computors?: number }
  tracker?: { allIds?: { identity?: string; error?: number; score?: number; isComputor?: boolean; ratingComplete?: boolean }[] }
  timestamp?: string
}

const iso = (s?: string) => (s ? new Date(s.replace(' UTC', 'Z').replace(' ', 'T')).toISOString() : '')
const histKey = (e: number) => `bpp:race:e${e}`

export async function race(): Promise<Race | null> {
  const r = await fetch(FEED, { cache: 'no-store', signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json' } })
  if (!r.ok) return null
  const f = (await r.json()) as Feed
  const epoch = Number(f.epoch?.number)
  const best = Number(f.network?.minScore)
  if (!epoch || !Number.isFinite(best) || best <= 0) return null

  const at = f.timestamp ?? new Date().toISOString()
  let history: RacePoint[] = []
  let lastEpoch: Race['lastEpoch'] = null
  try {
    history = (await kvGetJson<RacePoint[]>(histKey(epoch))) ?? []
    const prev = await kvGetJson<RacePoint[]>(histKey(epoch - 1))
    if (prev?.length) lastEpoch = { epoch: epoch - 1, best: Math.min(...prev.map(p => p.best)) }
    const last = history[history.length - 1]
    if (!last || best < last.best) {
      history = [...history, { t: at, best }].slice(-400)
      await kvSetJson(histKey(epoch), history, 60 * 60 * 24 * 60)
    }
  } catch {
    if (!history.length) history = [{ t: at, best }]
  }

  const top = (f.tracker?.allIds ?? [])
    .map(x => ({ id: String(x.identity ?? ''), errors: Number(x.error ?? x.score), computor: Boolean(x.isComputor) }))
    .filter(x => x.id && Number.isFinite(x.errors) && x.errors > 0)
    .sort((a, b) => a.errors - b.errors)
    .slice(0, 5)

  return {
    epoch,
    start: iso(f.epoch?.start),
    end: iso(f.epoch?.end),
    best,
    avg: Number(f.network?.avgScore ?? 0),
    worst: Number(f.network?.maxScore ?? 0),
    scored: Number(f.network?.scoredIds ?? 0),
    ids: Number(f.network?.totalIds ?? 0),
    computors: Number(f.network?.computors ?? 676),
    top,
    history,
    lastEpoch,
    at,
  }
}
