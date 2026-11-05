/**
 * My rig: the miner's own dashboard. One reading per worker (QC.xxx) from one of three sources:
 *   pool  the pool's per-worker stats (stats-adapter.ts; TODO(Bob) until POOL.statsUrl exists)
 *   log   numbers read from a pasted miner log by measure.ts; the log itself never leaves the browser
 *   demo  a clearly labelled sample, so the design can be seen before the pool reports anything
 * From a reading: the status, one coach line, the standing against similar rigs, the epoch strip,
 * the user's own cost per solution, and the share card payload.
 *
 * Pure and browser safe: no node APIs, no network. The list of rigs lives in localStorage only.
 * Rates only: never income, profit or projections, and no price anywhere.
 */
import { type HardwareRow, rowFor, type Summary } from './aggregate.ts'
import { MEASURE, POOL, RIG } from './config.ts'
import { EPOCH_MS, epochAt, formatLeft } from './epoch.ts'
import { costPerSolution, type Extracted, extractMetrics, fmtRate, fmtWindow, type MineMode, normalizeCpu, normalizeGpu, partKey, type Unit } from './measure.ts'
import { containsAddress, containsSeed } from './redact.ts'

export type RigSource = 'pool' | 'log' | 'demo'
export const SOURCE_LABEL: Record<RigSource, string> = { pool: 'pool', log: 'from log', demo: 'demo' }

export type RigHw = { gpu?: string | null; gpuCount?: number; cpu?: string; threads?: number; mode?: MineMode }
export type RigPoint = { t: number; solPerHour: number }

export type RigReading = {
  source: RigSource
  worker: string
  /** ms UTC of the newest data in the reading */
  at: number
  epoch: number
  hw: RigHw
  /** solutions this epoch (pool, demo) or in the log's window (log) */
  solutions?: number
  /** whole rig */
  solPerHour?: number
  /** minutes the miner has run, within this epoch */
  uptimeMin?: number
  /** it/s per lane as the miner prints it: CUDA, AVX2, AVX512, CPU */
  its: Record<string, number>
  rejected?: number
  restarts?: number
  /** sol/h over the epoch, oldest first */
  series: RigPoint[]
  /** titles of doctor faults seen in the log */
  faults: string[]
  /** the pool (or demo) says the network is between epochs */
  epochIdle?: boolean
}

/* ---------------- readings ---------------- */

/** sol/h between consecutive counter readouts; a reset starts again from zero. Needs two readouts or more. */
export function seriesFromCounter(counter: { t: number; n: number }[] | undefined, dated: boolean, endMs: number): RigPoint[] {
  if (!counter || counter.length < 2) return []
  const last = counter.at(-1)!.t
  const out: RigPoint[] = []
  for (let i = 1; i < counter.length; i++) {
    const a = counter[i - 1]!
    const b = counter[i]!
    const dt = b.t - a.t
    if (dt <= 0) continue
    const d = b.n - a.n >= 0 ? b.n - a.n : b.n
    // undated logs: place the points relative to the reading's end
    const t = dated ? b.t * 60_000 : endMs - (last - b.t) * 60_000
    out.push({ t, solPerHour: Math.round((d / dt) * 600) / 10 })
  }
  return out
}

/** A reading from a pasted log. `faults` are the doctor's fault titles for the same log. */
export function readingFromLog(log: string, worker: string, now: Date = new Date(), faults: string[] = [], x: Extracted = extractMetrics(log)): RigReading {
  const at = x.lastAt ?? now.getTime()
  const epoch = x.epoch ?? epochAt(new Date(at)).epoch
  // uptime within this epoch: a log that started before the epoch change only counts from the change
  const sinceStart = (at - epochAt(new Date(at)).start.getTime()) / 60_000
  const up = x.uptimeMin ?? x.windowMin
  const gpuRig = x.gpuIts !== undefined || Boolean(x.gpu)
  return {
    source: 'log',
    worker,
    at,
    epoch,
    hw: {
      gpu: x.gpu ?? null,
      gpuCount: x.gpuCount ?? (gpuRig ? 1 : 0),
      cpu: x.cpu,
      threads: x.threads,
      mode: x.gpuIts !== undefined && x.cpuIts !== undefined ? 'gpu+cpu' : gpuRig ? 'gpu' : 'cpu',
    },
    solutions: x.solutions,
    solPerHour: x.solPerHour,
    uptimeMin: up === undefined ? undefined : x.dated ? Math.min(up, Math.max(0, sinceStart)) : up,
    its: Object.fromEntries(Object.entries(x.its).filter(([k]) => k !== 'total' || Object.keys(x.its).length === 1)),
    rejected: x.rejected,
    restarts: x.restarts,
    series: seriesFromCounter(x.counter, Boolean(x.dated), at),
    faults,
  }
}

/** Rejected share of what the rig submitted, in percent. */
export function rejectedPct(r: Pick<RigReading, 'solutions' | 'rejected'>): number | undefined {
  if (r.rejected === undefined || r.solutions === undefined) return undefined
  const total = r.solutions + r.rejected
  return total > 0 ? Math.round((r.rejected / total) * 1000) / 10 : undefined
}

export const gpuCount = (hw: RigHw) => (hw.gpu && hw.mode !== 'cpu' ? Math.max(1, hw.gpuCount ?? 1) : 0)
export const perCard = (r: Pick<RigReading, 'solPerHour' | 'hw'>) => {
  const g = gpuCount(r.hw)
  return r.solPerHour !== undefined && g > 1 && r.hw.mode === 'gpu' ? r.solPerHour / g : undefined
}

/* ---------------- status ---------------- */

/** waiting: the rig is in the list but nothing has been read from it yet (just added, or never pasted). */
export type RigStatus = 'waiting' | 'mining' | 'warming' | 'early' | 'idle' | 'no-signal' | 'look'
export type StatusView = { status: RigStatus; title: string; line: string }

export const STATUS_TITLE: Record<RigStatus, string> = {
  waiting: 'Waiting for first data',
  mining: 'Mining',
  warming: 'Warming up',
  early: 'Early',
  idle: 'Idle',
  'no-signal': 'No signal',
  look: 'Needs a look',
}

const ago = (min: number) => (min >= 1440 ? `${Math.floor(min / 1440)} d` : min >= 60 ? `${Math.floor(min / 60)} h` : `${Math.max(1, Math.round(min))} min`)

/**
 * The state, in order: waiting (no reading yet), no signal, idle at the epoch change, a fault, warming up (first 20 minutes: do not judge),
 * nothing found after 20 minutes, too many rejected, early (under 2 hours: rates run high), mining.
 */
export function rigStatus(r: RigReading | null | undefined, now: Date = new Date()): StatusView {
  const v = (status: RigStatus, line: string): StatusView => ({ status, title: STATUS_TITLE[status], line })
  if (!r) return v('waiting', `Nothing read from this rig yet. Start the miner, give it ${MEASURE.minWindowMin} minutes, then paste the log.`)
  const age = (now.getTime() - r.at) / 60_000
  if (age > RIG.noSignalMin[r.source]) return v('no-signal', `Nothing new for ${ago(age)}. Check the machine is on and the miner runs.`)
  const e = epochAt(now)
  const sinceStart = (now.getTime() - e.start.getTime()) / 60_000
  if (r.epochIdle || (sinceStart < RIG.epochIdleMin && (r.epoch < e.epoch || r.solutions === 0)))
    return v('idle', 'The network is switching epochs. Mining resumes on its own.')
  if (r.faults.length) return v('look', `${r.faults[0]}.`)
  const up = r.uptimeMin
  if (up !== undefined && up < MEASURE.minWindowMin) return v('warming', `First ${MEASURE.minWindowMin} minutes. Do not judge it yet.`)
  if (up !== undefined && r.solutions === 0) return v('look', `0 solutions after ${fmtWindow(up)}.`)
  const rej = rejectedPct(r)
  if (rej !== undefined && rej >= RIG.rejectedLookPct) return v('look', `${rej}% of solutions rejected.`)
  if (up !== undefined && up < MEASURE.warmupMin) return v('early', `Under ${MEASURE.warmupMin / 60} hours in. Early rates run ${MEASURE.warmupFactor} high.`)
  return v('mining', 'Solutions are coming in. Steady.')
}

/**
 * How old the numbers are, for their labels. Numbers from an earlier epoch say which epoch, never
 * "this epoch"; a stale reading (no signal) is greyed out, gives no list rate and makes no share card.
 */
export type Freshness = {
  /** no signal: the numbers are old */
  stale: boolean
  /** the reading belongs to an earlier epoch than now */
  previousEpoch: boolean
  /** "this epoch", "in this log", or "epoch 237" */
  scope: string
  /** "epoch 237 · 3 d ago", only when stale or from an earlier epoch */
  note?: string
  /** a share card may be made from it */
  shareable: boolean
}

export function freshness(r: RigReading | null | undefined, st: StatusView, now: Date = new Date()): Freshness {
  if (!r) return { stale: false, previousEpoch: false, scope: 'this epoch', shareable: false }
  const cur = epochAt(now).epoch
  const previousEpoch = r.epoch < cur
  const stale = st.status === 'no-signal'
  const age = Math.max(0, (now.getTime() - r.at) / 60_000)
  const scope = previousEpoch ? `epoch ${r.epoch}` : r.source === 'log' ? 'in this log' : 'this epoch'
  const note = stale || previousEpoch ? `epoch ${r.epoch} · ${ago(age)} ago` : undefined
  return { stale, previousEpoch, scope, note, shareable: !stale && !previousEpoch && st.status !== 'waiting' }
}

/* ---------------- against similar rigs ---------------- */

/**
 * Where a value sits, from the three quantiles we have (p25, median, p75): linear between them,
 * extended with the nearest segment's slope outside, clamped to 1..99. Without a spread there is no percentile.
 */
export function approxPercentile(v: number, p25?: number, p50?: number, p75?: number): number | undefined {
  if (![v, p25, p50, p75].every(x => typeof x === 'number' && Number.isFinite(x))) return undefined
  const [a, m, b] = [p25!, p50!, p75!]
  if (!(b > a) || m < a || m > b) return undefined
  const lo = m - a || (b - a) / 2
  const hi = b - m || (b - a) / 2
  let p: number
  if (v <= m) p = 50 - ((m - v) / lo) * 25
  else p = 50 + ((v - m) / hi) * 25
  return Math.round(Math.min(99, Math.max(1, p)))
}

export type Standing =
  | { kind: 'none'; text: string }
  | {
      kind: 'ok'
      yours: number
      median: number
      ratio: number
      n: number
      epoch: number
      unit: Unit
      label: string
      tags: string[]
      /** about this percentile among similar rigs, when the spread is known */
      pct?: number
      band?: 'low' | 'mid' | 'high'
      /** n is at least MEASURE.fewData and a percentile exists: enough to put on a share card */
      enough: boolean
    }

export function rigPart(hw: RigHw) {
  const gpu = hw.gpu ? normalizeGpu(hw.gpu) : null
  const cpu = hw.cpu ? normalizeCpu(hw.cpu) : ''
  const mode: MineMode = hw.mode ?? (gpu ? 'gpu' : 'cpu')
  if (mode !== 'cpu' ? !gpu : !cpu) return null
  return partKey({ cpu, gpu, mode })
}

/** A rate more than this many times off the median is another algorithm era, not a comparison. */
export const ERA_RATIO = 10

/** The rig's sol/h per unit against the measured median for the same hardware. */
export function standing(r: RigReading | null | undefined, sum: Summary | null | undefined): Standing {
  if (!r || r.solPerHour === undefined) return { kind: 'none', text: 'No rate yet.' }
  const p = rigPart(r.hw)
  if (!p) return { kind: 'none', text: 'Add the hardware to compare.' }
  const row: HardwareRow | undefined = rowFor(sum, p.key)
  const L = row?.latest
  if (!row || !L || L.median === undefined || L.median <= 0) return { kind: 'none', text: `No measured ${p.label} rigs yet.` }
  const yours = p.unit === 'card' ? r.solPerHour / Math.max(1, gpuCount(r.hw)) : r.solPerHour
  // more than 10x apart is another algorithm era (tens per hour in epoch 229, thousands in 233), not a slow rig
  if (yours > 0 && (yours / L.median > ERA_RATIO || L.median / yours > ERA_RATIO))
    return { kind: 'none', text: `Measured in epoch ${L.epoch}, under an older algorithm. Not comparable with today.` }
  const pct = L.n > 1 ? approxPercentile(yours, L.p25, L.median, L.p75) : undefined
  const band = pct === undefined ? undefined : pct < 25 ? 'low' : pct > 75 ? 'high' : 'mid'
  return {
    kind: 'ok',
    yours,
    median: L.median,
    ratio: yours / L.median,
    n: L.n,
    epoch: L.epoch,
    unit: p.unit,
    label: p.label,
    tags: row.tags,
    pct,
    band,
    enough: pct !== undefined && L.n >= MEASURE.fewData,
  }
}

/** "+12% vs median" */
export const vsMedian = (s: Extract<Standing, { kind: 'ok' }>) => {
  const d = Math.round((s.ratio - 1) * 100)
  return d === 0 ? 'at the median' : `${d > 0 ? '+' : ''}${d}% vs median`
}

/* ---------------- the coach ---------------- */

export type CoachId = 'waiting' | 'no-signal' | 'idle' | 'fault' | 'close' | 'restart' | 'cpu-feed' | 'warming' | 'rejected' | 'early' | 'slow' | 'healthy'
export type Coach = { id: CoachId; text: string; doctor?: boolean }

/** The single most useful next action, from the field rules, most urgent first. */
export function coachLine(r: RigReading | null | undefined, st: StatusView, s?: Standing): Coach {
  if (!r || st.status === 'waiting') return { id: 'waiting', text: `Start the miner and leave it ${MEASURE.minWindowMin} minutes. Then paste the last 30 to 50 log lines here.` }
  if (st.status === 'no-signal') return { id: 'no-signal', text: 'Check the machine is on and the miner runs, then paste a fresh log.' }
  if (st.status === 'idle') return { id: 'idle', text: 'Epoch change. Leave it running; restarting does not help.' }
  if (r.faults.length) return { id: 'fault', text: `Fix this first: ${r.faults[0]}.`, doctor: true }
  const up = r.uptimeMin
  if (up !== undefined && up >= MEASURE.minWindowMin && r.solutions === 0) {
    if ((r.restarts ?? 0) >= 1) return { id: 'close', text: `0 solutions after ${MEASURE.minWindowMin} min and one restart: close it.`, doctor: true }
    return { id: 'restart', text: `0 solutions after ${MEASURE.minWindowMin} min: restart the miner once.`, doctor: true }
  }
  const g = gpuCount(r.hw)
  if (g > 0 && r.hw.threads !== undefined && r.hw.threads / g < RIG.threadsPerGpu)
    return { id: 'cpu-feed', text: `CPU may be starving the cards: ${r.hw.threads} threads for ${g} GPU${g > 1 ? 's' : ''}.`, doctor: true }
  if (st.status === 'warming') return { id: 'warming', text: `Warming up. Come back in ${Math.max(1, Math.ceil(MEASURE.minWindowMin - (up ?? 0)))} min.` }
  const rej = rejectedPct(r)
  if (rej !== undefined && rej >= RIG.rejectedCheckPct) return { id: 'rejected', text: `${rej}% rejected: check the CPU and the network feeding the miner.`, doctor: true }
  if (st.status === 'early') return { id: 'early', text: `Early rates run ${MEASURE.warmupFactor} high. Judge it after ${MEASURE.warmupMin / 60} hours.` }
  if (s?.kind === 'ok' && s.band === 'low' && s.n >= MEASURE.fewData)
    return { id: 'slow', text: 'Slower than most rigs like it: check the PCIe width and the power limit.', doctor: true }
  return { id: 'healthy', text: 'Looks healthy, leave it.' }
}

/* ---------------- the epoch strip ---------------- */

export type EpochStrip = { epoch: number; frac: number; day: number; left: string; payout: string }

export function epochStrip(now: Date = new Date()): EpochStrip {
  const e = epochAt(now)
  const elapsed = now.getTime() - e.start.getTime()
  return {
    epoch: e.epoch,
    frac: Math.min(1, Math.max(0, elapsed / EPOCH_MS)),
    day: Math.min(7, Math.floor(elapsed / 86_400_000) + 1),
    left: formatLeft(e.msLeft),
    payout: `Rewards are ${POOL.payout.timing}.`,
  }
}

/* ---------------- the user's own cost ---------------- */

/** The only money figure: the user's own daily cost ÷ their solutions per day. Never income. */
export const rigCost = (dailyCost: number | undefined, r: Pick<RigReading, 'solPerHour'> | null | undefined) => costPerSolution(dailyCost, r?.solPerHour)
export const fmtCost = (v: number) => (v < 0.01 ? v.toFixed(4) : v < 1 ? v.toFixed(3) : v.toFixed(2))

/* ---------------- formatting ---------------- */

export const fmtInt = (n: number) => Math.round(n).toLocaleString('en-US')
/** "3 d 4 h", "5 h 10 min", "12 min" */
export const fmtUptime = (min: number) => formatLeft(min * 60_000)
/** "3d 4h", "5h 10m", "12m": for the big numbers */
export const fmtUpShort = (min: number) =>
  formatLeft(min * 60_000)
    .replace(' min', 'm')
    .replace(/ ([dh])/g, '$1')
    .replace(/(\d+h) 0m$/, '$1')
/** "QC.4090-rig-a" -> "4090-rig-a"; long names keep their start and end. */
export function shortWorker(w: string, max = 18): string {
  const v = w.startsWith(POOL.workerPrefix) ? w.slice(POOL.workerPrefix.length) : w
  return v.length <= max ? v : `${v.slice(0, max - 7)}…${v.slice(-6)}`
}
/** "4x RTX 4090 · Xeon E5-2696 v3" */
export function hwLine(hw: RigHw): string {
  const g = gpuCount(hw)
  const gpu = hw.gpu && g ? `${g > 1 ? `${g}x ` : ''}${normalizeGpu(hw.gpu)}` : ''
  const cpu = hw.cpu ? normalizeCpu(hw.cpu) : ''
  return [gpu, cpu].filter(Boolean).join(' · ') || 'Hardware not given'
}
export { fmtRate }

/* ---------------- my rigs, in this browser ---------------- */

export const RIGS_KEY = 'qc-pool:rigs'

/** The numbers of the last log reading, never the log. */
export type StoredReading = Pick<RigReading, 'at' | 'epoch' | 'solutions' | 'solPerHour' | 'uptimeMin' | 'its' | 'rejected' | 'restarts' | 'series'>

export type MyRig = {
  worker: string
  gpu?: string
  gpuCount?: number
  cpu?: string
  threads?: number
  /** the user's own daily cost in USD, for cost per solution; stays here */
  dailyCost?: number
  added: number
  last?: StoredReading
}

type KV = Pick<Storage, 'getItem' | 'setItem'>
const local = (): KV | null => {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

const fin = (v: unknown, min: number, max: number) => (typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : undefined)
const txt = (v: unknown, max = 60) => {
  if (typeof v !== 'string') return undefined
  const t = [...v].filter(c => c.charCodeAt(0) >= 32).join('').trim().slice(0, max)
  return t && !containsAddress(t) && !containsSeed(t) ? t : undefined
}
export const validWorker = (w: unknown): w is string =>
  typeof w === 'string' && w.startsWith(POOL.workerPrefix) && w.length > POOL.workerPrefix.length && POOL.workerPattern.test(w) && !containsAddress(w)

function cleanReading(x: unknown): StoredReading | undefined {
  if (!x || typeof x !== 'object') return undefined
  const r = x as Record<string, unknown>
  const at = fin(r.at, 0, 9e15)
  const epoch = fin(r.epoch, 1, 100_000)
  if (at === undefined || epoch === undefined) return undefined
  const its = Object.fromEntries(
    Object.entries(r.its && typeof r.its === 'object' ? (r.its as Record<string, unknown>) : {})
      .filter(([k, v]) => /^[A-Za-z0-9]{1,8}$/.test(k) && fin(v, 0, 1e7) !== undefined)
      .slice(0, 6),
  ) as Record<string, number>
  const series = (Array.isArray(r.series) ? r.series : [])
    .map(p => ({ t: fin((p as RigPoint)?.t, 0, 9e15), solPerHour: fin((p as RigPoint)?.solPerHour, 0, 1e6) }))
    .filter((p): p is RigPoint => p.t !== undefined && p.solPerHour !== undefined)
    .slice(-96)
  return {
    at,
    epoch,
    solutions: fin(r.solutions, 0, 1e8),
    solPerHour: fin(r.solPerHour, 0, 1e6),
    uptimeMin: fin(r.uptimeMin, 0, 14 * 1440),
    its,
    rejected: fin(r.rejected, 0, 1e8),
    restarts: fin(r.restarts, 0, 1000),
    series,
  }
}

/** One stored rig, checked field by field; anything malformed is dropped, never thrown. */
export function cleanRig(x: unknown): MyRig | null {
  if (!x || typeof x !== 'object') return null
  const r = x as Record<string, unknown>
  if (!validWorker(r.worker)) return null
  const rig: MyRig = {
    worker: r.worker,
    gpu: txt(r.gpu),
    gpuCount: fin(r.gpuCount, 1, 16),
    cpu: txt(r.cpu),
    threads: fin(r.threads, 1, 4096),
    dailyCost: fin(r.dailyCost, 0.0001, 100_000),
    added: fin(r.added, 0, 9e15) ?? 0,
    last: cleanReading(r.last),
  }
  return Object.fromEntries(Object.entries(rig).filter(([, v]) => v !== undefined)) as MyRig
}

/** The list from localStorage. Private mode, blocked storage or junk all give an empty list. */
export function loadRigs(store: KV | null = local()): MyRig[] {
  try {
    const raw = store?.getItem(RIGS_KEY)
    if (!raw) return []
    const j = JSON.parse(raw) as unknown
    if (!Array.isArray(j)) return []
    const seen = new Set<string>()
    return j
      .map(cleanRig)
      .filter((r): r is MyRig => {
        if (!r || seen.has(r.worker)) return false
        seen.add(r.worker)
        return true
      })
      .slice(0, RIG.maxRigs)
  } catch {
    return []
  }
}

/** Saves the list; false when storage is unavailable or full (the app keeps working from memory). */
export function saveRigs(rigs: MyRig[], store: KV | null = local()): boolean {
  try {
    if (!store) return false
    const clean = rigs.map(cleanRig).filter((r): r is MyRig => !!r).slice(0, RIG.maxRigs)
    store.setItem(RIGS_KEY, JSON.stringify(clean))
    return true
  } catch {
    return false
  }
}

/** Add or update one rig by worker name; new rigs go first. */
export function upsertRig(rigs: MyRig[], rig: Partial<MyRig> & { worker: string }, now = Date.now()): MyRig[] {
  const cur = rigs.find(r => r.worker === rig.worker)
  const next = cleanRig({ ...(cur ?? { added: now }), ...rig })
  if (!next) return rigs
  return cur ? rigs.map(r => (r.worker === rig.worker ? next : r)) : [next, ...rigs].slice(0, RIG.maxRigs)
}

export const removeRig = (rigs: MyRig[], worker: string) => rigs.filter(r => r.worker !== worker)

export const rigHw = (r: MyRig): RigHw => ({ gpu: r.gpu ?? null, gpuCount: r.gpu ? (r.gpuCount ?? 1) : 0, cpu: r.cpu, threads: r.threads, mode: r.gpu ? 'gpu' : 'cpu' })

/** A stored rig's last log reading, as a reading again. */
export function storedReading(r: MyRig): RigReading | null {
  if (!r.last) return null
  return { ...r.last, source: 'log', worker: r.worker, hw: rigHw(r), faults: [] }
}

export const toStored = (r: RigReading): StoredReading => ({
  at: r.at,
  epoch: r.epoch,
  solutions: r.solutions,
  solPerHour: r.solPerHour,
  uptimeMin: r.uptimeMin,
  its: r.its,
  rejected: r.rejected,
  restarts: r.restarts,
  series: r.series.slice(-96),
})

/* ---------------- demo ---------------- */

/** Deterministic wobble, so every render of the demo is the same. */
const wob = (i: number, seed: number) => Math.sin(i * 1.7 + seed) * 0.6 + Math.sin(i * 0.43 + seed * 2.1) * 0.4

/** A sample sol/h series: high early (the warm-up overstates), settling to `rate`. */
function demoSeries(now: number, upMin: number, rate: number, seed: number, points = 28): RigPoint[] {
  if (upMin < 30) return []
  const out: RigPoint[] = []
  for (let i = 1; i <= points; i++) {
    const tMin = (upMin * i) / points
    const warm = 1 + 0.42 * Math.exp(-tMin / 70)
    out.push({ t: now - (upMin - tMin) * 60_000, solPerHour: Math.round(rate * warm * (1 + 0.07 * wob(i, seed))) })
  }
  return out
}

export type DemoRig = { rig: MyRig; reading: RigReading }

/** Six sample rigs, one per state, labelled demo everywhere they appear. */
export function demoRigs(now: Date = new Date()): DemoRig[] {
  const t = now.getTime()
  const e = epochAt(now)
  const sinceStart = Math.max(0, (t - e.start.getTime()) / 60_000)
  const longUp = Math.max(MEASURE.warmupMin + 30, Math.min(sinceStart - 12, 6 * 1440))
  const mk = (rig: Omit<MyRig, 'added'>, r: Partial<RigReading> & Pick<RigReading, 'at'>): DemoRig => {
    const full: MyRig = { ...rig, added: 0 }
    return { rig: full, reading: { source: 'demo', worker: rig.worker, epoch: e.epoch, hw: rigHw(full), its: {}, series: [], faults: [], ...r } }
  }
  const rate4090 = 2412
  return [
    mk(
      { worker: 'QC.4090-rig-a', gpu: 'RTX 4090', gpuCount: 4, cpu: 'Xeon E5-2696 v3', threads: 72, dailyCost: 28 },
      {
        at: t - 2 * 60_000,
        uptimeMin: longUp,
        solPerHour: rate4090,
        solutions: Math.round((rate4090 * longUp) / 60 * 1.03),
        its: { CUDA: 796 },
        rejected: Math.round((rate4090 * longUp) / 60 * 0.004),
        series: demoSeries(t, longUp, rate4090, 1),
      },
    ),
    mk(
      { worker: 'QC.5080-duo', gpu: 'RTX 5080', gpuCount: 2, cpu: 'EPYC 7B13', threads: 6 },
      { at: t - 60_000, uptimeMin: 12, solPerHour: 1140, solutions: 228, its: { CUDA: 1404 }, rejected: 3 },
    ),
    mk(
      { worker: 'QC.7950x-a', cpu: 'Ryzen 9 7950X', threads: 32, dailyCost: 2.4 },
      { at: t - 3 * 60_000, uptimeMin: 74, solPerHour: 61, solutions: 75, its: { AVX512: 30.4 }, rejected: 0, series: demoSeries(t, 74, 52, 3, 12) },
    ),
    mk(
      { worker: 'QC.5070ti-b', gpu: 'RTX 5070 Ti', gpuCount: 1, cpu: 'Ryzen 9 9950X', threads: 32 },
      { at: t - 4 * 60_000, uptimeMin: 3 * 60, solPerHour: 0, solutions: 1240, its: { CUDA: 0, AVX512: 0 }, epochIdle: true, series: demoSeries(t, 180, 420, 4, 14) },
    ),
    mk({ worker: 'QC.m3pro-home', cpu: 'Apple M3 Pro', threads: 12 }, { at: t - 3 * 3600_000 - 20 * 60_000, uptimeMin: 9 * 60, solPerHour: 38, solutions: 342, its: { CPU: 40 } }),
    mk(
      { worker: 'QC.3090-c', gpu: 'RTX 3090', gpuCount: 1, cpu: 'Ryzen 7 5800X', threads: 16 },
      { at: t - 60_000, uptimeMin: 34, solPerHour: 0, solutions: 0, its: { CUDA: 212 }, restarts: 1, rejected: 0 },
    ),
  ]
}

/* ---------------- the share card ---------------- */

export type CardFormat = 'story' | 'x'
export const CARD_SIZE: Record<CardFormat, { width: number; height: number }> = { story: { width: 1080, height: 1350 }, x: { width: 1200, height: 675 } }

/** What a share card shows. Signed on the server (card-sign.ts) so a link cannot be edited into other numbers. */
export type CardData = {
  v: 1
  src: RigSource
  /** worker name */
  w: string
  /** hardware line */
  hw: string
  /** solutions this epoch (pool) or in the log (log, demo) */
  sol: number
  /** whole-rig sol/h */
  rate: number
  /** sol/h per card, when the rig has more than one GPU */
  pc?: number
  /** uptime minutes this epoch */
  up: number
  ep: number
  st: RigStatus
  /** about this percentile among similar rigs, and how many rigs, only when there is enough data */
  pct?: number
  pn?: number
  /** the user's own cost per solution in USD, only when they turned it on */
  cost?: number
}

/** Statuses a card may carry. No signal and waiting make no card: old numbers would circulate as current. */
const STATUSES: RigStatus[] = ['mining', 'warming', 'early', 'idle', 'look']

/**
 * Check a card payload. The browser may ask for `log` and `demo` cards only; `pool` cards are signed
 * from the pool's own numbers on the server (allowPool), once that API exists.
 */
export function checkCard(raw: unknown, opts: { allowPool?: boolean } = {}): { ok: true; value: CardData } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Nothing to draw.' }
  const r = raw as Record<string, unknown>
  const src = r.src
  if (src !== 'log' && src !== 'demo' && !(src === 'pool' && opts.allowPool)) return { ok: false, error: 'Unknown source.' }
  if (!validWorker(r.w)) return { ok: false, error: 'Worker names start with QC.' }
  const hw = txt(r.hw, 64)
  if (typeof r.hw === 'string' && r.hw.trim() && !hw) return { ok: false, error: 'Only hardware names go on a card.' }
  const sol = fin(r.sol, 0, 1e8)
  const rate = fin(r.rate, 0, 1e6)
  const up = fin(r.up, 0, 14 * 1440)
  const ep = fin(r.ep, 1, 100_000)
  if (sol === undefined || rate === undefined || up === undefined || ep === undefined) return { ok: false, error: 'Numbers out of range.' }
  if (r.st === 'no-signal' || r.st === 'waiting') return { ok: false, error: 'No card for a rig without fresh numbers. Paste a fresh log first.' }
  const st = STATUSES.includes(r.st as RigStatus) ? (r.st as RigStatus) : undefined
  if (!st) return { ok: false, error: 'Unknown status.' }
  const pct = fin(r.pct, 1, 99)
  const pn = fin(r.pn, MEASURE.fewData, 1e6)
  const card: CardData = {
    v: 1,
    src,
    w: r.w,
    hw: hw ?? 'Hardware not given',
    sol: Math.round(sol),
    rate: Math.round(rate * 10) / 10,
    pc: fin(r.pc, 0, 1e6),
    up: Math.round(up),
    ep: Math.round(ep),
    st,
    // a percentile only rides with its n, and only with enough rigs behind it
    pct: pct !== undefined && pn !== undefined ? Math.round(pct) : undefined,
    pn: pct !== undefined && pn !== undefined ? Math.round(pn) : undefined,
    cost: fin(r.cost, 0, 10_000),
  }
  return { ok: true, value: Object.fromEntries(Object.entries(card).filter(([, v]) => v !== undefined)) as CardData }
}

/** The card for a reading. `withCost` is the user's explicit toggle (default off). */
export function cardFrom(r: RigReading, st: StatusView, s: Standing, opts: { dailyCost?: number; withCost?: boolean } = {}): CardData {
  const cost = opts.withCost ? rigCost(opts.dailyCost, r) : undefined
  const c: CardData = {
    v: 1,
    src: r.source,
    w: r.worker,
    hw: hwLine(r.hw),
    sol: Math.round(r.solutions ?? 0),
    rate: Math.round((r.solPerHour ?? 0) * 10) / 10,
    pc: perCard(r),
    up: Math.round(r.uptimeMin ?? 0),
    ep: r.epoch,
    st: st.status,
    pct: s.kind === 'ok' && s.enough ? s.pct : undefined,
    pn: s.kind === 'ok' && s.enough ? s.n : undefined,
    cost,
  }
  return Object.fromEntries(Object.entries(c).filter(([, v]) => v !== undefined)) as CardData
}

/** "Faster than about 70% of similar rigs" */
export const percentileLine = (pct: number) => `Faster than about ${pct}% of similar rigs`
