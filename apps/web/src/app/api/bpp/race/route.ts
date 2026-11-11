import { NextResponse } from 'next/server'
import { race } from '@/lib/bpp/race'

// The same answer for everyone: the CDN keeps it a minute, so the tracker feed is read at most once a minute.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const r = await race()
    if (!r) return NextResponse.json({ error: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'public, s-maxage=30' } })
    return NextResponse.json(r, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'public, s-maxage=30' } })
  }
}
