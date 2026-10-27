import 'server-only'

/**
 * Storage for W4W (the town of Aigarth). Same Upstash Redis as BPP-9000, keys under "w4w:".
 * Without Redis, development keeps everything in memory.
 */
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
const MEMORY = process.env.NODE_ENV !== 'production' || process.env.BPP_MEMORY_STORE === '1'
export const w4wReady = () => Boolean(URL_ && TOKEN) || MEMORY

type Arg = string | number
type Cmd = Arg[]

const g = globalThis as unknown as { __w4wMem?: { kv: Map<string, string>; h: Map<string, Map<string, string>>; s: Map<string, Set<string>>; l: Map<string, string[]>; z: Map<string, Map<string, number>> } }
const M = (g.__w4wMem ??= { kv: new Map(), h: new Map(), s: new Map(), l: new Map(), z: new Map() })

function memRun(c: Cmd): unknown {
  const [op, k, ...r] = c.map(String) as [string, string, ...string[]]
  const hash = () => M.h.get(k) ?? (M.h.set(k, new Map()), M.h.get(k)!)
  const set = () => M.s.get(k) ?? (M.s.set(k, new Set()), M.s.get(k)!)
  const list = () => M.l.get(k) ?? (M.l.set(k, []), M.l.get(k)!)
  const zs = () => M.z.get(k) ?? (M.z.set(k, new Map()), M.z.get(k)!)
  switch (op) {
    case 'GET': return M.kv.get(k) ?? null
    case 'SET': M.kv.set(k, r[0]!); return 'OK'
    case 'DEL': M.kv.delete(k); M.h.delete(k); M.l.delete(k); return 1
    case 'HSET': { const h = hash(); for (let i = 0; i < r.length; i += 2) h.set(r[i]!, r[i + 1]!); return 1 }
    case 'HGET': return M.h.get(k)?.get(r[0]!) ?? null
    case 'HDEL': return M.h.get(k)?.delete(r[0]!) ? 1 : 0
    case 'HGETALL': return [...(M.h.get(k) ?? new Map())].flat()
    case 'HLEN': return M.h.get(k)?.size ?? 0
    case 'SADD': { const s = set(); const b = s.size; r.forEach(x => s.add(x)); return s.size - b }
    case 'SREM': { const s = set(); return r.filter(x => s.delete(x)).length }
    case 'SISMEMBER': return M.s.get(k)?.has(r[0]!) ? 1 : 0
    case 'SMEMBERS': return [...(M.s.get(k) ?? [])]
    case 'RPUSH': { const l = list(); l.push(...r); return l.length }
    case 'LPUSH': { const l = list(); l.unshift(...r.reverse()); return l.length }
    case 'LLEN': return M.l.get(k)?.length ?? 0
    case 'LRANGE': { const l = M.l.get(k) ?? []; const a = Number(r[0]); const b = Number(r[1]); return l.slice(a < 0 ? Math.max(0, l.length + a) : a, b < 0 ? l.length + b + 1 : b + 1) }
    case 'LTRIM': { const l = M.l.get(k); if (l) M.l.set(k, l.slice(Number(r[0]), Number(r[1]) + 1)); return 'OK' }
    case 'ZADD': zs().set(r[1]!, Number(r[0])); return 1
    case 'ZREM': return M.z.get(k)?.delete(r[0]!) ? 1 : 0
    case 'ZRANGEBYSCORE': return [...(M.z.get(k) ?? new Map())].filter(([, v]) => v >= Number(r[0])).sort((a, b) => a[1] - b[1]).map(([m]) => m)
    case 'ZREMRANGEBYSCORE': { const z = M.z.get(k); let n = 0; if (z) for (const [m, v] of z) if (v <= Number(r[1])) { z.delete(m); n++ } return n }
    default: throw new Error(`w4w mem: ${op}`)
  }
}

export async function run<T = unknown>(...cmd: Cmd): Promise<T> {
  return (await pipe([cmd]))[0] as T
}

/** Several commands in one round trip. */
export async function pipe(cmds: Cmd[]): Promise<unknown[]> {
  if (!URL_ || !TOKEN) {
    if (!MEMORY) throw new Error('Storage is not connected yet.')
    return cmds.map(memRun)
  }
  const r = await fetch(`${URL_.replace(/\/$/, '')}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds.map(c => c.map(String))),
    cache: 'no-store',
  })
  const j = (await r.json()) as { result?: unknown; error?: string }[] | { error?: string }
  if (!r.ok || !Array.isArray(j)) throw new Error((j as { error?: string }).error ?? `redis ${r.status}`)
  const bad = j.find(x => x.error)
  if (bad) throw new Error(bad.error)
  return j.map(x => x.result)
}

/** HGETALL comes back as a flat [field, value, ...] list. */
export function pairs(flat: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (Array.isArray(flat)) for (let i = 0; i + 1 < flat.length; i += 2) out[String(flat[i])] = String(flat[i + 1])
  else if (flat && typeof flat === 'object') Object.assign(out, flat)
  return out
}

export const K = {
  houses: 'w4w:c:houses',
  orders: 'w4w:c:orders',
  notices: 'w4w:c:notices',
  column: 'w4w:column',
  log: (uid: string) => `w4w:log:${uid}`,
  presence: 'w4w:presence',
  presenceData: 'w4w:presence:data',
  events: 'w4w:events',
  players: 'w4w:players',
  admins: 'w4w:admins',
  invites: 'w4w:invites',
  who: 'w4w:who',
}
