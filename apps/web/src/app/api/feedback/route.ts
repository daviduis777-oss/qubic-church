import { NextResponse } from 'next/server'
import { clientIp } from '@/lib/pool/ratelimit'
import { pageStep, REPORT, SITE_TYPES, uaClass } from '@/lib/pool/report'
import { reports } from '@/lib/pool/report-store'

export const dynamic = 'force-dynamic'

const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }
const MAX_BODY = Math.ceil((REPORT.imageMaxBytes * 4) / 3) + REPORT.maxText * 4 + 4096
const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status, headers })

/** A browser sends Origin on a POST: it must be this site. No Origin (curl, old browsers) is let through to the limits. */
function sameOrigin(req: Request) {
  const origin = req.headers.get('origin')
  if (!origin) return true
  try {
    const o = new URL(origin).host
    return o === new URL(req.url).host || o === req.headers.get('host') || o === req.headers.get('x-forwarded-host')
  } catch {
    return false
  }
}

/**
 * The site's Suggest form: an idea, an update, a tool, a review or a bug, from anyone. It lands in the same
 * store as the pool's Report app, so the moderator tracks both in one place (/mod). Same rules: bodies are never
 * logged, seeds and addresses are redacted, the IP is only an HMAC for the day's limit, the user agent a coarse class.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail('Send it from qubic.church.', 403)
  const len = Number(req.headers.get('content-length') ?? 0)
  if (len > MAX_BODY) return fail('The screenshot is too large. Try a smaller one.', 413)
  const raw = await req.text().catch(() => '')
  if (raw.length > MAX_BODY) return fail('The screenshot is too large. Try a smaller one.', 413)
  let body: Record<string, unknown> | null = null
  try {
    body = JSON.parse(raw)
  } catch {}
  if (!body || typeof body !== 'object') return fail('Nothing to send.', 400)
  // The hidden field only a bot fills in: answer as if it worked, keep nothing.
  if (typeof body.website === 'string' && body.website) return NextResponse.json({ ok: true, id: 'r0', seed: false }, { headers })
  if (!SITE_TYPES.some(t => t.id === body.type)) return fail('Choose what kind of message this is.', 422)
  const input = { type: body.type, text: body.text, contact: body.contact, image: body.image, ctx: { app: 'site', step: pageStep(body.page) } }
  const r = await reports().add(input, { ip: clientIp(req), ua: uaClass(req.headers.get('user-agent')) })
  if (!r.ok) return fail(r.error, r.status ?? 422)
  return NextResponse.json({ ok: true, id: r.value.id, seed: Boolean(r.value.seed) }, { headers })
}
