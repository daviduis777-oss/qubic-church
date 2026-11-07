import { NextResponse } from 'next/server'
import { brainsAllowed } from '@/lib/bpp/brains-gate'
import { brainGenome } from '@/lib/bpp/brains'
import { genomeFile } from '@/lib/bpp/brains-view'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }

/** One brain's genome, checked by our own run; ?download=1 hands it over as a file. */
export async function GET(req: Request, ctx: { params: Promise<{ hash: string }> }) {
  if (!(await brainsAllowed(req))) return NextResponse.json({ error: 'Not found' }, { status: 404, headers })
  const { hash } = await ctx.params
  const g = await brainGenome(hash).catch(() => null)
  if (!g) return NextResponse.json({ error: 'Not found' }, { status: 404, headers })
  if (new URL(req.url).searchParams.get('download') === '1') {
    return new NextResponse(JSON.stringify(genomeFile(g), null, 1), {
      headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="bpp9000-brain-e${g.epoch}-${g.hash.slice(0, 12)}.json"` },
    })
  }
  return NextResponse.json(g, { headers })
}
