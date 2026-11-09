import { NextResponse } from 'next/server'
import { fieldEpochs, fieldView, findTerritory } from '@/lib/garden/field'
import { isIdentity } from '@/lib/garden/garden-view'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }

/** The field of the current epoch, or of a past one (?epoch=), with the list of epochs that have one; ?find=ID looks one identity up. */
export async function GET(req: Request) {
  const u = new URL(req.url)
  const ep = Number(u.searchParams.get('epoch') ?? '')
  const find = u.searchParams.get('find')
  try {
    if (find != null) {
      if (!isIdentity(find)) return NextResponse.json({ ok: false, reason: 'An identity is 60 capital letters.' }, { status: 400, headers })
      const epochs = await fieldEpochs()
      const epoch = Number.isInteger(ep) && ep > 0 ? ep : epochs[0]?.epoch
      if (!epoch) return NextResponse.json({ ok: false, reason: 'The field has not been read yet.' }, { status: 404, headers })
      return NextResponse.json({ ok: true, found: await findTerritory(epoch, find) }, { headers })
    }
    const [view, epochs] = await Promise.all([fieldView(Number.isInteger(ep) && ep > 0 ? ep : undefined), fieldEpochs()])
    if (!view) return NextResponse.json({ ok: false, reason: 'The field has not been read yet.', epochs: epochs.map(e => e.epoch) }, { status: 404, headers })
    return NextResponse.json({ ok: true, ...view, epochs: epochs.map(e => e.epoch) }, { headers })
  } catch (e) {
    return NextResponse.json({ ok: false, reason: e instanceof Error ? e.message : 'unavailable' }, { status: 503, headers })
  }
}
