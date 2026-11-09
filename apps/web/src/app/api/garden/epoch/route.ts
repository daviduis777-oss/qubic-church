import { NextResponse } from 'next/server'
import { epochGarden } from '@/lib/garden/garden'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }

/** The season so far: brains grown this epoch, the newest births, the best brain and the gardeners behind the best hundred. */
export async function GET() {
  try {
    return NextResponse.json({ ok: true, ...(await epochGarden()) }, { headers })
  } catch (e) {
    return NextResponse.json({ ok: false, reason: e instanceof Error ? e.message : 'unavailable' }, { status: 503, headers })
  }
}
