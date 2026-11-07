import 'server-only'
import type { Candle } from './record'

/**
 * The closed hourly BTC candle that starts at `hour` (unix seconds). Binance BTC/USDT first, the pair the
 * miners' task and the price oracle use (Binance's public market-data host, reachable from US servers);
 * Coinbase BTC-USD if Binance does not answer. Null while the hour has not closed.
 */
const opts = { cache: 'no-store', signal: AbortSignal.timeout(8000) } as const

async function binance(hour: number): Promise<Candle | null> {
  const r = await fetch(`https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1h&startTime=${hour * 1000}&limit=1`, opts)
  if (!r.ok) throw new Error(`binance ${r.status}`)
  const rows = (await r.json()) as [number, string, string, string, string, string, number][]
  const k = rows[0]
  if (!k || k[0] !== hour * 1000 || k[6] >= Date.now()) return null
  return { open: Number(k[1]), close: Number(k[4]), source: 'binance BTCUSDT 1h' }
}

async function coinbase(hour: number): Promise<Candle | null> {
  const start = new Date(hour * 1000).toISOString()
  const end = new Date((hour + 3600) * 1000).toISOString()
  const r = await fetch(`https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=3600&start=${start}&end=${end}`, { ...opts, headers: { 'User-Agent': 'qubic.church' } })
  if (!r.ok) throw new Error(`coinbase ${r.status}`)
  const rows = (await r.json()) as [number, number, number, number, number, number][]
  const k = rows.find(x => x[0] === hour)
  if (!k || (hour + 3600) * 1000 > Date.now()) return null
  return { open: k[3], close: k[4], source: 'coinbase BTC-USD 1h' }
}

export async function hourCandle(hour: number): Promise<Candle | null> {
  try {
    return await binance(hour)
  } catch {
    return coinbase(hour).catch(() => null)
  }
}

/**
 * Hourly closes from `fromHour` up to the last closed hour, Binance BTC/USDT (the task's own venue). Fetched in
 * fixed chunks of 1000 hours aligned to `fromHour`, so Next's data cache serves the old chunks and only the
 * chunk holding the current hour is refreshed. Brain Watch grades brains on these hours.
 */
export async function hourlyCloses(fromHour: number, toHour = Math.floor(Date.now() / 3600000) * 3600 - 3600): Promise<{ hour: number; close: number }[]> {
  const out: { hour: number; close: number }[] = []
  const CHUNK = 1000
  for (let start = fromHour; start <= toHour; start += CHUNK * 3600) {
    const last = start + (CHUNK - 1) * 3600
    const current = last >= toHour
    const r = await fetch(`https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1h&startTime=${start * 1000}&limit=${CHUNK}`, {
      next: { revalidate: current ? 600 : 86400 },
      signal: AbortSignal.timeout(12000),
    })
    if (!r.ok) throw new Error(`binance ${r.status}`)
    const rows = (await r.json()) as [number, string, string, string, string, string, number][]
    const now = Date.now()
    for (const k of rows) {
      const hour = k[0] / 1000
      if (hour > toHour || k[6] >= now) break
      out.push({ hour, close: Number(k[4]) })
    }
  }
  return out
}
