/**
 * The Garden, pure side: the shapes the page reads and the arithmetic on them. Browser safe.
 *
 * Aigarth is "AI" + "garth", a yard or a garden (Come-from-Beyond's own gloss). Every BPP-9000 solution is a
 * brain grown by a miner's machine from a parent brain; the explorer keeps the parent of each one, so a brain
 * has a lineage: the generations that led to it. The garden shows the epoch as what it is, a season of growth.
 */

/** Hours the homework covers; a score is the count of hours the brain got wrong. */
export const FRAME = 8760

export const homework = (score: number) => (1 - score / FRAME) * 100

/** One brain, as the garden keeps it: enough to draw it and to find its parent. */
export type Gen = {
  hash: string
  depth: number
  score: number
  /** ms since epoch; null when the explorer gave none */
  ts: number | null
  tick: number | null
  gardener: string
  parent: string | null
}

export type Lineage = {
  top: string
  /** from the top brain down to the root (depth 1); complete when `done` */
  gens: Gen[]
  done: boolean
  /** the explorer rate-limited this walk; ask again after a pause */
  limited?: boolean
}

/** One freshly grown brain in the births ticker. */
export type Birth = {
  hash: string
  gardener: string
  score: number
  ts: number | null
  tick: number | null
  depth: number | null
}

export type Gardener = {
  id: string
  /** verified brains this epoch, from the explorer's per-identity record */
  grown: number
  /** best homework % among the epoch's 100 best brains, when one is theirs */
  best: number | null
  bestHash: string | null
  firstAt: number | null
  lastAt: number | null
}

export type EpochGarden = {
  epoch: number
  start: number
  end: number
  /** verified brains this epoch, from /epochs */
  grown: number
  /** brains per minute over the newest ones we saw; null when too few */
  perMinute: number | null
  births: Birth[]
  /** the epoch's best brain by the core's rating */
  best: { hash: string; gardener: string; score: number; ts: number | null } | null
  gardeners: Gardener[]
  /** identities the ranking looked at: those who grew one of the 100 best brains */
  rankedFrom: number
  fetchedAt: string
}

export type PlotEpoch = { epoch: number; grown: number; firstAt: number | null; lastAt: number | null }

export type Plot = {
  id: string
  /** all-time verified brains */
  grown: number
  epochs: PlotEpoch[]
  /** this identity's best brain among the current epoch's 100 best, if any */
  best: { hash: string; score: number; rank: number } | null
  epoch: number
}

export const isIdentity = (s: string) => /^[A-Z]{60}$/.test(s)

/** Brains per minute from newest-first timestamps; null under 5 brains or an empty span. */
export function perMinute(ts: (number | null)[]): number | null {
  const t = ts.filter((x): x is number => typeof x === 'number' && x > 0)
  if (t.length < 5) return null
  const span = Math.max(...t) - Math.min(...t)
  if (span <= 0) return null
  return ((t.length - 1) * 60_000) / span
}

/** Generations grouped into sittings: a gap over `gapMs` between consecutive births starts a new one. */
export function sittings(gens: Gen[], gapMs = 20 * 60_000): { from: number; to: number; gens: number }[] {
  const asc = [...gens].filter(g => g.ts != null).sort((a, b) => a.depth - b.depth)
  const out: { from: number; to: number; gens: number }[] = []
  for (const g of asc) {
    const t = g.ts as number
    const last = out[out.length - 1]
    if (last && t - last.to <= gapMs) {
      last.to = t
      last.gens++
    } else out.push({ from: t, to: t, gens: 1 })
  }
  return out
}
