import { NextResponse } from 'next/server'
import { annaFind, annaView } from '@/lib/garden/anna'
import { isIdentity } from '@/lib/garden/garden-view'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }

/** Anna as grown so far; ?find=ID gives one identity's part in her. */
export async function GET(req: Request) {
  const find = new URL(req.url).searchParams.get('find')
  try {
    if (find != null) {
      if (!isIdentity(find)) return NextResponse.json({ ok: false, reason: 'An identity is 60 capital letters.' }, { status: 400, headers })
      return NextResponse.json({ ok: true, found: await annaFind(find) }, { headers })
    }
    return NextResponse.json({ ok: true, ...(await annaView()) }, { headers })
  } catch (e) {
    return NextResponse.json({ ok: false, reason: e instanceof Error ? e.message : 'unavailable' }, { status: 503, headers })
  }
}
