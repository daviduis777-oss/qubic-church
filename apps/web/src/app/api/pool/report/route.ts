import { NextResponse } from 'next/server'
import { poolAllowed } from '@/lib/pool/gate'
import { clientIp } from '@/lib/pool/ratelimit'
import { REPORT, uaClass } from '@/lib/pool/report'
import { reports } from '@/lib/pool/report-store'

export const dynamic = 'force-dynamic'

const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }
const notFound = () => NextResponse.json({ error: 'Not found' }, { status: 404, headers })

/** The largest body a valid report can have: the image as base64 (4/3), the text, the rest. */
const MAX_BODY = Math.ceil((REPORT.imageMaxBytes * 4) / 3) + REPORT.maxText * 4 + 4096

/**
 * One report from the Report app: a bug, an idea or an update. Behind the same gate as the pool page while
 * it is a preview. Bodies are never logged. The IP is used only for the day's limit, as an HMAC; the user
 * agent is kept as a coarse class ("mobile · iOS · Safari"), never as the raw string.
 */
export async function POST(req: Request) {
  if (!(await poolAllowed(req))) return notFound()
  const len = Number(req.headers.get('content-length') ?? 0)
  if (len > MAX_BODY) return NextResponse.json({ ok: false, error: 'The screenshot is too large. Try a smaller one.' }, { status: 413, headers })
  const raw = await req.text().catch(() => '')
  if (raw.length > MAX_BODY) return NextResponse.json({ ok: false, error: 'The screenshot is too large. Try a smaller one.' }, { status: 413, headers })
  let body: unknown = null
  try {
    body = JSON.parse(raw)
  } catch {}
  if (!body || typeof body !== 'object') return NextResponse.json({ ok: false, error: 'Nothing to send.' }, { status: 400, headers })
  const r = await reports().add(body, { ip: clientIp(req), ua: uaClass(req.headers.get('user-agent')) })
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: r.status ?? 422, headers })
  return NextResponse.json({ ok: true, id: r.value.id, seed: Boolean(r.value.seed) }, { headers })
}
