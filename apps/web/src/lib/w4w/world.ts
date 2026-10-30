/**
 * W4W world rules, shared by the server (/api/w4w, the authority) and the game (inlined by w4w/build.mjs).
 * Pure functions only: no imports, no clock, no randomness except seeded hashes, so both sides agree cell by cell.
 *
 * Time on the map is real time. One step = one hex. Rates are per minute.
 */

export type Cell = [number, number]
export type Inv = Record<string, number> // stacks: raw materials and what you make from them
export type Act = { kind: 'gather'; q: number; r: number; res: string; until: number } | { kind: 'craft'; recipe: string; until: number; q?: number; r?: number; res?: string } | null
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
  items?: Record<string, 'worn' | 'pack' | 'home'> // clothing and tools: on you, in the pack, or at home
  sips?: number // what is left in the thermos
  known?: string[] // recipes this character can make
  renown?: number // what the town owes you: rank comes from it
  deeds?: Record<string, number> // firsts that earned renown, once each
  orders?: { day: number; done: string[] } // today's town orders you have filled
  tended?: Record<string, number> // when you last gave warmth to each pylon
}
export type Ctx = {
  heatR: number // radius of the town's warm circle, world units
  holds: boolean // the town holds tonight
  netStorm: boolean // the network is having a bad epoch
  shelters: Record<string, 'house' | 'church' | 'fire'>
  home: string // key of this character's own house
  hearths: Record<string, number> // key -> burning until (ms)
  insulation: number
  veil?: number // the dome's strength 0..1, from the town's mining power
  pylons?: number[] // the six pylons' strength now, 0..100
  rime?: [number, number, number][] // where the Rime stood: [since t, q, r], oldest first
  noDrift?: boolean // planning a trip: no wind luck
}
export type Event =
  | { kind: 'arrived'; t: number; q: number; r: number }
  | { kind: 'froze'; t: number; q: number; r: number; cause: string; zone: number; inv: Inv }
  | { kind: 'gathered'; t: number; q: number; r: number; res: string }
  | { kind: 'crafted'; t: number; recipe: string; ok: boolean; why?: string }
  | { kind: 'thawed'; t: number }
  | { kind: 'lost'; t: number; q: number; r: number }

export const STEP_MS = 3_000 // one cell inside the town, calm weather
/** How long one cell takes, by the zone you step into: quick between houses, hours across the Wastes. */
export const ZONE_STEP_MS = [2_500, 4_000, 5_000, 6_500] as const
export const WX_SLOW = { calm: 1, wind: 1.3, blizzard: 1.8 } as const
/** Chance per step out in the Wastes that the wind takes the trail and you lose your way. */
export const DRIFT = { calm: 0, wind: 0.15, blizzard: 0.4 } as const
/** The Rime: what walks the Wastes. Anna's light keeps it past the forest edge. */
export const RIME_MS = 20_000
/** The town reaches ring TOWN_RING; everything outside was laid out for a town of 5 rings and is pushed out by the difference. */
export const TOWN_RING = 8
const SHIFT = TOWN_RING - 5
/** Push a cell of the old layout outward by SHIFT rings, along its own direction. */
function outward(c: [number, number]): [number, number] {
  const n = (Math.abs(c[0]) + Math.abs(c[1]) + Math.abs(c[0] + c[1])) / 2; if (!n) return c
  const k = (n + SHIFT) / n, x = c[0] * k, z = c[1] * k, y = -x - z
  let rx = Math.round(x), rz = Math.round(z); const ry = Math.round(y), dx = Math.abs(rx - x), dz = Math.abs(rz - z), dy = Math.abs(ry - y)
  if (dx > dz && dx > dy) rx = -rz - ry; else if (dz > dy) rz = -rx - ry
  return [rx, rz]
}
export const RIME_MIN_RING = 7 + SHIFT
export const RIME_PULL = 0.04
/** The Mouth: the cave of Pure Cold under the last tooth, and the two that keep it. */
export const CAVE: Cell = outward([6, 10])
export const GUARD_MS = 20_000
export const MAX_RING = 16 + SHIFT
/** The game ships in acts. Act I: the town under Anna's dome, and nothing outside it. */
export const STAGE = 1
export const DOME_RING = TOWN_RING + 2 // no cell beyond this ring is inside the dome
/** The Veil is round: a cell is inside when its centre is clear of the dome wall by more than a cell's radius. World units. */
export const DOME_RADIUS = 18.4
export const insideDome = (q: number, r: number) => { const x = 2 * (q + r / 2), z = 1.7320508 * r; return Math.hypot(x, z) <= DOME_RADIUS - 1.2 }
/** Anna's block and its boilers fill the centre cell and the ring around it: you stand at ring 2, never inside. */
export const CORE_RING = 1
export const inCore = (q: number, r: number) => ringOf(q, r) <= CORE_RING
export const CORE: Cell = [0, 0]
export const FREEZE_MS = 24 * 3600_000
export const BAG_MS = 24 * 3600_000
export const GATHER_MS = 20_000
export const NODE_COOLDOWN_MS = 10 * 60_000
export const LOSS_K = 0.5 // warmth lost per minute per point of cold not covered
export const FROSTBITE = 1 // health lost per minute below 25 warmth
export const INSULATION_T1 = 22
/* ================= things: what you gather, make, wear and carry ================= */
/** Stackable things. Each stack takes one cell of the bag. */
export const MATS: Record<string, { name: string; stack: number; q: number; note: string }> = {
  wood: { name: 'Wood', stack: 10, q: 0, note: 'Cut with a saw or an axe. Burns, builds, holds things together.' },
  stone: { name: 'Stone', stack: 10, q: 0, note: 'Broken out with a pickaxe.' },
  flint: { name: 'Flint', stack: 20, q: 0, note: 'Only in the Stone Teeth. Sparks, edges, the start of every hearth.' },
  resin: { name: 'Resin', stack: 20, q: 0, note: 'Tapped from the Black Pines. Melt it with wood into pitch.' },
  fiber: { name: 'Dry grass', stack: 20, q: 0, note: 'Pulled by hand from open snow in The Edge and the Black Pines.' },
  cord: { name: 'Cord', stack: 10, q: 1, note: 'Twisted grass. Ties tools, sews quilts, carries loads.' },
  pitch: { name: 'Pine pitch', stack: 10, q: 1, note: 'Black, sticky, waterproof. Seals seams and flasks.' },
  charcoal: { name: 'Charcoal', stack: 10, q: 1, note: 'Burns hot and long. Fills a thermos with heat.' },
  hearth_kit: { name: 'Hearth kit', stack: 2, q: 2, note: 'A hearth in a bundle: unfold it anywhere out in the cold.' },
  shard: { name: "Anna's shard", stack: 5, q: 3, note: 'A splinter of the machine in the ice, still faintly warm. Bring it to Anna: she remembers who did.' },
}
export const HEARTH_COST: Inv = { wood: 6, stone: 4, flint: 1 }
export const HEARTH_START_MS = 6 * 3600_000
export const HEARTH_WOOD_MS = 3 * 3600_000
export const HEARTH_MAX_MS = 24 * 3600_000
export const POCKETS = 4 // without a bag, this is all you can carry
export const SIP_WARMTH = 30
/** Things you own one of: clothing, bags, tools, the thermos. q is quality: 0 common, 1 good, 2 rare. */
export type Item = { name: string; slot: 'head' | 'body' | 'hands' | 'legs' | 'feet' | 'bag' | 'tool' | 'flask'; ins: number; q: number; bag?: number; for?: string[]; speed?: number; note: string }
export const ITEMS: Record<string, Item> = {
  wool_cap: { name: 'Wool cap', slot: 'head', ins: 3, q: 0, note: 'Knitted in town. Better than nothing.' },
  canvas_coat: { name: 'Canvas coat', slot: 'body', ins: 9, q: 0, note: 'Stiff with frost by noon.' },
  mittens: { name: 'Mittens', slot: 'hands', ins: 3, q: 0, note: 'Thin at the thumbs.' },
  wool_trousers: { name: 'Wool trousers', slot: 'legs', ins: 4, q: 0, note: 'Patched twice.' },
  felt_boots: { name: 'Felt boots', slot: 'feet', ins: 3, q: 0, note: 'Warm until they are wet.' },
  quilted_cap: { name: 'Quilted hood', slot: 'head', ins: 5, q: 1, note: 'Grass quilted between two layers, sealed with pitch.' },
  quilted_coat: { name: 'Quilted coat', slot: 'body', ins: 14, q: 1, note: 'Heavy, ugly and very warm.' },
  lined_mittens: { name: 'Lined mittens', slot: 'hands', ins: 5, q: 1, note: 'Cord-stitched, grass-lined.' },
  padded_trousers: { name: 'Padded trousers', slot: 'legs', ins: 7, q: 1, note: 'You walk like a bear in them.' },
  bark_boots: { name: 'Bark-soled boots', slot: 'feet', ins: 5, q: 1, note: 'Wooden soles keep the snow away from your feet.' },
  canvas_sack: { name: 'Canvas sack', slot: 'bag', ins: 0, q: 0, bag: 8, note: 'Eight places for eight stacks.' },
  woven_pack: { name: 'Woven pack', slot: 'bag', ins: 0, q: 1, bag: 12, note: 'Grass and cord, tight enough to hold stone.' },
  frame_pack: { name: 'Expedition frame', slot: 'bag', ins: 0, q: 2, bag: 16, note: 'A wooden frame on your back. For the long trips.' },
  saw: { name: 'Bow saw', slot: 'tool', ins: 0, q: 0, for: ['wood', 'resin'], speed: 1, note: 'Cuts wood and taps resin.' },
  pickaxe: { name: 'Pickaxe', slot: 'tool', ins: 0, q: 0, for: ['stone', 'flint'], speed: 1, note: 'Breaks stone and flint.' },
  flint_axe: { name: 'Flint axe', slot: 'tool', ins: 0, q: 1, for: ['wood', 'resin'], speed: 2, note: 'Twice as fast as the saw.' },
  flint_pick: { name: 'Flint pick', slot: 'tool', ins: 0, q: 1, for: ['stone', 'flint'], speed: 2, note: 'Twice as fast as the old pickaxe.' },
  thermos: { name: 'Stone thermos', slot: 'flask', ins: 0, q: 2, note: 'Fill it with charcoal heat at home. Each sip gives back 30 warmth, anywhere.' },
}
/** What you can make. At home on the workbench, or a few simple things anywhere. */
export type Recipe = { out: string; n: number; in: Inv; ms: number; group: 'Materials' | 'Tools' | 'Clothing' | 'Bags' | 'Survival'; field?: boolean }
export const RECIPES: Record<string, Recipe> = {
  cord: { out: 'cord', n: 1, in: { fiber: 3 }, ms: 4_000, group: 'Materials', field: true },
  pitch: { out: 'pitch', n: 1, in: { resin: 2, wood: 1 }, ms: 8_000, group: 'Materials' },
  charcoal: { out: 'charcoal', n: 1, in: { wood: 2 }, ms: 6_000, group: 'Materials' },
  flint_axe: { out: 'flint_axe', n: 1, in: { wood: 3, flint: 2, cord: 1 }, ms: 15_000, group: 'Tools' },
  flint_pick: { out: 'flint_pick', n: 1, in: { wood: 2, flint: 3, cord: 1 }, ms: 15_000, group: 'Tools' },
  quilted_cap: { out: 'quilted_cap', n: 1, in: { fiber: 4, pitch: 1 }, ms: 10_000, group: 'Clothing' },
  quilted_coat: { out: 'quilted_coat', n: 1, in: { fiber: 10, pitch: 2, cord: 1 }, ms: 20_000, group: 'Clothing' },
  lined_mittens: { out: 'lined_mittens', n: 1, in: { fiber: 4, cord: 1 }, ms: 10_000, group: 'Clothing' },
  padded_trousers: { out: 'padded_trousers', n: 1, in: { fiber: 7, pitch: 1 }, ms: 15_000, group: 'Clothing' },
  bark_boots: { out: 'bark_boots', n: 1, in: { wood: 2, fiber: 3, pitch: 1 }, ms: 12_000, group: 'Clothing' },
  woven_pack: { out: 'woven_pack', n: 1, in: { fiber: 8, cord: 3, pitch: 1 }, ms: 20_000, group: 'Bags' },
  frame_pack: { out: 'frame_pack', n: 1, in: { wood: 4, cord: 6, pitch: 2 }, ms: 30_000, group: 'Bags' },
  hearth_kit: { out: 'hearth_kit', n: 1, in: { wood: 6, stone: 4, flint: 1 }, ms: 12_000, group: 'Survival' },
  thermos: { out: 'thermos', n: 1, in: { stone: 4, flint: 2, pitch: 2 }, ms: 30_000, group: 'Survival' },
}
/** Everyone knows these; the rest are found out in the Wastes or copied from the Library. */
export const STARTER_RECIPES = ['cord', 'pitch', 'charcoal', 'hearth_kit']
/** Where the lost recipes lie: one scrap per recipe, on open snow near its seed. */
const SCROLL_SEEDS: Record<string, Cell> = { flint_pick: outward([-4, 8]), flint_axe: outward([7, -1]), quilted_cap: outward([-7, 1]), woven_pack: outward([1, -8]), lined_mittens: outward([10, -3]), padded_trousers: outward([-9, -1]), bark_boots: outward([2, 9]), quilted_coat: outward([-5, -6]), frame_pack: outward([-14, 7]), thermos: outward([7, 9]) }
let scrollCache: Record<string, Cell> | null = null
export function scrolls(): Record<string, Cell> {
  if (scrollCache) return scrollCache
  const out: Record<string, Cell> = {}, used = new Set<string>()
  for (const [id, seed] of Object.entries(SCROLL_SEEDS)) { const z = zoneOf(seed[0], seed[1])
    search: for (let k = 0; k <= 4; k++) for (const [dq, dr] of k ? ringCells(k) : [[0, 0] as Cell]) { const q = seed[0] + dq, r = seed[1] + dr
      if (terrain(q, r) === 'open' && zoneOf(q, r) === z && !used.has(key(q, r)) && !(q === CAVE[0] && r === CAVE[1])) { out[id] = [q, r]; used.add(key(q, r)); break search } } }
  return (scrollCache = out)
}
function ringCells(n: number): Cell[] { const out: Cell[] = []; let q = -n, r = n; for (const [dq, dr] of DIRS) for (let i = 0; i < n; i++) { out.push([q, r]); q += dq; r += dr } return out }
export const knownOf = (c: { known?: string[] }) => (c.known ??= [...STARTER_RECIPES])
export const nameOf = (id: string) => MATS[id]?.name ?? ITEMS[id]?.name ?? id
export const startItems = (): Record<string, 'worn' | 'pack' | 'home'> => ({ wool_cap: 'worn', canvas_coat: 'worn', mittens: 'worn', wool_trousers: 'worn', felt_boots: 'worn', canvas_sack: 'worn', saw: 'home', pickaxe: 'home' })
type Owner = { items?: Record<string, 'worn' | 'pack' | 'home'>; inv: Inv; stash?: Inv }
export const itemsOf = (c: { items?: Record<string, 'worn' | 'pack' | 'home'> }) => { const it = (c.items ??= startItems()); if (!Object.keys(it).some(k => ITEMS[k]?.slot === 'bag')) it.canvas_sack = 'worn'; return it }
export const insulationOf = (c: { items?: Record<string, 'worn' | 'pack' | 'home'> }) => Object.entries(itemsOf(c)).reduce((a, [id, at]) => a + (at === 'worn' ? ITEMS[id]?.ins ?? 0 : 0), 0)
export const bagSize = (c: { items?: Record<string, 'worn' | 'pack' | 'home'>; renown?: number }) => { const b = Object.entries(itemsOf(c)).find(([id, at]) => at === 'worn' && ITEMS[id]?.slot === 'bag'); return POCKETS + rankOf(c.renown ?? 0) + (b ? ITEMS[b[0]]!.bag ?? 0 : 0) }

/* ================= why you go out: renown and rank, the town's daily orders, the shards of Anna ================= */
/** Ranks of the expedition. Each one earned adds a pocket. */
export const RANKS = [[0, 'Newcomer'], [10, 'Gatherer'], [30, 'Pathfinder'], [70, 'Wayfarer'], [140, 'Pinewalker'], [250, 'Teethwalker'], [400, "Anna's Keeper"]] as const
export const rankOf = (renown: number) => { let i = 0; RANKS.forEach(([n], k) => { if (renown >= n) i = k }); return i }
export const rankName = (renown: number) => RANKS[rankOf(renown)]![1]
/** Firsts, once each. */
export const DEEDS: Record<string, { pts: number; text: string }> = {
  z1: { pts: 3, text: 'First steps past the posts' }, z2: { pts: 5, text: 'Into the Black Pines' }, z3: { pts: 8, text: 'Into the Stone Teeth' },
  'lm:camp': { pts: 5, text: 'Found the First Camp' }, 'lm:lake': { pts: 6, text: 'Stood on the Still Lake' }, 'lm:choir': { pts: 10, text: 'Heard the Choir Stones' }, 'lm:mouth': { pts: 12, text: 'Looked into the Mouth' },
  hearth: { pts: 5, text: 'Lit a hearth in the cold' }, wrote: { pts: 6, text: 'Wrote a recipe into the Library' }, shard: { pts: 8, text: 'Brought Anna her first shard' },
}
function award(c: Char, id: string, pts?: number) { c.deeds ??= {}; if (c.deeds[id]) return 0; const p = pts ?? DEEDS[id]?.pts ?? 1; c.deeds[id] = 1; c.renown = (c.renown ?? 0) + p; return p }
const addRenown = (c: Char, n: number) => { c.renown = (c.renown ?? 0) + n }
/** What the town asks for today: three of these, the same for everyone, new every day at midnight UTC. Fill them at the plaza board. */
export const ORDER_POOL: { id: string; text: string; need: Inv; pts: number }[] = [
  { id: 'fire', text: 'Wood for the plaza fire', need: { wood: 5 }, pts: 5 },
  { id: 'roof', text: 'Stone for the Library roof', need: { stone: 4 }, pts: 6 },
  { id: 'beds', text: 'Dry grass for the newcomers\' beds', need: { fiber: 6 }, pts: 4 },
  { id: 'splints', text: 'Cord for the healer\'s splints', need: { cord: 3 }, pts: 8 },
  { id: 'lamps', text: 'Resin for the street lamps', need: { resin: 3 }, pts: 8 },
  { id: 'pump', text: 'Pitch to seal the well pump', need: { pitch: 2 }, pts: 10 },
  { id: 'forge', text: 'Charcoal for the smith\'s forge', need: { charcoal: 3 }, pts: 9 },
  { id: 'flint', text: 'Flint for the smith', need: { flint: 2 }, pts: 12 },
  { id: 'search', text: 'A hearth kit for the search party', need: { hearth_kit: 1 }, pts: 15 },
]
export const DAY_MS = 86_400_000
export const dayOf = (t: number) => Math.floor(t / DAY_MS)
export function ordersFor(day: number) {
  const pool = ORDER_POOL.slice(), out: typeof ORDER_POOL = []
  for (let i = 0; i < 3; i++) out.push(pool.splice(Math.floor(hash(day, i, 41) * pool.length), 1)[0]!)
  return out
}
export const ordersDone = (c: Char, t: number) => (c.orders && c.orders.day === dayOf(t) ? c.orders.done : [])
/** Anna's shards: twelve a week across the Wastes, the same for everyone. Whoever picks one up first has it. */
export const WEEK_MS = 7 * DAY_MS
export const weekOf = (t: number) => Math.floor(t / WEEK_MS)
export const SHARD_MELT = 1.5 // points of Anna's thaw for each shard brought to her
let shardCache: { week: number; list: { id: string; at: Cell; zone: number; place?: string }[] } | null = null
export function shardsFor(week: number) {
  if (shardCache?.week === week) return shardCache.list
  const list: { id: string; at: Cell; zone: number; place?: string }[] = [], used = new Set<string>()
  // one by each named place; the one at the Mouth sits right under the keepers
  const fixed: [string, Cell][] = [['camp', [LANDMARKS[0].at[0] + 1, LANDMARKS[0].at[1]]], ['lake', LANDMARKS[1].at], ['choir', LANDMARKS[2].at], ['mouth', [CAVE[0] - 1, CAVE[1]]]]
  fixed.forEach(([place, at], i) => { list.push({ id: `${week}:${i}`, at, zone: zoneOf(at[0], at[1]), place }); used.add(key(...at)) })
  const want: [number, number][] = [[1, 3], [2, 3], [3, 2]]
  let n = list.length
  for (const [z, count] of want) { const cells: Cell[] = []
    for (let ring = (z === 1 ? 6 : z === 2 ? 9 : 13) + SHIFT; ring <= (z === 1 ? 8 + SHIFT : z === 2 ? 12 + SHIFT : MAX_RING); ring++) for (const c of ringCells(ring)) if (terrain(c[0], c[1]) === 'open' && !roadAt(c[0], c[1]) && !used.has(key(...c)) && dist(c, CAVE) > 1) cells.push(c)
    for (let i = 0; i < count && cells.length; i++) { const c = cells.splice(Math.floor(hash(week, n, 43) * cells.length), 1)[0]!; used.add(key(...c)); list.push({ id: `${week}:${n}`, at: c, zone: z }); n++ } }
  shardCache = { week, list }; return list
}
export const stacksOf = (inv: Inv) => Object.entries(inv).reduce((a, [k, n]) => a + (n > 0 ? Math.ceil(n / (MATS[k]?.stack ?? 10)) : 0), 0)
export const slotsUsed = (c: Owner) => stacksOf(c.inv) + Object.values(itemsOf(c)).filter(at => at === 'pack').length
/** How many of a material still fit in the bag. */
export function roomFor(c: Owner, mat: string, n = 1) {
  const free = bagSize(c) - slotsUsed(c), st = MATS[mat]?.stack ?? 10, have = c.inv[mat] || 0, inLast = have % st ? st - (have % st) : 0
  return Math.min(n, inLast + Math.max(0, free) * st)
}
/** Old name kept for the screen: how full the bag is, in cells. */
export const loadOf = (c: Owner) => slotsUsed(c)
export const toolsFor = (res: string) => Object.keys(ITEMS).filter(id => ITEMS[id]!.for?.includes(res))
export const toolFor = (res: string) => toolsFor(res)[0] ?? ''
export const bestTool = (c: Owner, res: string) => toolsFor(res).filter(id => itemsOf(c)[id] === 'pack').sort((a, b) => (ITEMS[b]!.speed ?? 1) - (ITEMS[a]!.speed ?? 1))[0] ?? null
/** Count of a material in reach: the bag, plus the home store when you stand at home. */
export const have = (c: Owner, mat: string, atHome: boolean) => (c.inv[mat] || 0) + (atHome ? c.stash?.[mat] || 0 : 0)
export function canCraft(c: Owner & { known?: string[] }, id: string, atHome: boolean): string | null {
  const r = RECIPES[id]; if (!r) return 'No such recipe.'
  if (!knownOf(c).includes(id)) return 'You do not know how to make this yet. Find the recipe in the Wastes, or copy it in the Library.'
  if (!r.field && !atHome) return 'That needs the workbench at home.'
  if (ITEMS[r.out] && itemsOf(c)[r.out]) return `You already have a ${ITEMS[r.out]!.name.toLowerCase()}.`
  for (const [m, n] of Object.entries(r.in)) if (have(c, m, atHome) < n) return `Not enough ${nameOf(m).toLowerCase()}: ${have(c, m, atHome)} of ${n}.`
  return null
}
function consume(c: Owner, inn: Inv, atHome: boolean) {
  for (const [m, n] of Object.entries(inn)) { let left = n; const fromBag = Math.min(left, c.inv[m] || 0); c.inv[m] = (c.inv[m] || 0) - fromBag; left -= fromBag
    if (left && atHome && c.stash) c.stash[m] = (c.stash[m] || 0) - left; if (!c.inv[m]) delete c.inv[m] }
}
/** Put n of a material in the bag; what does not fit goes to the home store if you are home, or is lost. */
function give(c: Owner, mat: string, n: number, atHome: boolean) {
  const fit = roomFor(c, mat, n); if (fit) c.inv[mat] = (c.inv[mat] || 0) + fit
  if (n > fit && atHome) { c.stash ??= {}; c.stash[mat] = (c.stash[mat] || 0) + (n - fit) }
  return fit
}
export const DEMO_TOWN = { people: 5, power: 5190, deeds: 2 }

/** Town buildings: they shelter anyone who reaches them. Same cells as the game's SPECIAL and DEMO houses. */
export const SPECIAL = { core: [0, 0], church: [1, -3], plaza: [-1, 3], observatory: [4, -2], library: [5, -5], mine: [-5, 0] } as const
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
  return insideDome(q, r) ? 0 : n <= TOWN_RING ? 1 : n <= 8 + SHIFT ? 1 : n <= 12 + SHIFT ? 2 : n <= MAX_RING ? 3 : 4
}

function hash(a: number, b: number, s = 0) {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(s | 0, 2147483647)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

export type Terrain = 'town' | 'open' | 'tree' | 'forest' | 'rock' | 'mountain' | 'void'

/* ---------- the shape of the Wastes: three old roads, a camp, a frozen lake, a wall of teeth, a circle of stones ---------- */
/** The old roads the first expedition packed: from a town gate out to the far cold. Faster underfoot, and the posts keep you on them. */
export const ROADS = [
  { id: 'north', name: 'The North Road', a: 2, b: 3, na: 7, nb: 4 },
  { id: 'timber', name: 'The Timber Road', a: 1, b: 0, na: 4, nb: 7 },
  { id: 'pilgrim', name: "The Pilgrims' Road", a: 5, b: 0, na: 5, nb: 6 },
] as const
/** Named places. The map shows them once you have seen them; the roads everyone knows. */
export const LANDMARKS = [
  { id: 'camp', name: 'The First Camp', at: outward([-1, -6]) as Cell, note: 'Where the first expedition slept before the storm. Their tents are still standing.' },
  { id: 'lake', name: 'The Still Lake', at: outward([-10, 4]) as Cell, note: 'Black ice so clear you can see the pines that grew here before the cold.' },
  { id: 'choir', name: 'The Choir Stones', at: outward([-6, 14]) as Cell, note: 'A ring of standing stones. On windless nights something sings between them.' },
  { id: 'mouth', name: 'The Mouth', at: CAVE, note: 'The cave of Pure Cold under the last tooth. Not open yet.' },
] as const
/** The Teeth close like a jaw: a wall of peaks on ring 13, broken where the roads go through and at two old passes. */
export const RIDGE_RING = 13 + SHIFT
export const PASSES: Cell[] = [outward([-13, 0]), outward([-13, 13])]
const ROAD_STEP = 0.7
let _roads: Map<string, string> | null = null
/** Every road cell, keyed, with the road it belongs to. */
export function roadCells() {
  if (_roads) return _roads
  const m = new Map<string, string>()
  for (const R of ROADS) {
    const A = DIRS[R.a]!, B = DIRS[R.b]!, N = R.na + R.nb
    let q = A[0] * TOWN_RING, r = A[1] * TOWN_RING
    for (let i = 0; i < N; i++) {
      const useB = Math.floor((i + 1) * R.nb / N) > Math.floor(i * R.nb / N)
      const d = useB ? B : A; q += d[0]; r += d[1]; m.set(key(q, r), R.id)
    }
  }
  return (_roads = m)
}
export const roadAt = (q: number, r: number) => roadCells().get(key(q, r)) ?? null
const nearRoad = (q: number, r: number) => !!roadAt(q, r) || DIRS.some(([dq, dr]) => !!roadAt(q + dq, r + dr))
export const lakeAt = (q: number, r: number) => { const d = dist([q, r], LANDMARKS[1].at); return d <= 1 || (d === 2 && hash(q, r, 29) < 0.55) }
export const landmarkAt = (q: number, r: number) => LANDMARKS.find(l => dist([q, r], l.at) <= (l.id === 'lake' ? 2 : 1))?.id ?? null

/** What stands on a cell. The game draws exactly this; the server walks exactly this. */
export function terrain(q: number, r: number): Terrain {
  const n = ringOf(q, r)
  if (insideDome(q, r)) return 'town'
  if (n <= TOWN_RING) return 'open'
  if (n > MAX_RING) return 'void'
  if (roadAt(q, r) || lakeAt(q, r)) return 'open'
  const camp = dist([q, r], LANDMARKS[0].at), choir = dist([q, r], LANDMARKS[2].at)
  if (camp <= 1 || choir === 0) return 'open'
  if (choir === 1) return 'rock'
  const h = hash(q, r, 7)
  if (n <= 8 + SHIFT) return h < 0.22 ? 'tree' : h < 0.3 ? 'rock' : 'open'
  if (n <= 12 + SHIFT) return n >= 10 + SHIFT && h < 0.12 && !nearRoad(q, r) ? 'mountain' : h < 0.62 ? 'forest' : h < 0.7 ? 'rock' : 'open'
  if (n === RIDGE_RING && !nearRoad(q, r) && !PASSES.some(p => dist(p, [q, r]) <= 1) && hash(q, r, 23) < 0.93) return 'mountain'
  return h < 0.22 && !nearRoad(q, r) ? 'mountain' : h < 0.52 ? 'rock' : h < 0.6 ? 'tree' : 'open'
}
export const passable = (q: number, r: number) => { const t = terrain(q, r); return t !== 'mountain' && t !== 'void' }
/** What a cell gives when you work it, or null. */
export function resourceOf(q: number, r: number): string | null {
  const t = terrain(q, r), z = zoneOf(q, r), h = hash(q, r, 11)
  if (t === 'open' && (roadAt(q, r) || lakeAt(q, r) || landmarkAt(q, r))) return null
  if (t === 'tree' || t === 'forest') return z === 2 && h < 0.25 ? 'resin' : 'wood'
  if (t === 'rock') return z === 3 && h < 0.3 ? 'flint' : 'stone'
  if (t === 'open' && (z === 1 || z === 2) && h < 0.32) return 'fiber'
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
/* ---------- the six pylons that hold the Veil's edge ---------- */
export const PYLON_N = 6
export const PYLON_GIVE = 15 // strength a pylon gains from one person's warmth
export const PYLON_COST = 12 // warmth it costs you
export const PYLON_WAIT = 20 * 60_000 // before you can give to the same pylon again
export const PYLON_PRESS_MS = 6 * 3600_000 // the Hollow picks a new sector to press every six hours
export type Pylon = { s: number; t: number; by?: string; nick?: string; at?: number }
export const pylonAngle = (i: number) => (i + 0.5) * Math.PI / 3
/** Pylon i stands on a cell just inside the wall. */
export function pylonCell(i: number): Cell {
  const a = pylonAngle(i), R = DOME_RADIUS - 2.4, x = Math.cos(a) * R, z = Math.sin(a) * R
  const r = z / 1.7320508, q = x / 2 - r / 2, s = -q - r
  let rq = Math.round(q), rr = Math.round(r); const rs = Math.round(s), dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s)
  if (dq > dr && dq > ds) rq = -rr - rs; else if (dr > ds) rr = -rq - rs
  return [rq, rr]
}
/** Which sector the Hollow presses in the window that contains t. */
export const pressedAt = (t: number) => Math.floor(hash(Math.floor(t / PYLON_PRESS_MS), 77, 5) * PYLON_N)
/** Strength lost per hour: the weak Veil lets them closer; the pressed sector loses three times as fast. */
const pylonRate = (i: number, t: number, veil: number) => (1.5 + 5 * (1 - veil)) * (pressedAt(t) === i ? 3 : 0.7)
export function pylonNow(p: Pylon | undefined, i: number, now: number, veil: number) {
  let s = p?.s ?? 80, t = p?.t ?? now
  if (now - t > 7 * 24 * 3600_000) t = now - 7 * 24 * 3600_000
  while (t < now && s > 0) { const end = Math.min(now, (Math.floor(t / 3600_000) + 1) * 3600_000); s -= pylonRate(i, t, veil) * (end - t) / 3600_000; t = end }
  return Math.max(0, Math.min(100, s))
}

/** The Veil's strength from the town's mining power, sol/h: logarithmic, full at VEIL_FULL. */
export const VEIL_FULL = 30_000
export const veilOf = (power: number) => Math.max(0, Math.min(1, Math.log10(1 + power / 400) / Math.log10(1 + VEIL_FULL / 400)))
/** Under the Veil the cold is what the mining lets through: none near Anna, most by the wall, all of it when the dome is weak. */
export const VEIL_COLD = 42
export function coldAt(q: number, r: number, t: number, ctx: Ctx) {
  const [x, z] = worldXZ(q, r)
  if (ctx.shelters[key(q, r)]) return 0 // indoors: walls, a stove, nothing gets in
  if (STAGE === 1 && insideDome(q, r)) {
    const V = ctx.veil ?? 0.6, d = Math.hypot(x, z) / DOME_RADIUS
    let c = VEIL_COLD * Math.pow(1 - V, 1.2) * (0.25 + 0.75 * d) // the outer streets, by the wall, freeze first
    // a failing pylon lets the cold through its sector: the houses nearest it freeze first
    if (ctx.pylons) for (let i = 0; i < PYLON_N; i++) { const a = pylonAngle(i), px = Math.cos(a) * (DOME_RADIUS - 2.4), pz = Math.sin(a) * (DOME_RADIUS - 2.4), prox = Math.max(0, 1 - Math.hypot(x - px, z - pz) / 10); if (prox > 0) c += 18 * Math.pow(1 - (ctx.pylons[i] ?? 80) / 100, 1.5) * prox }
    if (greyAt(t)) c -= 3
    if (bellAt(t)) c += 8
    return Math.max(0, c) * weatherAt(t, ctx.netStorm).mult
  }
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

export const weightOf = (inv: Inv) => stacksOf(inv)
export const emptyInv = (): Inv => ({})

/** Shortest walkable path from a to b (b may be a building cell). Cells after a, a excluded. */
/** Buildings are walked into, never through: `blocked` cells are only allowed as the destination. */
export function findPath(a: Cell, b: Cell, limit = 4000, blocked?: Set<string>): Cell[] | null {
  if (a[0] === b[0] && a[1] === b[1]) return []
  if (!passable(b[0], b[1])) return null
  const open: [number, number, Cell][] = [[dist(a, b) * ROAD_STEP, 0, a]]
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
      if (!passable(nq, nr) || inCore(nq, nr) || (STAGE === 1 && !insideDome(nq, nr))) continue
      if (blocked?.has(nk) && !(nq === b[0] && nr === b[1])) continue
      const ng = gc + (roadAt(nq, nr) ? ROAD_STEP : 1)
      if (ng < (g.get(nk) ?? Infinity) - 1e-9) { g.set(nk, ng); came.set(nk, key(...cur)); open.push([ng + dist([nq, nr], b) * ROAD_STEP, ng, [nq, nr]]) }
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
  return Math.round(ZONE_STEP_MS[z]! * slow * (z >= 1 && roadAt(to[0], to[1]) ? ROAD_STEP : 1) * (load > 1e9 ? 1 : 1))
}
/** Start the step toward path[0] at time t. In wind and blizzard, out in the Wastes, the trail can be lost. */
export function beginStep(c: Char, t: number, ctx: Ctx) {
  c.t0 = t
  if (!c.path.length) return
  const w = weatherAt(t, ctx.netStorm).id as keyof typeof DRIFT, next = c.path[0]!
  const onRoad = !!roadAt(c.q, c.r) && !!roadAt(next[0], next[1])
  if (!ctx.noDrift && !onRoad && Math.max(zoneOf(c.q, c.r), zoneOf(next[0], next[1])) >= 1 && hash(Math.floor(t / 1000), c.q * 131 + c.r, 17) < DRIFT[w]) {
    const opts = DIRS.map(([dq, dr]) => [c.q + dq, c.r + dr] as Cell).filter(x => passable(x[0], x[1]) && !(x[0] === next[0] && x[1] === next[1]))
    if (opts.length) { c.path = [opts[Math.floor(hash(Math.floor(t / 1000), 3, 19) * opts.length)]!]; c.lost = true }
  }
  c.stepMs = stepDur(c.path[0]!, t, loadOf(c), ctx.netStorm)
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
      { const z = zoneOf(q, r); if (z >= 1 && z <= 3) award(c, 'z' + z); for (const L of LANDMARKS) if (dist([q, r], L.at) <= (L.id === 'mouth' ? 2 : 1)) award(c, 'lm:' + L.id) }
      c.energy = Math.max(0, c.energy - 1)
      if (c.lost) { c.lost = false; c.path = []; c.t0 = te; events.push({ kind: 'lost', t: te, q, r }) }
      else if (c.path.length) beginStep(c, te, ctx)
      else { c.t0 = te; events.push({ kind: 'arrived', t: te, q, r }) }
    }
    if (c.act && t1 >= c.act.until) {
      const a = c.act; c.act = null
      const home = key(c.q, c.r) === ctx.home && !c.path.length
      if (a.kind === 'gather') { if (give(c, a.res, 1, home)) events.push({ kind: 'gathered', t: a.until, q: a.q, r: a.r, res: a.res }) }
      else if (a.kind === 'craft') {
        // the work is done; the materials are taken now, so nothing is lost if you walked away
        const why = canCraft(c, a.recipe, home), r = RECIPES[a.recipe]
        if (why || !r) events.push({ kind: 'crafted', t: a.until, recipe: a.recipe, ok: false, why: why ?? 'No such recipe.' })
        else { consume(c, r.in, home); if (ITEMS[r.out]) itemsOf(c)[r.out] = home ? 'home' : 'pack'; else give(c, r.out, r.n, home); award(c, 'make:' + r.out, ITEMS[r.out] ? 4 : 2); events.push({ kind: 'crafted', t: a.until, recipe: a.recipe, ok: true }) }
      }
    }
    const q = c.q, r = c.r, zone = zoneOf(q, r)
    const cold = coldAt(q, r, t1, ctx), src = sourceAt(q, r, t1, ctx)
    const tired = c.energy <= 0 ? 1.25 : 1
    const ins = insulationOf(c), loss = Math.max(0, cold - ins) * LOSS_K * tired
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
      const cause = pure ? 'Pure Cold. The cave is not open yet' : kept ? 'the keepers of the Mouth took you' : taken ? 'Chthon passed through you' : c.health <= 0 && c.warmth > 0 ? 'frostbite' : `cold ${Math.round(cold)} against clothing ${ins}${w.id === 'calm' ? '' : `, ${w.name.toLowerCase()} ×${w.mult}`}`
      events.push({ kind: 'froze', t: t1, q, r, cause, zone, inv: { ...c.inv } })
      c.died = { t: t1, q, r, cause, zone }
      Object.assign(c, { frozenUntil: t1 + FREEZE_MS, warmth: 0, path: [], act: null, lost: false, q: c.home[0], r: c.home[1], inv: {}, simT: now, t0: t1 })
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
  return { W, F, B, holds: B >= 0, heatR: Math.min(10, Math.max(2.6, 5.6 + B * 0.28)) * TOWN_RING / 5, power: o.power, veil: veilOf(o.power) }
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
  library?: Record<string, { by: string; nick: string; at: number }> // recipes written into the town's book
  shards?: Record<string, { by: string; nick: string; t: number }> // this week's shards already picked up
  anna?: { n: number; heroes: Record<string, { nick: string; n: number }> } // shards brought to Anna, and by whom
  delivered?: { day: number; n: number } // town orders filled today, by everyone
  pylons?: Record<string, Pylon> // the six pylons, by index
  rime?: Rime
  rimeTrail?: [number, number, number][] // computed on load, not stored
}
export type Feed = { id: string; t: number; topic: 'froze' | 'hearth' | 'took' | 'library' | 'found' | 'shard' | 'anna' | 'order' | 'pylon'; by: string; data: Record<string, unknown> }
export type Dirty = { chars: Set<string>; hearths: Set<string>; bags: Set<string>; bagsGone: Set<string>; nodes: Set<string>; feed: Feed[]; rime?: boolean; library?: Set<string>; shards?: Set<string>; anna?: boolean; delivered?: boolean; pylons?: Set<string> }
export const newDirty = (): Dirty => ({ chars: new Set(), hearths: new Set(), bags: new Set(), bagsGone: new Set(), nodes: new Set(), feed: [] })

export function townOfState(ws: WState) {
  const real = Object.values(ws.houses)
  const mining = real.filter(x => x.state === 'mining')
  const fire = real.filter(x => ws.now - (x.lastWood ?? 0) < 3600_000).length
  const today = ws.delivered?.day === dayOf(ws.now) ? ws.delivered.n : 0
  return townWarmth({ people: DEMO_TOWN.people + mining.length, online: ws.online, deeds: DEMO_TOWN.deeds + ws.doneOrders + Math.floor(today / 2), fire, power: DEMO_TOWN.power + mining.reduce((a, x) => a + (x.sol ?? 0), 0), storm: false })
}
export function ctxOf(ws: WState, uid: string): Ctx {
  const t = townOfState(ws)
  const cells = Object.values(ws.houses).filter(x => x.q != null && x.r != null).map(x => [x.q!, x.r!] as Cell)
  const home = ws.chars[uid]?.home ?? [ws.houses[uid]?.q ?? 0, ws.houses[uid]?.r ?? 0]
  const pyl = Array.from({ length: PYLON_N }, (_, i) => pylonNow(ws.pylons?.[i], i, ws.now, t.veil))
  return { pylons: pyl, veil: t.veil, heatR: t.heatR, holds: t.holds, netStorm: false, shelters: townShelters(cells), home: key(home[0], home[1]), hearths: Object.fromEntries(Object.entries(ws.hearths).map(([k, v]) => [k, v.until])), insulation: INSULATION_T1, rime: ws.rimeTrail }
}
const nickIn = (ws: WState, uid: string) => ws.houses[uid]?.nick ?? 'someone'
export const zoneName = (z: number) => (ZONES as readonly { name: string }[])[z]?.name ?? 'the far cold'

export function stepChar(ws: WState, uid: string, d: Dirty) {
  const c0 = ws.chars[uid]; if (!c0) return [] as Event[]
  const { c, events } = advance(c0, ws.now, ctxOf(ws, uid))
  for (const e of events) {
    if (e.kind !== 'froze') continue
    const has = Object.values(e.inv).some(v => v > 0)
    { const id = `${uid}:${e.t}`; ws.bags[id] = { id, owner: uid, nick: nickIn(ws, uid), q: e.q, r: e.r, inv: e.inv, until: e.t + BAG_MS }; d.bags.add(id) }
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
  let th: Rime = ws.rime && ringOf(ws.rime.q, ws.rime.r) >= RIME_MIN_RING ? ws.rime : { ...(ws.rime ?? { t: Math.floor(ws.now / RIME_MS) * RIME_MS, d: 2 }), q: outward([11, -6])[0], r: outward([11, -6])[1] }
  if (ws.now - th.t > 24 * 3600_000) th = { ...th, t: Math.floor((ws.now - 24 * 3600_000) / RIME_MS) * RIME_MS }
  const trail: [number, number, number][] = [[th.t, th.q, th.r]], targets = rimeTargets(ws)
  while (th.t + RIME_MS <= ws.now) { th = rimeStep(th, targets); trail.push([th.t, th.q, th.r]) }
  if (!ws.rime || th.t !== ws.rime.t) d.rime = true
  ws.rime = th; ws.rimeTrail = trail
}
export function stepAll(ws: WState, d: Dirty) {
  stepRime(ws, d)
  if (STAGE === 1) for (const [uid, c] of Object.entries(ws.chars)) if (!insideDome(c.q, c.r) || inCore(c.q, c.r) || c.path.some(p => !insideDome(p[0], p[1]))) {
    Object.assign(c, { q: c.home[0], r: c.home[1], path: [], act: null, lost: false, t0: ws.now, simT: ws.now, warmth: Math.max(c.warmth, 60) }); if (c.frozenUntil > ws.now) c.frozenUntil = ws.now; d.chars.add(uid) }
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
    library: ws.library ?? {},
    shards: shardsFor(weekOf(ws.now)).map(s => ({ ...s, taken: ws.shards?.[s.id] ? ws.shards[s.id]!.nick : null })),
    anna: ws.anna ?? { n: 0, heroes: {} },
    orders: ordersFor(dayOf(ws.now)), delivered: ws.delivered?.day === dayOf(ws.now) ? ws.delivered.n : 0,
    pylons: Array.from({ length: PYLON_N }, (_, i) => { const p = ws.pylons?.[i]; return { i, at: pylonCell(i), s: pylonNow(p, i, ws.now, veilOf(townOfState(ws).power)), nick: p?.nick ?? null, at_t: p?.at ?? 0 } }),
    pressed: pressedAt(ws.now), pressNext: (Math.floor(ws.now / PYLON_PRESS_MS) + 1) * PYLON_PRESS_MS,
    ranks: Object.fromEntries(Object.entries(ws.chars).map(([k, x]) => [k, rankOf(x.renown ?? 0)])),
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
      let to = cellArg(b.to); if (!to) return fail('Where to?')
      if (STAGE === 1 && !insideDome(...to)) return fail('The dome holds, and nothing living goes through it. Not in this act.')
      if (ringOf(...to) > MAX_RING) return fail('Beyond here the cold has no edge. Not yet.')
      // Anna's block: walk up to it, not into it
      if (inCore(...to)) { const sh = ctxOf(ws, uid).shelters; to = ringCells(CORE_RING + 1).filter(x => !sh[key(...x)] && passable(...x)).sort((a, c) => dist(a, here) - dist(c, here))[0] ?? to }
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
      if (!roomFor(c, res, 1)) return fail('Your bag is full.')
      const needs = toolsFor(res), tool = bestTool(c, res)
      if (needs.length && !tool) return fail(`You need a ${ITEMS[needs[0]!]!.name.toLowerCase()} in your bag for ${nameOf(res).toLowerCase()}.`)
      c.act = { kind: 'gather', q: at[0], r: at[1], res, until: now + Math.round(GATHER_MS / (tool ? ITEMS[tool]!.speed ?? 1 : 1.5)) }
      ws.nodes[k] = now + GATHER_MS + NODE_COOLDOWN_MS; d.nodes.add(k)
      return ok()
    }
    case 'hearth': {
      if (c.path.length) return fail('Stop walking first.')
      if (zoneOf(...here) < 1) return fail('The town has its own fire. Build out in the cold.')
      const k = key(...here)
      if (ws.hearths[k]) return fail('There is a hearth here already.')
      if ((c.inv.hearth_kit || 0) > 0) { c.inv.hearth_kit! -= 1; if (!c.inv.hearth_kit) delete c.inv.hearth_kit }
      else { for (const [res, n] of Object.entries(HEARTH_COST)) if ((c.inv[res] || 0) < n) return fail(`A hearth takes a hearth kit, or ${HEARTH_COST.wood} wood, ${HEARTH_COST.stone} stone and ${HEARTH_COST.flint} flint.`)
        consume(c, HEARTH_COST, false) }
      ws.hearths[k] = { by: uid, nick: nickIn(ws, uid), at: now, until: now + HEARTH_START_MS }; d.hearths.add(k); award(c, 'hearth')
      d.feed.push({ id: `hb${uid}${now}`, t: now, topic: 'hearth', by: uid, data: { nick: nickIn(ws, uid), zone: zoneName(zoneOf(...here)), q: here[0], r: here[1] } })
      return ok()
    }
    case 'feed': {
      const at = cellArg(b.at) ?? here, k = key(...at), h = ws.hearths[k]
      if (!h) return fail('No hearth there.')
      if (!near(at)) return fail('Too far. Stand next to it.')
      if ((c.inv.wood || 0) < 1) return fail('You have no wood.')
      c.inv.wood! -= 1; if (!c.inv.wood) delete c.inv.wood; h.until = Math.min(now + HEARTH_MAX_MS, Math.max(now, h.until) + HEARTH_WOOD_MS); d.hearths.add(k)
      return ok()
    }
    case 'take': {
      const bag = ws.bags[String(b.id ?? '')]
      if (!bag || bag.until <= now) return fail('That pack is gone.')
      if (bag.owner === uid) return fail('Your own frozen pack will not open for you. Someone else has to carry it.')
      if (!near([bag.q, bag.r])) return fail('Too far. Stand next to it.')
      const took: Inv = {}
      for (const res of Object.keys(bag.inv)) { const n = roomFor(c, res, bag.inv[res] || 0); if (!n) continue; bag.inv[res]! -= n; c.inv[res] = (c.inv[res] || 0) + n; took[res] = n; if (!bag.inv[res]) delete bag.inv[res] }
      if (!Object.values(bag.inv).some(v => v > 0)) { delete ws.bags[bag.id]; d.bagsGone.add(bag.id) } else d.bags.add(bag.id)
      d.feed.push({ id: `tk${uid}${now}`, t: now, topic: 'took', by: uid, data: { nick: nickIn(ws, uid), owner: bag.nick, took } })
      return ok()
    }
    case 'unload': {
      if (key(...here) !== key(...c.home)) return fail('Unload at your own house.')
      c.stash = c.stash ?? {}
      for (const res of Object.keys(c.inv)) { c.stash[res] = (c.stash[res] || 0) + (c.inv[res] || 0) }
      c.inv = {}
      return ok()
    }
    case 'pack': {
      if (key(...here) !== key(...c.home)) return fail('Pack at your own house.')
      const res = String(b.res ?? ''), n = Math.max(1, Math.min(200, Number(b.n) || 1))
      if (!MATS[res]) return fail('Pack what?')
      c.stash = c.stash ?? {}
      const m = Math.min(n, c.stash[res] || 0, roomFor(c, res, n)); if (!m) return fail('Your bag is full.')
      c.stash[res] = (c.stash[res] || 0) - m; if (!c.stash[res]) delete c.stash[res]; c.inv[res] = (c.inv[res] || 0) + m
      return ok()
    }
    case 'store': {
      if (key(...here) !== key(...c.home)) return fail('Store things at your own house.')
      const res = String(b.res ?? ''), n = Math.max(1, Math.min(200, Number(b.n) || (c.inv[res] || 0)))
      const m = Math.min(n, c.inv[res] || 0); if (!m) return fail('Nothing to store.')
      c.stash = c.stash ?? {}; c.stash[res] = (c.stash[res] || 0) + m; c.inv[res] = (c.inv[res] || 0) - m; if (!c.inv[res]) delete c.inv[res]
      return ok()
    }
    case 'craft': {
      if (c.path.length) return fail('Stop walking first.')
      if (c.act) return fail('You are busy.')
      const id = String(b.recipe ?? ''), atHome = key(...here) === key(...c.home), why = canCraft(c, id, atHome)
      if (why) return fail(why)
      c.act = { kind: 'craft', recipe: id, until: now + RECIPES[id]!.ms }
      return ok()
    }
    case 'fill': {
      if (key(...here) !== key(...c.home)) return fail('Fill the thermos at home, from the stove.')
      if (!itemsOf(c).thermos) return fail('You have no thermos.')
      if ((c.sips || 0) >= 3) return fail('The thermos is full.')
      if (have(c, 'charcoal', true) < 2) return fail('It takes 2 charcoal to fill.')
      consume(c, { charcoal: 2 }, true); c.sips = 3
      return ok()
    }
    case 'drink': {
      if (!itemsOf(c).thermos || itemsOf(c).thermos === 'home') return fail('The thermos is not with you.')
      if (!(c.sips || 0)) return fail('The thermos is empty.')
      c.sips = (c.sips || 0) - 1; c.warmth = Math.min(100, c.warmth + SIP_WARMTH)
      return ok()
    }
    case 'item': {
      const id = String(b.id ?? ''), to = String(b.to ?? '') as 'worn' | 'pack' | 'home', it = ITEMS[id], items = itemsOf(c)
      if (!it || !items[id]) return fail('No such thing.')
      if (!['worn', 'pack', 'home'].includes(to)) return fail('Where to?')
      const atHome = key(...here) === key(...c.home)
      if ((to === 'home' || items[id] === 'home') && !atHome) return fail('That stays at home. Go home first.')
      if (to === 'worn' && (it.slot === 'tool' || it.slot === 'flask')) return fail('That goes in the bag.')
      if (to === 'pack' && items[id] !== 'pack' && slotsUsed(c) + 1 > bagSize(c)) return fail('Your bag is full.')
      if (it.slot === 'bag' && items[id] === 'worn' && to !== 'worn') return fail('Put on another bag instead; this one holds everything you carry.')
      if (it.slot === 'bag' && to === 'worn') { const cur = Object.keys(items).find(k => items[k] === 'worn' && ITEMS[k]?.slot === 'bag'); const after = POCKETS + (it.bag ?? 0); if (slotsUsed(c) - (items[id] === 'pack' ? 1 : 0) + (cur && items[id] === 'pack' ? 1 : 0) > after) return fail('Everything you carry would not fit in that bag.') }
      // putting something on takes off whatever was in that slot, back to where the new one came from
      if (to === 'worn') for (const [o, at] of Object.entries(items)) if (o !== id && at === 'worn' && ITEMS[o]?.slot === it.slot) items[o] = items[id]!
      items[id] = to
      return ok()
    }
    case 'learn': {
      const id = String(b.recipe ?? ''), at = scrolls()[id]
      if (!at) return fail('There is no such recipe out there.')
      if (here[0] !== at[0] || here[1] !== at[1]) return fail('Stand on the spot where it lies.')
      const kn = knownOf(c); if (!kn.includes(id)) { kn.push(id); d.feed.push({ id: `fd${uid}${id}`, t: now, topic: 'found', by: uid, data: { nick: nickIn(ws, uid), recipe: id, name: nameOf(RECIPES[id]!.out) } }) }
      return ok()
    }
    case 'donate': {
      const id = String(b.recipe ?? '')
      if (key(...here) !== key(SPECIAL.library[0], SPECIAL.library[1])) return fail('Write recipes into the book in the Library.')
      if (!knownOf(c).includes(id) || STARTER_RECIPES.includes(id)) return fail('You can only write down a recipe you found.')
      ws.library ??= {}; if (ws.library[id]) return fail('That recipe is already in the book.')
      ws.library[id] = { by: uid, nick: nickIn(ws, uid), at: now }; (d.library ??= new Set()).add(id); award(c, 'wrote'); addRenown(c, 4)
      d.feed.push({ id: `lb${uid}${id}`, t: now, topic: 'library', by: uid, data: { nick: nickIn(ws, uid), recipe: id, name: nameOf(RECIPES[id]!.out) } })
      return ok()
    }
    case 'study': {
      if (key(...here) !== key(SPECIAL.library[0], SPECIAL.library[1])) return fail('The book stays in the Library. Go there to copy it.')
      const kn = knownOf(c); for (const id of Object.keys(ws.library ?? {})) if (!kn.includes(id)) kn.push(id)
      return ok()
    }
    case 'tend': {
      const i = Number(b.i); if (!(i >= 0 && i < PYLON_N)) return fail('Which pylon?')
      if (c.path.length) return fail('Stop walking first.')
      if (dist(here, pylonCell(i)) > 1) return fail('Stand next to the pylon.')
      const last = c.tended?.[i] ?? 0; if (now - last < PYLON_WAIT) return fail(`You gave this pylon your warmth not long ago. Again in ${Math.ceil((PYLON_WAIT - (now - last)) / 60_000)} min.`)
      if (c.warmth < PYLON_COST + 8) return fail('You are too cold to give any warmth. Get indoors first.')
      ws.pylons ??= {}; const V = veilOf(townOfState(ws).power), cur = pylonNow(ws.pylons[i], i, now, V)
      ws.pylons[i] = { s: Math.min(100, cur + PYLON_GIVE), t: now, by: uid, nick: nickIn(ws, uid), at: now }; (d.pylons ??= new Set()).add(String(i))
      c.warmth -= PYLON_COST; (c.tended ??= {})[i] = now; addRenown(c, cur < 30 ? 4 : 2)
      d.feed.push({ id: `py${uid}${i}${now}`, t: now, topic: 'pylon', by: uid, data: { nick: nickIn(ws, uid), i, s: Math.round(ws.pylons[i]!.s), was: Math.round(cur) } })
      return ok()
    }
    case 'pick': {
      const s = shardsFor(weekOf(now)).find(x => x.id === String(b.id ?? ''))
      if (!s) return fail('There is no such shard this week.')
      if (here[0] !== s.at[0] || here[1] !== s.at[1] || c.path.length) return fail('Stand on the spot where it lies.')
      ws.shards ??= {}; if (ws.shards[s.id]) return fail(`${ws.shards[s.id]!.nick} found this one first.`)
      if (!roomFor(c, 'shard', 1)) return fail('Your bag is full. Make room for the shard.')
      c.inv.shard = (c.inv.shard || 0) + 1; ws.shards[s.id] = { by: uid, nick: nickIn(ws, uid), t: now }; (d.shards ??= new Set()).add(s.id)
      addRenown(c, 2 + 2 * s.zone)
      d.feed.push({ id: `sh${uid}${s.id}`, t: now, topic: 'shard', by: uid, data: { nick: nickIn(ws, uid), zone: zoneName(s.zone) } })
      return ok()
    }
    case 'give': {
      if (dist(here, [0, 0]) > CORE_RING + 1 || c.path.length) return fail('Bring the shards to Anna, in the middle of town.')
      const n = c.inv.shard || 0; if (!n) return fail('You carry no shard.')
      delete c.inv.shard
      ws.anna ??= { n: 0, heroes: {} }; ws.anna.n += n; const h = (ws.anna.heroes[uid] ??= { nick: nickIn(ws, uid), n: 0 }); h.n += n; h.nick = nickIn(ws, uid); d.anna = true
      award(c, 'shard'); addRenown(c, 6 * n)
      d.feed.push({ id: `an${uid}${now}`, t: now, topic: 'anna', by: uid, data: { nick: nickIn(ws, uid), n } })
      return ok()
    }
    case 'deliver': {
      const o = ordersFor(dayOf(now)).find(x => x.id === String(b.id ?? ''))
      if (!o) return fail('The town does not ask for that today.')
      if (dist(here, [SPECIAL.plaza[0], SPECIAL.plaza[1]]) > 1 || c.path.length) return fail('Bring it to the board on the plaza.')
      if (!c.orders || c.orders.day !== dayOf(now)) c.orders = { day: dayOf(now), done: [] }
      if (c.orders.done.includes(o.id)) return fail('You already filled this one today. Tomorrow brings new ones.')
      for (const [m, n] of Object.entries(o.need)) if ((c.inv[m] || 0) < n) return fail(`It takes ${n} ${nameOf(m).toLowerCase()} from your bag. You carry ${c.inv[m] || 0}.`)
      consume(c, o.need, false); c.orders.done.push(o.id); addRenown(c, o.pts)
      ws.delivered = ws.delivered?.day === dayOf(now) ? { day: ws.delivered.day, n: ws.delivered.n + 1 } : { day: dayOf(now), n: 1 }; d.delivered = true
      d.feed.push({ id: `or${uid}${o.id}${now}`, t: now, topic: 'order', by: uid, data: { nick: nickIn(ws, uid), text: o.text } })
      return ok()
    }
    default: return fail('unknown action')
  }
}
