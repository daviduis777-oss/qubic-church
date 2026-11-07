import { NextResponse } from 'next/server'
import { brainsAllowed } from '@/lib/bpp/brains-gate'
import { shelf, shelves, topBrains } from '@/lib/bpp/brains'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }

/** The best brains of the current epoch (live from the explorer), or of an archived one (?epoch=), plus the shelves we keep. */
export async function GET(req: Request) {
  if (!(await brainsAllowed(req))) return NextResponse.json({ error: 'Not found' }, { status: 404, headers })
  const ep = Number(new URL(req.url).searchParams.get('epoch') ?? '')
  const epochs = await shelves()
  try {
    const top = await topBrains(Number.isInteger(ep) && ep > 0 ? ep : undefined)
    return NextResponse.json({ ok: true, ...top, epochs }, { headers })
  } catch (e) {
    // the explorer is down or the epoch is gone from it: the shelf we kept, if any
    const kept = Number.isInteger(ep) && ep > 0 ? await shelf(ep) : epochs[0] ? await shelf(epochs[0]) : null
    if (kept) return NextResponse.json({ ok: true, ...kept, fetchedAt: kept.updatedAt, live: false, epochs }, { headers })
    return NextResponse.json({ ok: false, reason: e instanceof Error ? e.message : 'unavailable', epochs }, { status: 503, headers })
  }
}
