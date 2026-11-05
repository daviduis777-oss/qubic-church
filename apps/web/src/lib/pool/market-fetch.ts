/**
 * Server only: fetch the live rental offers (market.ts parses and ranks them).
 * Vast.ai's search is public. Clore.ai needs CLORE_API_KEY: use a key from an account with no balance,
 * so the key can read prices and can never rent or spend. Prices are cached for MARKET.ttlSec.
 */
import { MARKET, type MarketSource, type Offer, parseClore, parseVast } from './market.ts'

export type Live = { at: number; offers: Offer[]; sources: { name: MarketSource; ok: boolean; n: number }[] }

/** Cards fetched from Vast: everything we measured, plus the ones miners ask about. */
const VAST_CARDS = ['RTX 5090', 'RTX 4090', 'RTX 5080', 'RTX 5070 Ti', 'RTX 4080S', 'RTX 4080', 'RTX 3090', 'RTX 4070 Ti', 'RTX 5070']

const TIMEOUT_MS = 8000
let cache: { at: number; live: Live } | null = null
let inflight: Promise<Live> | null = null
/** after a total failure, wait this long before asking the marketplaces again */
let failedAt = 0
const RETRY_MS = 60_000

async function vast(): Promise<Offer[]> {
  const q = {
    rentable: { eq: true },
    rented: { eq: false },
    gpu_name: { in: VAST_CARDS },
    reliability2: { gte: MARKET.minReliability },
    type: 'on-demand',
    order: [['dph_total', 'asc']],
    limit: 400,
  }
  const r = await fetch(`https://console.vast.ai/api/v0/bundles/?q=${encodeURIComponent(JSON.stringify(q))}`, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  })
  if (!r.ok) throw new Error(`vast ${r.status}`)
  return parseVast(await r.json())
}

async function clore(key: string): Promise<Offer[]> {
  const r = await fetch('https://api.clore.ai/v1/marketplace', {
    headers: { auth: key, accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  })
  if (!r.ok) throw new Error(`clore ${r.status}`)
  return parseClore(await r.json())
}

async function load(): Promise<Live> {
  const key = process.env.CLORE_API_KEY
  const jobs: [MarketSource, Promise<Offer[]>][] = [['Vast.ai', vast()]]
  if (key) jobs.push(['Clore.ai', clore(key)])
  const done = await Promise.allSettled(jobs.map(([, p]) => p))
  const offers: Offer[] = []
  const sources = jobs.map(([name], i) => {
    const d = done[i]!
    if (d.status === 'fulfilled') offers.push(...d.value)
    else console.warn('pool/market', name, d.reason instanceof Error ? d.reason.message : 'failed')
    return { name, ok: d.status === 'fulfilled', n: d.status === 'fulfilled' ? d.value.length : 0 }
  })
  return { at: Date.now(), offers, sources }
}

/** The live offers, at most MARKET.ttlSec old. Null when no marketplace answered. */
export async function liveOffers(): Promise<Live | null> {
  if (cache && Date.now() - cache.at < MARKET.ttlSec * 1000) return cache.live
  if (Date.now() - failedAt < RETRY_MS) return cache?.live ?? null
  inflight ??= load().finally(() => {
    inflight = null
  })
  const live = await inflight
  if (!live.sources.some(s => s.ok)) {
    failedAt = Date.now()
    return cache?.live ?? null
  }
  cache = { at: live.at, live }
  return live
}

/** Which marketplaces this deployment can read, for the app's footnote. */
export const marketSources = (): MarketSource[] => (process.env.CLORE_API_KEY ? ['Vast.ai', 'Clore.ai'] : ['Vast.ai'])
