/*
 * Medals: marks for things a person did in the Qubic Church ecosystem. Never bought, never sold, never paid out.
 * Each one is earned by an act that is on the record (a registration, a post, a solution, a held Anna).
 */

export type MedalId = 'first-marathon' | 'crypt-author' | 'crypt-voice' | 'anna-founder' | 'first-solution' | 'first-live-hour' | 'second-marathon' | 'full-week'

export type Medal = {
  id: MedalId
  name: string
  /** what it is for, one line */
  for: string
  /** glyph drawn in the middle of the medal */
  glyph: 'flame' | 'quill' | 'speech' | 'crown' | 'spark' | 'clock' | 'flag' | 'week'
  /** not earnable yet: the event has not happened */
  opens?: string
}

export const MEDALS: Medal[] = [
  { id: 'first-marathon', name: 'First Mining Marathon', for: 'Joined QC in the days of the first marathon, from epoch 233.', glyph: 'flame' },
  { id: 'anna-founder', name: 'Founder', for: 'Holds an Anna from the Anna Aigarth collection.', glyph: 'crown' },
  { id: 'crypt-author', name: 'Author of the Crypt', for: 'Published an article in The Crypt.', glyph: 'quill' },
  { id: 'crypt-voice', name: 'Voice of the Crypt', for: 'Answered in The Crypt.', glyph: 'speech' },
  { id: 'first-solution', name: 'First useful solution', for: 'Found a solution the network accepted, mining in the QC pool.', glyph: 'spark', opens: 'with the pool' },
  { id: 'first-live-hour', name: 'The first live hour', for: 'Was in when BPP-9000 made its first live call.', glyph: 'clock', opens: '18 November' },
  { id: 'second-marathon', name: 'Second Mining Marathon', for: 'Mined through the second marathon.', glyph: 'flag', opens: '25 November' },
  { id: 'full-week', name: 'The full week', for: 'Mined in the epoch the first networks held 55% for all 168 frames.', glyph: 'week', opens: 'with the pool' },
]

/** Everyone registered by this moment counts for the first marathon (Bob, 12 Nov 2026). */
export const FIRST_MARATHON_CUTOFF = '2026-11-12T23:59:59Z'

export type MedalFacts = { bppJoined?: string; articles: number; replies: number; annas: number; solutions: number }

export function earned(f: MedalFacts): MedalId[] {
  const out: MedalId[] = []
  if (f.bppJoined && f.bppJoined <= FIRST_MARATHON_CUTOFF) out.push('first-marathon')
  if (f.annas > 0) out.push('anna-founder')
  if (f.articles > 0) out.push('crypt-author')
  if (f.replies > 0) out.push('crypt-voice')
  if (f.solutions > 0) out.push('first-solution')
  return out
}

/*
 * Power: one number for what a person brought to QC, like reputation on a forum.
 * Useful solutions found in the QC pool carry it; the rest is a small push for being here.
 * The levels are long on purpose: the pool is meant to run for years.
 */
export const POWER = { solution: 10, medal: 100, article: 50, reply: 5, trade: 1, tradeCap: 200 } as const

export const LEVELS = [
  { name: 'Spark', at: 0, gives: 'Your star in the QC sky and this cabinet.' },
  { name: 'Ember', at: 250, gives: 'Your level shows next to your name in the Crypt.' },
  { name: 'Flame', at: 1_000, gives: 'A flame ring around your picture, everywhere on the site.' },
  { name: 'Blaze', at: 3_000, gives: 'A vote in QC polls: what we build next.' },
  { name: 'Star', at: 10_000, gives: 'Your name on your star: the sky shows who you are.' },
  { name: 'Constellation', at: 30_000, gives: 'New QC tools before everyone else.' },
  { name: 'Nova', at: 100_000, gives: 'A medal of your own, designed with you.' },
  { name: 'Supernova', at: 300_000, gives: 'Your story told in the Crypt.' },
  { name: 'Pulsar', at: 1_000_000, gives: 'Your name cut into the founding stone of QC, for good.' },
] as const

export type PowerFacts = { solutions: number; medals: number; articles: number; replies: number; trades: number }

export function powerOf(f: PowerFacts) {
  const parts = {
    solutions: f.solutions * POWER.solution,
    medals: f.medals * POWER.medal,
    crypt: f.articles * POWER.article + f.replies * POWER.reply,
    bpp: Math.min(f.trades, POWER.tradeCap) * POWER.trade,
  }
  const total = parts.solutions + parts.medals + parts.crypt + parts.bpp
  return { total, parts, level: levelOf(total) }
}

export function levelOf(power: number) {
  let i = 0
  for (let k = 0; k < LEVELS.length; k++) if (power >= LEVELS[k]!.at) i = k
  const cur = LEVELS[i]!
  const next = LEVELS[i + 1] ?? null
  return {
    index: i,
    name: cur.name,
    progress: next ? (power - cur.at) / (next.at - cur.at) : 1,
    next: next ? { name: next.name, at: next.at, missing: next.at - power } : null,
  }
}
