import { NextResponse } from 'next/server'
import { readRecord, verifyRecord } from '@/lib/bpp/record'
import { joinRecord, recordStats } from '@/lib/bpp/record-view'

export const dynamic = 'force-dynamic'

/**
 * The BPP-9000 record, public: every sealed call joined with its result, the stats, and the chain's head.
 * ?raw=1 returns the entries themselves, so anyone can recompute every hash.
 */
export async function GET(req: Request) {
  const { entries, ok } = await readRecord()
  const chain = verifyRecord(entries)
  const headers = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
  if (new URL(req.url).searchParams.get('raw') === '1') return NextResponse.json({ ok, chain, entries }, { headers })
  const hours = joinRecord(entries)
  return NextResponse.json({ ok, chain: { ...chain, entries: entries.length }, stats: recordStats(hours), hours: hours.slice(-24 * 60) }, { headers })
}
