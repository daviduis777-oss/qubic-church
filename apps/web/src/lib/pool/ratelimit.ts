import 'server-only'
import { createHash } from 'node:crypto'

/**
 * Per-IP daily message limit for Ask Maria, on the same Upstash Redis as BPP-9000 and W4W.
 * The IP is hashed before it becomes a key; no raw IP is stored. Without Redis, memory (per instance).
 */
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

const g = globalThis as unknown as { __poolRate?: Map<string, number> }
const mem = (g.__poolRate ??= new Map())

export function clientIp(req: Request): string {
  const xf = req.headers.get('x-forwarded-for')
  return (xf?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'local').trim()
}

const day = () => new Date().toISOString().slice(0, 10)
const keyFor = (ip: string) => `pool:maria:${day()}:${createHash('sha256').update(`qc-pool:${ip}`).digest('hex').slice(0, 24)}`

/** Count one message. Returns whether it is allowed and how many remain today. */
export async function takeMessage(ip: string, perDay: number): Promise<{ ok: boolean; remaining: number }> {
  const key = keyFor(ip)
  let n: number
  if (URL_ && TOKEN) {
    try {
      const r = await fetch(`${URL_.replace(/\/$/, '')}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([['INCR', key], ['EXPIRE', key, '90000']]),
        cache: 'no-store',
      })
      const j = (await r.json()) as { result?: unknown }[]
      n = Number(j[0]?.result)
      if (!Number.isFinite(n)) throw new Error('redis')
    } catch {
      n = (mem.get(key) ?? 0) + 1
      mem.set(key, n)
    }
  } else {
    n = (mem.get(key) ?? 0) + 1
    mem.set(key, n)
  }
  return { ok: n <= perDay, remaining: Math.max(0, perDay - n) }
}
