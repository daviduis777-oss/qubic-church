import { NextResponse } from 'next/server'
import { poolAllowed } from '@/lib/pool/gate'
import { MARKET_POLICY, rank, ratesFrom, type Scale, SCALE_CARDS } from '@/lib/pool/market'
import { liveOffers, marketSources } from '@/lib/pool/market-fetch'
import { measureStore } from '@/lib/pool/store'

export const dynamic = 'force-dynamic'

const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }

/**
 * Live rentals for Pick hardware > Rent a box: the best boxes right now by cost per 1,000 solutions,
 * priced with what our miners measured. Read-only: nothing is ever rented from here.
 */
export async function GET(req: Request) {
  if (!(await poolAllowed(req))) return NextResponse.json({ error: 'Not found' }, { status: 404, headers })
  const s = new URL(req.url).searchParams.get('scale')
  const scale = s && s in SCALE_CARDS ? (s as Scale) : undefined
  const [live, sum] = await Promise.all([liveOffers().catch(() => null), measureStore().summary().catch(() => null)])
  const sources = marketSources()
  if (!live) return NextResponse.json({ ok: false, sources, policy: MARKET_POLICY }, { headers })
  const { ranked, unmeasured } = rank(live.offers, ratesFrom(sum), scale)
  return NextResponse.json(
    { ok: true, at: live.at, scale: scale ?? null, ranked, unmeasured, sources: live.sources, policy: MARKET_POLICY },
    { headers },
  )
}
