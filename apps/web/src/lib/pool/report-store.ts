/**
 * Report storage, private: the same Upstash / Vercel KV REST store as store.ts and ledger.ts; without that
 * env (dev, tests) it is memory, per instance. Server only by use: the API routes and the review page import it.
 *
 * Keys:
 *   pool:report:ids          a list of ids, newest first, trimmed to REPORT.keep
 *   pool:report:r:<id>       the report as JSON (StoredReport), expires after REPORT.ttlDays
 *   pool:report:img:<id>     its screenshot as a data URL, when there is one, same expiry
 *   pool:report:rate:<day>:<hash>   the day's count for one connection: an HMAC of the IP, never the IP
 *
 * Never stored: the IP, the raw user agent, a seed or an address (redacted in report.ts before this sees it).
 */
import { createHmac, randomBytes } from 'node:crypto'
import { base64Bytes, type Checked, checkReport, isStatus, NOTE_MAX, REPORT, type ReportStatus, type StoredReport } from './report.ts'
import { saltFromEnv } from './store.ts'

export const IDS_KEY = 'pool:report:ids'
export const reportKey = (id: string) => `pool:report:r:${id}`
export const imageKey = (id: string) => `pool:report:img:${id}`
const TTL_S = REPORT.ttlDays * 86_400

export interface ReportBackend {
  kind: 'rest' | 'memory'
  /** store the report (and its image) under fresh keys, push the id to the front, trim the list */
  put(id: string, json: string, image?: string): Promise<void>
  /** the newest ids, newest first */
  ids(limit: number): Promise<string[]>
  /** the stored JSON for each id, null where it expired */
  get(ids: string[]): Promise<(string | null)[]>
  /** replace a report's JSON, keeping its expiry; false when it is gone */
  replace(id: string, json: string): Promise<boolean>
  image(id: string): Promise<string | null>
  /** count one hit on a rate key that expires after ttlS; returns the new count */
  hit(key: string, ttlS: number): Promise<number>
}

export function memoryReports(
  state: { list: string[]; docs: Map<string, string>; imgs: Map<string, string>; hits: Map<string, number> } = {
    list: [],
    docs: new Map(),
    imgs: new Map(),
    hits: new Map(),
  },
): ReportBackend & { state: typeof state } {
  return {
    kind: 'memory',
    state,
    async put(id, json, image) {
      state.docs.set(reportKey(id), json)
      if (image) state.imgs.set(imageKey(id), image)
      state.list.unshift(id)
      for (const old of state.list.splice(REPORT.keep)) {
        state.docs.delete(reportKey(old))
        state.imgs.delete(imageKey(old))
      }
    },
    async ids(limit) {
      return state.list.slice(0, limit)
    },
    async get(ids) {
      return ids.map(id => state.docs.get(reportKey(id)) ?? null)
    },
    async replace(id, json) {
      if (!state.docs.has(reportKey(id))) return false
      state.docs.set(reportKey(id), json)
      return true
    },
    async image(id) {
      return state.imgs.get(imageKey(id)) ?? null
    },
    async hit(key) {
      const n = (state.hits.get(key) ?? 0) + 1
      state.hits.set(key, n)
      return n
    },
  }
}

export function restReports(url: string, token: string, fetcher: typeof fetch = fetch): ReportBackend {
  const pipe = async (cmds: string[][]) => {
    const r = await fetcher(`${url.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmds),
      cache: 'no-store',
    })
    if (!r.ok) throw new Error(`kv ${r.status}`)
    const j = (await r.json()) as { result?: unknown; error?: string }[]
    const bad = j.find(x => x.error)
    if (bad) throw new Error(`kv ${bad.error}`)
    return j
  }
  const ttl = String(TTL_S)
  return {
    kind: 'rest',
    async put(id, json, image) {
      await pipe([
        ...(image ? [['SET', imageKey(id), image, 'EX', ttl]] : []),
        ['SET', reportKey(id), json, 'EX', ttl],
        ['LPUSH', IDS_KEY, id],
        ['LTRIM', IDS_KEY, '0', String(REPORT.keep - 1)],
      ])
    },
    async ids(limit) {
      const [x] = await pipe([['LRANGE', IDS_KEY, '0', String(limit - 1)]])
      return Array.isArray(x?.result) ? (x.result as unknown[]).filter((v): v is string => typeof v === 'string') : []
    },
    async get(ids) {
      if (!ids.length) return []
      const [x] = await pipe([['MGET', ...ids.map(reportKey)]])
      const r = Array.isArray(x?.result) ? (x.result as unknown[]) : []
      return ids.map((_, i) => (typeof r[i] === 'string' ? (r[i] as string) : null))
    },
    async replace(id, json) {
      // XX: only if it still exists; KEEPTTL: the expiry set at creation stays
      const [x] = await pipe([['SET', reportKey(id), json, 'XX', 'KEEPTTL']])
      return x?.result === 'OK'
    },
    async image(id) {
      const [x] = await pipe([['GET', imageKey(id)]])
      return typeof x?.result === 'string' ? x.result : null
    },
    async hit(key, ttlS) {
      const [x] = await pipe([
        ['INCR', key],
        ['EXPIRE', key, String(ttlS)],
      ])
      const n = Number(x?.result)
      if (!Number.isFinite(n)) throw new Error('kv incr')
      return n
    },
  }
}

const g = globalThis as unknown as { __poolReportMem?: Parameters<typeof memoryReports>[0]; __poolReports?: ReturnType<typeof createReports> }

export function defaultReportBackend(): ReportBackend {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token) return restReports(url, token)
  g.__poolReportMem ??= { list: [], docs: new Map(), imgs: new Map(), hits: new Map() }
  return memoryReports(g.__poolReportMem)
}

/** The rate key for one connection and UTC day: an HMAC of the IP with the server secret. The IP itself is dropped. */
export const rateKey = (ip: string, day: string, salt: string) =>
  `pool:report:rate:${day}:${createHmac('sha256', salt).update(`qc-pool-report|${ip.trim()}|${day}`).digest('hex').slice(0, 24)}`

/** Ids are random, short and URL safe: "r" + 12 base32 characters. */
const B32 = 'abcdefghijkmnpqrstuvwxyz23456789'
export function newId(rand: (n: number) => Uint8Array = n => randomBytes(n)): string {
  const b = rand(12)
  let s = 'r'
  for (let i = 0; i < 12; i++) s += B32[(b[i] as number) % 32]
  return s
}
export const ID_PATTERN = /^r[a-z2-9]{12}$/

/** Read a stored report back, defensively. */
export function parseReport(json: string | null): StoredReport | null {
  if (!json) return null
  try {
    const r = JSON.parse(json) as StoredReport
    if (r?.v !== 1 || typeof r.id !== 'string' || typeof r.text !== 'string' || typeof r.at !== 'number' || !isStatus(r.status)) return null
    return r
  } catch {
    return null
  }
}

type Opts = { backend?: ReportBackend; salt?: string | null; now?: () => Date; id?: () => string }

export function createReports(opts: Opts = {}) {
  const backend = opts.backend ?? defaultReportBackend()
  const salt = opts.salt === undefined ? saltFromEnv() : opts.salt
  const now = opts.now ?? (() => new Date())
  const id = opts.id ?? (() => newId())

  return {
    backend,
    /**
     * Check, count against the connection's day, store. A refused report does not use up the day's quota.
     * The IP is used for the rate key's HMAC only; the user agent becomes a coarse class before it gets here.
     */
    async add(input: unknown, ctx: { ip: string; ua: string }): Promise<Checked<StoredReport> & { status?: number }> {
      if (!salt) return { ok: false, error: 'Reports are not set up on this server.', status: 503 }
      const c = checkReport(input)
      if (!c.ok) return { ...c, status: 422 }
      const t = now()
      const n = await backend.hit(rateKey(ctx.ip, t.toISOString().slice(0, 10), salt), 90_000)
      if (n > REPORT.perDay)
        return { ok: false, error: `That is today's ${REPORT.perDay} reports from this connection. Thank you; try again tomorrow.`, status: 429 }
      const { image, seed, ...d } = c.value
      const rec: StoredReport = {
        v: 1,
        id: id(),
        type: d.type,
        text: d.text,
        ...(d.contact ? { contact: d.contact } : {}),
        ctx: d.ctx,
        ua: ctx.ua,
        at: t.getTime(),
        status: 'new',
        ...(image ? { img: { type: image.startsWith('data:image/webp') ? 'webp' : 'jpeg', bytes: base64Bytes(image.slice(image.indexOf(',') + 1)) } } : {}),
        ...(seed ? { seed: true } : {}),
      }
      await backend.put(rec.id, JSON.stringify(rec), image)
      return { ok: true, value: rec }
    },
    /** Newest first. Expired or malformed entries are skipped. */
    async list(limit = 100): Promise<StoredReport[]> {
      const ids = await backend.ids(Math.max(1, Math.min(REPORT.keep, limit)))
      const docs = await backend.get(ids)
      return docs.map(parseReport).filter((r): r is StoredReport => !!r)
    },
    async setStatus(rid: unknown, status: unknown): Promise<Checked<StoredReport>> {
      return this.update(rid, { status })
    },
    /** The moderator's tracker: change the status, the note, or both. An empty note removes it. */
    async update(rid: unknown, change: { status?: unknown; note?: unknown }): Promise<Checked<StoredReport>> {
      if (typeof rid !== 'string' || !ID_PATTERN.test(rid)) return { ok: false, error: 'No such report.' }
      if (change.status !== undefined && !isStatus(change.status)) return { ok: false, error: 'Unknown status.' }
      if (change.note !== undefined && typeof change.note !== 'string') return { ok: false, error: 'The note must be text.' }
      const [doc] = await backend.get([rid])
      const r = parseReport(doc ?? null)
      if (!r) return { ok: false, error: 'No such report.' }
      const next: StoredReport = { ...r, updated: now().getTime() }
      if (change.status !== undefined) next.status = change.status as ReportStatus
      if (typeof change.note === 'string') {
        // biome-ignore lint/suspicious/noControlCharactersInRegex: stripping them is the point
        const n = change.note
          .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
          .trim()
          .slice(0, NOTE_MAX)
        if (n) next.note = n
        else delete next.note
      }
      if (!(await backend.replace(rid, JSON.stringify(next)))) return { ok: false, error: 'No such report.' }
      return { ok: true, value: next }
    },
    /** The screenshot as bytes and a content type, for the moderator's review page. */
    async image(rid: unknown): Promise<{ type: string; bytes: ArrayBuffer } | null> {
      if (typeof rid !== 'string' || !ID_PATTERN.test(rid)) return null
      const d = await backend.image(rid)
      const m = d?.match(/^data:(image\/(?:jpeg|webp));base64,(.+)$/)
      if (!m) return null
      const b = Buffer.from(m[2] as string, 'base64')
      return { type: m[1] as string, bytes: b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer }
    },
  }
}

export function reports() {
  g.__poolReports ??= createReports()
  return g.__poolReports
}
