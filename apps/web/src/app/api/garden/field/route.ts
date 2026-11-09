import { NextResponse } from 'next/server'
import { fieldEpochs, fieldView } from '@/lib/garden/field'

export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }

/** The field of the current epoch, or of a past one (?epoch=), with the list of epochs that have one. */
export async function GET(req: Request) {
  const ep = Number(new URL(req.url).searchParams.get('epoch') ?? '')
  try {
    const [view, epochs] = await Promise.all([fieldView(Number.isInteger(ep) && ep > 0 ? ep : undefined), fieldEpochs()])
    if (!view) return NextResponse.json({ ok: false, reason: 'The field has not been read yet.', epochs: epochs.map(e => e.epoch) }, { status: 404, headers })
    return NextResponse.json({ ok: true, ...view, epochs: epochs.map(e => e.epoch) }, { headers })
  } catch (e) {
    return NextResponse.json({ ok: false, reason: e instanceof Error ? e.message : 'unavailable' }, { status: 503, headers })
  }
}
