/**
 * The Field, pure side: the epoch as land. One cell per BRAINS_PER_CELL verified brains, laid along a Hilbert
 * curve so that every identity's land is one contiguous territory, in the order the identities first appeared in
 * the epoch. Counts only grow, so no territory ever shrinks; at the end of the epoch the field is sealed and kept.
 *
 * An identity is the one the network credits a solution to. Since epoch 228 they rotate: a pool or a miner
 * uses many over an epoch, each for a while. So a territory is a season's name; the pool keeps the worker.
 * Browser safe.
 */

export const BRAINS_PER_CELL = 100

/** The state of one epoch's field, as the crawl keeps it: parallel arrays by identity index. */
export type FieldState = {
  epoch: number
  ids: string[]
  /** verified brains per identity */
  n: number[]
  /** first and last brain seen, ms */
  first: (number | null)[]
  last: (number | null)[]
  /** best (lowest) score seen */
  best: (number | null)[]
  /** brains counted so far */
  counted: number
  /** newest solution the crawl has reached: everything newer is still to count, everything older is counted */
  head: Edge | null
  /** a catch-up that did not reach the head in one tick continues here next tick; `min` is the oldest it counted */
  catchup: { offset: number; newTick: number; newHashes: string[]; min: Edge } | null
  /** when the crawl of this epoch began (ms); brains before it are not in the field */
  opened: number | null
  /** the oldest tick the crawl has counted */
  oldestTick: number | null
  updatedAt: string
  sealed: boolean
}

export type Territory = {
  /** a short handle: first six and last four letters of the identity */
  h: string
  i: number
  /** curve offset of the first cell */
  at: number
  cells: number
  brains: number
  first: number | null
  last: number | null
  best: number | null
}

export type FieldView = {
  epoch: number
  start: number
  end: number
  sealed: boolean
  updatedAt: string
  /** brains verified this epoch, from the explorer's epoch record */
  grown: number
  /** brains the crawl has counted so far, and since when */
  counted: number
  opened: number | null
  grid: { w: number; h: number }
  /** territories in curve order */
  territories: Territory[]
  cells: number
  identities: number
  /** the Aigarth Pool's identities, when known (GARDEN_POOL_COMPUTORS), as indexes */
  pool: number[]
}

export const handleOf = (id: string) => `${id.slice(0, 6)}…${id.slice(-4)}`

export const emptyField = (epoch: number): FieldState => ({
  epoch,
  ids: [],
  n: [],
  first: [],
  last: [],
  best: [],
  counted: 0,
  head: null,
  catchup: null,
  opened: null,
  oldestTick: null,
  updatedAt: new Date(0).toISOString(),
  sealed: false,
})

/** An edge of a crawl: a tick and the hashes already counted at that tick, since several solutions share a tick. */
export type Edge = { tick: number; hashes: string[] }

export const edgeHas = (e: Edge, s: StreamItem) => (s.tickNumber ?? 0) === e.tick && e.hashes.includes(s.hash)
/** Move the edge to this solution: a new tick replaces the hashes, the same tick adds to them. */
export function edgeNote(e: Edge, s: StreamItem) {
  const t = s.tickNumber ?? 0
  if (t === e.tick) e.hashes.push(s.hash)
  else {
    e.tick = t
    e.hashes = [s.hash]
  }
}

/** One solution of the stream, the fields the field needs. */
export type StreamItem = { hash: string; computorId: string; tickNumber?: number; timestamp?: string | number; verification?: { score?: number } }

/** Count a solution into the state (mutates). Returns the identity's index. */
export function countInto(f: FieldState, s: StreamItem, index: Map<string, number>): number {
  let i = index.get(s.computorId)
  if (i == null) {
    i = f.ids.length
    f.ids.push(s.computorId)
    f.n.push(0)
    f.first.push(null)
    f.last.push(null)
    f.best.push(null)
    index.set(s.computorId, i)
  }
  f.n[i]!++
  f.counted++
  const t = typeof s.timestamp === 'string' || typeof s.timestamp === 'number' ? Number(s.timestamp) : NaN
  if (Number.isFinite(t) && t > 0) {
    if (f.first[i] == null || t < f.first[i]!) f.first[i] = t
    if (f.last[i] == null || t > f.last[i]!) f.last[i] = t
  }
  const sc = s.verification?.score
  if (typeof sc === 'number' && (f.best[i] == null || sc < f.best[i]!)) f.best[i] = sc
  return i
}

/* ---------------- the ground: the Anna Matrix, two field cells to each of hers ---------------- */

/** Anna's side; the field's block side is twice that, so one block is one Anna. */
export const ANNA = 128
export const BLOCK = ANNA * 2
/** cells in one block: one whole Anna */
export const CELLS_PER_ANNA = BLOCK * BLOCK

/** Grid for a number of cells: Anna-sized blocks side by side, as many as the cells need (at least one). */
export function gridFor(cells: number): { w: number; h: number; block: number } {
  const blocks = Math.max(1, Math.ceil(cells / CELLS_PER_ANNA))
  return { w: BLOCK * blocks, h: BLOCK, block: BLOCK }
}

/**
 * Cell at a curve offset. The curve walks Anna row by row from the top, turning at the end of each row, and
 * fills each of her cells (two by two field cells) before the next: so the week grows her from the boot sector
 * down to the output, and a territory is a strip along a row.
 */
export function cellAt(grid: { w: number; h: number; block: number }, d: number): [number, number] {
  const b = Math.floor(d / CELLS_PER_ANNA)
  const r0 = d - b * CELLS_PER_ANNA
  const a = r0 >> 2
  const sub = r0 & 3
  const row = Math.floor(a / ANNA)
  const c0 = a % ANNA
  const col = row & 1 ? ANNA - 1 - c0 : c0
  return [b * BLOCK + col * 2 + (sub & 1), row * 2 + (sub >> 1)]
}

/** Curve offset of a cell, the inverse of cellAt. */
export function offsetOf(grid: { w: number; h: number; block: number }, x: number, y: number): number {
  const b = Math.floor(x / BLOCK)
  const lx = x - b * BLOCK
  const row = y >> 1
  const col = lx >> 1
  const c0 = row & 1 ? ANNA - 1 - col : col
  const sub = (lx & 1) + ((y & 1) << 1)
  return b * CELLS_PER_ANNA + (row * ANNA + c0) * 4 + sub
}

/** Anna's cell under a field cell: row and column of the matrix. */
export const annaCellOf = (x: number, y: number): [number, number] => [y >> 1, (x % BLOCK) >> 1]

/** Jordan's reading of the rows (a hypothesis, kept as he drew it): what each band of the matrix is for. */
export const BANDS: { from: number; to: number; name: string }[] = [
  { from: 0, to: 20, name: 'boot sector' },
  { from: 21, to: 21, name: 'input row' },
  { from: 22, to: 42, name: 'shallow network' },
  { from: 43, to: 67, name: 'processing core' },
  { from: 68, to: 68, name: 'cortex bridge' },
  { from: 69, to: 95, name: 'deep network' },
  { from: 96, to: 96, name: 'output row' },
  { from: 97, to: 127, name: 'the void' },
]

export const bandOf = (row: number) => BANDS.find(b => row >= b.from && row <= b.to) ?? BANDS[BANDS.length - 1]!

/** Which of Anna's rows the field has reached with `cells` claimed cells (one block), and how much of her is grown. */
export function annaProgress(cells: number): { row: number; grown: number } {
  const inBlock = Math.min(cells, CELLS_PER_ANNA)
  return { row: Math.min(ANNA - 1, Math.floor(inBlock / (ANNA * 4))), grown: inBlock / CELLS_PER_ANNA }
}

/* ---------------- layout ---------------- */

/** Territories from the state: by first appearance, then by index; cells = floor(brains / BRAINS_PER_CELL). */
export function territories(f: Pick<FieldState, 'ids' | 'n' | 'first' | 'last' | 'best'>): Territory[] {
  const rows: number[] = []
  for (let i = 0; i < f.ids.length; i++) if (f.n[i]! >= BRAINS_PER_CELL) rows.push(i)
  rows.sort((a, b) => (f.first[a] ?? Infinity) - (f.first[b] ?? Infinity) || a - b)
  let at = 0
  return rows.map(i => {
    const cells = Math.floor(f.n[i]! / BRAINS_PER_CELL)
    const t: Territory = { h: handleOf(f.ids[i]!), i, at, cells, brains: f.n[i]!, first: f.first[i] ?? null, last: f.last[i] ?? null, best: f.best[i] ?? null }
    at += cells
    return t
  })
}

/** A warm colour per identity, spread so that neighbours differ: hue 18..52, lightness 34..72, from the id's hash. */
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

/** What a territory has earned this epoch, all of it checkable against the explorer. */
export function marks(t: Pick<Territory, 'brains' | 'cells' | 'best'> | null, inHundred: boolean, bestOfEpoch: boolean): Mark[] {
  const brains = t?.brains ?? 0
  const best = t?.best ?? null
  return [
    { key: 'sprout', label: 'first sprout', got: brains >= 1, note: 'one verified brain' },
    { key: 'cell', label: 'a cell', got: brains >= BRAINS_PER_CELL, note: `${BRAINS_PER_CELL} brains claim one cell` },
    { key: 'ten', label: 'ten cells', got: brains >= 10 * BRAINS_PER_CELL, note: `${(10 * BRAINS_PER_CELL).toLocaleString('en-US')} brains` },
    { key: 'hundred', label: 'a hundred cells', got: brains >= 100 * BRAINS_PER_CELL, note: `${(100 * BRAINS_PER_CELL).toLocaleString('en-US')} brains` },
    { key: 'sixty', label: 'past sixty', got: best != null && best <= 3504, note: 'a brain with homework over 60%' },
    { key: 'top', label: 'in the hundred', got: inHundred, note: 'one of the epoch’s hundred best brains' },
    { key: 'best', label: 'best of the epoch', got: bestOfEpoch, note: 'the epoch’s best brain, so far' },
  ]
}

/** Brains to the next cell. */
export const toNextCell = (brains: number) => BRAINS_PER_CELL - (brains % BRAINS_PER_CELL)
