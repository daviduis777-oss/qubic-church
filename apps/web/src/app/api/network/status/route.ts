import { NextResponse } from 'next/server'
import { networkStatus } from '@/lib/network/status'

export const dynamic = 'force-dynamic'

/** Is the Qubic network running? Public. The record's schedule also calls it, so stalls are caught when nobody is looking. */
async function run() {
  try {
    return NextResponse.json(await networkStatus(), { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ ok: false, reason: e instanceof Error ? e.message : 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}

export const GET = run
export const POST = run
