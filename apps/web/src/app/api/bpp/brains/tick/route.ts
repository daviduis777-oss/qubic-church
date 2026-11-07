import { NextResponse } from 'next/server'
import { archiveBrains } from '@/lib/bpp/brains'
import { defaultRecordBackend } from '@/lib/bpp/record'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** At most this many archive runs a minute from everyone together; the job is idempotent. */
const PER_MINUTE = 4

/** Keep the current epoch's best brains on the shelf. Public and idempotent; the record's schedule calls it too. */
async function run() {
  const minute = Math.floor(Date.now() / 60000)
  const n = await defaultRecordBackend().hit(`bpp:brains:tick:${minute}`, 120).catch(() => 0)
  if (n > PER_MINUTE) return NextResponse.json({ ok: false, reason: 'busy' }, { status: 429 })
  try {
    const r = await archiveBrains()
    return NextResponse.json({ ok: true, ...r }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ ok: false, reason: e instanceof Error ? e.message : 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}

export const GET = run
export const POST = run
