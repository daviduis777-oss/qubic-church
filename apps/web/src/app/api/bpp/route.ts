import { NextResponse } from 'next/server'
import { getSession } from '@/lib/forum/auth'
import { getParticipant, participantCount, saveParticipant, storeReady, type Participant, type Trade } from '@/lib/bpp/store'
import { statsOf } from '@/lib/bpp/stats'

export const dynamic = 'force-dynamic'

const MAX_TRADES = 5000

export async function GET() {
  const user = await getSession()
  const count = await participantCount()
  if (!user) return NextResponse.json({ user: null, participant: null, count, ready: storeReady() })
  try {
    const p = await getParticipant(user.handle)
    return NextResponse.json({ user, participant: p, stats: p ? statsOf(p.trades, p.start, p.joined) : null, count, ready: storeReady() })
  } catch (e) {
    return NextResponse.json({ user, participant: null, count, ready: false, error: (e as Error).message })
  }
}

const num = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' ? Number(v.replace(',', '.').replace(/[^\d.\-e]/gi, '')) : NaN)
const id = () => Math.random().toString(36).slice(2, 10)

function cleanTrade(t: Record<string, unknown>): Trade | string {
  const at = new Date(String(t.at ?? ''))
  if (Number.isNaN(at.getTime())) return 'Time is not a date.'
  const side = String(t.side ?? '').toLowerCase()
  const s = side.startsWith('l') || side === 'buy' || side === 'up' ? 'long' : side.startsWith('s') || side === 'sell' || side === 'down' ? 'short' : null
  if (!s) return 'Direction must be long or short.'
  const entry = num(t.entry)
  const exit = num(t.exit)
  const size = num(t.size)
  const fee = t.fee === undefined || t.fee === '' ? 0 : num(t.fee)
  if (!(entry > 0) || !(exit > 0)) return 'Entry and exit prices must be above zero.'
  if (!(size > 0)) return 'Size must be above zero.'
  if (!(fee >= 0)) return 'Fee must be zero or more.'
  return { id: id(), at: at.toISOString(), side: s, entry, exit, size, fee, note: t.note ? String(t.note).slice(0, 140) : undefined }
}

/** CSV: time,direction,entry,exit,size,fee[,note] with a header row. Separators , or ; */
function parseCsv(text: string): { trades: Trade[]; errors: string[] } {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim())
  if (!lines.length) return { trades: [], errors: ['The file is empty.'] }
  const sep = lines[0]!.includes(';') ? ';' : ','
  const head = lines[0]!.toLowerCase().split(sep).map(s => s.trim())
  const col = (names: string[]) => head.findIndex(h => names.some(n => h === n || h.includes(n)))
  const ix = { at: col(['time', 'date', 'opened']), side: col(['direction', 'side', 'type']), entry: col(['entry', 'open price', 'avg entry']), exit: col(['exit', 'close price', 'avg exit']), size: col(['size', 'amount', 'value', 'usd']), fee: col(['fee', 'commission']), note: col(['note', 'comment']) }
  if (ix.at < 0 || ix.side < 0 || ix.entry < 0 || ix.exit < 0 || ix.size < 0) return { trades: [], errors: ['Header must have: time, direction, entry, exit, size (fee and note optional).'] }
  const trades: Trade[] = []
  const errors: string[] = []
  lines.slice(1).forEach((l, i) => {
    const c = l.split(sep).map(s => s.trim().replace(/^"|"$/g, ''))
    const t = cleanTrade({ at: c[ix.at], side: c[ix.side], entry: c[ix.entry], exit: c[ix.exit], size: c[ix.size], fee: ix.fee >= 0 ? c[ix.fee] : undefined, note: ix.note >= 0 ? c[ix.note] : undefined })
    if (typeof t === 'string') errors.push(`Row ${i + 2}: ${t}`)
    else trades.push(t)
  })
  return { trades, errors }
}

export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Log in first.' }, { status: 401 })
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b) return NextResponse.json({ error: 'bad request' }, { status: 400 })
  try {
    let p = await getParticipant(user.handle)
    const action = String(b.action ?? '')
    if (action === 'join' || action === 'capital') {
      const start = num(b.start)
      if (!(start > 0) || start > 1e9) return NextResponse.json({ error: 'Starting capital: a number above zero.' }, { status: 400 })
      p = p ? { ...p, start } : ({ handle: user.handle, name: user.name, auth: user.auth, id: user.id, start, joined: new Date().toISOString(), trades: [] } satisfies Participant)
    } else {
      if (!p) return NextResponse.json({ error: 'Join the experiment first.' }, { status: 400 })
      if (action === 'add') {
        const t = cleanTrade(b.trade as Record<string, unknown>)
        if (typeof t === 'string') return NextResponse.json({ error: t }, { status: 400 })
        p.trades.push(t)
      } else if (action === 'delete') {
        p.trades = p.trades.filter(t => t.id !== b.id)
      } else if (action === 'import') {
        const { trades, errors } = parseCsv(String(b.csv ?? ''))
        if (!trades.length) return NextResponse.json({ error: errors[0] ?? 'Nothing to import.', errors }, { status: 400 })
        const seen = new Set(p.trades.map(t => `${t.at}|${t.entry}|${t.exit}|${t.size}`))
        const fresh = trades.filter(t => !seen.has(`${t.at}|${t.entry}|${t.exit}|${t.size}`))
        p.trades.push(...fresh)
        if (p.trades.length > MAX_TRADES) return NextResponse.json({ error: `${MAX_TRADES} trades is the limit.` }, { status: 400 })
        await saveParticipant(p)
        return NextResponse.json({ ok: true, imported: fresh.length, skipped: trades.length - fresh.length, errors, participant: p, stats: statsOf(p.trades, p.start, p.joined) })
      } else return NextResponse.json({ error: 'unknown action' }, { status: 400 })
      if (p.trades.length > MAX_TRADES) return NextResponse.json({ error: `${MAX_TRADES} trades is the limit.` }, { status: 400 })
    }
    p.name = user.name
    await saveParticipant(p)
    return NextResponse.json({ ok: true, participant: p, stats: statsOf(p.trades, p.start, p.joined), count: await participantCount() })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
