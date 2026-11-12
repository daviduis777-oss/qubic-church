import { NextResponse } from 'next/server'
import { brainsAllowed } from '@/lib/bpp/brains-gate'
import { brainGenome, liveOf } from '@/lib/bpp/brains'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }

/** The brain run past the end of its task, graded on every closed hour since against Binance. */
export async function GET(req: Request, ctx: { params: Promise<{ hash: string }> }) {
  if (!(await brainsAllowed(req))) return NextResponse.json({ error: 'Not found' }, { status: 404, headers })
  const { hash } = await ctx.params
  const g = await brainGenome(hash).catch(() => null)
  if (!g) return NextResponse.json({ error: 'Not found' }, { status: 404, headers })
  // a replay that does not reproduce the verified score grades nothing
  if (!g.check.matches) return NextResponse.json({ ok: false, reason: 'replay does not match the core yet' }, { status: 409, headers })
  try {
    const r = await liveOf(g)
    return NextResponse.json({ ok: true, ...r }, { headers })
  } catch (e) {
    return NextResponse.json({ ok: false, reason: e instanceof Error ? e.message : 'unavailable' }, { status: 503, headers })
  }
}
