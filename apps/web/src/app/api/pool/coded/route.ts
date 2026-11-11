import { NextResponse } from 'next/server'
import { poolAllowed } from '@/lib/pool/gate'

/*
 * CODED partner stats for QC's workers, read on the server with the stats bearer (never sent to the browser).
 * Env: CODED_API_ORIGIN (e.g. https://api.codedonqubic.com) and CODED_STATS_BEARER.
 * Behind the pool gate like the rest of the pool: the moderator alone until POOL_PUBLIC=1.
 * Upstream is asked at most once a minute: the answer is kept in this instance's memory for 60 s.
 */

export const dynamic = 'force-dynamic'

type Kept = { at: number; body: unknown }
let kept: Kept | null = null

async function upstream(path: string) {
  const origin = (process.env.CODED_API_ORIGIN ?? '').replace(/\/+$/, '')
  const bearer = process.env.CODED_STATS_BEARER ?? ''
  if (!origin || !bearer) return { ok: false as const, status: 0, error: 'not configured' }
  const r = await fetch(`${origin}${path}`, {
    headers: { Authorization: `Bearer ${bearer}`, Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })
  const text = await r.text()
  let data: unknown = text
  try {
    data = JSON.parse(text)
  } catch {}
  return r.ok ? { ok: true as const, status: r.status, data } : { ok: false as const, status: r.status, error: String(text).slice(0, 300) }
}

export async function GET(req: Request) {
  if (!(await poolAllowed(req))) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (kept && Date.now() - kept.at < 60_000) return NextResponse.json(kept.body, { headers: { 'Cache-Control': 'no-store' } })
  try {
    const [stats, me] = await Promise.all([upstream('/v1/partner/stats'), upstream('/v1/partner/me')])
    const body = { at: new Date().toISOString(), stats, me }
    if (stats.ok) kept = { at: Date.now(), body }
    return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502, headers: { 'Cache-Control': 'no-store' } })
  }
}
