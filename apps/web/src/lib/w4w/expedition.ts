import 'server-only'
import { K, pairs, pipe } from './store'
import * as W from './world'

/**
 * Characters and expeditions on the server. The rules live in world.ts (shared with the game); this file only
 * loads the world, lets the rules run, and writes back what changed. The server walks every character and
 * counts the cold even while their tab is closed.
 */
export const KX = { chars: 'w4w:c:chars', hearths: 'w4w:c:hearths', bags: 'w4w:c:bags', nodes: 'w4w:c:nodes', rime: 'w4w:c:rime', library: 'w4w:c:library', shards: 'w4w:c:shards', anna: 'w4w:c:anna', delivered: 'w4w:c:delivered', pylons: 'w4w:c:pylons' }

const safe = (v: string | null | undefined) => { if (!v) return null; try { return JSON.parse(v) } catch { return null } }
const parseAll = <T>(m: unknown) => Object.fromEntries(Object.entries(pairs(m)).map(([k, v]) => [k, safe(v) as T]).filter(([, v]) => v)) as Record<string, T>

async function load(now = Date.now()): Promise<W.WState> {
  const [h, c, he, b, n, o, alive, rm, lb, sh, an, dv, py] = await pipe([
    ['HGETALL', K.houses], ['HGETALL', KX.chars], ['HGETALL', KX.hearths], ['HGETALL', KX.bags], ['HGETALL', KX.nodes], ['HGETALL', K.orders],
    ['ZRANGEBYSCORE', K.presence, now - 30_000, '+inf'],
    ['GET', KX.rime],
    ['HGETALL', KX.library],
    ['HGETALL', KX.shards], ['GET', KX.anna], ['GET', KX.delivered], ['HGETALL', KX.pylons],
  ])
  const week = String(W.weekOf(now)) + ':'
  const shards = Object.fromEntries(Object.entries(parseAll<{ by: string; nick: string; t: number }>(sh)).filter(([k]) => k.startsWith(week)))
  const orders = parseAll<{ state?: string }>(o)
  const nodes = Object.fromEntries(Object.entries(pairs(n)).map(([k, v]) => [k, Number(v)]).filter(([, v]) => (v as number) > now)) as Record<string, number>
  return { now, houses: parseAll<W.HouseLite>(h), chars: parseAll<W.Char>(c), hearths: parseAll<W.Hearth>(he), bags: parseAll<W.Bag>(b), nodes, online: ((alive as string[]) ?? []).length, doneOrders: Object.values(orders).filter(x => x.state === 'done').length, rime: (safe(rm as string | null) as W.Rime | null) ?? undefined, library: parseAll<{ by: string; nick: string; at: number }>(lb),
    shards, anna: (safe(an as string | null) as W.WState['anna']) ?? undefined, delivered: (safe(dv as string | null) as W.WState['delivered']) ?? undefined, pylons: parseAll<W.Pylon>(py) }
}

async function save(ws: W.WState, d: W.Dirty) {
  const cmds: (string | number)[][] = []
  for (const u of d.chars) if (ws.chars[u]) cmds.push(['HSET', KX.chars, u, JSON.stringify(ws.chars[u])])
  for (const k of d.hearths) if (ws.hearths[k]) cmds.push(['HSET', KX.hearths, k, JSON.stringify(ws.hearths[k])])
  for (const id of d.bags) if (ws.bags[id]) cmds.push(['HSET', KX.bags, id, JSON.stringify(ws.bags[id])])
  for (const id of d.bagsGone) cmds.push(['HDEL', KX.bags, id])
  for (const k of d.nodes) cmds.push(['HSET', KX.nodes, k, ws.nodes[k] ?? 0])
  if (d.rime && ws.rime) cmds.push(['SET', KX.rime, JSON.stringify(ws.rime)])
  for (const id of d.library ?? []) if (ws.library?.[id]) cmds.push(['HSET', KX.library, id, JSON.stringify(ws.library[id])])
  for (const id of d.shards ?? []) if (ws.shards?.[id]) cmds.push(['HSET', KX.shards, id, JSON.stringify(ws.shards[id])])
  if (d.anna && ws.anna) cmds.push(['SET', KX.anna, JSON.stringify(ws.anna)])
  if (d.delivered && ws.delivered) cmds.push(['SET', KX.delivered, JSON.stringify(ws.delivered)])
  for (const i of d.pylons ?? []) if (ws.pylons?.[i]) cmds.push(['HSET', KX.pylons, i, JSON.stringify(ws.pylons[i])])
  for (const f of d.feed) cmds.push(['LPUSH', K.events, JSON.stringify({ ...f, tab: 'server' })])
  if (d.feed.length) cmds.push(['LTRIM', K.events, 0, 99])
  if (cmds.length) await pipe(cmds)
}

/** For the plain GET: walk everyone up to now, then hand the screen what it draws. */
export async function worldFor(uid: string) {
  const ws = await load(); const d = W.newDirty()
  W.stepAll(ws, d)
  await save(ws, d)
  return W.viewOf(ws, uid)
}

/** Admin test tool: thaw a character now, back home with full bars. Never reachable by players. */
export async function revive(uid: string) {
  const ws = await load(); const d = W.newDirty()
  const c = ws.chars[uid]; if (!c) return { ok: false as const, error: 'No character yet.' }
  Object.assign(c, { frozenUntil: 0, warmth: 100, health: 100, energy: 100, q: c.home[0], r: c.home[1], path: [], act: null, lost: false, t0: ws.now, simT: ws.now })
  d.chars.add(uid); await save(ws, d)
  return { ok: true as const, data: W.viewOf(ws, uid) }
}

/** One action from the player; the rules decide, the server writes it down. */
export async function act(uid: string, op: string, b: Record<string, unknown>) {
  const ws = await load(); const d = W.newDirty()
  const r = W.action(ws, uid, op, b, d)
  await save(ws, d)
  return r.ok ? { ok: true as const, data: W.viewOf(ws, uid, r.events) } : { ok: false as const, error: r.error, status: r.status }
}
