import { NextResponse } from 'next/server'
import { poolAllowed, poolPublic } from '@/lib/pool/gate'
import { gateReply } from '@/lib/pool/nav'

export const dynamic = 'force-dynamic'

const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', Vary: 'Cookie' }

/**
 * May this browser see the pool? {ok:true} for the moderator (or everyone once POOL_PUBLIC=1), a plain 404
 * otherwise. The nav asks this to decide whether to render the QC Pool tab; the cookie itself stays httpOnly.
 */
export async function GET(req: Request) {
  const r = gateReply(await poolAllowed(req), poolPublic())
  return NextResponse.json(r.body, { status: r.status, headers })
}
