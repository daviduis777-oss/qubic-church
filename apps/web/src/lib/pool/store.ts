/**
 * Measured results storage: append-only lists per epoch on the same Upstash / Vercel KV REST store as
 * ratelimit.ts, capped at MEASURE.capPerEpoch rows each. Without that env (dev, tests) it is memory, per instance.
 * Server only by use: the API route and the pool page import it; nothing in the browser does.
 *
 * Stored per row: hardware, rates, epoch, time, source, and a salted hash of worker name + day.
 * Never stored: wallet, seed, IP, worker name, the log text, the user's daily cost.
 */
import { createHmac } from 'node:crypto'
import { aggregate, type Summary } from './aggregate.ts'
import { MEASURE } from './config.ts'
import { epochAt } from './epoch.ts'
import {
  buildSample,
  type Checked,
  FIELD_SAMPLES,
  type Sample,
} from './measure.ts'
import { parsePoolStats } from './stats-adapter.ts'

export interface MeasureBackend {
  kind: 'rest' | 'memory'
  append(epoch: number, row: string): Promise<void>
  /** rows of each epoch; `ok` is false when the store could not be read */
  read(epochs: number[]): Promise<{ rows: string[]; ok: boolean }>
}

export const listKey = (epoch: number) => `pool:measure:e:${epoch}`
const TTL_S = String((MEASURE.readEpochs + 2) * 7 * 86_400)

export function memoryBackend(
  map: Map<string, string[]> = new Map()
): MeasureBackend & { map: Map<string, string[]> } {
  return {
    kind: 'memory',
    map,
    async append(epoch, row) {
      const l = map.get(listKey(epoch)) ?? []
      l.push(row)
      if (l.length > MEASURE.capPerEpoch)
        l.splice(0, l.length - MEASURE.capPerEpoch)
      map.set(listKey(epoch), l)
    },
    async read(epochs) {
      return { rows: epochs.flatMap(e => map.get(listKey(e)) ?? []), ok: true }
    },
  }
}

export function restBackend(
  url: string,
  token: string,
  fetcher: typeof fetch = fetch
): MeasureBackend {
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
    async append(epoch, row) {
      const k = listKey(epoch)
      await pipe([
        ['RPUSH', k, row],
        ['LTRIM', k, String(-MEASURE.capPerEpoch), '-1'],
        ['EXPIRE', k, TTL_S],
      ])
    },
    async read(epochs) {
      try {
        const res = await pipe(
          epochs.map(e => ['LRANGE', listKey(e), '0', '-1'])
        )
        return {
          rows: res.flatMap(x =>
            Array.isArray(x.result)
              ? (x.result as unknown[]).filter(
                  (v): v is string => typeof v === 'string'
                )
              : []
          ),
          ok: true,
        }
      } catch {
        return { rows: [], ok: false }
      }
    },
  }
}

const g = globalThis as unknown as {
  __poolMeasureMem?: Map<string, string[]>
  __poolMeasureStore?: ReturnType<typeof createStore>
}

export function defaultBackend(): MeasureBackend {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token) return restBackend(url, token)
  g.__poolMeasureMem ??= new Map()
  return memoryBackend(g.__poolMeasureMem)
}

/** The salt: FORUM_SECRET. Only dev and tests fall back to a fixed one. */
export function saltFromEnv(): string | null {
  const s = process.env.FORUM_SECRET
  if (s && s.length >= 16) return s
  return process.env.NODE_ENV === 'production'
    ? null
    : 'qc-pool-dev-salt-not-for-production'
}

/** Salted hash of a worker name (or, without one, of the connection and rig) plus the UTC day. */
export const dedupeHash = (who: string, day: string, salt: string) =>
  createHmac('sha256', salt)
    .update(`qc-pool-measure|${who.trim().toLowerCase()}|${day}`)
    .digest('hex')
    .slice(0, 24)

/** Read a stored row back, defensively: anything malformed is skipped. */
export function parseRow(row: string): Sample | null {
  try {
    const s = JSON.parse(row) as Sample
    if (
      s?.v !== 1 ||
      !s.hw ||
      !s.result ||
      typeof s.result.epoch !== 'number' ||
      typeof s.at !== 'number'
    )
      return null
    if (s.source !== 'pool' && s.source !== 'log') return null // field rows come from code, never from storage
    return s
  } catch {
    return null
  }
}

type StoreOpts = {
  backend?: MeasureBackend
  salt?: string | null
  now?: () => Date
  field?: Sample[]
}

export function createStore(opts: StoreOpts = {}) {
  const backend = opts.backend ?? defaultBackend()
  const salt = opts.salt === undefined ? saltFromEnv() : opts.salt
  const now = opts.now ?? (() => new Date())
  const field = opts.field ?? FIELD_SAMPLES
  let live: { at: number; sum: Summary } | null = null
  let snap: { epoch: number; sum: Summary; until: number } | null = null

  const epochs = (cur: number) =>
    Array.from({ length: MEASURE.readEpochs }, (_, i) => cur - i)

  async function samples(): Promise<{ list: Sample[]; ok: boolean }> {
    const cur = epochAt(now()).epoch
    const { rows, ok } = await backend.read(epochs(cur))
    const stored = rows.map(parseRow).filter((x): x is Sample => !!x)
    return { list: [...field, ...stored], ok }
  }

  return {
    backend,
    /** Validate, hash, append. The worker name and the IP are used for the hash only, then dropped. */
    async add(
      input: unknown,
      ctx: { ip?: string } = {}
    ): Promise<Checked<Sample>> {
      if (!salt)
        return { ok: false, error: 'Saving is not set up on this server.' }
      const t = now()
      const built = buildSample(input, t, 'log')
      if (!built.ok) return built
      const worker =
        typeof (input as { worker?: unknown })?.worker === 'string'
          ? ((input as { worker: string }).worker as string).trim().slice(0, 64)
          : ''
      const who = worker
        ? `w:${worker}`
        : `c:${ctx.ip ?? 'local'}|${built.value.key}`
      const sample: Sample = {
        ...built.value,
        dedupe: dedupeHash(who, t.toISOString().slice(0, 10), salt),
      }
      await backend.append(sample.result.epoch, JSON.stringify(sample))
      live = null
      return { ok: true, value: sample }
    },
    /** Pool stats, once the adapter exists: parse and append each worker's sample. */
    async ingestPool(payload: unknown): Promise<number> {
      if (!salt) return 0
      const list = parsePoolStats(
        payload,
        (w, d) => dedupeHash(`w:${w}`, d, salt),
        now()
      )
      for (const s of list)
        await backend.append(s.result.epoch, JSON.stringify(s))
      if (list.length) live = null
      return list.length
    },
    samples: async () => (await samples()).list,
    /** Live aggregates for the picker, the doctor and the page: recomputed on read, cached MEASURE.cacheMs. */
    async summary(): Promise<Summary> {
      const t = now().getTime()
      if (live && t - live.at < MEASURE.cacheMs) return live.sum
      const { list } = await samples()
      const sum = aggregate(list, epochAt(now()).epoch, t)
      live = { at: t, sum }
      return sum
    },
    /**
     * Maria's MEASURED table: only finished epochs, so the text is the same on every instance for a whole
     * epoch and the cached prompt block stays warm. Recomputed when the epoch changes.
     */
    async promptSnapshot(): Promise<Summary> {
      const cur = epochAt(now())
      const t = now().getTime()
      if (snap && snap.epoch === cur.epoch && t < snap.until) return snap.sum
      const { list, ok } = await samples()
      const sum = aggregate(
        list.filter(s => s.result.epoch < cur.epoch),
        cur.epoch,
        cur.start.getTime()
      )
      // a failed read is retried soon instead of being frozen for the epoch
      snap = {
        epoch: cur.epoch,
        sum,
        until: ok ? cur.end.getTime() : t + MEASURE.cacheMs,
      }
      return sum
    },
  }
}

export function measureStore() {
  g.__poolMeasureStore ??= createStore()
  return g.__poolMeasureStore
}
