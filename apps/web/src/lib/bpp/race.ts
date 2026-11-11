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
const EXPLORER = 'https://annexplorer.jetskipool.ai/api/v1/epochs/'
export const EXPLORER_URL = 'https://annexplorer.jetskipool.ai/epochs/'

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
  top: { id: string; errors: number; computor: boolean; frame: number }[]
  /** networks that passed the mark and advanced frames: their year of hours moved forward, up to cap hours */
  frames: { networks: number; computors: number; best: number; cap: number }
  /** one entry per computor seat, best first: -1 not scored yet, otherwise the frame its network reached */
  seats: number[]
  history: RacePoint[]
  lastEpoch: { epoch: number; best: number } | null
  /** the epoch's rules and archive, from the Jetski ANN Explorer (null when it does not answer) */
  info: { goal: number; neurons: number; connections: number; core: string; solutions: number; verified: number; cap: number } | null
  at: string
}

type Explorer = {
  solutions?: number
  verification?: { verified?: number; totalChecked?: number }
  metadata?: { coreVersion?: string }
  scoringParameters?: { parameters?: { advanceThreshold?: number; populationThreshold?: number; neighbors?: number; shiftCap?: number } }[]
}

async function explorer(epoch: number): Promise<Race['info']> {
  try {
    const r = await fetch(EXPLORER + epoch, { cache: 'no-store', signal: AbortSignal.timeout(6000), headers: { Accept: 'application/json' } })
    if (!r.ok) return null
    const e = (await r.json()) as Explorer
    const p = e.scoringParameters?.[0]?.parameters ?? {}
    const neurons = Number(p.populationThreshold ?? 0)
    const checked = Number(e.verification?.totalChecked ?? 0)
    return {
      goal: Number(p.advanceThreshold ?? GOAL),
      neurons,
      connections: neurons * Number(p.neighbors ?? 0),
      core: String(e.metadata?.coreVersion ?? ''),
      solutions: Number(e.solutions ?? 0),
      verified: checked ? Number(e.verification?.verified ?? 0) / checked : 0,
      cap: Number(p.shiftCap ?? 168),
    }
  } catch {
    return null
  }
}

type Feed = {
  epoch?: { number?: number; start?: string; end?: string }
  network?: { minScore?: number; avgScore?: number; maxScore?: number; scoredIds?: number; totalIds?: number; computors?: number }
  tracker?: { allIds?: { identity?: string; error?: number; score?: number; shift?: number; isComputor?: boolean; ratingComplete?: boolean }[] }
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
  const infoP = explorer(epoch)
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

  // the core's ranking: further frame first, then fewer errors
  const all = (f.tracker?.allIds ?? [])
    .map(x => ({ id: String(x.identity ?? ''), errors: Number(x.error ?? x.score), computor: Boolean(x.isComputor), frame: Number(x.shift ?? 0) || 0 }))
    .filter(x => x.id && Number.isFinite(x.errors) && x.errors > 0)
    .sort((a, b) => b.frame - a.frame || a.errors - b.errors)
  const top = all.slice(0, 5)
  const framed = all.filter(x => x.frame > 0)
  const info = await infoP
  const frames = { networks: framed.length, computors: framed.filter(x => x.computor).length, best: framed[0]?.frame ?? 0, cap: info?.cap ?? 168 }
  const seatCount = Number(f.network?.computors ?? 676) || 676
  const scoredComps = all.filter(x => x.computor).map(x => x.frame)
  const seats = [...scoredComps, ...Array(Math.max(0, seatCount - scoredComps.length)).fill(-1)].slice(0, seatCount)

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
    frames,
    seats,
    history,
    lastEpoch,
    info,
    at,
  }
}
