import { NextResponse } from 'next/server'
import { allParticipants, participantCount } from '@/lib/bpp/store'

export const dynamic = 'force-dynamic'

/** The participants of the experiment: how many, and how many trades they logged (in total and this UTC hour). */
export async function GET() {
  const hour = new Date().toISOString().slice(0, 13)
  const [signedUp, people] = await Promise.all([participantCount(), allParticipants().catch(() => [])])
  let total = 0
  let trades = 0
  for (const p of people) {
    total += p.trades.length
    for (const t of p.trades) if (t.at.slice(0, 13) === hour) trades++
  }
  return NextResponse.json({ signedUp, total, trades }, { headers: { 'Cache-Control': 'public, s-maxage=60' } })
}
