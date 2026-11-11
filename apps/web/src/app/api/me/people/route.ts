import { NextResponse } from 'next/server'
import { isModerator } from '@/lib/forum/auth'
import { people } from '@/lib/me/me'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!(await isModerator(req))) return NextResponse.json({ error: 'not found' }, { status: 404 })
  try {
    return NextResponse.json({ people: await people() }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
