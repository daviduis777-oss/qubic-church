import { NextResponse } from 'next/server'
import { plot } from '@/lib/garden/garden'
import { isIdentity } from '@/lib/garden/garden-view'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }

/** One identity's plot: brains grown per epoch, and its best brain among this epoch's hundred best, if any. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  if (!isIdentity(id)) return NextResponse.json({ ok: false, reason: 'A Qubic identity is 60 capital letters.' }, { status: 400, headers })
  try {
    const p = await plot(id)
    if (!p) return NextResponse.json({ ok: false, reason: 'The explorer has no record of this identity.' }, { status: 404, headers })
    return NextResponse.json({ ok: true, ...p }, { headers })
  } catch (e) {
    return NextResponse.json({ ok: false, reason: e instanceof Error ? e.message : 'unavailable' }, { status: 503, headers })
  }
}
