/**
 * The BPP-9000 record, server side: an append-only hash chain of calls and results in the same Upstash / Vercel
 * KV REST store as store.ts (memory in dev and tests). Same design as the pool's ledger: every entry carries
 * sha256(previous hash + entry), and appends are a compare-and-set on the head, so the chain never forks.
 *
 * tick() is the whole job, run every half hour by a GitHub Actions schedule and by any visitor:
 *  1. seal the call for the current hour, if the network has made one and it is not sealed yet;
 *  2. check every closed hour that has a call and no result yet, against the exchange's hourly candle.
 * It is idempotent: running it twice, or from two places at once, appends nothing twice.
 */
import { createHash } from 'node:crypto'
import { type CallEntry, RECORD_GENESIS, type RecordEntry, type ResultEntry, type Side } from './record-view.ts'

export const RECORD_KEY = 'bpp:record:entries'
export const RECORD_HEAD = 'bpp:record:head'

/** A call is sealed only while its hour still has this many seconds to run. */
export const SEAL_BEFORE_CLOSE_S = 60
/** A closed hour is checked once its candle has had this long to settle. */
export const CHECK_AFTER_CLOSE_S = 90
/** Closed hours older than this without a result are left alone (a gap is shown, never back-filled). */
export const CHECK_WINDOW_S = 72 * 3600

type Body<T extends RecordEntry> = Omit<T, 'hash'>
const ORDER: Record<RecordEntry['kind'], string[]> = {
  call: ['kind', 'seq', 'prev', 'hour', 'side', 'net', 'epoch', 'source', 'at'],
  result: ['kind', 'seq', 'prev', 'hour', 'open', 'close', 'source', 'at'],
}

export const canonicalEntry = (e: Body<RecordEntry>) => JSON.stringify(ORDER[e.kind].map(k => [k, (e as Record<string, unknown>)[k]]))
export const recordHash = (e: Body<RecordEntry>) => createHash('sha256').update(`qc-bpp-record|${e.prev}|${canonicalEntry(e)}`).digest('hex')
const headOf = (e?: Pick<RecordEntry, 'seq' | 'hash'>) => (e ? `${e.seq}:${e.hash}` : `0:${RECORD_GENESIS}`)

export function verifyRecord(entries: RecordEntry[]): { ok: true; head: string } | { ok: false; brokenAt: number; head: string } {
  let prev = RECORD_GENESIS
  for (let i = 0; i < entries.length; i++) {
    const { hash, ...body } = entries[i]!
    if (body.seq !== i + 1 || body.prev !== prev || recordHash(body) !== hash) return { ok: false, brokenAt: i + 1, head: entries.at(-1)?.hash ?? RECORD_GENESIS }
    prev = hash
  }
  return { ok: true, head: prev }
}

const SIDES: Side[] = ['up', 'down', 'skip']
export function parseRecordEntry(row: string): RecordEntry | null {
  try {
    const e = JSON.parse(row) as RecordEntry
    if (!e || typeof e.seq !== 'number' || typeof e.hour !== 'number' || typeof e.hash !== 'string') return null
    if (e.kind === 'call') return SIDES.includes(e.side) ? e : null
    if (e.kind === 'result') return Number.isFinite(e.open) && Number.isFinite(e.close) ? e : null
    return null
  } catch {
    return null
  }
}

/* ---------------- storage ---------------- */

export interface RecordBackend {
  kind: 'rest' | 'memory'
  read(): Promise<{ rows: string[]; ok: boolean }>
  append(prev: string, next: string, row: string): Promise<boolean>
  /** one hit on a counter that expires after ttlS; returns the count */
  hit(key: string, ttlS: number): Promise<number>
}

export function memoryRecord(state: { rows: string[]; head: string; hits: Map<string, number> } = { rows: [], head: headOf(), hits: new Map() }): RecordBackend & { state: typeof state } {
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

const APPEND_LUA = `local h = redis.call('GET', KEYS[1])
if h == false then h = ARGV[4] end
if h ~= ARGV[1] then return 0 end
redis.call('RPUSH', KEYS[2], ARGV[3])
redis.call('SET', KEYS[1], ARGV[2])
return 1`

export function restRecord(url: string, token: string, fetcher: typeof fetch = fetch): RecordBackend {
  const pipe = async (cmds: string[][]) => {
    const r = await fetcher(`${url.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
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
        const [x] = await pipe([['LRANGE', RECORD_KEY, '0', '-1']])
        return { rows: Array.isArray(x?.result) ? (x.result as unknown[]).filter((v): v is string => typeof v === 'string') : [], ok: true }
      } catch {
        return { rows: [], ok: false }
      }
    },
    async append(prev, next, row) {
      const [x] = await pipe([['EVAL', APPEND_LUA, '2', RECORD_HEAD, RECORD_KEY, prev, next, row, headOf()]])
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

const g = globalThis as unknown as { __bppRecordMem?: Parameters<typeof memoryRecord>[0] }
export function defaultRecordBackend(): RecordBackend {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token) return restRecord(url, token)
  g.__bppRecordMem ??= { rows: [], head: headOf(), hits: new Map() }
  return memoryRecord(g.__bppRecordMem)
}

export async function readRecord(backend: RecordBackend = defaultRecordBackend()): Promise<{ entries: RecordEntry[]; ok: boolean }> {
  const { rows, ok } = await backend.read()
  return { entries: rows.map(parseRecordEntry).filter((e): e is RecordEntry => e != null), ok }
}

/* ---------------- the tick ---------------- */

export type LiveCall = { side: Side; net: string; epoch: number; source: string }
export type Candle = { open: number; close: number; source: string }
export type TickDeps = {
  backend?: RecordBackend
  now?: number
  /** the network's call for the hour starting at `hour` (unix s), or null when it has made none */
  call: (hour: number) => Promise<LiveCall | null>
  /** the closed hourly candle starting at `hour`, or null when the exchange has none yet */
  candle: (hour: number) => Promise<Candle | null>
}
export type TickResult = { ok: boolean; sealed: number | null; checked: number[]; reason?: string }

async function appendOne<T extends RecordEntry>(backend: RecordBackend, make: (seq: number, prev: string) => Body<T>, stillNeeded: (entries: RecordEntry[]) => boolean): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { entries, ok } = await readRecord(backend)
    if (!ok) throw new Error('store unreadable')
    if (!stillNeeded(entries)) return false
    const last = entries.at(-1)
    const body = make((last?.seq ?? 0) + 1, last?.hash ?? RECORD_GENESIS)
    const entry = { ...body, hash: recordHash(body as Body<RecordEntry>) } as unknown as RecordEntry
    if (await backend.append(headOf(last), headOf(entry), JSON.stringify(entry))) return true
  }
  return false
}

export async function tick(deps: TickDeps): Promise<TickResult> {
  const backend = deps.backend ?? defaultRecordBackend()
  const now = deps.now ?? Date.now()
  const nowS = Math.floor(now / 1000)
  const hour = nowS - (nowS % 3600)
  const at = new Date(now).toISOString()
  const { entries, ok } = await readRecord(backend)
  if (!ok) return { ok: false, sealed: null, checked: [], reason: 'store unreadable' }

  let sealed: number | null = null
  const hasCall = (es: RecordEntry[], h: number) => es.some(e => e.kind === 'call' && e.hour === h)
  if (!hasCall(entries, hour) && nowS < hour + 3600 - SEAL_BEFORE_CLOSE_S) {
    const c = await deps.call(hour).catch(() => null)
    // the time is taken again after the network answered: a call is never sealed in the hour's last minute
    const sealMs = deps.now ?? Date.now()
    if (c && SIDES.includes(c.side) && sealMs / 1000 < hour + 3600 - SEAL_BEFORE_CLOSE_S) {
      const sealAt = new Date(sealMs).toISOString()
      const done = await appendOne<CallEntry>(
        backend,
        (seq, prev) => ({ kind: 'call', seq, prev, hour, side: c.side, net: c.net, epoch: c.epoch, source: c.source, at: sealAt }),
        es => !hasCall(es, hour),
      )
      if (done) sealed = hour
    }
  }

  const checked: number[] = []
  const hasResult = (es: RecordEntry[], h: number) => es.some(e => e.kind === 'result' && e.hour === h)
  const due = entries
    .filter((e): e is CallEntry => e.kind === 'call')
    .map(e => e.hour)
    .filter(h => h + 3600 + CHECK_AFTER_CLOSE_S <= nowS && h + 3600 >= nowS - CHECK_WINDOW_S && !hasResult(entries, h))
  for (const h of due) {
    const k = await deps.candle(h).catch(() => null)
    if (!k || !(k.open > 0) || !(k.close > 0)) continue
    const done = await appendOne<ResultEntry>(backend, (seq, prev) => ({ kind: 'result', seq, prev, hour: h, open: k.open, close: k.close, source: k.source, at }), es => !hasResult(es, h))
    if (done) checked.push(h)
  }
  return { ok: true, sealed, checked }
}
