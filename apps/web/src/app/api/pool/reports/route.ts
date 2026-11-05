import { NextResponse } from 'next/server'
import { isModerator } from '@/lib/forum/auth'
import { reports } from '@/lib/pool/report-store'

export const dynamic = 'force-dynamic'

const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', Vary: 'Cookie' }
const notFound = () => NextResponse.json({ error: 'Not found' }, { status: 404, headers })

/**
 * The reports, for the moderator only, public pool or not: everyone else gets a plain 404.
 * GET: the newest reports (no screenshots: /api/pool/reports/image serves those). PATCH {id, status}: mark it.
 */
export async function GET(req: Request) {
  if (!(await isModerator(req))) return notFound()
  return NextResponse.json({ ok: true, reports: await reports().list(200) }, { headers })
}

export async function PATCH(req: Request) {
  if (!(await isModerator(req))) return notFound()
  const b = (await req.json().catch(() => null)) as { id?: unknown; status?: unknown } | null
  const r = await reports().setStatus(b?.id, b?.status)
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 422, headers })
  return NextResponse.json({ ok: true, report: r.value }, { headers })
}
