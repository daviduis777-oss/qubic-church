import { NextResponse } from 'next/server'
import { isModerator } from '@/lib/forum/auth'
import { reports } from '@/lib/pool/report-store'

export const dynamic = 'force-dynamic'

const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', Vary: 'Cookie' }

/** A report's screenshot, for the moderator only. Served as an image with no sniffing and no caching. */
export async function GET(req: Request) {
  if (!(await isModerator(req))) return NextResponse.json({ error: 'Not found' }, { status: 404, headers })
  const img = await reports().image(new URL(req.url).searchParams.get('id'))
  if (!img) return NextResponse.json({ error: 'Not found' }, { status: 404, headers })
  return new Response(img.bytes, {
    headers: { ...headers, 'Content-Type': img.type, 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'", 'Content-Disposition': 'inline' },
  })
}
