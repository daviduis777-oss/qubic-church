/**
 * Live rentals: what can be rented right now, ranked by cost per 1,000 solutions.
 * Pure functions: parse each marketplace, keep the boxes that mine well, price the work with what our
 * miners measured. No network here (market-fetch.ts does that), no React. Tests: __tests__/market.test.mts.
 *
 * The rate behind every ranking is a measurement (aggregate.ts rows "gpu|<card>", per card). A card nobody
 * measured is never ranked: it is listed apart, by price only, so a guess is never dressed up as a number.
 */
import type { HardwareRow, Summary } from './aggregate.ts'
import { RENTALS } from './config.ts'
import { normalizeGpu } from './measure.ts'
import { newestEraSummary } from './stats-view.ts'

export type MarketSource = 'Vast.ai' | 'Clore.ai'
export type Scale = 'small' | 'mid' | 'large'

export type Offer = {
  source: MarketSource
  id: string
  /** the physical machine, so one host does not fill the whole top three */
  machine: string
  gpu: string
  gpus: number
  /** whole box, on demand, USD per hour */
  usdHour: number
  threads?: number
  ramGb?: number
  reliability?: number
  country?: string
}

export type Rate = { gpu: string; perCard: number; epoch: number; n: number; older: boolean }

export type Ranked = Offer & { solHour: number; usdPer1k: number; rate: Rate }

export type Unmeasured = { gpu: string; offers: number; cardHourFrom: number }

export const MARKET = {
  /** host uptime, as both marketplaces report it (0..1) */
  minReliability: 0.98,
  /** our epoch 233 runs: fewer CPU threads per card starve the cards */
  minThreadsPerCard: 12,
  minRamGb: 16,
  /** USD per card per hour outside this range is a parsing or unit error, never shown */
  cardHour: { min: 0.03, max: 6 },
  top: 3,
  /** how long fetched prices are reused, seconds */
  ttlSec: 300,
} as const

export const SCALE_CARDS: Record<Scale, { min: number; max: number }> = {
  small: { min: 1, max: 2 },
  mid: { min: 3, max: 8 },
  large: { min: 6, max: 64 },
}

/** What each marketplace says about mining, and where its prices come from. Shown with every result. */
export const MARKET_POLICY: Record<MarketSource, { mining: string; checked: string; url: string; open: string }> = {
  'Vast.ai': {
    mining: 'Vast allows mining only on credits bought with crypto. Its terms forbid mining on credits bought by card.',
    checked: '6 Nov 2026, vast.ai/terms',
    url: 'https://vast.ai/terms',
    open: 'https://cloud.vast.ai/create/',
  },
  'Clore.ai': {
    mining: 'Clore allows mining. All our own test rigs ran there.',
    checked: 'our runs, epochs 229 and 233',
    url: 'https://clore.ai',
    open: RENTALS.find(r => r.name === 'Clore.ai')?.url ?? 'https://clore.ai',
  },
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() && Number.isFinite(Number(v)) ? Number(v) : undefined)
const obj = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})

/* ---------------- parsing ---------------- */

/** Vast.ai bundles search (public, no key): prices are per hour for the whole offer. */
export function parseVast(json: unknown): Offer[] {
  const list = obj(json).offers
  if (!Array.isArray(list)) return []
  const out: Offer[] = []
  for (const raw of list) {
    const o = obj(raw)
    const gpu = normalizeGpu(String(o.gpu_name ?? ''))
    const gpus = num(o.num_gpus)
    const usdHour = num(o.dph_total)
    const id = num(o.id)
    if (!gpu || !gpus || !usdHour || id === undefined) continue
    if (o.rentable === false || o.rented === true) continue
    const ram = num(o.cpu_ram)
    out.push({
      source: 'Vast.ai',
      id: String(id),
      machine: `vast:${num(o.machine_id) ?? id}`,
      gpu,
      gpus,
      usdHour,
      threads: num(o.cpu_cores_effective),
      ramGb: ram === undefined ? undefined : Math.round(ram / 1024),
      reliability: num(o.reliability2) ?? num(o.reliability),
      country: typeof o.geolocation === 'string' ? o.geolocation : undefined,
    })
  }
  return out
}

/**
 * Clore.ai marketplace (needs a key). Clore quotes prices per day; the USD on-demand price is used.
 * A box with mixed cards is skipped: one rate cannot price it.
 */
export function parseClore(json: unknown): Offer[] {
  const list = obj(json).servers
  if (!Array.isArray(list)) return []
  const out: Offer[] = []
  for (const raw of list) {
    const o = obj(raw)
    if (o.rented === true) continue
    const specs = obj(o.specs)
    const arr = Array.isArray(o.gpu_array) ? o.gpu_array.map(String) : []
    const names = arr.length ? arr : (() => {
      const m = String(specs.gpu ?? '').match(/^(\d+)x\s+(.+)$/i)
      return m ? Array(Number(m[1])).fill(m[2]) : []
    })()
    const models = [...new Set(names.map(n => normalizeGpu(n)).filter((g): g is string => !!g))]
    if (models.length !== 1 || !names.length) continue
    const price = obj(o.price)
    const usd = obj(price.usd)
    const perDay = num(usd.on_demand_usd) ?? num(usd.on_demand_clore) ?? num(obj(price.on_demand)['USD-Blockchain'])
    const id = num(o.id)
    if (!perDay || id === undefined) continue
    const threads = num(String(specs.cpus ?? '').split('/')[1])
    out.push({
      source: 'Clore.ai',
      id: String(id),
      machine: `clore:${id}`,
      gpu: models[0]!,
      gpus: names.length,
      usdHour: perDay / 24,
      threads,
      ramGb: num(specs.ram) === undefined ? undefined : Math.round(num(specs.ram)!),
      reliability: num(o.reliability),
      country: typeof obj(specs.net).cc === 'string' ? String(obj(specs.net).cc) : undefined,
    })
  }
  return out
}

/* ---------------- what mines well ---------------- */

/** Why a box is left out, or null when it qualifies. Unknown values are not held against a box. */
export function rejectReason(o: Offer): string | null {
  const card = o.usdHour / o.gpus
  if (!(card >= MARKET.cardHour.min && card <= MARKET.cardHour.max)) return 'price out of range'
  if (o.reliability !== undefined && o.reliability < MARKET.minReliability) return 'host reliability under 98%'
  if (o.threads !== undefined && o.threads / o.gpus < MARKET.minThreadsPerCard) return 'fewer than 12 CPU threads per card'
  if (o.ramGb !== undefined && o.ramGb < MARKET.minRamGb) return 'under 16 GB RAM'
  return null
}

/**
 * Per-card rates from what our miners measured: GPU-only rows, per card, with a median, from the newest era
 * only. Rates across an algorithm change differ a hundredfold (epoch 229 against 233), so one era at a time.
 */
export function ratesFrom(sum: Summary | null | undefined): Map<string, Rate> {
  const m = new Map<string, Rate>()
  const gpuOnly = sum ? { ...sum, rows: sum.rows.filter(r => r.unit === 'card' && r.key.startsWith('gpu|') && r.latest.median !== undefined) } : sum
  for (const r of (newestEraSummary(gpuOnly)?.rows ?? []) as HardwareRow[]) {
    if (r.unit !== 'card' || !r.key.startsWith('gpu|') || r.latest.median === undefined || r.latest.median <= 0) continue
    m.set(r.label, { gpu: r.label, perCard: r.latest.median, epoch: r.latest.epoch, n: r.latest.n, older: r.older })
  }
  return m
}

/**
 * The ranking: qualifying boxes of the chosen size with a measured card, cheapest 1,000 solutions first,
 * one offer per machine. Cards without a measurement come back apart, cheapest per card first.
 */
export function rank(offers: Offer[], rates: Map<string, Rate>, scale?: Scale, top: number = MARKET.top): { ranked: Ranked[]; unmeasured: Unmeasured[] } {
  const size = scale ? SCALE_CARDS[scale] : { min: 1, max: 64 }
  const fits = offers.filter(o => o.gpus >= size.min && o.gpus <= size.max && !rejectReason(o))
  const priced: Ranked[] = []
  const rest = new Map<string, Unmeasured>()
  for (const o of fits) {
    const rate = rates.get(o.gpu)
    if (!rate) {
      const card = o.usdHour / o.gpus
      const u = rest.get(o.gpu)
      rest.set(o.gpu, { gpu: o.gpu, offers: (u?.offers ?? 0) + 1, cardHourFrom: Math.min(u?.cardHourFrom ?? Infinity, card) })
      continue
    }
    const solHour = rate.perCard * o.gpus
    priced.push({ ...o, rate, solHour, usdPer1k: (o.usdHour / solHour) * 1000 })
  }
  priced.sort((a, b) => a.usdPer1k - b.usdPer1k || (b.reliability ?? 0) - (a.reliability ?? 0))
  const seen = new Set<string>()
  const ranked: Ranked[] = []
  for (const p of priced) {
    if (seen.has(p.machine)) continue
    seen.add(p.machine)
    ranked.push(p)
    if (ranked.length >= top) break
  }
  const unmeasured = [...rest.values()].sort((a, b) => a.cardHourFrom - b.cardHourFrom).slice(0, 4)
  return { ranked, unmeasured }
}

/* ---------------- words ---------------- */

export const usd = (n: number) => `$${n < 1 ? n.toFixed(2) : n < 10 ? n.toFixed(2) : Math.round(n).toLocaleString('en-US')}`
export const rateNote = (r: Rate) => `measured in epoch ${r.epoch}${r.n > 1 ? `, ${r.n} rigs` : ', 1 rig'}${r.older ? ', before the latest algorithm changes' : ''}`
export const offerTitle = (o: Offer) => `${o.gpus}x ${o.gpu}`

/** One block for Maria's request-time prompt: the live top offers, or why there are none. */
export function marketPromptBlock(live: { at: number; offers: Offer[]; sources: { name: MarketSource; ok: boolean }[] } | null, rates: Map<string, Rate>): string {
  if (!live) return 'LIVE RENTALS: not available right now. Point to Pick hardware > Rent a box.'
  const when = new Date(live.at).toISOString().slice(11, 16)
  const lines: string[] = []
  for (const scale of ['small', 'mid', 'large'] as Scale[]) {
    const { ranked } = rank(live.offers, rates, scale, 2)
    for (const r of ranked) lines.push(`- ${scale}: ${offerTitle(r)} on ${r.source} (offer ${r.id}), ${usd(r.usdHour)}/h, about ${Math.round(r.solHour)} sol/h, ${usd(r.usdPer1k)} per 1,000 solutions (rate ${rateNote(r.rate)})`)
  }
  const down = live.sources.filter(s => !s.ok).map(s => s.name)
  return `LIVE RENTALS (prices fetched ${when} UTC; they change by the minute; the rate is our measurement, not a promise)
${lines.length ? lines.join('\n') : '- no qualifying box with a measured card right now'}
${down.length ? `- not fetched: ${down.join(', ')}\n` : ''}- ${MARKET_POLICY['Vast.ai'].mining}
- Pick hardware > Rent a box shows the live list in the app. Never present a price or rate as income.`
}
