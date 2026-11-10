import { after, NextResponse } from 'next/server'
import { defaultRecordBackend } from '@/lib/bpp/record'
import { fieldTick } from '@/lib/garden/field'
import { networkStatus } from '@/lib/network/status'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Minutes between two readings of the garden's stream, whoever's visit triggers them. */
const GARDEN_EVERY_MIN = 5

/**
 * Is the Qubic network running? Public. Every page's navigation asks it once a minute, so it is also the garden's
 * heartbeat: GitHub's schedule fires only every few hours, and Anna must keep up with the stream. At most one
 * reading per five minutes, from whichever visit comes first, after the answer is sent.
 */
async function run(req: Request) {
  // a GET is the same answer for everyone: the CDN keeps it a minute, so a page view costs no function run
  // (the /status page asks with ?fresh=1: it reads the tick itself and needs every reading)
  const cache = req.method === 'GET' && !new URL(req.url).searchParams.has('fresh') ? 'public, s-maxage=60, stale-while-revalidate=300' : 'no-store'
  after(async () => {
    try {
      const slot = Math.floor(Date.now() / (GARDEN_EVERY_MIN * 60_000))
      if ((await defaultRecordBackend().hit(`garden:heartbeat:${slot}`, GARDEN_EVERY_MIN * 120)) === 1) await fieldTick()
    } catch {
      // the next slot tries again
    }
  })
  try {
    return NextResponse.json(await networkStatus(), { headers: { 'Cache-Control': cache } })
  } catch (e) {
    return NextResponse.json({ ok: false, reason: e instanceof Error ? e.message : 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}

export const GET = run
export const POST = run
