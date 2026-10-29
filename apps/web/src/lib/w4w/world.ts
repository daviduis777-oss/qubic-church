/**
 * W4W world rules, shared by the server (/api/w4w, the authority) and the game (inlined by w4w/build.mjs).
 * Pure functions only: no imports, no clock, no randomness except seeded hashes, so both sides agree cell by cell.
 *
 * Time on the map is real time. One step = one hex. Rates are per minute.
 */

export type Cell = [number, number]
export type Inv = { wood: number; stone: number; flint: number; resin: number }
export type Act = { kind: 'gather'; q: number; r: number; res: keyof Inv; until: number } | null
export type Char = {
  stash?: Inv
  v: 1
  q: number
  r: number
  path: Cell[]
  t0: number
  stepMs: number
  warmth: number
  health: number
  energy: number
  simT: number
  frozenUntil: number
  home: Cell
  inv: Inv
  act: Act
  died?: { t: number; q: number; r: number; cause: string; zone: number } | null
  lost?: boolean // the wind took the trail: this step leads somewhere you did not choose
}
export type Ctx = {
  heatR: number // radius of the town's warm circle, world units
  holds: boolean // the town holds tonight
  netStorm: boolean // the network is having a bad epoch
  shelters: Record<string, 'house' | 'church' | 'fire'>
  home: string // key of this character's own house
  hearths: Record<string, number> // key -> burning until (ms)
  insulation: number
  rime?: [number, number, number][] // where the Rime stood: [since t, q, r], oldest first
  noDrift?: boolean // planning a trip: no wind luck
}
export type Event =
  | { kind: 'arrived'; t: number; q: number; r: number }
  | { kind: 'froze'; t: number; q: number; r: number; cause: string; zone: number; inv: Inv }
  | { kind: 'gathered'; t: number; q: number; r: number; res: keyof Inv }
  | { kind: 'thawed'; t: number }
  | { kind: 'lost'; t: number; q: number; r: number }

export const STEP_MS = 3_000 // one cell inside the town, calm weather
/** How long one cell takes, by the zone you step into: quick between houses, hours across the Wastes. */
export const ZONE_STEP_MS = [3_000, 30_000, 45_000, 60_000] as const
export const WX_SLOW = { calm: 1, wind: 1.5, blizzard: 2.5 } as const
/** Chance per step out in the Wastes that the wind takes the trail and you lose your way. */
export const DRIFT = { calm: 0, wind: 0.15, blizzard: 0.4 } as const
/** The Rime: what walks the Wastes. Anna's light keeps it past the forest edge. */
export const RIME_MS = 45_000
export const RIME_MIN_RING = 7
export const RIME_PULL = 0.04
/** The Mouth: the cave of Pure Cold under the last tooth, and the two that keep it. */
export const CAVE: Cell = [6, 10]
export const GUARD_MS = 20_000
export const MAX_RING = 16
export const FREEZE_MS = 24 * 3600_000
export const BAG_MS = 24 * 3600_000
export const GATHER_MS = 60_000
export const NODE_COOLDOWN_MS = 20 * 60_000
export const LOSS_K = 0.5 // warmth lost per minute per point of cold not covered
export const FROSTBITE = 1 // health lost per minute below 25 warmth
export const INSULATION_T1 = 22
export const WEIGHT: Inv = { wood: 2, stone: 3, flint: 0.2, resin: 0.3 }
export const CAPACITY = 14 // pockets 6 + canvas sack 8
export const OVERLOAD = 1.3
export const HEARTH_COST: Inv = { wood: 6, stone: 4, flint: 1, resin: 0 }
export const HEARTH_START_MS = 6 * 3600_000
export const HEARTH_WOOD_MS = 3 * 3600_000
export const HEARTH_MAX_MS = 24 * 3600_000
/** Demo residents that still warm the town in the closed test: five rigs on, 5,190 sol/h. */
export const DEMO_TOWN = { people: 5, power: 5190, deeds: 2 }

/** Town buildings: they shelter anyone who reaches them. Same cells as the game's SPECIAL and DEMO houses. */
export const SPECIAL = { core: [0, 0], church: [1, -3], plaza: [-1, 3], observatory: [4, -2], library: [5, -5], mine: [-6, 2] } as const
export const DEMO_CELLS: Cell[] = [[2, -1], [-2, 1], [1, 1], [-1, -1], [3, -3], [-3, 3], [3, 0]]

export const ZONES = [
  { name: 'Aigarth', cold: 12 },
  { name: 'The Edge', cold: 15 },
  { name: 'Black Pines', cold: 22 },
  { name: 'Stone Teeth', cold: 28 },
] as const

export const DIRS: Cell[] = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]]
export const key = (q: number, r: number) => `${q},${r}`
export const ringOf = (q: number, r: number) => (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2
export const dist = (a: Cell, b: Cell) => ringOf(a[0] - b[0], a[1] - b[1])
export const worldXZ = (q: number, r: number) => [2 * (q + r / 2), 1.7320508 * r] as const
export function zoneOf(q: number, r: number) {
  const n = ringOf(q, r)
  return n <= 5 ? 0 : n <= 8 ? 1 : n <= 12 ? 2 : n <= MAX_RING ? 3 : 4
}

function hash(a: number, b: number, s = 0) {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(s | 0, 2147483647)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

export type Terrain = 'town' | 'open' | 'tree' | 'forest' | 'rock' | 'mountain' | 'void'
/** What stands on a cell. The game draws exactly this; the server walks exactly this. */
export function terrain(q: number, r: number): Terrain {
  const n = ringOf(q, r)
  if (n <= 5) return 'town'
  if (n > MAX_RING) return 'void'
  const h = hash(q, r, 7)
  if (n <= 8) return h < 0.22 ? 'tree' : h < 0.3 ? 'rock' : 'open'
  if (n <= 12) return n >= 10 && h < 0.12 ? 'mountain' : h < 0.62 ? 'forest' : h < 0.7 ? 'rock' : 'open'
  return h < 0.22 ? 'mountain' : h < 0.52 ? 'rock' : h < 0.6 ? 'tree' : 'open'
}
export const passable = (q: number, r: number) => { const t = terrain(q, r); return t !== 'mountain' && t !== 'void' }
/** What a cell gives when you work it, or null. */
export function resourceOf(q: number, r: number): keyof Inv | null {
  const t = terrain(q, r), z = zoneOf(q, r), h = hash(q, r, 11)
  if (t === 'tree' || t === 'forest') return z === 2 && h < 0.25 ? 'resin' : 'wood'
  if (t === 'rock') return z === 3 && h < 0.3 ? 'flint' : 'stone'
  return null
}

/** The weather, the same for the whole world. Two-hour blocks; a bad network epoch tilts it to storms. */
export function weatherAt(t: number, netStorm = false) {
  const h = hash(Math.floor(t / 7_200_000), 5, 3)
  const [calm, wind] = netStorm ? [0.25, 0.75] : [0.5, 0.85]
  return h < calm ? { id: 'calm', name: 'Calm', mult: 1.0 } : h < wind ? { id: 'wind', name: 'Wind', mult: 1.4 } : { id: 'blizzard', name: 'Blizzard', mult: 2.0 }
}
/** Six-hour day: four hours of night, two of grey light. */
export const greyAt = (t: number) => Math.floor(t / 3_600_000) % 6 >= 4
/** Wednesday 12:00 to 14:00 UTC, the epoch changes: the night of the bell. */
export function bellAt(t: number) { const d = new Date(t); return d.getUTCDay() === 3 && d.getUTCHours() >= 12 && d.getUTCHours() < 14 }

/** How much cold bites on a cell at a moment, before clothing. 0 inside the warm circle. */
export function coldAt(q: number, r: number, t: number, ctx: Ctx) {
  const [x, z] = worldXZ(q, r)
  if (Math.hypot(x, z) <= ctx.heatR) return 0
  const zone = zoneOf(q, r)
  if (zone > 3) return 999
  let c: number = (ZONES as readonly { cold: number }[])[zone]!.cold
  // a town that holds softens the near zones; a frozen town bites even between its own houses
  if (ctx.holds) { if (zone <= 2) c -= 5 } else c += zone === 0 ? 10 : 5
  if (greyAt(t)) c -= 5
  if (bellAt(t)) c += 10
  if (inMouth(q, r)) c += 20 // the cave breathes out
  return Math.max(0, c) * weatherAt(t, ctx.netStorm).mult
}
/** Warmth gained per minute from what stands on the cell. */
export function sourceAt(q: number, r: number, t: number, ctx: Ctx) {
  const k = key(q, r)
  if ((ctx.hearths[k] ?? 0) > t) return 8
  const s = ctx.shelters[k]
  if (s === 'fire') return 8
  if (s) return 6
  const [x, z] = worldXZ(q, r)
  return Math.hypot(x, z) <= ctx.heatR ? 4 : 0
}

export const weightOf = (inv: Inv) => (Object.keys(WEIGHT) as (keyof Inv)[]).reduce((a, k) => a + (inv[k] || 0) * WEIGHT[k], 0)
export const emptyInv = (): Inv => ({ wood: 0, stone: 0, flint: 0, resin: 0 })

/** Shortest walkable path from a to b (b may be a building cell). Cells after a, a excluded. */
/** Buildings are walked into, never through: `blocked` cells are only allowed as the destination. */
export function findPath(a: Cell, b: Cell, limit = 4000, blocked?: Set<string>): Cell[] | null {
  if (a[0] === b[0] && a[1] === b[1]) return []
  if (!passable(b[0], b[1])) return null
  const open: [number, number, Cell][] = [[dist(a, b), 0, a]]
  const came = new Map<string, string>(), g = new Map<string, number>([[key(...a), 0]])
  let n = 0
  while (open.length && n++ < limit) {
    open.sort((x, y) => x[0] - y[0])
    const [, gc, cur] = open.shift()!
    if (cur[0] === b[0] && cur[1] === b[1]) {
      const out: Cell[] = []; let k = key(...cur)
      while (k !== key(...a)) { const [q, r] = k.split(',').map(Number); out.unshift([q!, r!]); k = came.get(k)! }
      return out
    }
    for (const [dq, dr] of DIRS) {
      const nq = cur[0] + dq, nr = cur[1] + dr, nk = key(nq, nr)
      if (!passable(nq, nr)) continue
      if (blocked?.has(nk) && !(nq === b[0] && nr === b[1])) continue
      const ng = gc + 1
      if (ng < (g.get(nk) ?? Infinity)) { g.set(nk, ng); came.set(nk, key(...cur)); open.push([ng + dist([nq, nr], b), ng, [nq, nr]]) }
    }
  }
  return null
}

export function newChar(home: Cell, now: number): Char {
  return { v: 1, q: home[0], r: home[1], path: [], t0: now, stepMs: STEP_MS, lost: false, warmth: 100, health: 100, energy: 100, simT: now, frozenUntil: 0, home, inv: emptyInv(), act: null, died: null }
}
/** Where a walking character stands at time t (the cell it last reached). */
export function cellAt(c: Char, _t?: number): Cell { return [c.q, c.r] }

/** How long the next step takes, from the weather at the moment you set out on it. */
export function stepDur(to: Cell, t: number, load: number, netStorm = false) {
  const z = Math.min(3, zoneOf(to[0], to[1])), w = weatherAt(t, netStorm).id as keyof typeof WX_SLOW
  const slow = z === 0 ? (w === 'calm' ? 1 : w === 'wind' ? 5 / 3 : 8 / 3) : WX_SLOW[w]
  return Math.round(ZONE_STEP_MS[z]! * slow * (load > CAPACITY ? 1.5 : 1))
}
/** Start the step toward path[0] at time t. In wind and blizzard, out in the Wastes, the trail can be lost. */
export function beginStep(c: Char, t: number, ctx: Ctx) {
  c.t0 = t
  if (!c.path.length) return
  const w = weatherAt(t, ctx.netStorm).id as keyof typeof DRIFT, next = c.path[0]!
  if (!ctx.noDrift && Math.max(zoneOf(c.q, c.r), zoneOf(next[0], next[1])) >= 1 && hash(Math.floor(t / 1000), c.q * 131 + c.r, 17) < DRIFT[w]) {
    const opts = DIRS.map(([dq, dr]) => [c.q + dq, c.r + dr] as Cell).filter(x => passable(x[0], x[1]) && !(x[0] === next[0] && x[1] === next[1]))
    if (opts.length) { c.path = [opts[Math.floor(hash(Math.floor(t / 1000), 3, 19) * opts.length)]!]; c.lost = true }
  }
  c.stepMs = stepDur(c.path[0]!, t, weightOf(c.inv), ctx.netStorm)
}
export function rimeAt(trail: [number, number, number][] | undefined, t: number): Cell | null {
  if (!trail?.length) return null
  let cur = trail[0]!
  for (const e of trail) { if (e[0] <= t) cur = e; else break }
  return [cur[1], cur[2]]
}

/* ---------- the Mouth ---------- */
export const mouthCells = (): Cell[] => [CAVE, ...DIRS.map(([dq, dr]) => [CAVE[0] + dq, CAVE[1] + dr] as Cell).filter(c => passable(c[0], c[1]) && ringOf(c[0], c[1]) <= MAX_RING)]
export const inMouth = (q: number, r: number) => dist([q, r], CAVE) <= 1
/** Where the two keepers of the Mouth stand at time t. They never leave it. */
export function guardsAt(t: number): Cell[] {
  const cells = mouthCells(), s = Math.floor(t / GUARD_MS)
  return [0, 1].map(i => cells[Math.floor(hash(s, i + 1, 211) * cells.length)]!)
}

/* ---------- the Rime ---------- */
export type Rime = { q: number; r: number; t: number; d: number }
const rimeOk = (q: number, r: number) => { const n = ringOf(q, r); return n >= RIME_MIN_RING && n <= MAX_RING && terrain(q, r) === 'open' }
/** One move of the Rime. It wanders without a goal; once in a while it turns toward someone out in the cold. */
export function rimeStep(th: Rime, targets: Cell[]): Rime {
  const s = Math.floor(th.t / RIME_MS) + 1, t = s * RIME_MS
  const h = hash(s, 1, 101), h2 = hash(s, 2, 103), h3 = hash(s, 3, 107)
  const here: Cell = [th.q, th.r]
  const prey = targets.filter(c => zoneOf(c[0], c[1]) >= 1 && dist(c, here) <= 8).sort((a, b) => dist(a, here) - dist(b, here))[0]
  const opts = DIRS.map(([dq, dr], i) => ({ i, c: [th.q + dq, th.r + dr] as Cell })).filter(o => rimeOk(o.c[0], o.c[1]))
  if (!opts.length) return { ...th, t }
  if (prey && h < RIME_PULL) { const o = opts.sort((a, b) => dist(a.c, prey) - dist(b.c, prey))[0]!; return { q: o.c[0], r: o.c[1], t, d: o.i } }
  if (h2 > 0.88) return { ...th, t } // it stops, as if listening
  let d = th.d
  if (h3 < 0.3) d = (d + (h3 < 0.15 ? 1 : 5)) % 6
  const ahead = opts.find(o => o.i === d) ?? opts[Math.floor(h3 * opts.length)]!
  return { q: ahead.c[0], r: ahead.c[1], t, d: ahead.i }
}

/**
 * Bring a character up to `now`. The server calls this before every action and every read, so the cold keeps
 * working while the tab is closed. Returns what happened on the way.
 */
export function advance(c0: Char, now: number, ctx: Ctx): { c: Char; events: Event[] } {
  const c: Char = JSON.parse(JSON.stringify(c0)); const events: Event[] = []
  if (c.frozenUntil) {
    if (now < c.frozenUntil) { c.simT = now; return { c, events } }
    const t = c.frozenUntil
    Object.assign(c, { frozenUntil: 0, warmth: 60, health: 50, energy: 50, simT: t, q: c.home[0], r: c.home[1], path: [], act: null, lost: false, t0: t })
    events.push({ kind: 'thawed', t })
  }
  let t = c.simT
  while (t < now) {
    const DT = c.path.length ? Math.min(30_000, Math.max(1_000, c.stepMs / 6)) : c.act ? 5_000 : 60_000
    const t1 = Math.min(now, t + DT), mins = (t1 - t) / 60_000
    // walking: finish every step that is due, then set out on the next one
    while (c.path.length && c.t0 + c.stepMs <= t1) {
      const te = c.t0 + c.stepMs, [q, r] = c.path.shift()!
      c.q = q; c.r = r
      c.energy = Math.max(0, c.energy - (weightOf(c.inv) > CAPACITY ? 2 : 1))
      if (c.lost) { c.lost = false; c.path = []; c.t0 = te; events.push({ kind: 'lost', t: te, q, r }) }
      else if (c.path.length) beginStep(c, te, ctx)
      else { c.t0 = te; events.push({ kind: 'arrived', t: te, q, r }) }
    }
    if (c.act && t1 >= c.act.until) {
      const a = c.act; c.act = null
      c.inv[a.res] = (c.inv[a.res] || 0) + 1
      events.push({ kind: 'gathered', t: a.until, q: a.q, r: a.r, res: a.res })
    }
    const q = c.q, r = c.r, zone = zoneOf(q, r)
    const cold = coldAt(q, r, t1, ctx), src = sourceAt(q, r, t1, ctx)
    const tired = c.energy <= 0 ? 1.25 : 1
    const loss = Math.max(0, cold - ctx.insulation) * LOSS_K * tired
    c.warmth = Math.min(100, Math.max(0, c.warmth + (src - loss) * mins))
    if (c.warmth < 25) c.health = Math.max(0, c.health - FROSTBITE * mins)
    const atHome = key(q, r) === ctx.home
    if (atHome && !c.path.length) c.health = Math.min(100, c.health + 0.1 * mins)
    if (src > 0 && !c.path.length) c.energy = Math.min(100, c.energy + (src >= 6 ? 10 : 5) / 60 * mins)
    const rime = zone >= 1 ? rimeAt(ctx.rime, t1) : null
    const taken = !!rime && rime[0] === q && rime[1] === r
    const pure = q === CAVE[0] && r === CAVE[1], kept = !pure && inMouth(q, r) && guardsAt(t1).some(g => g[0] === q && g[1] === r)
    if (taken || pure || kept || c.warmth <= 0 || c.health <= 0) {
      const w = weatherAt(t1, ctx.netStorm)
      const cause = pure ? 'Pure Cold. The cave is not open yet' : kept ? 'the keepers of the Mouth took you' : taken ? 'Chthon passed through you' : c.health <= 0 && c.warmth > 0 ? 'frostbite' : `cold ${Math.round(cold)} against clothing ${ctx.insulation}${w.id === 'calm' ? '' : `, ${w.name.toLowerCase()} ×${w.mult}`}`
      events.push({ kind: 'froze', t: t1, q, r, cause, zone, inv: { ...c.inv } })
      c.died = { t: t1, q, r, cause, zone }
      Object.assign(c, { frozenUntil: t1 + FREEZE_MS, warmth: 0, path: [], act: null, lost: false, q: c.home[0], r: c.home[1], inv: emptyInv(), simT: now, t0: t1 })
      return { c, events }
    }
    t = t1
    if (!c.path.length && !c.act && src > 0 && c.warmth >= 100 && c.health >= 100 && c.energy >= 100) break
  }
  c.simT = now
  return { c, events }
}

/** What a trip would cost if the wind leaves you alone: when you arrive, and with how much warmth. */
export function planTrip(c0: Char, path: Cell[], now: number, ctx: Ctx) {
  const c: Char = JSON.parse(JSON.stringify(c0)); const cx = { ...ctx, noDrift: true, rime: undefined }
  c.path = path.slice(); c.act = null; c.lost = false; c.simT = now; beginStep(c, now, cx)
  let t = now
  // a minute at a time, so we know which came first: getting there, or the cold
  for (let i = 0; i < 720 && c.path.length; i++) {
    t += 60_000
    const r = advance(c, t, cx); Object.assign(c, r.c)
    for (const e of r.events) {
      if (e.kind === 'froze') return { eta: e.t - now, warmth: 0, health: c.health, froze: true, cause: e.cause }
      if (e.kind === 'arrived') return { eta: e.t - now, warmth: c.warmth, health: c.health, froze: false, cause: '' }
    }
  }
  return { eta: t - now, warmth: c.warmth, health: c.health, froze: false, cause: '' }
}

/** Town warmth on the server, the same sum the game draws on the meter. */
/** The shelters of the town: every house, the church, the plaza fire and the public buildings. */
export function townShelters(houseCells: Cell[]): Record<string, 'house' | 'church' | 'fire'> {
  const out: Record<string, 'house' | 'church' | 'fire'> = {}
  for (const [q, r] of [...DEMO_CELLS, ...houseCells]) out[key(q, r)] = 'house'
  for (const [k, [q, r]] of Object.entries(SPECIAL)) if (k !== 'core') out[key(q, r)] = k === 'church' ? 'church' : k === 'plaza' ? 'fire' : 'house'
  return out
}

export function townWarmth(o: { people: number; online: number; deeds: number; fire: number; power: number; storm: boolean }) {
  const W = 6 * Math.min(o.people, 12) + 6 * Math.min(o.online, 5) + 4 * Math.min(o.deeds, 5) + 3 * Math.min(o.fire, 5) + Math.round(12 * Math.log10(1 + o.power / 500) * 10) / 10
  const F = 60 + (o.storm ? 15 : 0)
  const B = W - F
  return { W, F, B, holds: B >= 0, heatR: Math.min(10, Math.max(2.6, 5.6 + B * 0.28)) }
}


/* ================= the whole expedition world as plain data: the server persists it, the prototype keeps it locally ================= */
export type Hearth = { by: string; nick: string; at: number; until: number }
export type Bag = { id: string; owner: string; nick: string; q: number; r: number; inv: Inv; until: number }
export type HouseLite = { q?: number; r?: number; nick?: string; state?: string; sol?: number; lastWood?: number }
export type WState = {
  now: number
  houses: Record<string, HouseLite>
  chars: Record<string, Char>
  hearths: Record<string, Hearth>
  bags: Record<string, Bag>
  nodes: Record<string, number>
  online: number
  doneOrders: number
  rime?: Rime
  rimeTrail?: [number, number, number][] // computed on load, not stored
}
export type Feed = { id: string; t: number; topic: 'froze' | 'hearth' | 'took'; by: string; data: Record<string, unknown> }
export type Dirty = { chars: Set<string>; hearths: Set<string>; bags: Set<string>; bagsGone: Set<string>; nodes: Set<string>; feed: Feed[]; rime?: boolean }
export const newDirty = (): Dirty => ({ chars: new Set(), hearths: new Set(), bags: new Set(), bagsGone: new Set(), nodes: new Set(), feed: [] })

export function townOfState(ws: WState) {
  const real = Object.values(ws.houses)
  const mining = real.filter(x => x.state === 'mining')
  const fire = real.filter(x => ws.now - (x.lastWood ?? 0) < 3600_000).length
  return townWarmth({ people: DEMO_TOWN.people + mining.length, online: ws.online, deeds: DEMO_TOWN.deeds + ws.doneOrders, fire, power: DEMO_TOWN.power + mining.reduce((a, x) => a + (x.sol ?? 0), 0), storm: false })
}
export function ctxOf(ws: WState, uid: string): Ctx {
  const t = townOfState(ws)
  const cells = Object.values(ws.houses).filter(x => x.q != null && x.r != null).map(x => [x.q!, x.r!] as Cell)
  const home = ws.chars[uid]?.home ?? [ws.houses[uid]?.q ?? 0, ws.houses[uid]?.r ?? 0]
  return { heatR: t.heatR, holds: t.holds, netStorm: false, shelters: townShelters(cells), home: key(home[0], home[1]), hearths: Object.fromEntries(Object.entries(ws.hearths).map(([k, v]) => [k, v.until])), insulation: INSULATION_T1, rime: ws.rimeTrail }
}
const nickIn = (ws: WState, uid: string) => ws.houses[uid]?.nick ?? 'someone'
export const zoneName = (z: number) => (ZONES as readonly { name: string }[])[z]?.name ?? 'the far cold'

export function stepChar(ws: WState, uid: string, d: Dirty) {
  const c0 = ws.chars[uid]; if (!c0) return [] as Event[]
  const { c, events } = advance(c0, ws.now, ctxOf(ws, uid))
  for (const e of events) {
    if (e.kind !== 'froze') continue
    const has = Object.values(e.inv).some(v => v > 0)
    if (has) { const id = `${uid}:${e.t}`; ws.bags[id] = { id, owner: uid, nick: nickIn(ws, uid), q: e.q, r: e.r, inv: e.inv, until: e.t + BAG_MS }; d.bags.add(id) }
    d.feed.push({ id: `fz${uid}${e.t}`, t: e.t, topic: 'froze', by: uid, data: { nick: nickIn(ws, uid), zone: zoneName(e.zone), q: e.q, r: e.r, bag: has } })
  }
  ws.chars[uid] = c
  if (events.length || c.simT - c0.simT > 600_000) d.chars.add(uid)
  return events
}
const rimeTargets = (ws: WState) => Object.values(ws.chars).filter(c => !(c.frozenUntil > ws.now)).map(c => [c.q, c.r] as Cell)
/** Walk the Rime up to now, one move every RIME_MS, and remember where it stood for the cold to check. */
export function stepRime(ws: WState, d: Dirty) {
  if (ws.rimeTrail) return
  let th: Rime = ws.rime ?? { q: 11, r: -6, t: Math.floor(ws.now / RIME_MS) * RIME_MS, d: 2 }
  if (ws.now - th.t > 24 * 3600_000) th = { ...th, t: Math.floor((ws.now - 24 * 3600_000) / RIME_MS) * RIME_MS }
  const trail: [number, number, number][] = [[th.t, th.q, th.r]], targets = rimeTargets(ws)
  while (th.t + RIME_MS <= ws.now) { th = rimeStep(th, targets); trail.push([th.t, th.q, th.r]) }
  if (!ws.rime || th.t !== ws.rime.t) d.rime = true
  ws.rime = th; ws.rimeTrail = trail
}
export function stepAll(ws: WState, d: Dirty) {
  stepRime(ws, d)
  for (const uid of Object.keys(ws.chars)) { const c = ws.chars[uid]!; if (c.path.length || c.act || c.frozenUntil || zoneOf(c.q, c.r) >= 1 || c.warmth < 100 || c.health < 100 || c.energy < 100) stepChar(ws, uid, d) }
}

export function viewOf(ws: WState, uid: string, events: Event[] = []) {
  const forecast = Array.from({ length: 7 }, (_, i) => { const at = Math.floor(ws.now / 7_200_000) * 7_200_000 + i * 7_200_000; const x = weatherAt(at); return { at, id: x.id, name: x.name, mult: x.mult } })
  const others = Object.fromEntries(Object.entries(ws.chars).filter(([k]) => k !== uid).map(([k, c]) => [k, { q: c.q, r: c.r, path: c.path.slice(0, 1), t0: c.t0, stepMs: c.stepMs, frozenUntil: c.frozenUntil, home: c.home, nick: nickIn(ws, k), act: c.act ? { kind: c.act.kind, until: c.act.until } : null }]))
  return {
    now: ws.now, town: townOfState(ws), forecast, grey: greyAt(ws.now), bell: bellAt(ws.now), me: ws.chars[uid] ?? null, others, hearths: ws.hearths,
    bags: Object.values(ws.bags).filter(b => b.until > ws.now).map(b => ({ id: b.id, nick: b.nick, q: b.q, r: b.r, until: b.until, mine: b.owner === uid, items: b.owner === uid ? null : b.inv })),
    nodes: Object.fromEntries(Object.entries(ws.nodes).filter(([, v]) => v > ws.now)), events,
    rime: ws.rime ? { ...ws.rime, next: rimeStep(ws.rime, rimeTargets(ws)) } : null,
  }
}
export type View = ReturnType<typeof viewOf>

/** One action from one player. Mutates ws, marks what changed in d. */
export function action(ws: WState, uid: string, op: string, b: Record<string, unknown>, d: Dirty): { ok: true; events: Event[] } | { ok: false; error: string; status?: number } {
  const now = ws.now, house = ws.houses[uid]
  if (!ws.chars[uid]) {
    if (!house || house.q == null || house.r == null) return { ok: false, error: 'Settle in town first: your character lives in your house.', status: 403 }
    ws.chars[uid] = newChar([house.q, house.r], now); d.chars.add(uid)
  }
  stepAll(ws, d)
  const events = stepChar(ws, uid, d)
  const c = ws.chars[uid]!
  d.chars.add(uid)
  const ok = () => ({ ok: true as const, events })
  const fail = (error: string, status = 400) => ({ ok: false as const, error, status })
  if (op === 'char') return ok()
  if (c.frozenUntil > now) return fail('You are frozen. Nothing thaws you faster.', 403)
  const here = cellAt(c, now)
  const cellArg = (v: unknown): Cell | null => Array.isArray(v) && v.length === 2 && v.every(n => Number.isInteger(n)) ? [v[0] as number, v[1] as number] : null
  const near = (a: Cell) => dist(here, a) <= 1
  switch (op) {
    case 'move': {
      const to = cellArg(b.to); if (!to) return fail('Where to?')
      if (ringOf(...to) > MAX_RING) return fail('Beyond here the cold has no edge. Not yet.')
      // already on the way: finish the step you are on, then turn; no jump back to the last cell
      const from: Cell = c.path.length ? c.path[0]! : here
      const rest = findPath(from, to, 4000, new Set(Object.keys(ctxOf(ws, uid).shelters))); if (!rest) return fail('No way through from here.')
      if (rest.length > 90) return fail('Too far for one walk. Go in stages.')
      if (c.path.length) { c.path = [from, ...rest]; c.act = null; c.lost = false; return ok() }
      Object.assign(c, { q: here[0], r: here[1], path: rest, t0: now, act: null, lost: false }); beginStep(c, now, ctxOf(ws, uid))
      return ok()
    }
    case 'stop': Object.assign(c, { q: here[0], r: here[1], path: [], t0: now, lost: false }); return ok()
    case 'gather': {
      const at = cellArg(b.at); if (!at) return fail('Gather what?')
      if (c.path.length) return fail('Stop walking first.')
      if (!near(at)) return fail('Too far. Stand next to it.')
      if (c.act) return fail('You are busy.')
      const res = resourceOf(...at); if (!res) return fail('Nothing to take here.')
      const k = key(...at)
      if ((ws.nodes[k] ?? 0) > now) return fail('Already picked clean. It comes back in a while.')
      if (weightOf(c.inv) + WEIGHT[res] > CAPACITY * OVERLOAD) return fail('You cannot carry more.')
      c.act = { kind: 'gather', q: at[0], r: at[1], res, until: now + GATHER_MS }
      ws.nodes[k] = now + GATHER_MS + NODE_COOLDOWN_MS; d.nodes.add(k)
      return ok()
    }
    case 'hearth': {
      if (c.path.length) return fail('Stop walking first.')
      if (zoneOf(...here) < 1) return fail('The town has its own fire. Build out in the cold.')
      const k = key(...here)
      if (ws.hearths[k]) return fail('There is a hearth here already.')
      for (const [res, n] of Object.entries(HEARTH_COST) as [keyof Inv, number][]) if ((c.inv[res] || 0) < n) return fail(`A hearth takes ${HEARTH_COST.wood} wood, ${HEARTH_COST.stone} stone and ${HEARTH_COST.flint} flint.`)
      for (const [res, n] of Object.entries(HEARTH_COST) as [keyof Inv, number][]) c.inv[res] -= n
      ws.hearths[k] = { by: uid, nick: nickIn(ws, uid), at: now, until: now + HEARTH_START_MS }; d.hearths.add(k)
      d.feed.push({ id: `hb${uid}${now}`, t: now, topic: 'hearth', by: uid, data: { nick: nickIn(ws, uid), zone: zoneName(zoneOf(...here)), q: here[0], r: here[1] } })
      return ok()
    }
    case 'feed': {
      const at = cellArg(b.at) ?? here, k = key(...at), h = ws.hearths[k]
      if (!h) return fail('No hearth there.')
      if (!near(at)) return fail('Too far. Stand next to it.')
      if ((c.inv.wood || 0) < 1) return fail('You have no wood.')
      c.inv.wood -= 1; h.until = Math.min(now + HEARTH_MAX_MS, Math.max(now, h.until) + HEARTH_WOOD_MS); d.hearths.add(k)
      return ok()
    }
    case 'take': {
      const bag = ws.bags[String(b.id ?? '')]
      if (!bag || bag.until <= now) return fail('That pack is gone.')
      if (bag.owner === uid) return fail('Your own frozen pack will not open for you. Someone else has to carry it.')
      if (!near([bag.q, bag.r])) return fail('Too far. Stand next to it.')
      const took = emptyInv()
      for (const res of Object.keys(WEIGHT) as (keyof Inv)[]) while (bag.inv[res] > 0 && weightOf(c.inv) + WEIGHT[res] <= CAPACITY * OVERLOAD) { bag.inv[res]--; c.inv[res]++; took[res]++ }
      if (!Object.values(bag.inv).some(v => v > 0)) { delete ws.bags[bag.id]; d.bagsGone.add(bag.id) } else d.bags.add(bag.id)
      d.feed.push({ id: `tk${uid}${now}`, t: now, topic: 'took', by: uid, data: { nick: nickIn(ws, uid), owner: bag.nick, took } })
      return ok()
    }
    case 'unload': {
      if (key(...here) !== key(...c.home)) return fail('Unload at your own house.')
      c.stash = c.stash ?? emptyInv()
      for (const res of Object.keys(WEIGHT) as (keyof Inv)[]) { c.stash[res] += c.inv[res]; c.inv[res] = 0 }
      return ok()
    }
    case 'pack': {
      if (key(...here) !== key(...c.home)) return fail('Pack at your own house.')
      const res = String(b.res ?? '') as keyof Inv, n = Math.max(1, Math.min(50, Number(b.n) || 1))
      if (!(res in WEIGHT)) return fail('Pack what?')
      c.stash = c.stash ?? emptyInv()
      let moved = 0
      while (moved < n && c.stash[res] > 0 && weightOf(c.inv) + WEIGHT[res] <= CAPACITY) { c.stash[res]--; c.inv[res]++; moved++ }
      return ok()
    }
    default: return fail('unknown action')
  }
}
