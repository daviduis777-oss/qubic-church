/**
 * Grow Anna: one goal for the whole network, once. Every BPP-9000 brain verified from epoch ANNA_FROM on is
 * planted into one cell of the 128 × 128 Anna Matrix, chosen by its own hash; a cell is whole when it holds
 * max(1, |value|) units of UNIT brains. When the last cell is whole, Anna is whole, and the brain that closed
 * her is kept with its identity, tick and time. Every finished cell keeps the identity of the brain that finished it.
 *
 * Pure and browser safe: the server applies brains, the page reads the same arithmetic.
 */

export const ANNA = 128
export const CELLS = ANNA * ANNA
/** brains per unit of growth; one unit per step of |value| */
export const UNIT = 128
/** the first epoch whose brains grow Anna: Wednesday 11 November 2026, 12:00 UTC */
export const ANNA_FROM = 239
export const ANNA_START = Date.UTC(2026, 10, 11, 12)

/** Brains a cell needs to be whole. */
export const needOf = (v: number, unit = UNIT) => Math.max(1, Math.abs(v)) * unit

/** Brains Anna needs in all, for a matrix. */
export function needTotal(matrix: number[][], unit = UNIT): number {
  let s = 0
  for (const row of matrix) for (const v of row) s += needOf(v, unit)
  return s
}

/**
 * The cell a brain is planted in: an FNV-1a hash of its 60-letter hash, folded to 14 bits. (Reading the letters
 * as one base-26 number would not do: 26 is even, so modulo 2^14 only the last fourteen letters would count.)
 */
export function cellOfHash(hash: string): number {
  let h = 2166136261
  for (let k = 0; k < hash.length; k++) {
    h ^= hash.charCodeAt(k)
    h = Math.imul(h, 16777619)
  }
  h >>>= 0
  return ((h ^ (h >>> 14) ^ (h >>> 28)) >>> 0) % CELLS
}

export const rowCol = (cell: number): [number, number] => [Math.floor(cell / ANNA), cell % ANNA]

/** One finished cell, for the feed. */
export type Finish = { c: number; i: number; ts: number; h: string }

export type Whole = { hash: string; i: number; tick: number; ts: number }

/** The goal's state. `brains` per cell, `finisher` identity index per cell (-1 while growing), `doneAt` seconds. */
export type AnnaCore = {
  brains: Uint32Array
  finisher: Int32Array
  doneAt: Uint32Array
  idBrains: number[]
  idCells: number[]
  total: number
  finished: number
  recent: Finish[]
  whole: Whole | null
}

export const emptyCore = (): AnnaCore => ({
  brains: new Uint32Array(CELLS),
  finisher: new Int32Array(CELLS).fill(-1),
  doneAt: new Uint32Array(CELLS),
  idBrains: [],
  idCells: [],
  total: 0,
  finished: 0,
  recent: [],
  whole: null,
})

/**
 * The next cell that is not whole, at `c` or after it in reading order, wrapping round; -1 when Anna is whole.
 * A disjoint-set over the cells keeps this quick when most of her is whole.
 */
export class NextOpen {
  private up: Int32Array
  constructor(whole: (c: number) => boolean) {
    this.up = new Int32Array(CELLS + 1)
    for (let c = 0; c <= CELLS; c++) this.up[c] = c < CELLS && whole(c) ? c + 1 : c
  }
  private find(c: number): number {
    let r = c
    while (this.up[r] !== r) r = this.up[r]!
    while (this.up[c] !== r) {
      const n = this.up[c]!
      this.up[c] = r
      c = n
    }
    return r
  }
  close(c: number) {
    this.up[c] = c + 1
  }
  from(c: number): number {
    const a = this.find(c)
    if (a < CELLS) return a
    const b = this.find(0)
    return b < CELLS ? b : -1
  }
}

export type Planted = { cell: number; finished: boolean } | null

/**
 * Plant one brain (mutates the core). It goes to the cell of its hash, or, when that cell is whole, to the next
 * cell that is not. Returns where it went and whether it finished that cell; null once Anna is whole.
 */
export function plant(
  core: AnnaCore,
  need: Uint32Array,
  open: NextOpen,
  brain: { hash: string; i: number; ts: number; tick: number },
): Planted {
  if (core.whole) return null
  const cell = open.from(cellOfHash(brain.hash))
  if (cell < 0) return null
  core.brains[cell]!++
  core.total++
  while (core.idBrains.length <= brain.i) {
    core.idBrains.push(0)
    core.idCells.push(0)
  }
  core.idBrains[brain.i]!++
  if (core.brains[cell]! < need[cell]!) return { cell, finished: false }
  core.finisher[cell] = brain.i
  core.doneAt[cell] = Math.floor(brain.ts / 1000)
  core.idCells[brain.i]!++
  core.finished++
  open.close(cell)
  core.recent.unshift({ c: cell, i: brain.i, ts: brain.ts, h: brain.hash })
  if (core.recent.length > 40) core.recent.length = 40
  if (core.finished === CELLS) core.whole = { hash: brain.hash, i: brain.i, tick: brain.tick, ts: brain.ts }
  return { cell, finished: true }
}

/* ---------------- colour ---------------- */

/** Anna's value as a colour: the site's cold glass for negative values, its warm filament for positive ones, white for zero. */
export function annaColour(v: number): [number, number, number] {
  if (v === 0) return [236, 223, 203]
  const k = Math.min(1, Math.abs(v) / 128)
  const mix = (a: number, b: number) => Math.round(a + (b - a) * k)
  return v < 0 ? [mix(30, 110), mix(44, 128), mix(110, 255)] : [mix(150, 255), mix(80, 200), mix(20, 110)]
}

/** A cell's colour at a stage of growth: dark ground, a faint seed, then her colour rising; whole cells at full strength. */
export function cellColour(v: number, progress: number, whole: boolean): [number, number, number] {
  const [r, g, b] = annaColour(v)
  if (whole) return [r, g, b]
  if (progress <= 0) return [16, 15, 22]
  const k = 0.08 + 0.4 * Math.min(1, progress)
  return [Math.round(16 + (r - 16) * k), Math.round(15 + (g - 15) * k), Math.round(22 + (b - 22) * k)]
}

/* ---------------- encoding ---------------- */

export function b64(a: Uint32Array | Int32Array): string {
  const u8 = new Uint8Array(a.buffer, a.byteOffset, a.byteLength)
  if (typeof Buffer !== 'undefined') return Buffer.from(u8).toString('base64')
  let s = ''
  for (let k = 0; k < u8.length; k++) s += String.fromCharCode(u8[k]!)
  return btoa(s)
}

export function fromB64<T extends Uint32Array | Int32Array>(s: string, Kind: { new (b: ArrayBuffer): T }): T {
  let u8: Uint8Array
  if (typeof Buffer !== 'undefined') u8 = new Uint8Array(Buffer.from(s, 'base64'))
  else {
    const bin = atob(s)
    u8 = new Uint8Array(bin.length)
    for (let k = 0; k < bin.length; k++) u8[k] = bin.charCodeAt(k)
  }
  const buf = new ArrayBuffer(u8.length)
  new Uint8Array(buf).set(u8)
  return new Kind(buf)
}

/** What the page receives. */
export type AnnaView = {
  from: number
  start: number
  unit: number
  need: number
  total: number
  finished: number
  /** base64 Uint32 per cell */
  brains: string
  /** base64 Int32 per cell: index into `handles`, or -1 */
  finisher: string
  handles: string[]
  recent: (Omit<Finish, 'i'> & { who: string })[]
  whole: (Omit<Whole, 'i'> & { who: string }) | null
  /** brains per day over the last week, for the pace */
  pace: number | null
  updatedAt: string
}

export const handleOf = (id: string) => `${id.slice(0, 6)}…${id.slice(-4)}`

/** When Anna will be whole at a pace (brains a day); null without a pace. */
export function eta(need: number, total: number, perDay: number | null, now: number): number | null {
  if (!perDay || perDay <= 0) return null
  return now + ((need - total) / perDay) * 86_400_000
}
