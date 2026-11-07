import 'server-only'
import { hourlyCloses } from './candles'
import {
  type BrainRow,
  type ExplorerReconstruction,
  type ExplorerSolution,
  EXPLORER,
  type Genome,
  emits,
  frameErrors,
  genomeOf,
  hourOfIndex,
  indexOfHour,
  liveCheck,
  type LiveHour,
  liveStats,
  type LiveStats,
  rankBrains,
  rowOf,
} from './brains-view'
import { kvAddToSet, kvGetJson, kvSetJson, kvSetMembers } from './store'

/**
 * Brain Watch, the server side: the best brains of an epoch from the Jetski ANN Explorer's public API, each
 * genome re-run here and kept only when our error count equals the verified score, the out-of-sample check
 * against real hours, and the archive (one list per epoch, one genome per brain) in KV.
 */
const API = `${EXPLORER}/api/v1`
/** how many of the epoch's best brains the page lists and the archive keeps */
export const TOP = 20

async function get<T>(path: string, revalidate: number): Promise<T> {
  const r = await fetch(`${API}${path}`, { next: { revalidate }, signal: AbortSignal.timeout(12000), headers: { accept: 'application/json' } })
  if (!r.ok) throw new Error(`explorer ${r.status} ${path}`)
  return (await r.json()) as T
}

type EpochItem = { epoch: number; algoFamily: string; solutions: number; coreVersion?: string; firstTick?: number; lastTick?: number }

export async function bppEpochs(): Promise<EpochItem[]> {
  const ep = await get<{ items: EpochItem[] }>('/epochs', 300)
  return ep.items.filter(e => e.algoFamily === 'bpp9000').sort((a, b) => b.epoch - a.epoch)
}

export type TopList = { epoch: number; rows: BrainRow[]; solutions: number; coreVersion: string | null; fetchedAt: string; live: boolean }

/** The epoch's best verified brains by the core's rating. The explorer sorts by error count; the shift re-sort is ours. */
export async function topBrains(epoch?: number): Promise<TopList> {
  const epochs = await bppEpochs()
  const cur = epoch ? epochs.find(e => e.epoch === epoch) : epochs[0]
  if (!cur) throw new Error('no epoch')
  const list = await get<{ items: ExplorerSolution[] }>(`/solutions?algorithm=BPP9000&epoch=${cur.epoch}&status=verified&sort=score&order=asc&limit=100`, 300)
  const rows = rankBrains(list.items.map(rowOf).filter((r): r is BrainRow => r != null)).slice(0, TOP)
  return { epoch: cur.epoch, rows, solutions: cur.solutions, coreVersion: cur.coreVersion ?? null, fetchedAt: new Date().toISOString(), live: true }
}

/** 18-bit signed movements, little-endian bit packing, as the explorer publishes the task. */
function targetsOf(b64: string, bits: number): Uint8Array {
  const b = Buffer.from(b64, 'base64')
  const n = Math.floor((b.length * 8) / bits)
  const out = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    let v = 0
    for (let k = 0; k < bits; k++) {
      const pos = i * bits + k
      if ((b[pos >> 3]! >> (pos & 7)) & 1) v |= 1 << k
    }
    if (v & (1 << (bits - 1))) v -= 1 << bits
    out[i] = v >= 0 ? 1 : 0
  }
  return out
}

type Rec = ExplorerReconstruction & { searchReplay?: { finalPredictions?: { taskMovements?: string; taskMovementBits?: number } } }

export type CheckedGenome = Genome & { check: { errors: number | null; matches: boolean } }

const GENOME_KEY = (hash: string) => `bpp:brain:${hash}`

/** The genome of one brain: from the archive when we have it, else from the explorer, re-run and checked. */
export async function brainGenome(hash: string): Promise<CheckedGenome | null> {
  if (!/^[a-z]{60}$/.test(hash)) return null
  const kept = await kvGetJson<CheckedGenome>(GENOME_KEY(hash)).catch(() => null)
  if (kept) return kept
  const [sol, rec] = await Promise.all([get<ExplorerSolution>(`/solutions/${hash}`, 86400), get<Rec>(`/solutions/${hash}/reconstruction`, 86400)])
  const row = rowOf(sol)
  if (!row) return null
  const g = genomeOf(rec, row)
  // our own run against the task the explorer ships with the reconstruction
  const fp = rec.searchReplay?.finalPredictions
  let errors: number | null = null
  if (fp?.taskMovements && fp.taskMovementBits) {
    const targets = targetsOf(fp.taskMovements, fp.taskMovementBits)
    const em = emits(g, g.shift + g.task.frame)
    errors = em.length === g.shift + g.task.frame && targets.length >= g.shift + g.task.frame ? frameErrors(em, targets, g.shift, g.task.frame) : null
  }
  const checked: CheckedGenome = { ...g, check: { errors, matches: errors === g.score } }
  if (checked.check.matches) await kvSetJson(GENOME_KEY(hash), checked).catch(() => {})
  return checked
}

export type LiveResult = {
  hash: string
  /** hours after the loaded task sequence, oldest first */
  hours: LiveHour[]
  all: LiveStats
  /** the hours after this brain was published: nobody could have fitted them */
  sinceFound: LiveStats
  /** when the loaded sequence ends (first out-of-sample hour) */
  dataEnd: number
  checkedAt: string
}

/** Run the brain past the end of its task and grade every closed hour since against Binance. */
export async function liveOf(g: Genome): Promise<LiveResult> {
  const dataEnd = hourOfIndex(g.task, g.task.hours)
  const closes = await hourlyCloses(dataEnd - 3600)
  const lastHour = closes.at(-1)?.hour ?? dataEnd
  const em = emits(g, indexOfHour(g.task, lastHour) + 1)
  const hours = liveCheck(em, g.task, closes)
  const found = g.foundAt ? Math.floor(Date.parse(g.foundAt) / 3600000) * 3600 + 3600 : null
  return {
    hash: g.hash,
    hours,
    all: liveStats(hours),
    sinceFound: liveStats(found == null ? [] : hours.filter(h => h.hour >= found)),
    dataEnd,
    checkedAt: new Date().toISOString(),
  }
}

/* ---------------- the archive: the museum's shelves ---------------- */

const EPOCH_KEY = (epoch: number) => `bpp:brains:epoch:${epoch}`
const EPOCHS_SET = 'bpp:brains:epochs'

export type EpochShelf = { epoch: number; rows: BrainRow[]; solutions: number; coreVersion: string | null; updatedAt: string }

/** Refresh the current epoch's shelf and keep every genome on it. Idempotent; the tick calls it. */
export async function archiveBrains(): Promise<{ epoch: number; kept: number; checked: number }> {
  const top = await topBrains()
  let kept = 0
  let checked = 0
  for (const r of top.rows) {
    const g = await brainGenome(r.hash).catch(() => null)
    if (g) {
      checked++
      if (g.check.matches) kept++
    }
  }
  const shelf: EpochShelf = { epoch: top.epoch, rows: top.rows, solutions: top.solutions, coreVersion: top.coreVersion, updatedAt: new Date().toISOString() }
  await kvSetJson(EPOCH_KEY(top.epoch), shelf)
  await kvAddToSet(EPOCHS_SET, String(top.epoch))
  return { epoch: top.epoch, kept, checked }
}

export async function shelf(epoch: number): Promise<EpochShelf | null> {
  return kvGetJson<EpochShelf>(EPOCH_KEY(epoch)).catch(() => null)
}

export async function shelves(): Promise<number[]> {
  const m = await kvSetMembers(EPOCHS_SET).catch(() => [] as string[])
  return m.map(Number).sort((a, b) => b - a)
}
