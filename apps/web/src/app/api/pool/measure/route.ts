import { NextResponse } from 'next/server'
import { rowFor } from '@/lib/pool/aggregate'
import { MEASURE } from '@/lib/pool/config'
import { poolAllowed } from '@/lib/pool/gate'
import { buildSample, partKey } from '@/lib/pool/measure'
import { clientIp, takeMessage } from '@/lib/pool/ratelimit'
import { measureStore } from '@/lib/pool/store'

export const dynamic = 'force-dynamic'

const headers = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
}
const notFound = () =>
  NextResponse.json({ error: 'Not found' }, { status: 404, headers })

/**
 * Measured results. GET: the aggregates (medians, spread, n, epoch; never raw rows or hashes).
 * POST: one result from a pasted log. Behind the same moderator gate as the pool page.
 * Request bodies are never logged: the worker name in one is hashed and dropped.
 */
export async function GET(req: Request) {
  if (!(await poolAllowed(req))) return notFound()
  const sum = await measureStore().summary()
  return NextResponse.json(sum, { headers })
}

export async function POST(req: Request) {
  if (!(await poolAllowed(req))) return notFound()
  const body = (await req.json().catch(() => null)) as unknown
  if (!body || typeof body !== 'object')
    return NextResponse.json(
      { ok: false, error: 'Nothing to save.' },
      { status: 400, headers }
    )
  // a refused result does not use up the day's quota
  const pre = buildSample(body)
  if (!pre.ok)
    return NextResponse.json(
      { ok: false, error: pre.error },
      { status: 422, headers }
    )
  const ip = clientIp(req)
  const quota = await takeMessage(ip, MEASURE.postsPerDay, 'measure')
  if (!quota.ok)
    return NextResponse.json(
      {
        ok: false,
        error: `That is today's ${MEASURE.postsPerDay} saved results from this connection. Thank you; try again tomorrow.`,
      },
      { status: 429, headers }
    )
  const store = measureStore()
  const r = await store.add(body, { ip })
  if (!r.ok)
    return NextResponse.json(
      { ok: false, error: r.error },
      { status: 422, headers }
    )
  const sum = await store.summary()
  return NextResponse.json(
    {
      ok: true,
      epoch: r.value.result.epoch,
      row: rowFor(sum, partKey(r.value.hw).key) ?? null,
      summary: sum,
    },
    { headers }
  )
}
