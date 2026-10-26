/** Journal statistics, the trader's "KDA". Pure functions: used on the page, in the API and on the share card. */
import type { Trade } from './store'

export const pnlOf = (t: Trade) => {
  const move = t.side === 'long' ? t.exit / t.entry - 1 : 1 - t.exit / t.entry
  return t.size * move - (t.fee || 0)
}
export const pctOf = (t: Trade) => (pnlOf(t) / t.size) * 100

export type Stats = {
  trades: number
  wins: number
  losses: number
  winRate: number | null
  streak: { kind: 'W' | 'L' | null; n: number }
  bestStreak: number
  profitFactor: number | null
  avgWin: number | null
  avgLoss: number | null
  best: number | null
  worst: number | null
  start: number
  capital: number
  returnPct: number
  equity: number[]
  day: number
}

export function statsOf(trades: Trade[], start: number, joined: string, now = Date.now()): Stats {
  const ts = trades.slice().sort((a, b) => a.at.localeCompare(b.at))
  const p = ts.map(pnlOf)
  const pc = ts.map(pctOf)
  const wins = p.filter(x => x > 0)
  const losses = p.filter(x => x <= 0)
  let streak: Stats['streak'] = { kind: null, n: 0 }
  let best = 0
  let run = 0
  let runKind: 'W' | 'L' | null = null
  for (const x of p) {
    const k = x > 0 ? 'W' : 'L'
    run = k === runKind ? run + 1 : 1
    runKind = k
    if (k === 'W') best = Math.max(best, run)
  }
  if (runKind) streak = { kind: runKind, n: run }
  const equity = [start]
  for (const x of p) equity.push(equity.at(-1)! + x)
  const gross = wins.reduce((s, x) => s + x, 0)
  const loss = -losses.reduce((s, x) => s + x, 0)
  const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null)
  const firstDay = Date.parse(joined)
  return {
    trades: ts.length,
    wins: wins.length,
    losses: losses.length,
    winRate: ts.length ? (wins.length / ts.length) * 100 : null,
    streak,
    bestStreak: best,
    profitFactor: loss > 0 ? gross / loss : wins.length ? null : null,
    avgWin: avg(pc.filter(x => x > 0)),
    avgLoss: avg(pc.filter(x => x <= 0)),
    best: pc.length ? Math.max(...pc) : null,
    worst: pc.length ? Math.min(...pc) : null,
    start,
    capital: equity.at(-1)!,
    returnPct: start ? ((equity.at(-1)! - start) / start) * 100 : 0,
    equity,
    day: Math.max(1, Math.floor((now - firstDay) / 86400_000) + 1),
  }
}

/** Two-sided chance that a coin (50%) would do at least this well over n hours: the "not luck" line. */
export function luckChance(hits: number, n: number): number | null {
  if (n < 10) return null
  const z = (hits - n / 2) / Math.sqrt(n / 4)
  // normal tail, one-sided
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp((-z * z) / 2)
  const tail = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return z > 0 ? tail : 1 - tail
}
