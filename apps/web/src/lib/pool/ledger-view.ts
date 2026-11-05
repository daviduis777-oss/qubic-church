/**
 * The record, as people read it: the entry types and one formatter for a journal line, shared by the
 * page strip, My rig and the API. Pure and browser safe; the writing side is ledger.ts (server only).
 *
 * The record says what was done and nothing about why: no rewards, no promises.
 */
import { POOL } from './config.ts'

export type LedgerKind =
  | 'solutions'
  | 'rental-hours'
  | 'rig-online-hours'
  | 'diagnosis-saved'
/** pool: the pool's own numbers. log: read from a miner log. self-reported: typed in by the miner. field: our own test runs. */
export type LedgerSource = 'pool' | 'log' | 'self-reported' | 'field'
export type LedgerUnit = 'solutions' | 'h' | 'result'

export const KIND_UNIT: Record<LedgerKind, LedgerUnit> = {
  solutions: 'solutions',
  'rental-hours': 'h',
  'rig-online-hours': 'h',
  'diagnosis-saved': 'result',
}

export const LEDGER_SOURCE_LABEL: Record<LedgerSource, string> = {
  pool: 'pool',
  log: 'from log',
  'self-reported': 'self-reported',
  field: 'field test',
}

/** One entry as the API hands it out: never the HMAC lookup tag, never a wallet or an IP. */
export type PublicEntry = {
  seq: number
  epoch: number
  /** the worker's display form, shortened ("QC.5070ti-a"); anonymised further on the page strip */
  show: string
  /** "7× RTX 5080", "RTX 5070 Ti · Ryzen 9 9950X", or empty */
  hw: string
  kind: LedgerKind
  value: number
  unit: LedgerUnit
  source: LedgerSource
  at: number
  hash: string
}

export type EpochTotal = {
  epoch: number
  solutions: number
  rentalHours: number
  onlineHours: number
  results: number
}

/** GET /api/pool/ledger?worker=QC.x */
export type WorkerRecord = {
  show: string
  entries: PublicEntry[]
  epochs: EpochTotal[]
  total: number
  head: string
}

/** GET /api/pool/ledger */
export type PoolRecord = {
  entries: number
  solutions: number
  rigs: number
  rentalHours: number
  onlineHours: number
  results: number
  epochs: number
  firstEpoch?: number
  lastEpoch?: number
  head: string
  verified: boolean
  newest: PublicEntry[]
}

export const GENESIS = '0'.repeat(64)

const int = (n: number) => Math.round(n).toLocaleString('en-US')
/** hours: whole numbers plain, otherwise one decimal */
export const fmtHours = (h: number) =>
  Number.isInteger(h)
    ? int(h)
    : (Math.round(h * 10) / 10).toLocaleString('en-US', {
        maximumFractionDigits: 1,
      })

/** "QC.5070ti-a" stays; long names keep their start and end: "QC.4090-rac…a-2". */
export function displayTag(worker: string): string {
  const p = POOL.workerPrefix
  const body = worker.toUpperCase().startsWith(p.toUpperCase())
    ? worker.slice(p.length)
    : worker
  return `${p}${body.length <= 12 ? body : `${body.slice(0, 8)}…${body.slice(-3)}`}`
}

/** For the public strip: the first four characters of the name only, "QC.5070··". */
export function anonTag(show: string): string {
  const p = POOL.workerPrefix
  const body = show.startsWith(p) ? show.slice(p.length) : show
  return `${p}${body.replace(/…/g, '').slice(0, 4)}··`
}

/** What happened, in a few words: "1,400 solutions", "12 h rented", "41.5 h online", "diagnosis saved". */
export function entryWhat(e: Pick<PublicEntry, 'kind' | 'value'>): string {
  switch (e.kind) {
    case 'solutions':
      return `${int(e.value)} solution${e.value === 1 ? '' : 's'}`
    case 'rental-hours':
      return `${fmtHours(e.value)} h rented`
    case 'rig-online-hours':
      return `${fmtHours(e.value)} h online`
    case 'diagnosis-saved':
      return e.value === 1
        ? 'diagnosis saved'
        : `${int(e.value)} diagnoses saved`
  }
}

/** The parts of one journal line: E235 · 1,400 solutions · QC.5070ti-a · from log. Rentals name the hardware. */
export function entryParts(
  e: PublicEntry,
  opts: { anon?: boolean } = {}
): string[] {
  const who = opts.anon ? anonTag(e.show) : e.show
  const third = e.kind === 'rental-hours' && e.hw ? e.hw : who
  return [`E${e.epoch}`, entryWhat(e), third, LEDGER_SOURCE_LABEL[e.source]]
}

export const entryLine = (e: PublicEntry, opts: { anon?: boolean } = {}) =>
  entryParts(e, opts).join(' · ')

/** "3f9a1c…a21e" */
export const shortHash = (h: string, n = 6) =>
  h.length > n * 2 ? `${h.slice(0, n)}…${h.slice(-4)}` : h
