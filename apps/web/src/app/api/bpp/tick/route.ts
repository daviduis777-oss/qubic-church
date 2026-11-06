import { NextResponse } from 'next/server'
import { hourCandle } from '@/lib/bpp/candles'
import { liveCall } from '@/lib/bpp/live-call'
import { defaultRecordBackend, tick } from '@/lib/bpp/record'

export const dynamic = 'force-dynamic'

/** At most this many ticks a minute from everyone together: the job is idempotent, so more add nothing. */
const PER_MINUTE = 20

/**
 * Seal the current hour's call and check closed hours. Public and idempotent: a GitHub Actions schedule
 * calls it every half hour, and anyone may; calling it twice appends nothing twice.
 */
async function run() {
  const backend = defaultRecordBackend()
  const minute = Math.floor(Date.now() / 60000)
  const n = await backend.hit(`bpp:record:tick:${minute}`, 120).catch(() => 0)
  if (n > PER_MINUTE) return NextResponse.json({ ok: false, reason: 'busy' }, { status: 429 })
  const r = await tick({ backend, call: liveCall, candle: hourCandle })
  return NextResponse.json(r, { status: r.ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } })
}

export const GET = run
export const POST = run
