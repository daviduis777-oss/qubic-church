import { NextResponse } from 'next/server'
import { defaultRecordBackend } from '@/lib/bpp/record'
import { fieldTick } from '@/lib/garden/field'

export const dynamic = 'force-dynamic'
export const maxDuration = 60
const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }

/** At most this many ticks a minute from everyone together; a tick is idempotent, so a doubled one changes nothing. */
const PER_MINUTE = 3

/** Read a few dozen computors' records into the field. Public and idempotent; the record's schedule calls it in a loop. */
async function run() {
  const minute = Math.floor(Date.now() / 60000)
  const n = await defaultRecordBackend().hit(`garden:field:tick:${minute}`, 120).catch(() => 0)
  if (n > PER_MINUTE) return NextResponse.json({ ok: false, reason: 'busy' }, { status: 429, headers })
  try {
    return NextResponse.json({ ok: true, ...(await fieldTick()) }, { headers })
  } catch (e) {
    return NextResponse.json({ ok: false, reason: e instanceof Error ? e.message : 'unavailable' }, { status: 503, headers })
  }
}

export const GET = run
export const POST = run
