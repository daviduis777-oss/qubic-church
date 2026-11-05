import { NextResponse } from 'next/server'
import { poolAllowed } from '@/lib/pool/gate'
import { ledger } from '@/lib/pool/ledger'
import { clientIp } from '@/lib/pool/ratelimit'

export const dynamic = 'force-dynamic'

const headers = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
}
const notFound = () =>
  NextResponse.json({ error: 'Not found' }, { status: 404, headers })

/**
 * The record. Behind the same moderator gate as the pool page while it is a preview.
 * GET ?worker=QC.x: that worker's entries (newest first) and epoch totals.
 * GET: pool-wide totals only, the newest few entries anonymised, and the chain head hash.
 * POST: one contribution from My rig (a log's numbers, or rented hours, self-reported). Saves from Fix my
 * rig are recorded by /api/pool/measure. The source is decided here, never by the browser.
 * Request bodies and worker names are never logged; the worker is kept as an HMAC and a short display form.
 */
export async function GET(req: Request) {
  if (!(await poolAllowed(req))) return notFound()
  const worker = new URL(req.url).searchParams.get('worker')
  if (worker !== null) {
    const rec = await ledger().forWorker(worker.trim())
    return NextResponse.json({ ok: true, record: rec }, { headers })
  }
  return NextResponse.json(
    { ok: true, ...(await ledger().totals()) },
    { headers }
  )
}

export async function POST(req: Request) {
  if (!(await poolAllowed(req))) return notFound()
  const body = (await req.json().catch(() => null)) as unknown
  if (!body || typeof body !== 'object')
    return NextResponse.json(
      { ok: false, error: 'Nothing to record.' },
      { status: 400, headers }
    )
  const r = await ledger().record(body, { ip: clientIp(req) })
  if (!r.ok)
    return NextResponse.json(
      { ok: false, error: r.error },
      { status: r.status ?? 422, headers }
    )
  const worker = (body as { worker?: unknown }).worker
  return NextResponse.json(
    {
      ok: true,
      entries: r.value,
      record:
        typeof worker === 'string'
          ? await ledger().forWorker(worker.trim())
          : null,
    },
    { headers }
  )
}
