import { NextResponse } from 'next/server'
import { allParticipants, participantCount, ping, watching } from '@/lib/bpp/store'

export const dynamic = 'force-dynamic'

/** The crowd around the call: sign-ups, people on the page now, trades opened this UTC hour and their direction. */
async function crowd(now = new Date()) {
  const hour = now.toISOString().slice(0, 13)
  const [signedUp, people] = await Promise.all([participantCount(), allParticipants().catch(() => [])])
  let long = 0
  let short = 0
  for (const p of people) for (const t of p.trades) if (t.at.slice(0, 13) === hour) t.side === 'long' ? long++ : short++
  return { signedUp, long, short, trades: long + short, hour: `${hour}:00Z` }
}

export async function GET() {
  const [c, w] = await Promise.all([crowd(), watching()])
  return NextResponse.json({ ...c, watching: w })
}

export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as { sid?: string } | null
  const sid = String(b?.sid ?? '').replace(/[^\w-]/g, '')
  if (sid.length < 8) return NextResponse.json({ error: 'bad sid' }, { status: 400 })
  const [w, c] = await Promise.all([ping(sid).catch(() => 0), crowd()])
  return NextResponse.json({ ...c, watching: w })
}
