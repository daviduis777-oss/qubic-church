import { NextResponse } from 'next/server'
import { getSession, isModerator } from '@/lib/forum/auth'
import { getParticipant } from '@/lib/bpp/store'
import { getForum } from '@/lib/forum/live'
import { personOf } from '@/lib/me/me'

// The cabinet is hidden while it is built: the moderator alone. ?as=<handle> previews anyone's cabinet.
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!(await isModerator(req))) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const as = new URL(req.url).searchParams.get('as')?.trim()
  try {
    if (as) {
      const p = await getParticipant(as).catch(() => null)
      const m = (await getForum()).memberByHandle(as)
      if (!p && !m) return NextResponse.json({ error: 'no such member' }, { status: 404 })
      const user = p ? { handle: p.handle, name: p.name, auth: p.auth, id: p.id } : { handle: m!.handle, name: m!.name, auth: m!.auth, id: m!.identity ?? '' }
      return NextResponse.json({ me: await personOf(user, p), preview: true }, { headers: { 'Cache-Control': 'no-store' } })
    }
    const user = await getSession()
    if (!user) return NextResponse.json({ me: null }, { headers: { 'Cache-Control': 'no-store' } })
    return NextResponse.json({ me: await personOf(user) }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
