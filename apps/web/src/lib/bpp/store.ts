import 'server-only'

/**
 * Storage for the BPP-9000 experiment: participants and their trade journals.
 * Upstash Redis over REST (Vercel Marketplace sets KV_REST_API_URL / KV_REST_API_TOKEN).
 * Without them, development falls back to memory; production says storage is not connected.
 */
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

const MEMORY = process.env.NODE_ENV !== 'production' || process.env.BPP_MEMORY_STORE === '1'
export const storeReady = () => Boolean(URL_ && TOKEN) || MEMORY

const mem = new Map<string, string>()
const memSets = new Map<string, Set<string>>()

async function cmd<T>(...args: (string | number)[]): Promise<T> {
  if (!URL_ || !TOKEN) {
    if (!MEMORY) throw new Error('Storage is not connected yet.')
    const [c, k, ...rest] = args.map(String)
    switch (c) {
      case 'GET':
        return (mem.get(k!) ?? null) as T
      case 'SET':
        mem.set(k!, rest[0]!)
        return 'OK' as T
      case 'SADD': {
        const s = memSets.get(k!) ?? new Set()
        const before = s.size
        rest.forEach(x => s.add(x))
        memSets.set(k!, s)
        return (s.size - before) as T
      }
      case 'SCARD':
        return (memSets.get(k!)?.size ?? 0) as T
      case 'SMEMBERS':
        return [...(memSets.get(k!) ?? [])] as T
      case 'MGET':
        return [k!, ...rest].map(x => mem.get(x) ?? null) as T
      default:
        throw new Error(`mem: ${c}`)
    }
  }
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args.map(String)), cache: 'no-store' })
  const j = (await r.json()) as { result?: T; error?: string }
  if (!r.ok || j.error) throw new Error(j.error ?? `redis ${r.status}`)
  return j.result as T
}

export type Trade = {
  id: string
  /** ISO time the position was opened (UTC) */
  at: string
  side: 'long' | 'short'
  entry: number
  exit: number
  /** position size in USD at entry */
  size: number
  fee: number
  note?: string
}
export type Participant = {
  handle: string
  name: string
  auth: 'qubic' | 'trip'
  id: string
  start: number
  joined: string
  trades: Trade[]
}

const KEY = (h: string) => `bpp:p:${h.toLowerCase()}`
const ALL = 'bpp:participants'

export async function getParticipant(handle: string): Promise<Participant | null> {
  const raw = await cmd<string | null>('GET', KEY(handle))
  return raw ? (JSON.parse(raw) as Participant) : null
}

export async function saveParticipant(p: Participant) {
  await cmd('SET', KEY(p.handle), JSON.stringify(p))
  await cmd('SADD', ALL, p.handle.toLowerCase())
}

export async function participantCount(): Promise<number> {
  try {
    return await cmd<number>('SCARD', ALL)
  } catch {
    return 0
  }
}

export async function allParticipants(): Promise<Participant[]> {
  const handles = await cmd<string[]>('SMEMBERS', ALL)
  if (!handles.length) return []
  const raws = await cmd<(string | null)[]>('MGET', ...handles.map(KEY))
  return raws.filter(Boolean).map(r => JSON.parse(r!) as Participant)
}
