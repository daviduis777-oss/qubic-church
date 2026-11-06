/**
 * The BPP-9000 record, the part the browser can read: entry types, the join of calls and results, the
 * stats, and Trader Maria, the paper bot. Pure functions, no network and no storage (record.ts does that).
 * Tests: lib/pool/__tests__/bpp-record.test.mts.
 *
 * The record is two kinds of entries in one hash chain:
 *  - a call, sealed during the hour it is about, before that hour closes: UP, DOWN or SKIP (not sure);
 *  - a result, appended after the hour closed: its open and close and which way it went.
 * Up means close >= open, the rule prediction markets use for "Bitcoin up or down".
 */
import { luckChance } from './stats.ts'

export const RECORD_GENESIS = '0'.repeat(64)

export type Side = 'up' | 'down' | 'skip'

export type CallEntry = {
  kind: 'call'
  seq: number
  prev: string
  /** unix seconds of the start of the hour this call is about */
  hour: number
  side: Side
  /** the network that made it: solution hash and epoch */
  net: string
  epoch: number
  /** where the call came from, e.g. "core-live" */
  source: string
  /** when it was sealed, ISO UTC; always before hour + 3600 */
  at: string
  hash: string
}

export type ResultEntry = {
  kind: 'result'
  seq: number
  prev: string
  hour: number
  open: number
  close: number
  /** price source, e.g. "binance BTCUSDT 1h" */
  source: string
  at: string
  hash: string
}

export type RecordEntry = CallEntry | ResultEntry

export type Hour = {
  hour: number
  side: Side
  net: string
  epoch: number
  sealedAt: string
  /** null until the hour has closed and been checked */
  went: 'up' | 'down' | null
  open: number | null
  close: number | null
  /** null for a skip or an unchecked hour */
  hit: boolean | null
}

export const wentOf = (open: number, close: number): 'up' | 'down' => (close >= open ? 'up' : 'down')

/** One row per called hour, oldest first, with its result when there is one. */
export function joinRecord(entries: RecordEntry[]): Hour[] {
  const results = new Map<number, ResultEntry>()
  for (const e of entries) if (e.kind === 'result') results.set(e.hour, e)
  const out: Hour[] = []
  for (const e of entries) {
    if (e.kind !== 'call') continue
    const r = results.get(e.hour)
    const went = r ? wentOf(r.open, r.close) : null
    out.push({
      hour: e.hour,
      side: e.side,
      net: e.net,
      epoch: e.epoch,
      sealedAt: e.at,
      went,
      open: r?.open ?? null,
      close: r?.close ?? null,
      hit: went == null || e.side === 'skip' ? null : e.side === went,
    })
  }
  return out.sort((a, b) => a.hour - b.hour)
}

export type RecordStats = {
  /** hours with a call that has been checked (skips left out) */
  checked: number
  hits: number
  /** percent of checked hours it got right, null before any */
  rate: number | null
  skipped: number
  pending: number
  /** current run: positive = hits in a row, negative = misses in a row */
  run: number
  bestRun: number
  /** chance a fair coin does at least this well over this many hours; null under 10 hours */
  luck: number | null
  last24: { checked: number; hits: number }
  /** hit rate per UTC day, oldest first */
  days: { day: string; checked: number; hits: number }[]
  first: number | null
}

export function recordStats(hours: Hour[], now = Date.now()): RecordStats {
  const done = hours.filter(h => h.hit != null)
  const hits = done.filter(h => h.hit).length
  let run = 0
  for (let i = done.length - 1; i >= 0; i--) {
    const h = done[i]!.hit!
    if (run === 0) run = h ? 1 : -1
    else if (run > 0 && h) run++
    else if (run < 0 && !h) run--
    else break
  }
  let best = 0
  let cur = 0
  for (const h of done) {
    cur = h.hit ? cur + 1 : 0
    best = Math.max(best, cur)
  }
  const since = now / 1000 - 24 * 3600
  const recent = done.filter(h => h.hour >= since)
  const byDay = new Map<string, { checked: number; hits: number }>()
  for (const h of done) {
    const day = new Date(h.hour * 1000).toISOString().slice(0, 10)
    const d = byDay.get(day) ?? { checked: 0, hits: 0 }
    d.checked++
    if (h.hit) d.hits++
    byDay.set(day, d)
  }
  return {
    checked: done.length,
    hits,
    rate: done.length ? (hits / done.length) * 100 : null,
    skipped: hours.filter(h => h.side === 'skip').length,
    pending: hours.filter(h => h.went == null).length,
    run,
    bestRun: best,
    luck: luckChance(hits, done.length),
    last24: { checked: recent.length, hits: recent.filter(h => h.hit).length },
    days: [...byDay.entries()].map(([day, v]) => ({ day, ...v })),
    first: hours[0]?.hour ?? null,
  }
}

/* ---------------- Trader Maria: the paper bot ---------------- */

/**
 * How a bet pays where it could really be placed. Per dollar staked: `win` is the profit when right, a
 * loss costs the whole stake. Break-even accuracy is 1 / (1 + win).
 */
export type Venue = { id: 'market' | 'broker'; name: string; win: number; note: string }

/** A prediction-market share bought at 50 cents plus 1 cent of slippage, with the taker fee 0.07 x p x (1 - p). */
const PRICE = 0.51
const FEE = 0.07 * PRICE * (1 - PRICE)
export const VENUES: Venue[] = [
  {
    id: 'market',
    name: 'Prediction market',
    win: 1 / (PRICE + FEE) - 1,
    note: 'An hourly "Bitcoin up or down" share bought at 50 cents, plus 1 cent of slippage and the taker fee crypto markets charge at even odds (about 1.75%).',
  },
  {
    id: 'broker',
    name: 'Binary broker',
    win: 0.85,
    note: 'A typical binary option: 85% profit when right, the whole stake lost when wrong. Banned for retail in the EU, the UK and Australia.',
  },
]

/** Accuracy above which one bet is worth placing: 1 / (1 + win). */
export const betBreakEven = (v: Venue) => (1 / (1 + v.win)) * 100

/**
 * Trader Maria's rules: start with $100, stake 5% of what she has on every call, sit out "not sure".
 * 5%, not more: at an edge of a few points the Kelly stake is around 5 to 6%, and betting above it
 * shrinks the typical bankroll even when the calls are good.
 */
export const TRADER = { start: 100, stake: 0.05 } as const

/**
 * Accuracy above which her typical bankroll grows under her rules. Higher than betBreakEven: bet after bet,
 * losses weigh more than equal gains (lose 5% then win 5% and she is below where she started).
 */
export const breakEven = (v: Venue) => {
  const lose = -Math.log(1 - TRADER.stake)
  return (lose / (Math.log(1 + TRADER.stake * v.win) + lose)) * 100
}

/** Her bankroll after every checked hour, starting with TRADER.start. */
export function traderCurve(hours: Hour[], v: Venue): number[] {
  let cash: number = TRADER.start
  const out = [cash]
  for (const h of hours) {
    if (h.hit == null) continue
    const bet = cash * TRADER.stake
    cash += h.hit ? bet * v.win : -bet
    out.push(cash)
  }
  return out
}

/**
 * What if: the typical bankroll after `bets` hourly calls if the network is right `rate` percent of the
 * time. Typical = the median path (geometric growth), not the average, which a few lucky runs inflate.
 */
export function whatIf(rate: number, bets: number, v: Venue): number {
  const a = rate / 100
  const g = a * Math.log(1 + TRADER.stake * v.win) + (1 - a) * Math.log(1 - TRADER.stake)
  return TRADER.start * Math.exp(bets * g)
}

export const money = (n: number) => `$${n >= 1000 ? Math.round(n).toLocaleString('en-US') : n.toFixed(2)}`
