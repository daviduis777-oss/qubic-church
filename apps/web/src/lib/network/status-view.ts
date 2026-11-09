/**
 * Is the Qubic network running? Pure logic, no I/O: the server and the tests share it.
 *
 * The network moves in ticks (several a second). We look at the tick now and then, and remember when we last saw
 * it change. A tick that has not moved for STALL_MS is a stall; the stall ends at the first look that finds it moved.
 * Between two looks we cannot see, so every start and end is "no later than" the look that caught it.
 */

export type Look = { tick: number; epoch: number; at: number }

export type Incident = {
  /** ms: when the stuck tick was last seen moving (the stall began after this) */
  from: number
  /** ms: the first look that found it moving again; null while it is still stuck */
  to: number | null
  tick: number
  epoch: number
  /** true when the times come from people's reports rather than our own looks */
  reported?: boolean
  note?: string
}

export type NetState = {
  last: Look | null
  /** ms: the last look at which the tick had moved since the look before */
  changedAt: number | null
  /** ticks per second between the last two looks that saw movement */
  rate: number | null
  incidents: Incident[]
}

export const STALL_MS = 10 * 60_000
export const KEEP_INCIDENTS = 50

/** Stops we know of from before the site watched, from the computors' own announcements. */
export const KNOWN: Incident[] = [
  {
    from: Date.UTC(2026, 9, 18, 1, 26),
    to: Date.UTC(2026, 9, 20, 5, 16),
    tick: 85_371_949,
    epoch: 235,
    reported: true,
    note: 'Halted by the computors after the weak-seed wallet drain, resumed after the recovery vote.',
  },
]

export const empty = (): NetState => ({ last: null, changedAt: null, rate: null, incidents: [] })

/** Fold one new look into the state. */
export function observe(s: NetState, look: Look): NetState {
  const incidents = s.incidents.map(i => ({ ...i }))
  const open = incidents.find(i => i.to == null)
  if (!s.last) return { last: look, changedAt: look.at, rate: null, incidents }

  const moved = look.tick !== s.last.tick
  if (moved) {
    if (open) open.to = look.at
    const dt = (look.at - s.last.at) / 1000
    const rate = look.tick > s.last.tick && dt > 0 && dt < 3 * 3600 && !open ? (look.tick - s.last.tick) / dt : s.rate
    return { last: look, changedAt: look.at, rate, incidents }
  }

  const since = s.changedAt ?? s.last.at
  if (!open && look.at - since >= STALL_MS) incidents.unshift({ from: since, to: null, tick: look.tick, epoch: look.epoch })
  return { last: look, changedAt: s.changedAt, rate: s.rate, incidents: incidents.slice(0, KEEP_INCIDENTS) }
}

export type Verdict = 'running' | 'stalled' | 'unknown'

export function verdict(s: NetState, now: number): { verdict: Verdict; stuckFor: number | null } {
  if (!s.last || now - s.last.at > 2 * 3600_000) return { verdict: 'unknown', stuckFor: null }
  const open = s.incidents.find(i => i.to == null)
  if (open) return { verdict: 'stalled', stuckFor: now - open.from }
  return { verdict: 'running', stuckFor: null }
}

/** Our own incidents first, then the known ones that are not already covered. */
export function history(s: NetState): Incident[] {
  return [...s.incidents, ...KNOWN].sort((a, b) => b.from - a.from)
}
