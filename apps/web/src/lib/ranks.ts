/**
 * Archive ranks, forum style (BitcoinTalk: Newbie, Jr. Member ... Legendary, and
 * Satoshi shown as Founder). Activity is what you write, merit is what others give
 * you (Maria's repost), weight is the sum and sets the rank. The ladder roughly
 * doubles at each step, so the top is far away.
 *
 * Rank 10, Founder, is not reachable by weight. It belongs to the origin.
 */
export type Rank = { level: number; name: string; min: number }

export const RANKS: Rank[] = [
  { level: 1, name: 'Newbie', min: 1 },
  { level: 2, name: 'Jr. Member', min: 3 },
  { level: 3, name: 'Member', min: 10 },
  { level: 4, name: 'Full Member', min: 25 },
  { level: 5, name: 'Sr. Member', min: 60 },
  { level: 6, name: 'Hero Member', min: 150 },
  { level: 7, name: 'Legendary', min: 400 },
  { level: 8, name: 'Elder', min: 1000 },
  { level: 9, name: 'Ancient', min: 2500 },
  { level: 10, name: 'Founder', min: Number.POSITIVE_INFINITY },
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
  /** profile picture (X), for members who came from X */
  avatar?: string
}

export const AUTHORS: Record<string, AuthorProfile> = {
  'Come-from-Beyond': { name: 'Come-from-Beyond', handle: 'c___f___b', fixedLevel: 10, title: 'The origin. Every article here is a primary source.', avatar: 'https://pbs.twimg.com/profile_images/956595678813270017/fYVjtfeG_200x200.jpg' },
  TesserAI: {
    name: 'TesserAI',
    handle: 'usetesserai',
    avatar: 'https://pbs.twimg.com/profile_images/2062568705666756608/f0LRumC9_200x200.jpg',
    title: 'Verifiable AI marketplace on Qubic: smart contract audits and AI agents, every result cryptographically receipted and challengeable. Writes the running story of Aigarth.',
  },
  Maria: { name: 'Maria', handle: 'maria_aigarth', title: 'The curator. Every repost gives the author +1 merit and Maria +1 weight.', avatar: 'https://pbs.twimg.com/profile_images/2029520793554898944/GXEaD1CT_200x200.jpg' },
  fallin: { name: 'fallin', handle: 'inqubic', avatar: 'https://pbs.twimg.com/profile_images/2056376206271094784/DoOoaQbf_200x200.jpg' },
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
  const cur = rankFor(xp).level
  const r = RANKS.find(r => Number.isFinite(r.min) && r.level > cur)
  return r ? { rank: r, missing: r.min - xp } : null
}

/** "Rank 3 · Member": the number is always written. */
export const rankLabel = (r: Rank) => `Rank ${r.level} · ${r.name}`
