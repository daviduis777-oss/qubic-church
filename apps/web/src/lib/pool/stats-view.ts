/**
 * What the statistics sections may show, honestly:
 *  - Below STATS.minRealRigs saved rigs that are not our own test runs, no miner statistics at all:
 *    our test runs are listed as test runs, and the page says statistics appear once enough rigs report.
 *  - Never two algorithm eras in one table: only the newest era leads; older rows sit behind a note.
 * Pure: the page, the in-app view and the picker all read from here.
 */
import { type EpochStat, type HardwareRow, type Summary, topRows } from './aggregate.ts'
import { MEASURE } from './config.ts'
import { FIELD_RUNS, type FieldRun } from './knowledge.ts'
import { STATS } from './ui-config.ts'

/** Same algorithm era as `newest`: within MEASURE.olderAfterEpochs epochs of it. */
export const sameEra = (epoch: number, newest: number) => newest - epoch <= MEASURE.olderAfterEpochs

/** Split by era: the newest epoch present leads, everything more than olderAfterEpochs behind it is older. */
export function splitEras<T>(items: T[], epochOf: (t: T) => number): { epoch?: number; current: T[]; older: T[] } {
  if (!items.length) return { current: [], older: [] }
  const epoch = Math.max(...items.map(epochOf))
  return { epoch, current: items.filter(x => sameEra(epochOf(x), epoch)), older: items.filter(x => !sameEra(epochOf(x), epoch)) }
}

/** Saved rigs that are not our own test runs: pool-reported and self-reported. */
export function realRigs(sum: Summary | null | undefined): number {
  if (!sum) return 0
  if (typeof sum.usage?.real === 'number') return sum.usage.real
  // a summary without usage (the prompt snapshot): count the headline rigs that are not field runs
  return sum.rows.reduce((a, r) => a + r.latest.nPool + r.latest.nLog, 0)
}

const tagsFor = (s: EpochStat, src: 'pool' | 'log', older: boolean) => [
  ...(s.n < MEASURE.fewData ? ['few data'] : []),
  ...(src === 'log' ? ['self-reported'] : []),
  ...(older ? ['older'] : []),
]

/**
 * A row as miner data, without our own test runs: a field headline gives way to the self-reported
 * epoch riding along, or the row is dropped (the test run is listed on its own).
 */
export function minerRow(r: HardwareRow, currentEpoch: number): HardwareRow | null {
  if (r.source !== 'field') return r
  const x = r.selfReported
  if (!x || x.median === undefined) return null
  const older = currentEpoch - x.epoch > MEASURE.olderAfterEpochs
  return { ...r, latest: x, source: 'log', previous: undefined, selfReported: undefined, older, drift: undefined, tags: tagsFor(x, 'log', older) }
}

export type TestRun = FieldRun & { perCard?: number }

export type StatsView = {
  /** enough real rigs to show miner statistics */
  show: boolean
  real: number
  need: number
  /** the table: miner rows of the newest era only */
  rows: HardwareRow[]
  /** rows of older eras, for the collapsed note */
  older: HardwareRow[]
  /** the epoch the table's era is anchored on */
  eraEpoch?: number
  /** our own test runs, newest era first, older eras apart */
  tests: { epoch?: number; current: TestRun[]; older: TestRun[] }
}

const perCard = (f: FieldRun) => (f.mode === 'gpu' && f.gpuCount > 0 ? f.solPerHour / f.gpuCount : undefined)

export function statsView(sum: Summary | null | undefined, opts: { limit?: number; runs?: FieldRun[] } = {}): StatsView {
  const real = realRigs(sum)
  const need = STATS.minRealRigs
  const cur = sum?.epoch ?? 0
  const rated = topRows(sum, 999)
    .map(r => minerRow(r, cur))
    .filter((r): r is HardwareRow => !!r && r.latest.median !== undefined)
  const era = splitEras(rated, r => r.latest.epoch)
  const runs = (opts.runs ?? FIELD_RUNS).map(f => ({ ...f, perCard: perCard(f) }))
  const t = splitEras(runs, f => f.epoch)
  return {
    show: real >= need,
    real,
    need,
    rows: era.current.slice(0, opts.limit ?? 8),
    older: era.older,
    eraEpoch: era.epoch,
    tests: { epoch: t.epoch, current: t.current, older: t.older },
  }
}

/** A summary with only the newest era's rows, so a picker card never quotes a number from an older algorithm. */
export function newestEraSummary(sum: Summary | null | undefined): Summary | null | undefined {
  if (!sum) return sum
  const rated = sum.rows.filter(r => r.latest.median !== undefined || r.latest.nIts > 0)
  const { epoch } = splitEras(rated, r => r.latest.epoch)
  if (epoch === undefined) return sum
  return { ...sum, rows: sum.rows.filter(r => sameEra(r.latest.epoch, epoch)) }
}

/** "1 to 3 Oct 2026" from a list of ISO dates. */
export function runDates(runs: Pick<FieldRun, 'at'>[]): string {
  if (!runs.length) return ''
  const ds = runs.map(r => new Date(r.at)).sort((a, b) => a.getTime() - b.getTime())
  const f = (d: Date, y = true) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(y ? { year: 'numeric' } : {}), timeZone: 'UTC' })
  const a = ds[0]!
  const b = ds.at(-1)!
  if (f(a) === f(b)) return f(a)
  return a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear() ? `${a.getUTCDate()} to ${f(b)}` : `${f(a, false)} to ${f(b)}`
}
