import 'server-only'
import { EXPLORER } from '@/lib/bpp/brains-view'
import { kvGetJson, kvSetJson } from '@/lib/bpp/store'
import { epochStart } from '@/lib/pool/epoch'
import { type FieldState, type FieldView, type StreamItem, type Territory, countInto, edgeHas, edgeNote, emptyField, gridFor, territories } from './field-view'

/**
 * The Field, server side: a crawl of the explorer's solution stream, a thousand solutions a page. Each tick
 * catches up with the newest solutions (from the head it reached last time) and backfills a few pages from the
 * oldest end of the epoch, until the two meet. Every solution is counted once, by the identity it is credited to.
 * Past epochs are backfilled the same way, one at a time, and sealed when complete.
 */
const API = `${EXPLORER}/api/v1`
const K_EPOCHS = 'garden:epochs'
const K_FIELD = (e: number) => `garden:field:${e}`
const K_IDS = (e: number, k: number) => `garden:field:${e}:ids:${k}`
const PAGE = 1000
const IDS_PER_CHUNK = 3000
/** pages per tick: catching up, backfilling the current epoch, backfilling a past one */
const CATCH_PAGES = 10
const BACK_PAGES = 4
const PAST_PAGES = 3
const GAP_MS = 150

type EpochItem = { epoch: number; algoFamily: string; solutions: number; verification?: { verified?: number } }

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${API}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(20000), headers: { accept: 'application/json' } })
  if (!r.ok) throw new Error(`explorer ${r.status} ${path}`)
  return (await r.json()) as T
}
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const page = (epoch: number, offset: number) =>
  get<{ items: StreamItem[]; hasMore: boolean }>(`/solutions?algorithm=BPP9000&epoch=${epoch}&status=verified&limit=${PAGE}&offset=${offset}`)

/** BPP-9000 epochs the explorer knows, newest first; kept in KV so the field pages can read them without the explorer. */
async function bppEpochList(): Promise<EpochItem[]> {
  const ep = await get<{ items: EpochItem[] }>('/epochs')
  const list = ep.items.filter(e => e.algoFamily === 'bpp9000').sort((a, b) => b.epoch - a.epoch)
  await kvSetJson(K_EPOCHS, list)
  return list
}

/* ---------------- state in KV: the numbers in one key, the identities in chunks ---------------- */

type Stored = Omit<FieldState, 'ids'> & { chunks: number }

async function loadField(epoch: number): Promise<{ f: FieldState; savedIds: number }> {
  const s = await kvGetJson<Stored>(K_FIELD(epoch))
  // nothing yet, or a record of the earlier shape (per-computor holdings): start over
  if (!s || !Array.isArray(s.n) || typeof s.chunks !== 'number') return { f: emptyField(epoch), savedIds: 0 }
  const ids: string[] = []
  for (let k = 0; k < s.chunks; k++) ids.push(...((await kvGetJson<string[]>(K_IDS(epoch, k))) ?? []))
  const { chunks: _c, ...rest } = s
  return { f: { ...rest, ids }, savedIds: ids.length }
}

async function saveField(f: FieldState, savedIds: number) {
  const chunks = Math.ceil(f.ids.length / IDS_PER_CHUNK)
  const firstDirty = Math.floor(savedIds / IDS_PER_CHUNK)
  for (let k = firstDirty; k < chunks; k++) await kvSetJson(K_IDS(f.epoch, k), f.ids.slice(k * IDS_PER_CHUNK, (k + 1) * IDS_PER_CHUNK))
  const { ids: _ids, ...rest } = f
  await kvSetJson(K_FIELD(f.epoch), { ...rest, chunks } satisfies Stored)
}

/* ---------------- the tick ---------------- */

export type TickResult = { epoch: number; caught: number; backfilled: number; past: number | null; counted: number; grown: number; sealed: number[] }

const tickOf = (s: StreamItem) => s.tickNumber ?? 0

export async function fieldTick(): Promise<TickResult> {
  const epochs = await bppEpochList()
  const cur = epochs[0]
  if (!cur) throw new Error('no epoch')
  const E = cur.epoch
  const grown = cur.verification?.verified ?? cur.solutions
  const { f, savedIds } = await loadField(E)
  const index = new Map(f.ids.map((id, i) => [id, i]))
  let caught = 0
  let backfilled = 0

  // 1. catch up: newest pages down to the head reached last time
  if (!f.head) {
    // the first look at this epoch: the newest page is counted whole and becomes the head; the backfill takes the rest
    const p0 = await page(E, 0)
    let min = Number.MAX_SAFE_INTEGER
    let max = 0
    for (const s of p0.items) {
      countInto(f, s, index)
      caught++
      min = Math.min(min, tickOf(s))
      max = Math.max(max, tickOf(s))
    }
    f.head = { tick: max, hashes: p0.items.filter(s => tickOf(s) === max).map(s => s.hash) }
    f.backfill.boundary = min
    if (!p0.hasMore) f.backfill.done = true
  } else {
    const c = f.catchup ?? { offset: 0, newTick: 0, newHashes: [] as string[], min: { tick: Number.MAX_SAFE_INTEGER, hashes: [] as string[] } }
    let reached = false
    for (let k = 0; k < CATCH_PAGES && !reached; k++) {
      const pg = await page(E, c.offset)
      if (c.offset === 0 && pg.items.length) {
        const top = Math.max(...pg.items.map(tickOf))
        c.newTick = top
        c.newHashes = pg.items.filter(s => tickOf(s) === top).map(s => s.hash)
      }
      for (const s of pg.items) {
        const t = tickOf(s)
        if (t < f.head.tick) {
          reached = true
          break
        }
        if (edgeHas(f.head, s)) {
          reached = true
          continue
        }
        // a page read after the list shifted: only what is older than what this catch-up already counted
        if (t > c.min.tick || edgeHas(c.min, s)) continue
        countInto(f, s, index)
        caught++
        edgeNote(c.min, s)
      }
      if (!pg.hasMore || !pg.items.length) reached = true
      c.offset += PAGE
      await sleep(GAP_MS)
    }
    if (reached) {
      f.head = { tick: c.newTick || f.head.tick, hashes: c.newTick ? c.newHashes : f.head.hashes }
      f.catchup = null
    } else f.catchup = c
  }

  // 2. backfill the current epoch from its oldest solution towards the boundary
  if (!f.backfill.done) {
    for (let k = 0; k < BACK_PAGES && !f.backfill.done; k++) {
      const offset = Math.max(0, grown - f.backfill.pos - PAGE)
      const pg = await page(E, offset)
      for (const s of [...pg.items].sort((a, b) => tickOf(a) - tickOf(b))) {
        const t = tickOf(s)
        if (t < f.backfill.max.tick || edgeHas(f.backfill.max, s)) continue
        if (t >= f.backfill.boundary) {
          f.backfill.done = true
          break
        }
        countInto(f, s, index)
        backfilled++
        edgeNote(f.backfill.max, s)
      }
      f.backfill.pos += PAGE
      if (offset === 0 || !pg.items.length) f.backfill.done = true
      await sleep(GAP_MS)
    }
  }
  f.updatedAt = new Date().toISOString()
  await saveField(f, savedIds)

  // 3. one past epoch at a time, oldest solutions first, once the current one is complete
  let past: number | null = null
  const sealed: number[] = []
  if (f.backfill.done && !f.catchup) {
    for (const e of epochs.slice(1)) {
      const { f: pf, savedIds: pSaved } = await loadField(e.epoch)
      if (pf.sealed) continue
      past = e.epoch
      const pIndex = new Map(pf.ids.map((id, i) => [id, i]))
      const total = e.verification?.verified ?? e.solutions
      for (let k = 0; k < PAST_PAGES && !pf.backfill.done; k++) {
        const offset = Math.max(0, total - pf.backfill.pos - PAGE)
        const pg = await page(e.epoch, offset)
        for (const s of [...pg.items].sort((a, b) => tickOf(a) - tickOf(b))) {
          const t = tickOf(s)
          if (t < pf.backfill.max.tick || edgeHas(pf.backfill.max, s)) continue
          countInto(pf, s, pIndex)
          edgeNote(pf.backfill.max, s)
        }
        pf.backfill.pos += PAGE
        if (offset === 0 || !pg.items.length) pf.backfill.done = true
        await sleep(GAP_MS)
      }
      if (pf.backfill.done) {
        pf.sealed = true
        sealed.push(e.epoch)
      }
      pf.updatedAt = new Date().toISOString()
      await saveField(pf, pSaved)
      break
    }
  }

  return { epoch: E, caught, backfilled, past, counted: f.counted, grown, sealed }
}

/* ---------------- reading ---------------- */

export async function fieldEpochs(): Promise<EpochItem[]> {
  return (await kvGetJson<EpochItem[]>(K_EPOCHS)) ?? []
}

const poolIds = () => (process.env.GARDEN_POOL_COMPUTORS ?? '').split(',').map(x => x.trim()).filter(x => /^[A-Z]{60}$/.test(x))

/** The field of an epoch (the current one when omitted), laid out as territories; null before the first tick. */
export async function fieldView(epoch?: number): Promise<FieldView | null> {
  const epochs = await fieldEpochs()
  const item = epoch ? epochs.find(e => e.epoch === epoch) : epochs[0]
  if (!item) return null
  const { f } = await loadField(item.epoch)
  if (!f.head && !f.counted) return null
  const ts = territories(f)
  const cells = ts.reduce((a, t) => a + t.cells, 0)
  const g = gridFor(cells)
  const pool = new Set(poolIds())
  return {
    epoch: item.epoch,
    start: epochStart(item.epoch).getTime(),
    end: epochStart(item.epoch + 1).getTime(),
    sealed: f.sealed,
    updatedAt: f.updatedAt,
    grown: item.verification?.verified ?? item.solutions,
    counted: f.counted,
    grid: { w: g.w, h: g.h },
    territories: ts,
    cells,
    identities: f.ids.length,
    pool: f.ids.map((id, i) => (pool.has(id) ? i : -1)).filter(i => i >= 0),
  }
}

/** One identity's land in an epoch, by its full identity; null when it has no brain there. */
export async function findTerritory(epoch: number, id: string): Promise<(Territory & { id: string }) | null> {
  const { f } = await loadField(epoch)
  const i = f.ids.indexOf(id)
  if (i < 0) return null
  const t = territories(f).find(x => x.i === i)
  if (t) return { ...t, id }
  // fewer brains than a cell: still a record
  return { id, h: `${id.slice(0, 6)}…${id.slice(-4)}`, i, at: -1, cells: 0, brains: f.n[i]!, first: f.first[i] ?? null, last: f.last[i] ?? null, best: f.best[i] ?? null }
}
