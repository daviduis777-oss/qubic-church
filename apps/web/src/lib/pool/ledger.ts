/**
 * The record: an append-only journal of every contribution through Aigarth Pool, one entry each.
 * Same Upstash / Vercel KV REST store as store.ts; without that env (dev, tests) it is memory, per instance.
 * Server only by use: the API routes and the pool page import it; the browser reads ledger-view.ts.
 *
 * Every entry carries sha256(previous hash + this entry), so the chain is tamper evident: change, drop or
 * reorder one entry and every hash after it stops matching. Appends are atomic on the head (a compare and
 * set in one script), so two writers can never fork the chain.
 *
 * Stored per entry: epoch, the worker as an HMAC (FORUM_SECRET) for lookup plus its shortened display form,
 * a hardware summary, kind, value, unit, source, time. Never stored: wallet, seed, IP, the log text.
 */
import { createHash, createHmac } from 'node:crypto'
import { LEDGER, MEASURE } from './config.ts'
import { epochAt } from './epoch.ts'
import {
  anonTag,
  displayTag,
  type EpochTotal,
  GENESIS,
  KIND_UNIT,
  type LedgerKind,
  type LedgerSource,
  type LedgerUnit,
  type PoolRecord,
  type PublicEntry,
  type WorkerRecord,
} from './ledger-view.ts'
import { type Checked, normalizeCpu, normalizeGpu } from './measure.ts'
import { containsAddress, containsSeed } from './redact.ts'
import { validWorker } from './rig.ts'
import type { PoolWorkerStat } from './stats-adapter.ts'

export type LedgerEntry = {
  v: 1
  seq: number
  epoch: number
  /** HMAC of the worker name: the lookup key, never shown */
  tag: string
  show: string
  hw: string
  kind: LedgerKind
  value: number
  unit: LedgerUnit
  source: LedgerSource
  at: number
  prev: string
  hash: string
}

/** An entry before it joins the chain. */
export type Draft = Omit<
  LedgerEntry,
  'v' | 'seq' | 'prev' | 'hash' | 'at' | 'tag' | 'show'
> & { worker: string }

/* ---------------- the chain ---------------- */

/** Field order is fixed, so the same entry always hashes the same. */
const ORDER = [
  'v',
  'seq',
  'epoch',
  'tag',
  'show',
  'hw',
  'kind',
  'value',
  'unit',
  'source',
  'at',
  'prev',
] as const

export const canonical = (e: Omit<LedgerEntry, 'hash'>) =>
  JSON.stringify(ORDER.map(k => [k, e[k]]))

/** sha256 of the previous hash and this entry */
export const entryHash = (e: Omit<LedgerEntry, 'hash'>) =>
  createHash('sha256')
    .update(`qc-pool-ledger|${e.prev}|${canonical(e)}`)
    .digest('hex')

/** Walk the chain: every entry must point at the one before it, count up by one, and hash to what it says. */
export function verifyChain(
  entries: LedgerEntry[]
): { ok: true; head: string } | { ok: false; brokenAt: number; head: string } {
  let prev = GENESIS
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!
    const { hash, ...body } = e
    if (e.seq !== i + 1 || e.prev !== prev || entryHash(body) !== hash)
      return {
        ok: false,
        brokenAt: i + 1,
        head: entries.at(-1)?.hash ?? GENESIS,
      }
    prev = hash
  }
  return { ok: true, head: prev }
}

/** Lookup key for a worker: HMAC-SHA256 with FORUM_SECRET, case-insensitive like the pool. */
export const workerTag = (worker: string, secret: string) =>
  createHmac('sha256', secret)
    .update(`qc-pool-ledger|v1|${worker.trim().toLowerCase()}`)
    .digest('hex')
    .slice(0, 32)

/* ---------------- storage ---------------- */

export interface LedgerBackend {
  kind: 'rest' | 'memory'
  /** every entry, oldest first; `ok` is false when the store could not be read */
  read(): Promise<{ rows: string[]; ok: boolean }>
  /** append only if the head is still `prev` ("seq:hash"); false when another write got there first */
  append(prev: string, next: string, row: string): Promise<boolean>
  /** count one hit on a rate key that expires after ttlS; returns the new count */
  hit(key: string, ttlS: number): Promise<number>
}

export const LEDGER_KEY = 'pool:ledger:entries'
export const HEAD_KEY = 'pool:ledger:head'
export const headOf = (e?: Pick<LedgerEntry, 'seq' | 'hash'>) =>
  e ? `${e.seq}:${e.hash}` : `0:${GENESIS}`

export function memoryLedger(
  state: { rows: string[]; head: string; hits: Map<string, number> } = {
    rows: [],
    head: headOf(),
    hits: new Map(),
  }
): LedgerBackend & { state: typeof state } {
  return {
    kind: 'memory',
    state,
    async read() {
      return { rows: [...state.rows], ok: true }
    },
    async append(prev, next, row) {
      if (state.head !== prev) return false
      state.rows.push(row)
      state.head = next
      return true
    },
    async hit(key) {
      const n = (state.hits.get(key) ?? 0) + 1
      state.hits.set(key, n)
      return n
    },
  }
}

/** Compare and set on the head, then push: one script, so the chain never forks. */
const APPEND_LUA = `local h = redis.call('GET', KEYS[1])
if h == false then h = ARGV[4] end
if h ~= ARGV[1] then return 0 end
redis.call('RPUSH', KEYS[2], ARGV[3])
redis.call('SET', KEYS[1], ARGV[2])
return 1`

export function restLedger(
  url: string,
  token: string,
  fetcher: typeof fetch = fetch
): LedgerBackend {
  const pipe = async (cmds: string[][]) => {
    const r = await fetcher(`${url.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cmds),
      cache: 'no-store',
    })
    if (!r.ok) throw new Error(`kv ${r.status}`)
    return (await r.json()) as { result?: unknown; error?: string }[]
  }
  return {
    kind: 'rest',
    async read() {
      try {
        const [x] = await pipe([['LRANGE', LEDGER_KEY, '0', '-1']])
        return {
          rows: Array.isArray(x?.result)
            ? (x.result as unknown[]).filter(
                (v): v is string => typeof v === 'string'
              )
            : [],
          ok: true,
        }
      } catch {
        return { rows: [], ok: false }
      }
    },
    async append(prev, next, row) {
      const [x] = await pipe([
        [
          'EVAL',
          APPEND_LUA,
          '2',
          HEAD_KEY,
          LEDGER_KEY,
          prev,
          next,
          row,
          headOf(),
        ],
      ])
      if (x?.error) throw new Error(`kv ${x.error}`)
      return Number(x?.result) === 1
    },
    async hit(key, ttlS) {
      const res = await pipe([
        ['INCR', key],
        ['EXPIRE', key, String(ttlS)],
      ])
      const n = Number(res[0]?.result)
      if (!Number.isFinite(n)) throw new Error('kv')
      return n
    },
  }
}

const g = globalThis as unknown as {
  __poolLedgerMem?: Parameters<typeof memoryLedger>[0]
  __poolLedger?: ReturnType<typeof createLedger>
}

export function defaultLedgerBackend(): LedgerBackend {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token) return restLedger(url, token)
  g.__poolLedgerMem ??= { rows: [], head: headOf(), hits: new Map() }
  return memoryLedger(g.__poolLedgerMem)
}

/** The HMAC key: FORUM_SECRET. Only dev and tests fall back to a fixed one; production refuses to write. */
export function ledgerSecret(
  env: Record<string, string | undefined> = process.env
): string | null {
  const s = env.FORUM_SECRET
  if (s && s.length >= 16) return s
  return env.NODE_ENV === 'production'
    ? null
    : 'qc-pool-ledger-dev-secret-not-for-production'
}

/** Read a stored entry back, defensively: anything malformed is kept out of totals but still breaks the chain. */
export function parseEntry(row: string): LedgerEntry | null {
  try {
    const e = JSON.parse(row) as LedgerEntry
    if (
      e?.v !== 1 ||
      typeof e.seq !== 'number' ||
      typeof e.hash !== 'string' ||
      typeof e.prev !== 'string' ||
      !(e.kind in KIND_UNIT)
    )
      return null
    return e
  } catch {
    return null
  }
}

/* ---------------- what may be written ---------------- */

/** What the browser may post. The server decides the source; the browser cannot claim "pool" or "field". */
export type ContributionInput =
  | {
      type: 'log'
      worker: string
      epoch?: number
      solutions?: number
      uptimeMin?: number
      gpu?: string | null
      gpuCount?: number
      cpu?: string
      saved?: boolean
    }
  | {
      type: 'rental'
      worker: string
      epoch?: number
      hours: number
      gpu?: string | null
      gpuCount?: number
      cpu?: string
    }

const fin = (v: unknown, min: number, max: number) => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max
    ? n
    : undefined
}
const clean = (v: unknown, max = 48) =>
  typeof v === 'string'
    ? [...v]
        .filter(c => c.charCodeAt(0) >= 32)
        .join('')
        .trim()
        .slice(0, max)
    : ''
const tenth = (n: number) => Math.round(n * 10) / 10

/** "7× RTX 5080", "RTX 5070 Ti · Ryzen 9 9950X", "Ryzen 9 7950X"; empty when nothing was given. */
export function hwSummary(
  gpu: string | null | undefined,
  gpuCount: number | undefined,
  cpu: string | undefined
): string {
  const gn = gpu ? normalizeGpu(gpu) : null
  const g = gn ? `${(gpuCount ?? 1) > 1 ? `${gpuCount}× ` : ''}${gn}` : ''
  const c = cpu ? normalizeCpu(cpu) : ''
  return [g, c && c !== 'Unknown' ? c : '']
    .filter(Boolean)
    .join(' · ')
    .slice(0, 64)
}

/**
 * Validate one contribution and turn it into entries. A log gives solutions and online hours (and
 * "diagnosis saved" when it came through Fix my rig's save); a rental gives rented hours, self-reported.
 */
export function buildEntries(
  raw: unknown,
  now: Date = new Date()
): Checked<Draft[]> {
  if (!raw || typeof raw !== 'object')
    return { ok: false, error: 'Nothing to record.' }
  const r = raw as Record<string, unknown>
  if (r.type !== 'log' && r.type !== 'rental')
    return { ok: false, error: 'Unknown kind of contribution.' }
  const texts = [r.worker, r.gpu, r.cpu].map(x => clean(x, 200))
  if (texts.some(t => containsAddress(t) || containsSeed(t)))
    return {
      ok: false,
      error: 'That looks like a wallet string. The record never holds one.',
    }
  const worker = clean(r.worker, 200)
  if (!validWorker(worker))
    return {
      ok: false,
      error:
        'A worker name starts with QC. and uses letters, numbers and . - _ only.',
    }
  const cur = epochAt(now).epoch
  const epoch = r.epoch === undefined ? cur : fin(r.epoch, 1, 100_000)
  if (
    epoch === undefined ||
    !Number.isInteger(epoch) ||
    (epoch !== cur && epoch !== cur - 1)
  )
    return {
      ok: false,
      error: `Only this epoch (${cur}) or the last one (${cur - 1}) can be recorded.`,
    }
  const gpuRaw = clean(r.gpu)
  const cpuRaw = clean(r.cpu)
  const gpuCount =
    r.gpuCount === undefined || r.gpuCount === null || r.gpuCount === ''
      ? undefined
      : fin(r.gpuCount, 1, LEDGER.maxCards)
  if (
    r.gpuCount !== undefined &&
    r.gpuCount !== null &&
    r.gpuCount !== '' &&
    (gpuCount === undefined || !Number.isInteger(gpuCount))
  )
    return {
      ok: false,
      error: `Cards: a whole number from 1 to ${LEDGER.maxCards}.`,
    }
  const hw = hwSummary(gpuRaw || null, gpuCount, cpuRaw || undefined)
  const base = { worker, epoch, hw }

  if (r.type === 'rental') {
    const hours = fin(r.hours, 0.1, LEDGER.maxHours)
    if (hours === undefined)
      return {
        ok: false,
        error: `Hours rented: a number from 0.1 to ${LEDGER.maxHours} (one epoch).`,
      }
    if (!hw)
      return {
        ok: false,
        error: 'Say what you rented, for example 7 cards of RTX 5080.',
      }
    return {
      ok: true,
      value: [
        {
          ...base,
          kind: 'rental-hours',
          value: tenth(hours),
          unit: 'h',
          source: 'self-reported',
        },
      ],
    }
  }

  const out: Draft[] = []
  if (r.solutions !== undefined && r.solutions !== null && r.solutions !== '') {
    const sol = fin(r.solutions, 0, 10_000_000)
    if (sol === undefined || !Number.isInteger(sol))
      return { ok: false, error: 'Solutions: a whole number.' }
    if (sol > 0)
      out.push({
        ...base,
        kind: 'solutions',
        value: sol,
        unit: 'solutions',
        source: 'log',
      })
  }
  if (r.uptimeMin !== undefined && r.uptimeMin !== null && r.uptimeMin !== '') {
    const up = fin(r.uptimeMin, 0, LEDGER.maxHours * 60)
    if (up === undefined)
      return {
        ok: false,
        error: `Online time: up to ${LEDGER.maxHours} hours in one epoch.`,
      }
    // under the field rule's first window there is nothing to judge, and nothing worth a line
    if (up >= MEASURE.minWindowMin)
      out.push({
        ...base,
        kind: 'rig-online-hours',
        value: tenth(up / 60),
        unit: 'h',
        source: 'log',
      })
  }
  if (r.saved === true)
    out.push({
      ...base,
      kind: 'diagnosis-saved',
      value: 1,
      unit: 'result',
      source: 'log',
    })
  if (!out.length)
    return {
      ok: false,
      error: 'Nothing to record yet: no solutions and under 20 minutes online.',
    }
  return { ok: true, value: out }
}

/* ---------------- totals ---------------- */

const pub = (e: LedgerEntry): PublicEntry => ({
  seq: e.seq,
  epoch: e.epoch,
  show: e.show,
  hw: e.hw,
  kind: e.kind,
  value: e.value,
  unit: e.unit,
  source: e.source,
  at: e.at,
  hash: e.hash,
})

/**
 * Counted conservatively. A log's counter runs from the miner's start, so two logs of one run overlap:
 * per rig and epoch, solutions and online hours count the largest entry, never the sum. When the pool
 * has reported a rig's epoch, the pool's number stands and logs for it are not counted. Rentals and
 * saved diagnoses are separate events and add up.
 */
export function epochTotals(
  entries: LedgerEntry[]
): Map<string, EpochTotal & { tag: string }> {
  const m = new Map<
    string,
    EpochTotal & {
      tag: string
      pool: { solutions: number; onlineHours: number }
      logs: { solutions: number; onlineHours: number }
      hasPool: { solutions: boolean; onlineHours: boolean }
    }
  >()
  for (const e of entries) {
    const k = `${e.tag}|${e.epoch}`
    let t = m.get(k)
    if (!t) {
      t = {
        tag: e.tag,
        epoch: e.epoch,
        solutions: 0,
        rentalHours: 0,
        onlineHours: 0,
        results: 0,
        pool: { solutions: 0, onlineHours: 0 },
        logs: { solutions: 0, onlineHours: 0 },
        hasPool: { solutions: false, onlineHours: false },
      }
      m.set(k, t)
    }
    if (e.kind === 'solutions' || e.kind === 'rig-online-hours') {
      const f = e.kind === 'solutions' ? 'solutions' : 'onlineHours'
      if (e.source === 'pool') {
        t.hasPool[f] = true
        t.pool[f] = Math.max(t.pool[f], e.value)
      } else t.logs[f] = Math.max(t.logs[f], e.value)
    } else if (e.kind === 'rental-hours')
      t.rentalHours = tenth(t.rentalHours + e.value)
    else t.results += e.value
  }
  const out = new Map<string, EpochTotal & { tag: string }>()
  for (const [k, t] of m) {
    out.set(k, {
      tag: t.tag,
      epoch: t.epoch,
      solutions: t.hasPool.solutions ? t.pool.solutions : t.logs.solutions,
      onlineHours: t.hasPool.onlineHours
        ? t.pool.onlineHours
        : t.logs.onlineHours,
      rentalHours: t.rentalHours,
      results: t.results,
    })
  }
  return out
}

export function poolTotals(
  entries: LedgerEntry[],
  verified: boolean,
  head: string,
  newest: number = LEDGER.newest
): PoolRecord {
  const per = [...epochTotals(entries).values()]
  const epochs = [...new Set(entries.map(e => e.epoch))].sort((a, b) => a - b)
  return {
    entries: entries.length,
    solutions: per.reduce((a, t) => a + t.solutions, 0),
    rigs: new Set(entries.map(e => e.tag)).size,
    rentalHours: tenth(per.reduce((a, t) => a + t.rentalHours, 0)),
    onlineHours: tenth(per.reduce((a, t) => a + t.onlineHours, 0)),
    results: per.reduce((a, t) => a + t.results, 0),
    epochs: epochs.length,
    firstEpoch: epochs[0],
    lastEpoch: epochs.at(-1),
    head,
    verified,
    // the page strip is public once the pool is: names cut to their first four characters
    newest: entries
      .slice(-newest)
      .reverse()
      .map(e => ({ ...pub(e), show: anonTag(e.show) })),
  }
}

/* ---------------- the ledger ---------------- */

type Opts = {
  backend?: LedgerBackend
  secret?: string | null
  now?: () => Date
}
export type RecordCtx = {
  ip?: string /** the save already counted against its own quota (Fix my rig) */
  skipQuota?: boolean
}
export type RecordResult = Checked<PublicEntry[]> & { status?: number }

const ipKey = (ip: string, day: string) =>
  `pool:ledger:rate:${day}:${createHash('sha256').update(`qc-pool:${ip}`).digest('hex').slice(0, 24)}`

export function createLedger(opts: Opts = {}) {
  const backend = opts.backend ?? defaultLedgerBackend()
  const secret = opts.secret === undefined ? ledgerSecret() : opts.secret
  const now = opts.now ?? (() => new Date())
  let cache: { at: number; rec: PoolRecord } | null = null

  async function all(): Promise<{
    list: LedgerEntry[]
    parsed: (LedgerEntry | null)[]
    ok: boolean
  }> {
    const { rows, ok } = await backend.read()
    const parsed = rows.map(parseEntry)
    return { list: parsed.filter((e): e is LedgerEntry => !!e), parsed, ok }
  }

  /** Append drafts to the chain, retrying when another write moved the head. */
  async function append(
    drafts: (Draft & { at?: number })[],
    list: LedgerEntry[]
  ): Promise<LedgerEntry[]> {
    if (!secret) throw new Error('no secret')
    let chain = list
    const done: LedgerEntry[] = []
    for (let attempt = 0; attempt < 5; attempt++) {
      const written: LedgerEntry[] = []
      let last = chain.at(-1)
      let ok = true
      for (const d of drafts) {
        const { worker, ...rest } = d
        const body: Omit<LedgerEntry, 'hash'> = {
          v: 1,
          seq: (last?.seq ?? 0) + 1,
          ...rest,
          tag: workerTag(worker, secret),
          show: displayTag(worker),
          at: d.at ?? now().getTime(),
          prev: last?.hash ?? GENESIS,
        }
        const e: LedgerEntry = { ...body, hash: entryHash(body) }
        // keep the stored field order stable; the hash does not depend on it
        const row = JSON.stringify({
          v: e.v,
          seq: e.seq,
          epoch: e.epoch,
          tag: e.tag,
          show: e.show,
          hw: e.hw,
          kind: e.kind,
          value: e.value,
          unit: e.unit,
          source: e.source,
          at: e.at,
          prev: e.prev,
          hash: e.hash,
        })
        if (!(await backend.append(headOf(last), headOf(e), row))) {
          ok = false
          break
        }
        written.push(e)
        last = e
      }
      done.push(...written)
      if (written.length) cache = null
      if (ok) return done
      // someone else wrote first: keep what landed, re-read, chain the rest on the new head
      drafts = drafts.slice(written.length)
      chain = (await all()).list
    }
    throw new Error('The record is busy. Try again in a moment.')
  }

  return {
    backend,
    /** Validate, check limits, skip what is already in the record, append. */
    async record(input: unknown, ctx: RecordCtx = {}): Promise<RecordResult> {
      if (!secret)
        return {
          ok: false,
          error: 'The record is not set up on this server.',
          status: 503,
        }
      const built = buildEntries(input, now())
      if (!built.ok) return { ...built, status: 422 }
      const { list, ok } = await all()
      if (!ok)
        return {
          ok: false,
          error: 'The record could not be read. Try again in a moment.',
          status: 503,
        }
      const tag = workerTag(built.value[0]!.worker, secret)
      const mine = list.filter(e => e.tag === tag)
      // the same line twice (a double tap, the same log saved again) is written once
      const fresh = built.value.filter(
        d =>
          !mine.some(
            e =>
              e.epoch === d.epoch &&
              e.kind === d.kind &&
              e.value === d.value &&
              e.source === d.source &&
              e.hw === d.hw
          )
      )
      if (!fresh.length)
        return { ok: false, error: 'Already in the record.', status: 409 }
      const inEpoch = mine.filter(e => e.epoch === fresh[0]!.epoch).length
      if (inEpoch + fresh.length > LEDGER.perWorkerEpoch)
        return {
          ok: false,
          error: `That is ${LEDGER.perWorkerEpoch} entries for this rig in epoch ${fresh[0]!.epoch}. The next epoch starts a new page.`,
          status: 429,
        }
      if (!ctx.skipQuota) {
        const n = await backend.hit(
          ipKey(ctx.ip ?? 'local', now().toISOString().slice(0, 10)),
          90_000
        )
        if (n > LEDGER.postsPerDay)
          return {
            ok: false,
            error: `That is today's ${LEDGER.postsPerDay} records from this connection. Try again tomorrow.`,
            status: 429,
          }
      }
      try {
        return { ok: true, value: (await append(fresh, list)).map(pub) }
      } catch (e) {
        return {
          ok: false,
          error:
            e instanceof Error && e.message !== 'no secret'
              ? e.message
              : 'Not recorded.',
          status: 503,
        }
      }
    },

    /**
     * The pool's own numbers, once the stats feed exists: one "pool" entry per worker and kind, written by
     * the server only. TODO(Bob): call this from a scheduled job at each epoch close once POOL.statsUrl
     * exists (poolStatsAdapter().fetch(epoch) gives the payload). Until then nothing calls it.
     */
    async ingestPool(payload: unknown): Promise<number> {
      if (!secret) return 0
      const drafts = poolDrafts(payload, now())
      if (!drafts.length) return 0
      const { list, ok } = await all()
      if (!ok) return 0
      const fresh = drafts.filter(d => {
        const tag = workerTag(d.worker, secret)
        return !list.some(
          e =>
            e.tag === tag &&
            e.epoch === d.epoch &&
            e.kind === d.kind &&
            e.source === 'pool' &&
            e.value === d.value
        )
      })
      if (!fresh.length) return 0
      return (await append(fresh, list)).length
    },

    /** One worker's entries, newest epoch first (newest entry first within it), and epoch totals. null when there are none. */
    async forWorker(worker: string): Promise<WorkerRecord | null> {
      if (!secret || !validWorker(worker)) return null
      const tag = workerTag(worker, secret)
      const { list } = await all()
      const mine = list.filter(e => e.tag === tag)
      if (!mine.length) return null
      const epochs = [...epochTotals(mine).values()]
        .map(({ tag: _t, ...t }) => t)
        .sort((a, b) => b.epoch - a.epoch)
      return {
        show: displayTag(worker),
        entries: [...mine]
          .sort((a, b) => b.epoch - a.epoch || b.seq - a.seq)
          .slice(0, LEDGER.workerEntries)
          .map(pub),
        epochs,
        total: mine.length,
        head: list.at(-1)?.hash ?? GENESIS,
      }
    },

    /** Pool-wide totals, the newest few entries and the chain head; verified on every recompute. */
    async totals(): Promise<PoolRecord> {
      const t = now().getTime()
      if (cache && t - cache.at < LEDGER.cacheMs) return cache.rec
      const { list, parsed } = await all()
      const v = parsed.some(e => !e)
        ? { ok: false as const }
        : verifyChain(list)
      const rec = poolTotals(list, v.ok, list.at(-1)?.hash ?? GENESIS)
      cache = { at: t, rec }
      return rec
    },

    async verify() {
      const { list, parsed } = await all()
      if (parsed.some(e => !e))
        return {
          ok: false as const,
          brokenAt: parsed.findIndex(e => !e) + 1,
          head: list.at(-1)?.hash ?? GENESIS,
        }
      return verifyChain(list)
    },
  }
}

/** Pool payload to drafts: our prefix only, solutions and online hours, source "pool". Wallet fields are never read. */
export function poolDrafts(payload: unknown, now: Date = new Date()): Draft[] {
  const p = payload as { epoch?: unknown; workers?: unknown; data?: unknown }
  const list = (
    Array.isArray(payload)
      ? payload
      : Array.isArray(p?.workers)
        ? p.workers
        : Array.isArray(p?.data)
          ? p.data
          : []
  ) as Partial<PoolWorkerStat & { workerName: unknown; name: unknown }>[]
  const fallback = fin(p?.epoch, 1, 100_000) ?? epochAt(now).epoch
  const out: Draft[] = []
  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue
    const worker = clean(raw.worker ?? raw.workerName ?? raw.name, 200)
    if (!validWorker(worker)) continue
    const epoch = fin(raw.epoch, 1, 100_000) ?? fallback
    const hw = hwSummary(
      clean(raw.gpu) || null,
      fin(raw.gpuCount, 1, LEDGER.maxCards),
      clean(raw.cpu) || undefined
    )
    const sol = fin(raw.solutions, 1, 10_000_000)
    const online = fin(
      raw.onlineMinutes,
      MEASURE.minWindowMin,
      LEDGER.maxHours * 60
    )
    if (sol !== undefined)
      out.push({
        worker,
        epoch,
        hw,
        kind: 'solutions',
        value: Math.round(sol),
        unit: 'solutions',
        source: 'pool',
      })
    if (online !== undefined)
      out.push({
        worker,
        epoch,
        hw,
        kind: 'rig-online-hours',
        value: tenth(online / 60),
        unit: 'h',
        source: 'pool',
      })
  }
  return out
}

export function ledger() {
  g.__poolLedger ??= createLedger()
  return g.__poolLedger
}
