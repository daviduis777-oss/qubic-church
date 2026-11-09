/**
 * The Field, pure side: the epoch as land. One cell per BRAINS_PER_CELL verified brains, laid along a Hilbert
 * curve so that every computor's land is one contiguous territory, in the order the computors first appeared in
 * the epoch. Counts only grow, so no territory ever shrinks; at the end of the epoch the field is sealed and kept.
 *
 * "Computor" is the explorer's word: the identity a solution is credited to. Pools mine into their computors'
 * seats, so a pool is one or a few territories; a pool worker's share lives in the pool's own record.
 * Browser safe.
 */

export const BRAINS_PER_CELL = 100

/** Computors known to the explorer, listed once and extended as new ones appear. */
export type ComputorMeta = { id: string; firstEpoch: number | null; lastEpoch: number | null; epochs: number | null; readAt?: number }

/** One computor's record in one epoch, with what the marks need to know about the computor. */
export type Holding = { id: string; n: number; first: number | null; last: number | null; fe?: number | null; ep?: number | null }

/** The field of one epoch: holdings by computor index, plus whether it is sealed. */
export type FieldState = {
  epoch: number
  holdings: Holding[]
  updatedAt: string
  sealed: boolean
}

export type FieldView = {
  epoch: number
  start: number
  end: number
  sealed: boolean
  updatedAt: string
  /** brains verified this epoch, from /epochs (the sum of holdings lags it a little) */
  grown: number
  grid: { w: number; h: number }
  /** territories in curve order */
  territories: Territory[]
  cells: number
  /** the Aigarth Pool's computors, when known (GARDEN_POOL_COMPUTORS) */
  pool: string[]
}

export type Territory = {
  id: string
  /** curve offset of the first cell */
  at: number
  cells: number
  brains: number
  first: number | null
  last: number | null
  firstEpoch: number | null
  epochs: number | null
}

/* ---------------- Hilbert curve ---------------- */

/** Position of the d-th point on a Hilbert curve over an n×n grid (n a power of two). */
export function hilbert(n: number, d: number): [number, number] {
  let x = 0
  let y = 0
  let t = d
  for (let s = 1; s < n; s *= 2) {
    const rx = 1 & (t >> 1)
    const ry = 1 & (t ^ rx)
    if (ry === 0) {
      if (rx === 1) {
        x = s - 1 - x
        y = s - 1 - y
      }
      const tmp = x
      x = y
      y = tmp
    }
    x += s * rx
    y += s * ry
    t >>= 2
  }
  return [x, y]
}

/** Grid for a number of cells: square Hilbert blocks of 256 side by side, as many as the cells need (at least one). */
export function gridFor(cells: number): { w: number; h: number; block: number } {
  const block = 256
  const blocks = Math.max(1, Math.ceil(cells / (block * block)))
  return { w: block * blocks, h: block, block }
}

/** Cell at a curve offset, blocks of the Hilbert curve side by side. */
export function cellAt(grid: { w: number; h: number; block: number }, d: number): [number, number] {
  const per = grid.block * grid.block
  const b = Math.floor(d / per)
  const [x, y] = hilbert(grid.block, d % per)
  return [x + b * grid.block, y]
}

/* ---------------- layout ---------------- */

/** Territories from holdings: by first appearance, then by id; cells = floor(brains / BRAINS_PER_CELL). */
export function territories(holdings: Holding[]): Territory[] {
  const rows = holdings.filter(h => h.n >= BRAINS_PER_CELL).sort((a, b) => (a.first ?? Infinity) - (b.first ?? Infinity) || (a.id < b.id ? -1 : 1))
  let at = 0
  return rows.map(h => {
    const cells = Math.floor(h.n / BRAINS_PER_CELL)
    const t: Territory = { id: h.id, at, cells, brains: h.n, first: h.first, last: h.last, firstEpoch: h.fe ?? null, epochs: h.ep ?? null }
    at += cells
    return t
  })
}

/** A warm colour per computor, spread so that neighbours differ: hue 18..52, lightness 34..72, from the id's hash. */
export function colourOf(id: string): string {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  h >>>= 0
  const hue = 18 + (h % 35)
  const light = 34 + ((h >>> 8) % 39)
  const sat = 55 + ((h >>> 16) % 35)
  return `hsl(${hue} ${sat}% ${light}%)`
}

/* ---------------- marks ---------------- */

export type Mark = { key: string; label: string; got: boolean; note: string }

/** What a territory has earned, all of it checkable against the explorer. */
export function marks(t: Pick<Territory, 'brains' | 'cells' | 'epochs' | 'firstEpoch'> | null, inHundred: boolean, bestOfEpoch: boolean): Mark[] {
  const brains = t?.brains ?? 0
  return [
    { key: 'sprout', label: 'first sprout', got: brains >= 1, note: 'one verified brain' },
    { key: 'cell', label: 'a cell', got: brains >= BRAINS_PER_CELL, note: `${BRAINS_PER_CELL} brains claim one cell` },
    { key: 'ten', label: 'ten cells', got: brains >= 10 * BRAINS_PER_CELL, note: `${(10 * BRAINS_PER_CELL).toLocaleString('en-US')} brains` },
    { key: 'hundred', label: 'a hundred cells', got: brains >= 100 * BRAINS_PER_CELL, note: `${(100 * BRAINS_PER_CELL).toLocaleString('en-US')} brains` },
    { key: 'top', label: 'in the hundred', got: inHundred, note: 'one of the epoch’s hundred best brains' },
    { key: 'best', label: 'best of the epoch', got: bestOfEpoch, note: 'the epoch’s best brain, so far' },
    { key: 'seven', label: 'seven epochs', got: (t?.epochs ?? 0) >= 7, note: 'seven epochs with at least one brain' },
    { key: 'elder', label: 'elder', got: t?.firstEpoch != null && t.firstEpoch <= 200, note: 'in the garden since epoch 200 or earlier' },
  ]
}

/** Brains to the next cell. */
export const toNextCell = (brains: number) => BRAINS_PER_CELL - (brains % BRAINS_PER_CELL)
