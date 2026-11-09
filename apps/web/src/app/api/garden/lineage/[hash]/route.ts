import { NextResponse } from 'next/server'
import { lineage } from '@/lib/garden/garden'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }

/** A brain's ancestors, a few dozen generations further per call; `done` once the root is reached. */
export async function GET(_req: Request, ctx: { params: Promise<{ hash: string }> }) {
  const { hash } = await ctx.params
  if (!/^[a-z]{60}$/.test(hash)) return NextResponse.json({ ok: false, reason: 'not a brain hash' }, { status: 400, headers })
  try {
    return NextResponse.json({ ok: true, ...(await lineage(hash)) }, { headers })
  } catch (e) {
    return NextResponse.json({ ok: false, reason: e instanceof Error ? e.message : 'unavailable' }, { status: 503, headers })
  }
}
