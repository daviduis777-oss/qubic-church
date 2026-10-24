/**
 * Archive ranks, library style. Every article has a weight, an author's weight adds
 * up, and the ladder doubles at each step so the top is far away: one pamphlet,
 * then a folio, a shelf, a bookcase, a section, a reading room, a floor, a wing.
 *
 * Rank 10, the Beyond wing, is not reachable by weight. It belongs to the origin.
 */
export type Rank = { level: number; name: string; min: number }

export const RANKS: Rank[] = [
  { level: 1, name: 'Pamphlet', min: 1 },
  { level: 2, name: 'Folio', min: 3 },
  { level: 3, name: 'Shelf', min: 10 },
  { level: 4, name: 'Bookcase', min: 25 },
  { level: 5, name: 'Section', min: 60 },
  { level: 6, name: 'Reading room', min: 150 },
  { level: 7, name: 'Floor', min: 400 },
  { level: 8, name: 'Wing', min: 1000 },
  { level: 9, name: 'Library', min: 2500 },
  { level: 10, name: 'Beyond wing', min: Number.POSITIVE_INFINITY },
]

export const BEYOND = RANKS[9]!

/** Article weight: what one piece adds to its author. */
export const WEIGHT = {
  /** an issue written for the archive */
  issue: 1,
  /** a primary source: the author built the thing the archive is about */
  primary: 3,
  /** Maria reposted it: weight given by someone else, not the author */
  maria: 1,
} as const

export type AuthorProfile = {
  name: string
  handle: string
  /** fixed rank, used only for the origin */
  fixedLevel?: number
  /** short line shown under the rank */
  title?: string
}

export const AUTHORS: Record<string, AuthorProfile> = {
  'Come-from-Beyond': { name: 'Come-from-Beyond', handle: 'c___f___b', fixedLevel: 10, title: 'The origin. Every article on this shelf is a primary source.' },
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

/** "Rank 3 · Shelf": the number is always written. */
export const rankLabel = (r: Rank) => `Rank ${r.level} · ${r.name}`
