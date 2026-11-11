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
  { id: 'first-marathon', name: 'First Mining Marathon', for: 'Joined Qubic Church in the days of the first marathon, from epoch 233.', glyph: 'flame' },
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

/** Stages by useful solutions: the same names as the pool's power gauge. */
export const STAGES = [
  { name: 'Spark', at: 0 },
  { name: 'Flame', at: 10 },
  { name: 'Star', at: 50 },
  { name: 'Nova', at: 200 },
  { name: 'Supernova', at: 1000 },
] as const

export function stageOf(solutions: number) {
  let i = 0
  for (let k = 0; k < STAGES.length; k++) if (solutions >= STAGES[k]!.at) i = k
  const next = STAGES[i + 1] ?? null
  return { index: i, name: STAGES[i]!.name, next: next ? { name: next.name, at: next.at, missing: next.at - solutions } : null }
}
