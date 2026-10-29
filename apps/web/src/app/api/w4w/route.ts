import { NextResponse } from 'next/server'
import { getSession } from '@/lib/forum/auth'
import { accessOf, adminView, dropInvite, makeInvite, redeem, revoke } from '@/lib/w4w/access'
import { K, pairs, pipe, run } from '@/lib/w4w/store'
import { act, revive, worldFor } from '@/lib/w4w/expedition'

export const dynamic = 'force-dynamic'

const PRESENCE_MS = 30_000
const MAX_DOC = 8_000
const TOPICS = new Set(['wood', 'welcome', 'settled'])

const no = (error: string, status = 400) => NextResponse.json({ error }, { status })
const parse = (m: Record<string, string>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, safe(v)]))
function safe(v: string | null | undefined): unknown {
  if (!v) return null
  try { return JSON.parse(v) } catch { return null }
}
const plain = (d: unknown): d is Record<string, unknown> => !!d && typeof d === 'object' && !Array.isArray(d)
const tooBig = (d: unknown) => JSON.stringify(d).length > MAX_DOC
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

/** Everything a player's screen needs, in one round trip. ?log=<uid> returns one house's chronicle instead. */
export async function GET(req: Request) {
  const user = await getSession()
  const acc = await accessOf(user)
  if (!user || !acc.player) return no('closed', 403)
  const url = new URL(req.url)
  const log = url.searchParams.get('log')
  if (log) {
    const list = (await run<string[]>('LRANGE', K.log(log), 0, 1999)) ?? []
    return NextResponse.json({ log: list.map(s => safe(s)).filter(Boolean) })
  }
  const now = Date.now()
  const [houses, orders, notices, column, , alive, pres, events] = await pipe([
    ['HGETALL', K.houses],
    ['HGETALL', K.orders],
    ['HGETALL', K.notices],
    ['GET', K.column],
    ['ZREMRANGEBYSCORE', K.presence, 0, now - PRESENCE_MS],
    ['ZRANGEBYSCORE', K.presence, now - PRESENCE_MS, '+inf'],
    ['HGETALL', K.presenceData],
    ['LRANGE', K.events, 0, 99],
  ])
  const presData = parse(pairs(pres))
  const x = await worldFor(user.handle).catch(e => ({ error: (e as Error).message }))
  const peers = ((alive as string[]) ?? []).map(h => ({ by: h, presence: presData[h] ?? null }))
  return NextResponse.json({
    me: { uid: user.handle, name: user.name, admin: acc.admin },
    houses: parse(pairs(houses)),
    orders: parse(pairs(orders)),
    notices: parse(pairs(notices)),
    column: safe(column as string | null),
    peers,
    events: ((events as string[]) ?? []).map(s => safe(s)).filter(Boolean),
    x,
    now,
  })
}

export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return no('Log in first.', 401)
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b) return no('bad request')
  const op = String(b.op ?? '')

  if (op === 'redeem') {
    const r = await redeem(user, String(b.code ?? ''))
    return r.ok ? NextResponse.json(r) : no(r.error, 403)
  }

  const acc = await accessOf(user)
  if (!acc.player) return no('closed', 403)
  const me = user.handle

  try {
    switch (op) {
      case 'set': {
        const path = String(b.path ?? '').split('/')
        const data = b.data
        if (!plain(data) || tooBig(data)) return no('That is too much to store.')
        const merge = b.merge === true
        if (path[0] === 'houses' && path.length === 2) {
          if (path[1] !== me && !acc.admin) return no('Only your own house.', 403)
          const prev = merge ? (safe(await run<string | null>('HGET', K.houses, path[1]!)) as Record<string, unknown> | null) : null
          await run('HSET', K.houses, path[1]!, JSON.stringify({ ...(prev ?? {}), ...data }))
          if (!prev) await run('HSET', K.who, me, JSON.stringify({ name: user.name, auth: user.auth, at: Date.now() }))
          return NextResponse.json({ ok: true })
        }
        if (path[0] === 'houses' && path[2] === 'log' && path.length === 4) {
          if (path[1] !== me) return no('Only your own chronicle.', 403)
          const len = await run<number>('RPUSH', K.log(me), JSON.stringify(data))
          if (len > 2000) await run('LTRIM', K.log(me), -2000, -1)
          return NextResponse.json({ ok: true })
        }
        if (path[0] === 'orders' && path.length === 2) {
          const prev = safe(await run<string | null>('HGET', K.orders, path[1]!)) as Record<string, unknown> | null
          if (!prev && merge) return no('That order is gone.', 404)
          await run('HSET', K.orders, path[1]!, JSON.stringify({ ...(prev ?? {}), ...data }))
          return NextResponse.json({ ok: true })
        }
        if (path[0] === 'herald' && path[1] === 'column') {
          if (!acc.admin) return no('Only the editor prints the column.', 403)
          await run('SET', K.column, JSON.stringify(data))
          return NextResponse.json({ ok: true })
        }
        return no('unknown path')
      }
      case 'add': {
        const col = String(b.collection ?? '')
        const data = b.data
        if (!plain(data) || tooBig(data)) return no('That is too much to store.')
        const id = newId()
        if (col === 'orders') await run('HSET', K.orders, id, JSON.stringify({ ...data, by: me }))
        else if (col === 'notices') {
          await run('HSET', K.notices, id, JSON.stringify({ ...data, by: me }))
          const n = await run<number>('HLEN', K.notices)
          if (n > 200) {
            const all = Object.entries(parse(pairs(await run('HGETALL', K.notices)))).sort((a, c) => Number((a[1] as { at?: number })?.at ?? 0) - Number((c[1] as { at?: number })?.at ?? 0))
            await pipe(all.slice(0, n - 200).map(([k]) => ['HDEL', K.notices, k]))
          }
        } else return no('unknown collection')
        return NextResponse.json({ ok: true, id })
      }
      case 'delete': {
        const [col, id] = String(b.path ?? '').split('/')
        if (col !== 'notices' || !id) return no('unknown path')
        const prev = safe(await run<string | null>('HGET', K.notices, id)) as { by?: string } | null
        if (prev && prev.by !== me && !acc.admin) return no('Only the person who pinned it can take it down.', 403)
        await run('HDEL', K.notices, id)
        return NextResponse.json({ ok: true })
      }
      case 'presence': {
        const data = plain(b.data) && !tooBig(b.data) ? b.data : {}
        await pipe([['ZADD', K.presence, Date.now(), me], ['HSET', K.presenceData, me, JSON.stringify(data)]])
        return NextResponse.json({ ok: true })
      }
      case 'leave': {
        await pipe([['ZREM', K.presence, me]])
        return NextResponse.json({ ok: true })
      }
      case 'emit': {
        const topic = String(b.topic ?? '')
        if (!TOPICS.has(topic)) return no('unknown topic')
        const data = plain(b.data) && !tooBig(b.data) ? b.data : {}
        await pipe([['LPUSH', K.events, JSON.stringify({ id: newId(), t: Date.now(), topic, by: me, tab: String(b.tab ?? '').slice(0, 20), data })], ['LTRIM', K.events, 0, 99]])
        return NextResponse.json({ ok: true })
      }
      case 'x': {
        // test tool for the admin only: players can never skip the 24 hours
        if (b.act === 'revive') { if (!acc.admin) return no('Only the admin can do that.', 403); const r = await revive(me); return r.ok ? NextResponse.json(r.data) : no(r.error, 400) }
        const r = await act(me, String(b.act ?? ''), b)
        return r.ok ? NextResponse.json(r.data) : no(r.error, r.status ?? 400)
      }
      case 'admin': {
        if (!acc.admin) return no('Admins only.', 403)
        return NextResponse.json(await adminView())
      }
      case 'invite': {
        if (!acc.admin) return no('Admins only.', 403)
        return NextResponse.json({ invite: await makeInvite(user, b.note ? String(b.note) : undefined) })
      }
      case 'revoke': {
        if (!acc.admin) return no('Admins only.', 403)
        await revoke(String(b.handle ?? ''))
        return NextResponse.json({ ok: true })
      }
      case 'dropInvite': {
        if (!acc.admin) return no('Admins only.', 403)
        await dropInvite(String(b.code ?? ''))
        return NextResponse.json({ ok: true })
      }
      default:
        return no('unknown op')
    }
  } catch (e) {
    return no((e as Error).message, 500)
  }
}
