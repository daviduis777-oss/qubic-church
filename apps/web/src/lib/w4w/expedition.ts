import 'server-only'
import { K, pairs, pipe } from './store'
import * as W from './world'

/**
 * Characters and expeditions on the server. The rules live in world.ts (shared with the game); this file only
 * loads the world, lets the rules run, and writes back what changed. The server walks every character and
 * counts the cold even while their tab is closed.
 */
export const KX = { chars: 'w4w:c:chars', hearths: 'w4w:c:hearths', bags: 'w4w:c:bags', nodes: 'w4w:c:nodes', rime: 'w4w:c:rime', library: 'w4w:c:library', shards: 'w4w:c:shards', anna: 'w4w:c:anna', delivered: 'w4w:c:delivered', pylons: 'w4w:c:pylons', story: 'w4w:c:story', letters: 'w4w:c:letters', lread: 'w4w:c:lread' }

const safe = (v: string | null | undefined) => { if (!v) return null; try { return JSON.parse(v) } catch { return null } }
const parseAll = <T>(m: unknown) => Object.fromEntries(Object.entries(pairs(m)).map(([k, v]) => [k, safe(v) as T]).filter(([, v]) => v)) as Record<string, T>

async function load(now = Date.now()): Promise<W.WState> {
  const [h, c, he, b, n, o, alive, rm, lb, sh, an, dv, py, st] = await pipe([
    ['HGETALL', K.houses], ['HGETALL', KX.chars], ['HGETALL', KX.hearths], ['HGETALL', KX.bags], ['HGETALL', KX.nodes], ['HGETALL', K.orders],
    ['ZRANGEBYSCORE', K.presence, now - 30_000, '+inf'],
    ['GET', KX.rime],
    ['HGETALL', KX.library],
    ['HGETALL', KX.shards], ['GET', KX.anna], ['GET', KX.delivered], ['HGETALL', KX.pylons], ['GET', KX.story],
  ])
  const week = String(W.weekOf(now)) + ':'
  const shards = Object.fromEntries(Object.entries(parseAll<{ by: string; nick: string; t: number }>(sh)).filter(([k]) => k.startsWith(week)))
  const orders = parseAll<{ state?: string }>(o)
  const nodes = Object.fromEntries(Object.entries(pairs(n)).map(([k, v]) => [k, Number(v)]).filter(([, v]) => (v as number) > now)) as Record<string, number>
  return { now, houses: parseAll<W.HouseLite>(h), chars: parseAll<W.Char>(c), hearths: parseAll<W.Hearth>(he), bags: parseAll<W.Bag>(b), nodes, online: ((alive as string[]) ?? []).length, doneOrders: Object.values(orders).filter(x => x.state === 'done').length, rime: (safe(rm as string | null) as W.Rime | null) ?? undefined, library: parseAll<{ by: string; nick: string; at: number }>(lb),
    shards, anna: (safe(an as string | null) as W.WState['anna']) ?? undefined, delivered: (safe(dv as string | null) as W.WState['delivered']) ?? undefined, pylons: parseAll<W.Pylon>(py), story: (safe(st as string | null) as W.Story | null) ?? undefined }
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
  if (d.story && ws.story) cmds.push(['SET', KX.story, JSON.stringify(ws.story)])
  for (const f of d.feed) cmds.push(['LPUSH', K.events, JSON.stringify({ ...f, tab: 'server' })])
  if (d.feed.length) cmds.push(['LTRIM', K.events, 0, 99])
  if (cmds.length) await pipe(cmds)
}

/** For the plain GET: walk everyone up to now, then hand the screen what it draws. */
export async function worldFor(uid: string) {
  const ws = await load(); const d = W.newDirty()
  W.stepAll(ws, d)
  await save(ws, d)
  return withLetters(W.viewOf(ws, uid), uid)
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
  if (op === 'readletter') return readLetter(ws, d, uid, String(b.id ?? ''))
  const r = W.action(ws, uid, op, b, d)
  await save(ws, d)
  return r.ok ? { ok: true as const, data: await withLetters(W.viewOf(ws, uid, r.events), uid) } : { ok: false as const, error: r.error, status: r.status }
}

/* ================= letters from beyond the Gate =================
 * The admin slips a letter under the North Gate. It lies there for a set time (an hour by default). Whoever walks to
 * the Gate in that time can read it and keep it. When the time is up the snow takes it, and those who missed it see
 * only that a letter came. Texts live in Redis, never in the public repo or the game file, so nobody reads ahead. */
export type Letter = { id: string; at: number; until: number; from: string; title: string; text: string }
async function lettersAll(): Promise<Letter[]> {
  const [m] = await pipe([['HGETALL', KX.letters]])
  return Object.values(parseAll<Letter>(m)).sort((a, b) => a.at - b.at)
}
async function readMap(uid: string): Promise<Record<string, number>> {
  const [r] = await pipe([['HGET', KX.lread, uid]]); return (safe(r as string | null) as Record<string, number> | null) ?? {}
}
async function withLetters<T extends object>(v: T, uid: string, now = Date.now()) {
  const [all, read] = await Promise.all([lettersAll(), readMap(uid)])
  const letters = all.filter(l => l.at <= now).slice(-40).map(l => read[l.id] ? { id: l.id, at: l.at, until: l.until, from: l.from, title: l.title, text: l.text, read: read[l.id] }
    : now < l.until ? { id: l.id, at: l.at, until: l.until, from: l.from, title: l.title, open: true } : { id: l.id, at: l.at, until: l.until, title: l.title, missed: true })
  return { ...v, letters }
}
async function readLetter(ws: W.WState, d: W.Dirty, uid: string, id: string): Promise<{ ok: true; data: object } | { ok: false; error: string; status?: number }> {
  W.stepAll(ws, d); await save(ws, d)
  const c = ws.chars[uid]; if (!c) return { ok: false as const, error: 'No character yet.' }
  const now = ws.now, l = (await lettersAll()).find(x => x.id === id)
  if (!l || l.at > now) return { ok: false as const, error: 'There is no letter under the Gate.' }
  if (now >= l.until) return { ok: false as const, error: 'The snow has taken it. The ink ran before anyone came.' }
  if (c.path.length || W.dist([c.q, c.r], W.GATE_CELL) > 1) return { ok: false as const, error: 'Walk to the North Gate. The letter is lying in the snow under it.' }
  const read = await readMap(uid)
  if (!read[id]) {
    read[id] = now; const n = Number((await pipe([['HINCRBY', KX.letters + ':n', id, 1]]))[0]) || 1
    await pipe([['HSET', KX.lread, uid, JSON.stringify(read)], ['LPUSH', K.events, JSON.stringify({ id: `lt${uid}${id}`, t: now, topic: 'letter', by: uid, tab: 'server', data: { nick: W.nickIn(ws, uid), title: l.title, n } })], ['LTRIM', K.events, 0, 99]])
  }
  return { ok: true as const, data: await withLetters(W.viewOf(ws, uid), uid) }
}

/* ================= the story desk: admin only ================= */
export async function storyDesk(b: Record<string, unknown>) {
  const now = Date.now(), cmd = String(b.do ?? 'list')
  const [st] = await pipe([['GET', KX.story]]); const story: W.Story = (safe(st as string | null) as W.Story | null) ?? { phase: 0, hush: 0, ht: now }
  if (cmd === 'post') {
    const title = String(b.title ?? '').trim().slice(0, 120), text = String(b.text ?? '').trim().slice(0, 4000)
    if (!title || !text) return { ok: false as const, error: 'A letter needs a title and a text.' }
    const at = b.at ? Number(new Date(String(b.at))) : now, hours = Math.max(0.1, Math.min(48, Number(b.hours ?? 1) || 1))
    if (!Number.isFinite(at)) return { ok: false as const, error: 'That time does not parse.' }
    const l: Letter = { id: 'l' + at.toString(36), at, until: at + hours * 3600_000, from: String(b.from ?? 'the twelve').slice(0, 60), title, text }
    await pipe([['HSET', KX.letters, l.id, JSON.stringify(l)]])
  } else if (cmd === 'del') await pipe([['HDEL', KX.letters, String(b.id ?? '')]])
  else if (cmd === 'phase') { story.phase = Math.max(0, Math.min(3, Number(b.phase) || 0)); await pipe([['SET', KX.story, JSON.stringify(story)]]) }
  else if (cmd === 'hush') { story.hush = Math.max(0, Math.min(W.HUSH_MAX, Number(b.hush) || 0)); story.ht = now; await pipe([['SET', KX.story, JSON.stringify(story)]]) }
  else if (cmd === 'unveil') { story.unveil = { at: now, until: now + (Number(b.hours) || 3) * 3600_000 }; await pipe([['SET', KX.story, JSON.stringify(story)], ['LPUSH', K.events, JSON.stringify({ id: `uv${now}`, t: now, topic: 'unveil', by: '', tab: 'server', data: { until: story.unveil.until } })]]) }
  else if (cmd === 'calm') { story.unveil = null; await pipe([['SET', KX.story, JSON.stringify(story)]]) }
  const [cnt] = await pipe([['HGETALL', KX.letters + ':n']]); const n = pairs(cnt)
  return { ok: true as const, data: { story: { ...story, hush: Math.round(W.hushNow(story, now)) }, letters: (await lettersAll()).map(l => ({ ...l, reads: Number(n[l.id] ?? 0) })) } }
}
