import 'server-only'

/** Market mood around the predictor: fear & greed, BTC dominance, an altseason index, BTC hourly candles. */
export type Market = {
  fng: { value: number; label: string; history: number[] } | null
  dominance: { btc: number; eth: number } | null
  altseason: { index: number; beat: number; of: number; window: string } | null
  btc: { price: number; change24h: number; candles: { t: number; o: number; c: number; h: number; l: number }[] } | null
}

const opts = { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) } as const

async function fng(): Promise<Market['fng']> {
  const r = await fetch('https://api.alternative.me/fng/?limit=30', opts)
  const j = (await r.json()) as { data: { value: string; value_classification: string }[] }
  const d = j.data
  return { value: Number(d[0]!.value), label: d[0]!.value_classification, history: d.map(x => Number(x.value)).reverse() }
}

async function dominance(): Promise<Market['dominance']> {
  const r = await fetch('https://api.coingecko.com/api/v3/global', opts)
  const j = (await r.json()) as { data: { market_cap_percentage: Record<string, number> } }
  return { btc: j.data.market_cap_percentage.btc!, eth: j.data.market_cap_percentage.eth! }
}

/**
 * Altseason, our own count: of the top 50 coins by market cap (stablecoins and wrapped BTC/ETH left out),
 * how many beat BTC over 30 days. 75% or more is usually called altseason, 25% or less bitcoin season.
 */
const SKIP = /usd|dai|tusd|fdusd|pyusd|usde|wbtc|steth|weth|wsteth|weeth|cbbtc|bsc-usd|reth|lbtc|solvbtc|wbeth|susds|usds|buidl/i
async function altseason(): Promise<Market['altseason']> {
  const r = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=80&page=1&price_change_percentage=30d', opts)
  const list = (await r.json()) as { id: string; symbol: string; price_change_percentage_30d_in_currency: number | null }[]
  const btc = list.find(c => c.id === 'bitcoin')?.price_change_percentage_30d_in_currency
  if (btc == null) return null
  const alts = list.filter(c => c.id !== 'bitcoin' && !SKIP.test(c.id) && !SKIP.test(c.symbol) && c.price_change_percentage_30d_in_currency != null).slice(0, 50)
  const beat = alts.filter(c => c.price_change_percentage_30d_in_currency! > btc).length
  return { index: Math.round((beat / alts.length) * 100), beat, of: alts.length, window: '30 days' }
}

async function btc(): Promise<Market['btc']> {
  const r = await fetch('https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=3600', { ...opts, next: { revalidate: 60 }, headers: { 'User-Agent': 'qubic.church' } })
  const rows = (await r.json()) as [number, number, number, number, number, number][]
  const candles = rows
    .slice(0, 24)
    .reverse()
    .map(([t, l, h, o, c]) => ({ t: t * 1000, o, c, h, l }))
  const last = candles.at(-1)!
  const first = candles[0]!
  return { price: last.c, change24h: ((last.c - first.o) / first.o) * 100, candles }
}

export async function market(): Promise<Market> {
  const [a, b, c, d] = await Promise.allSettled([fng(), dominance(), altseason(), btc()])
  const v = <T,>(x: PromiseSettledResult<T>) => (x.status === 'fulfilled' ? x.value : null)
  return { fng: v(a), dominance: v(b), altseason: v(c), btc: v(d) }
}
