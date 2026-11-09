import 'server-only'
import { EXPLORER, type ExplorerSolution } from '@/lib/bpp/brains-view'
import { kvAddToSet, kvGetJson, kvSetHas, kvSetJson } from '@/lib/bpp/store'
import { epochStart } from '@/lib/pool/epoch'
import { type ComputorMeta, type FieldState, type FieldView, type Holding, gridFor, territories } from './field-view'

/**
 * The Field, server side. The explorer keeps, per computor, how many solutions it was credited with in each
 * epoch; the field is those counts, read a few dozen computors at a time by a public idempotent tick and kept
 * in KV per epoch. Computors seen in the last two epochs are re-read in rounds; the rest are read once, for
 * the maps of past epochs. A past epoch is sealed once a full round finished after it ended.
 */
const API = `${EXPLORER}/api/v1`
const K_ACTIVE = 'garden:active'
const K_QUEUE = 'garden:queue'
const K_DONE = 'garden:done'
const K_SCAN = 'garden:scan'
const K_EPOCHS = 'garden:epochs'
const K_FIELD = (e: number) => `garden:field:${e}`
/** computors re-read per tick; each is one explorer call */
const ACTIVE_PER_TICK = 36
const QUEUE_PER_TICK = 12
const LIST_PAGES_PER_TICK = 5
const RELIST_MS = 7 * 24 * 3600_000
const GAP_MS = 120

type Scan = { listOffset: number; listed: boolean; listedAt: number; cursor: number; lastFullPassAt: number; queueDone: boolean; ticks: number }
type EpochItem = { epoch: number; algoFamily: string; solutions: number }
type ComputorRow = { computorId: string; epochsParticipated?: number; firstEpoch?: number; lastEpoch?: number }
type Participation = { epoch: number; solutions: number; firstTimestamp?: string | number; lastTimestamp?: string | number; algorithms?: { algorithm: string; count: number }[] }
type ComputorRecord = { computorId: string; epochParticipation?: Participation[] }

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${API}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(12000), headers: { accept: 'application/json' } })
  if (!r.ok) throw new Error(`explorer ${r.status} ${path}`)
  return (await r.json()) as T
}
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const ms = (t: unknown): number | null => {
  const n = typeof t === 'string' || typeof t === 'number' ? Number(t) : NaN
  return Number.isFinite(n) && n > 0 ? n : null
}
const bppCount = (p: Participation) => (p.algorithms ? (p.algorithms.find(a => a.algorithm === 'BPP9000')?.count ?? 0) : p.solutions)

/** BPP-9000 epochs the explorer knows, newest first; kept in KV so the field pages can read them without the explorer. */
async function bppEpochList(): Promise<EpochItem[]> {
  const ep = await get<{ items: EpochItem[] }>('/epochs')
  const list = ep.items.filter(e => e.algoFamily === 'bpp9000').sort((a, b) => b.epoch - a.epoch)
  await kvSetJson(K_EPOCHS, list)
  return list
}

/* ---------------- the tick ---------------- */

export type TickResult = { epoch: number; listed: boolean; active: number; queued: number; refreshed: number; fieldsTouched: number[]; sealed: number[] }

export async function fieldTick(): Promise<TickResult> {
  const epochs = await bppEpochList()
  const E = epochs[0]?.epoch
  if (!E) throw new Error('no epoch')
  const known = new Set(epochs.map(e => e.epoch))
  const scan: Scan = (await kvGetJson<Scan>(K_SCAN)) ?? { listOffset: 0, listed: false, listedAt: 0, cursor: 0, lastFullPassAt: 0, queueDone: false, ticks: 0 }
  scan.ticks++
  let active = (await kvGetJson<ComputorMeta[]>(K_ACTIVE)) ?? []
  let queue = (await kvGetJson<string[]>(K_QUEUE)) ?? []
  const activeIds = new Set(active.map(c => c.id))
  const queued = new Set(queue)
  let activeDirty = false
  let queueDirty = false
  const activate = (id: string, meta?: Partial<ComputorMeta>) => {
    if (activeIds.has(id)) return
    active.push({ id, firstEpoch: meta?.firstEpoch ?? null, lastEpoch: meta?.lastEpoch ?? null, epochs: meta?.epochs ?? null })
    activeIds.add(id)
    activeDirty = true
  }

  // 1. the list of all computors, a few pages per tick: recent ones join the rounds, the rest queue for one read
  if (!scan.listed || Date.now() - scan.listedAt > RELIST_MS) {
    for (let p = 0; p < LIST_PAGES_PER_TICK; p++) {
      const page = await get<{ items: ComputorRow[]; hasMore: boolean }>(`/computors?limit=100&offset=${scan.listOffset}`)
      for (const c of page.items) {
        if (c.lastEpoch == null || c.lastEpoch >= E - 1) activate(c.computorId, { firstEpoch: c.firstEpoch, lastEpoch: c.lastEpoch, epochs: c.epochsParticipated })
        else if (!activeIds.has(c.computorId) && !queued.has(c.computorId) && !(await kvSetHas(K_DONE, c.computorId))) {
          queue.push(c.computorId)
          queued.add(c.computorId)
          queueDirty = true
        }
      }
      scan.listOffset += page.items.length
      if (!page.hasMore || !page.items.length) {
        scan.listed = true
        scan.listedAt = Date.now()
        scan.listOffset = 0
        break
      }
      await sleep(GAP_MS)
    }
  }

  // 2. computors behind the newest brains join the rounds straight away
  try {
    const fresh = await get<{ items: ExplorerSolution[] }>(`/solutions?algorithm=BPP9000&epoch=${E}&status=verified&limit=100`)
    for (const s of fresh.items) activate(s.computorId, { lastEpoch: E })
  } catch {}

  // 3. one slice of the rounds, one slice of the queue
  const round = active.length ? Array.from({ length: Math.min(ACTIVE_PER_TICK, active.length) }, (_, k) => active[(scan.cursor + k) % active.length]!) : []
  const wrapped = scan.listed && active.length > 0 && scan.cursor + ACTIVE_PER_TICK >= active.length
  scan.cursor = active.length ? (scan.cursor + ACTIVE_PER_TICK) % active.length : 0
  if (wrapped) scan.lastFullPassAt = Date.now()
  const fromQueue = queue.slice(0, QUEUE_PER_TICK)

  const fields = new Map<number, FieldState>()
  const fieldOf = async (e: number) => {
    let f = fields.get(e)
    if (!f) {
      f = (await kvGetJson<FieldState>(K_FIELD(e))) ?? { epoch: e, holdings: [], updatedAt: new Date(0).toISOString(), sealed: false }
      fields.set(e, f)
    }
    return f
  }
  const record = async (id: string, meta: ComputorMeta | null): Promise<ComputorMeta> => {
    const rec = await get<ComputorRecord>(`/computors/${id}`)
    const parts = (rec.epochParticipation ?? []).filter(p => bppCount(p) > 0)
    const m: ComputorMeta = {
      id,
      epochs: parts.length || meta?.epochs || null,
      firstEpoch: parts.length ? Math.min(...parts.map(p => p.epoch)) : (meta?.firstEpoch ?? null),
      lastEpoch: parts.length ? Math.max(...parts.map(p => p.epoch)) : (meta?.lastEpoch ?? null),
    }
    for (const p of parts) {
      if (!known.has(p.epoch)) continue
      const f = await fieldOf(p.epoch)
      if (f.sealed) continue
      const h: Holding = { id, n: bppCount(p), first: ms(p.firstTimestamp), last: ms(p.lastTimestamp), fe: m.firstEpoch, ep: m.epochs }
      const j = f.holdings.findIndex(x => x.id === id)
      // counts only grow; a smaller number from the explorer is never written over a larger one
      if (j < 0) f.holdings.push(h)
      else if (h.n >= f.holdings[j]!.n) f.holdings[j] = h
      f.updatedAt = new Date().toISOString()
    }
    return m
  }

  let refreshed = 0
  for (const c of round) {
    try {
      const m = await record(c.id, c)
      if (m.epochs !== c.epochs || m.firstEpoch !== c.firstEpoch || m.lastEpoch !== c.lastEpoch) {
        Object.assign(c, m)
        activeDirty = true
      }
      refreshed++
    } catch {
      // a missing or rate-limited record is read again next round
    }
    await sleep(GAP_MS)
  }
  const done: string[] = []
  for (const id of fromQueue) {
    try {
      const m = await record(id, null)
      if (m.lastEpoch != null && m.lastEpoch >= E - 1) activate(id, m)
      done.push(id)
      refreshed++
    } catch {
      done.push(id) // a dormant record that fails is dropped from the queue; the weekly relist brings it back
    }
    await sleep(GAP_MS)
  }
  if (done.length) {
    await kvAddToSet(K_DONE, ...done)
    const dset = new Set(done)
    queue = queue.filter(id => !dset.has(id))
    queueDirty = true
  }
  if (scan.listed && queue.length === 0) scan.queueDone = true

  // computors that fell two epochs behind leave the rounds; their holdings stay in the fields
  const before = active.length
  active = active.filter(c => c.lastEpoch == null || c.lastEpoch >= E - 1)
  if (active.length !== before) {
    activeDirty = true
    scan.cursor = active.length ? scan.cursor % active.length : 0
  }

  // 4. seal past epochs once a full round finished after the epoch ended (older ones also need the queue read)
  const sealed: number[] = []
  for (const e of epochs.map(x => x.epoch)) {
    if (e >= E) continue
    const end = epochStart(e + 1).getTime()
    const complete = scan.lastFullPassAt > end && (e >= E - 1 || scan.queueDone)
    if (!complete) continue
    const f = await fieldOf(e)
    if (!f.sealed && f.holdings.length) {
      f.sealed = true
      f.updatedAt = new Date().toISOString()
      sealed.push(e)
    }
  }

  if (activeDirty) await kvSetJson(K_ACTIVE, active)
  if (queueDirty) await kvSetJson(K_QUEUE, queue)
  await kvSetJson(K_SCAN, scan)
  for (const f of fields.values()) await kvSetJson(K_FIELD(f.epoch), f)
  return { epoch: E, listed: scan.listed, active: active.length, queued: queue.length, refreshed, fieldsTouched: [...fields.keys()], sealed }
}

/* ---------------- reading ---------------- */

export async function fieldEpochs(): Promise<EpochItem[]> {
  return (await kvGetJson<EpochItem[]>(K_EPOCHS)) ?? []
}

/** The field of an epoch (the current one when omitted), laid out as territories; null before the first tick. */
export async function fieldView(epoch?: number): Promise<FieldView | null> {
  const epochs = await fieldEpochs()
  const item = epoch ? epochs.find(e => e.epoch === epoch) : epochs[0]
  if (!item) return null
  const f = await kvGetJson<FieldState>(K_FIELD(item.epoch))
  if (!f) return null
  const ts = territories(f.holdings)
  const cells = ts.reduce((a, t) => a + t.cells, 0)
  const g = gridFor(cells)
  return {
    epoch: item.epoch,
    start: epochStart(item.epoch).getTime(),
    end: epochStart(item.epoch + 1).getTime(),
    sealed: f.sealed,
    updatedAt: f.updatedAt,
    grown: item.solutions,
    grid: { w: g.w, h: g.h },
    territories: ts,
    cells,
    pool: (process.env.GARDEN_POOL_COMPUTORS ?? '').split(',').map(x => x.trim()).filter(x => /^[A-Z]{60}$/.test(x)),
  }
}
