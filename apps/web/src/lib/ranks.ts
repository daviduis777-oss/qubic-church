/**
 * Archive ranks. Modelled on forum rank ladders (BitcoinTalk: Newbie → Legendary by
 * activity and merit): every article carries a weight, an author's weight adds up,
 * and the ladder doubles at each step so the top is far away.
 *
 * Level 10, Beyond, is not reachable by weight. It belongs to the origin.
 */
export type Rank = { level: number; name: string; min: number }

export const RANKS: Rank[] = [
  { level: 1, name: 'Seed', min: 1 },
  { level: 2, name: 'Sprout', min: 3 },
  { level: 3, name: 'Tissue', min: 10 },
  { level: 4, name: 'Neuron', min: 25 },
  { level: 5, name: 'Synapse', min: 60 },
  { level: 6, name: 'Loop', min: 150 },
  { level: 7, name: 'Colony', min: 400 },
  { level: 8, name: 'Quorum', min: 1000 },
  { level: 9, name: 'Legendary', min: 2500 },
  { level: 10, name: 'Beyond', min: Number.POSITIVE_INFINITY },
]

export const BEYOND = RANKS[9]!

/** Article weight: what one piece adds to its author. */
export const WEIGHT = {
  /** an issue written for the archive */
  issue: 1,
  /** a primary source: the author built the thing the archive is about */
  primary: 3,
} as const

export type AuthorProfile = {
  name: string
  handle: string
  /** fixed level, used only for the origin */
  fixedLevel?: number
  /** short line shown under the level */
  title?: string
}

export const AUTHORS: Record<string, AuthorProfile> = {
  'Come-from-Beyond': { name: 'Come-from-Beyond', handle: 'c___f___b', fixedLevel: 10, title: 'The origin. Every article here is a primary source.' },
  TesserAI: { name: 'TesserAI', handle: 'usetesserai', title: 'Writes the running story of Aigarth.' },
}

export function rankFor(xp: number, fixedLevel?: number): Rank {
  if (fixedLevel) return RANKS.find(r => r.level === fixedLevel) ?? BEYOND
  let out = RANKS[0]!
  for (const r of RANKS) if (Number.isFinite(r.min) && xp >= r.min) out = r
  return out
}

/** Next rank and how much weight is still missing; null at the top. */
export function nextRank(xp: number, fixedLevel?: number): { rank: Rank; missing: number } | null {
  if (fixedLevel) return null
  const r = RANKS.find(r => Number.isFinite(r.min) && r.min > xp)
  return r ? { rank: r, missing: r.min - xp } : null
}

/** 0..1 progress inside the current rank band. */
export function rankProgress(xp: number, fixedLevel?: number): number {
  if (fixedLevel) return 1
  const cur = rankFor(xp)
  const nxt = nextRank(xp)
  if (!nxt) return 1
  return Math.max(0, Math.min(1, (xp - cur.min) / (nxt.rank.min - cur.min)))
}
