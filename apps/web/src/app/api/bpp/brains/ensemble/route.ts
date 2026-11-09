import { NextResponse } from 'next/server'
import { ensembleOf } from '@/lib/bpp/brains'
import { brainsAllowed } from '@/lib/bpp/brains-gate'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** The epoch's ten best brains voting, graded on the hours after their task. ?epoch=N for an archived epoch. */
export async function GET(req: Request) {
  if (!(await brainsAllowed())) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const e = Number(new URL(req.url).searchParams.get('epoch'))
  try {
    const r = await ensembleOf(Number.isInteger(e) && e > 0 ? e : undefined)
    if (!r) return NextResponse.json({ ok: false, reason: 'too few brains' }, { status: 404 })
    return NextResponse.json({ ok: true, ...r }, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800' } })
  } catch (e) {
    return NextResponse.json({ ok: false, reason: e instanceof Error ? e.message : 'unavailable' }, { status: 503 })
  }
}
