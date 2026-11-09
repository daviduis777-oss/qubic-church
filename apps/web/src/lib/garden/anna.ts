import 'server-only'
import annaMatrix from '@/data/anna-matrix.json'
import { kvGetJson, kvSetJson } from '@/lib/bpp/store'
import {
  ANNA_FROM,
  ANNA_START,
  type AnnaCore,
  type AnnaView,
  CELLS,
  NextOpen,
  UNIT,
  b64,
  emptyCore,
  fromB64,
  handleOf,
  needOf,
  plant,
} from './anna-view'
import type { StreamItem } from './field-view'

/**
 * Grow Anna, server side: the core in KV (three per-cell arrays, the identities in chunks, their totals), fed by
 * the field's crawl with every brain of epoch ANNA_FROM and after, oldest first within each batch.
 */
const K = 'garden:anna'
const K_IDS = (k: number) => `garden:anna:ids:${k}`
const IDS_PER_CHUNK = 3000

const MATRIX = (annaMatrix as { matrix: number[][] }).matrix
/** brains per unit; GARDEN_ANNA_UNIT only for local runs */
export const unit = () => Number(process.env.GARDEN_ANNA_UNIT) || UNIT
/** first epoch; GARDEN_ANNA_FROM only for local runs */
export const annaFrom = () => Number(process.env.GARDEN_ANNA_FROM) || ANNA_FROM

function needs(): Uint32Array {
  const u = unit()
  const n = new Uint32Array(CELLS)
  for (let r = 0; r < 128; r++) for (let c = 0; c < 128; c++) n[r * 128 + c] = needOf(MATRIX[r]![c]!, u)
  return n
}

type Stored = {
  brains: string
  finisher: string
  doneAt: string
  idBrains: string
  idCells: string
  chunks: number
  total: number
  finished: number
  recent: AnnaCore['recent']
  whole: AnnaCore['whole']
  daily: { d: string; total: number }[]
  updatedAt: string
}

type Loaded = { core: AnnaCore; ids: string[]; savedIds: number; daily: Stored['daily']; updatedAt: string }

async function load(): Promise<Loaded> {
  const s = await kvGetJson<Stored>(K)
  if (!s) return { core: emptyCore(), ids: [], savedIds: 0, daily: [], updatedAt: new Date(0).toISOString() }
  const ids: string[] = []
  for (let k = 0; k < s.chunks; k++) ids.push(...((await kvGetJson<string[]>(K_IDS(k))) ?? []))
  const core: AnnaCore = {
    brains: fromB64(s.brains, Uint32Array),
    finisher: fromB64(s.finisher, Int32Array),
    doneAt: fromB64(s.doneAt, Uint32Array),
    idBrains: Array.from(fromB64(s.idBrains, Uint32Array)),
    idCells: Array.from(fromB64(s.idCells, Uint32Array)),
    total: s.total,
    finished: s.finished,
    recent: s.recent,
    whole: s.whole,
  }
  return { core, ids, savedIds: ids.length, daily: s.daily ?? [], updatedAt: s.updatedAt }
}

async function save(l: Loaded) {
  const chunks = Math.ceil(l.ids.length / IDS_PER_CHUNK)
  for (let k = Math.floor(l.savedIds / IDS_PER_CHUNK); k < chunks; k++) await kvSetJson(K_IDS(k), l.ids.slice(k * IDS_PER_CHUNK, (k + 1) * IDS_PER_CHUNK))
  const day = new Date().toISOString().slice(0, 10)
  const daily = l.daily.filter(x => x.d !== day).concat({ d: day, total: l.core.total }).slice(-30)
  const s: Stored = {
    brains: b64(l.core.brains),
    finisher: b64(l.core.finisher),
    doneAt: b64(l.core.doneAt),
    idBrains: b64(Uint32Array.from(l.core.idBrains)),
    idCells: b64(Uint32Array.from(l.core.idCells)),
    chunks,
    total: l.core.total,
    finished: l.core.finished,
    recent: l.core.recent,
    whole: l.core.whole,
    daily,
    updatedAt: new Date().toISOString(),
  }
  await kvSetJson(K, s)
}

/** Plant a batch of one epoch's brains, oldest first. Returns how many were planted and how many cells they finished. */
export async function growAnna(epoch: number, items: StreamItem[]): Promise<{ planted: number; finished: number } | null> {
  if (epoch < annaFrom() || !items.length) return null
  const l = await load()
  if (l.core.whole) return { planted: 0, finished: 0 }
  const need = needs()
  const open = new NextOpen(c => l.core.brains[c]! >= need[c]!)
  const index = new Map(l.ids.map((id, i) => [id, i]))
  const sorted = [...items].sort((a, b) => (a.tickNumber ?? 0) - (b.tickNumber ?? 0) || (a.hash < b.hash ? -1 : 1))
  let planted = 0
  let finished = 0
  for (const s of sorted) {
    let i = index.get(s.computorId)
    if (i == null) {
      i = l.ids.length
      l.ids.push(s.computorId)
      index.set(s.computorId, i)
    }
    const t = Number(s.timestamp)
    const p = plant(l.core, need, open, { hash: s.hash, i, ts: Number.isFinite(t) && t > 0 ? t : Date.now(), tick: s.tickNumber ?? 0 })
    if (!p) break
    planted++
    if (p.finished) finished++
  }
  await save(l)
  return { planted, finished }
}

/** Brains a day over the last week of the record, or null before two days of it. */
function paceOf(daily: Stored['daily'], total: number): number | null {
  if (daily.length < 2) return null
  const first = daily[Math.max(0, daily.length - 8)]!
  const days = (Date.now() - Date.parse(`${first.d}T00:00:00Z`)) / 86_400_000
  return days > 0.5 ? (total - first.total) / days : null
}

export async function annaView(): Promise<AnnaView> {
  const l = await load()
  // only the finishers' handles travel to the page
  const ref = new Map<number, number>()
  const handles: string[] = []
  const finisher = new Int32Array(CELLS).fill(-1)
  const refOf = (i: number) => {
    let r = ref.get(i)
    if (r == null) {
      r = handles.length
      handles.push(handleOf(l.ids[i] ?? ''))
      ref.set(i, r)
    }
    return r
  }
  for (let c = 0; c < CELLS; c++) if (l.core.finisher[c]! >= 0) finisher[c] = refOf(l.core.finisher[c]!)
  const u = unit()
  return {
    from: annaFrom(),
    start: ANNA_START,
    unit: u,
    need: needs().reduce((a, b) => a + b, 0),
    total: l.core.total,
    finished: l.core.finished,
    brains: b64(l.core.brains),
    finisher: b64(finisher),
    handles,
    recent: l.core.recent.slice(0, 12).map(({ i, ...f }) => ({ ...f, who: handleOf(l.ids[i] ?? '') })),
    whole: l.core.whole ? { hash: l.core.whole.hash, tick: l.core.whole.tick, ts: l.core.whole.ts, who: l.ids[l.core.whole.i] ?? '' } : null,
    pace: paceOf(l.daily, l.core.total),
    updatedAt: l.updatedAt,
  }
}

export type AnnaFind = { id: string; brains: number; cells: number[]; rank: number | null; gardeners: number }

/** One identity's part in Anna: its brains, the cells it finished, its rank by brains. */
export async function annaFind(id: string): Promise<AnnaFind | null> {
  const l = await load()
  const i = l.ids.indexOf(id)
  if (i < 0) return null
  const cells: number[] = []
  for (let c = 0; c < CELLS; c++) if (l.core.finisher[c] === i) cells.push(c)
  const mine = l.core.idBrains[i] ?? 0
  let ahead = 0
  for (const n of l.core.idBrains) if (n > mine) ahead++
  return { id, brains: mine, cells, rank: ahead + 1, gardeners: l.ids.length }
}
