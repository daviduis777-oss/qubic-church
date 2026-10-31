import 'server-only'
import { K, pairs, pipe } from './store'
import * as W from './world'

/**
 * Characters and expeditions on the server. The rules live in world.ts (shared with the game); this file only
 * loads the world, lets the rules run, and writes back what changed. The server walks every character and
 * counts the cold even while their tab is closed.
 */
export const KX = { chars: 'w4w:c:chars', hearths: 'w4w:c:hearths', bags: 'w4w:c:bags', nodes: 'w4w:c:nodes', rime: 'w4w:c:rime', library: 'w4w:c:library', shards: 'w4w:c:shards', anna: 'w4w:c:anna', delivered: 'w4w:c:delivered', pylons: 'w4w:c:pylons', story: 'w4w:c:story', letters: 'w4w:c:letters', lread: 'w4w:c:lread', say: 'w4w:c:say', sayT: 'w4w:c:sayT', replies: 'w4w:c:replies', replyT: 'w4w:c:replyT', mail: 'w4w:c:mail', mailRep: 'w4w:c:mailRep' }

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
  if (op === 'say') return sayAloud(ws, d, uid, b.text)
  if (op.startsWith('mail')) return mailAct(ws, d, uid, op, b)
  if (op === 'reply') return replyUnderGate(ws, d, uid, b.text)
  const r = W.action(ws, uid, op, b, d)
  await save(ws, d)
  return r.ok ? { ok: true as const, data: await withLetters(W.viewOf(ws, uid, r.events), uid) } : { ok: false as const, error: r.error, status: r.status }
}

/* ================= letters from beyond the Gate =================
 * The admin slips a letter under the North Gate. It lies there for a set time (an hour by default). Whoever walks to
 * the Gate in that time can read it and keep it. When the time is up the snow takes it, and those who missed it see
 * only that a letter came. Texts live in Redis, never in the public repo or the game file, so nobody reads ahead. */
export type Letter = { id: string; at: number; until: number; from: string; title: string; text: string; to?: string }
async function lettersAll(): Promise<Letter[]> {
  const [m] = await pipe([['HGETALL', KX.letters]])
  return Object.values(parseAll<Letter>(m)).sort((a, b) => a.at - b.at)
}
async function readMap(uid: string): Promise<Record<string, number>> {
  const [r] = await pipe([['HGET', KX.lread, uid]]); return (safe(r as string | null) as Record<string, number> | null) ?? {}
}
async function withLetters<T extends object>(v: T, uid: string, now = Date.now()) {
  const [all, read, cnt, said] = await Promise.all([lettersAll(), readMap(uid), pipe([['HGETALL', KX.letters + ':n']]).then(([m]) => pairs(m)), pipe([['LRANGE', KX.say, 0, 199]]).then(([l]) => (l as string[]) ?? [])])
  const letters = all.filter(l => l.at <= now && (!l.to || l.to === uid)).slice(-40).map(l => { const reads = Number(cnt[l.id] ?? 0), mine = l.to === uid || undefined
    return read[l.id] ? { id: l.id, at: l.at, until: l.until, from: l.from, title: l.title, text: l.text, read: read[l.id], reads, mine }
      : now < l.until ? { id: l.id, at: l.at, until: l.until, from: l.from, title: l.title, open: true, reads, mine } : { id: l.id, at: l.at, until: l.until, from: l.from, title: l.title, missed: true, reads, mine } })
  // what you heard: only words said within earshot of where you stand, in the last quarter of an hour
  const me = (v as { me?: { q: number; r: number } | null }).me
  const heard = !me ? [] : said.map(x => safe(x) as Said | null).filter((x): x is Said => !!x && now - x.t < SAY_KEEP && (x.uid === uid || W.dist([x.q, x.r], [me.q, me.r]) <= EARSHOT)).slice(0, 30).reverse()
  return { ...v, letters, heard, mail: await mailView(uid) }
}

/* ================= the post: a letter is a thing in someone's hands =================
 * You write it at the post office. It waits in the sack, or you carry it yourself. Anyone may take it and carry it;
 * it reaches the reader only when someone stands at their door with it. A carrier can break the seal and read it,
 * and the seal stays broken. The reader sees every hand it passed through. Nothing delivers itself. */
type Mail = { id: string; at: number; from: string; fromNick: string; to: string; toNick: string; text: string; where: 'sack' | 'hands' | 'delivered' | 'burned'; holder: string | null; sealBy: string | null; trail: { uid: string; nick: string; t: number }[]; deliveredAt?: number; anon?: boolean; reported?: boolean; burnedBy?: string; replyTo?: string }
const MAIL_CARRY = 3
async function mailAll(): Promise<Mail[]> { const [m] = await pipe([['HGETALL', KX.mail]]); return Object.values(parseAll<Mail>(m)).sort((a, b) => a.at - b.at) }
const putMail = (m: Mail) => pipe([['HSET', KX.mail, m.id, JSON.stringify(m)]])
type Rep = { d: number; b: number }
async function repAll(): Promise<Record<string, Rep>> { const [m] = await pipe([['HGETALL', KX.mailRep]]); return parseAll<Rep>(m) }
async function bumpRep(uid: string, k: keyof Rep) { const r = (await repAll())[uid] ?? { d: 0, b: 0 }; r[k]++; await pipe([['HSET', KX.mailRep, uid, JSON.stringify(r)]]) }
const fromShown = (m: Mail) => (m.anon ? 'no name' : m.fromNick)
async function mailView(uid: string) {
  const all = await mailAll(), hand = (m: Mail) => m.trail.map(x => x.nick), rep = await repAll()
  const carriers: Record<string, number> = {}; for (const m of all) if (m.where === 'hands' && m.holder) carriers[m.holder] = (carriers[m.holder] ?? 0) + 1
  return { carriers, rep,
    carrying: all.filter(m => m.where === 'hands' && m.holder === uid).map(m => ({ id: m.id, at: m.at, toNick: m.toNick, to: m.to, gate: m.to === 'story', fromNick: fromShown(m), sealed: !m.sealBy, text: m.sealBy === uid || m.from === uid ? m.text : undefined, mine: m.from === uid })),
    sack: all.filter(m => m.where === 'sack').map(m => ({ id: m.id, at: m.at, toNick: m.toNick, fromNick: fromShown(m), sealed: !m.sealBy, gate: m.to === 'story' })),
    inbox: all.filter(m => m.where === 'delivered' && m.to === uid).slice(-30).map(m => ({ id: m.id, at: m.at, deliveredAt: m.deliveredAt, fromNick: fromShown(m), fromValk: m.from === 'story', text: m.text, sealBy: m.sealBy ? (m.trail.find(x => x.uid === m.sealBy)?.nick ?? 'someone') : null, hands: hand(m).slice(m.from === uid || m.anon ? 0 : 0), reported: !!m.reported, answered: all.some(x => x.replyTo === m.id) })),
    // a letter that never arrived: you only learn whose hands it was last in
    sent: all.filter(m => m.from === uid).slice(-20).map(m => ({ id: m.id, at: m.at, toNick: m.toNick, where: m.where === 'burned' ? 'lost' : m.where, holderNick: m.where === 'burned' ? (m.trail.at(-1)?.nick ?? null) : m.holder ? (m.trail.at(-1)?.nick ?? null) : null })),
  }
}
type R = { ok: true; data: object } | { ok: false; error: string; status?: number }
async function mailAct(ws: W.WState, d: W.Dirty, uid: string, op: string, b: Record<string, unknown>): Promise<R> {
  W.stepAll(ws, d); const c = ws.chars[uid]; if (!c) return { ok: false, error: 'No character yet.' }
  const here: W.Cell = [c.q, c.r], still = !c.path.length, nick = W.nickIn(ws, uid), atPost = still && W.dist(here, W.POST_CELL) <= 1
  const all = await mailAll(), m = all.find(x => x.id === String(b.id ?? '')), mine = all.filter(x => x.where === 'hands' && x.holder === uid)
  const done = async () => { await save(ws, d); return { ok: true as const, data: await withLetters(W.viewOf(ws, uid), uid) } }
  if (op === 'mailwrite') {
    if (!atPost) return { ok: false, error: 'Letters are written at the post office.' }
    const text = clean(b.text, 1200); if (text.length < 2) return { ok: false, error: 'Write something first.' }
    const want = String(b.to ?? '').trim().toLowerCase(); const to = Object.entries(ws.houses).find(([k, h]) => k.toLowerCase() === want || (h.nick ?? '').toLowerCase() === want)
    if (!to) return { ok: false, error: 'Nobody in Aigarth goes by that name.' }
    if (to[0] === uid) return { ok: false, error: 'You would have to carry it to your own door. Write to someone else.' }
    const keep = b.keep === true; if (keep && mine.length >= MAIL_CARRY) return { ok: false, error: 'Your hands are full. Leave one in the sack first.' }
    const anon = b.anon === true
    const x: Mail = { id: `m${ws.now.toString(36)}${uid.slice(-3)}`, at: ws.now, from: uid, fromNick: nick, to: to[0], toNick: to[1].nick ?? 'someone', text, where: keep ? 'hands' : 'sack', holder: keep ? uid : null, sealBy: null, trail: anon && !keep ? [] : [{ uid, nick, t: ws.now }], ...(anon ? { anon } : {}) }
    await putMail(x); return done()
  }
  if (!m) return { ok: false, error: 'That letter is not here.' }
  if (op === 'mailreply') {
    // an answer goes into your own coat: someone still has to carry it. An answer to T. V. goes under the North Gate
    if (m.where !== 'delivered' || m.to !== uid) return { ok: false, error: 'You can answer only a letter left at your door.' }
    if (m.anon) return { ok: false, error: 'It has no name on it. There is nobody to answer.' }
    if (all.some(x => x.replyTo === m.id)) return { ok: false, error: 'You already answered this one.' }
    if (mine.length >= MAIL_CARRY) return { ok: false, error: 'Your hands are full. Deliver or leave a letter first.' }
    const text = clean(b.text, 1200); if (text.length < 2) return { ok: false, error: 'Write something first.' }
    const x: Mail = { id: `m${ws.now.toString(36)}${uid.slice(-3)}r`, at: ws.now, from: uid, fromNick: nick, to: m.from, toNick: m.fromNick, text, where: 'hands', holder: uid, sealBy: null, trail: [{ uid, nick, t: ws.now }], replyTo: m.id }
    await putMail(x); return done()
  }
  if (op === 'mailreport') {
    if (m.to !== uid && m.sealBy !== uid) return { ok: false, error: 'Only someone who read it can report it.' }
    m.reported = true; await putMail(m); return done()
  }
  if (op === 'mailtake') {
    if (!atPost) return { ok: false, error: 'The sack hangs in the post office.' }
    if (m.where !== 'sack') return { ok: false, error: 'Someone already took it.' }
    if (mine.length >= MAIL_CARRY) return { ok: false, error: `You can carry ${MAIL_CARRY} letters at most.` }
    Object.assign(m, { where: 'hands', holder: uid }); if (m.trail.at(-1)?.uid !== uid) m.trail.push({ uid, nick, t: ws.now }); await putMail(m); return done()
  }
  if (m.where !== 'hands' || m.holder !== uid) return { ok: false, error: 'You are not carrying that letter.' }
  if (op === 'mailleave') { if (!atPost) return { ok: false, error: 'Leave it in the sack at the post office.' }; Object.assign(m, { where: 'sack', holder: null }); await putMail(m); return done() }
  if (op === 'mailopen') { if (!m.sealBy && m.from !== uid) { m.sealBy = uid; await putMail(m); await bumpRep(uid, 'b') } return done() }
  if (op === 'mailburn') {
    const atFire = still && (W.dist(here, [W.SPECIAL.plaza[0], W.SPECIAL.plaza[1]]) <= 1 || W.dist(here, c.home) <= 1)
    if (!atFire) return { ok: false, error: 'You need a fire: the plaza, or your own stove at home.' }
    Object.assign(m, { where: 'burned', holder: null, burnedBy: uid }); await putMail(m); return done()
  }
  if (op === 'mailgive') {
    const who = String(b.who ?? ''), o = ws.chars[who]; if (!o || who === uid) return { ok: false, error: 'Hand it to whom?' }
    if (!still || o.path.length || W.dist(here, [o.q, o.r]) > 1) return { ok: false, error: 'Stand next to them to hand it over.' }
    if (all.filter(x => x.where === 'hands' && x.holder === who).length >= MAIL_CARRY) return { ok: false, error: 'Their hands are full.' }
    Object.assign(m, { holder: who }); m.trail.push({ uid: who, nick: W.nickIn(ws, who), t: ws.now }); await putMail(m); return done()
  }
  if (op === 'maildeliver') {
    if (m.to === 'story') {
      if (!still || W.dist(here, W.GATE_CELL) > 1) return { ok: false, error: 'Letters for whoever signs T. V. go under the North Gate.' }
      Object.assign(m, { where: 'delivered', holder: null, deliveredAt: ws.now })
      const r: Reply = { id: `r${ws.now.toString(36)}m`, t: ws.now, uid: m.from, nick: m.fromNick, text: m.text, to: `carried by ${m.trail.map(x => x.nick).join(', ')}` }
      await pipe([['LPUSH', KX.replies, JSON.stringify(r)], ['LTRIM', KX.replies, 0, 499]])
      if (uid !== m.from) { c.renown = (c.renown ?? 0) + 2; d.chars.add(uid); await bumpRep(uid, 'd') }
      await putMail(m); return done()
    }
    const h = ws.houses[m.to]; if (h?.q == null || h.r == null) return { ok: false, error: 'They have no house yet. Keep the letter until they do.' }
    if (!still || W.dist(here, [h.q, h.r]) > 1) return { ok: false, error: `Walk to ${m.toNick}'s door.` }
    Object.assign(m, { where: 'delivered', holder: null, deliveredAt: ws.now })
    if (uid !== m.from) { c.renown = (c.renown ?? 0) + 2; d.chars.add(uid); await bumpRep(uid, 'd') }
    d.feed.push({ id: `ml${m.id}`, t: ws.now, topic: 'mail', by: uid, data: { nick, to: m.toNick } })
    await putMail(m); return done()
  }
  return { ok: false, error: 'unknown action' }
}

/* ================= talking: only people standing near you hear what you say ================= */
type Said = { id: string; t: number; uid: string; nick: string; q: number; r: number; text: string }
export const EARSHOT = 3, SAY_KEEP = 15 * 60_000
const clean = (t: unknown, n: number) => String(t ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n)
async function sayAloud(ws: W.WState, d: W.Dirty, uid: string, raw: unknown): Promise<{ ok: true; data: object } | { ok: false; error: string; status?: number }> {
  W.stepAll(ws, d); await save(ws, d)
  const c = ws.chars[uid]; if (!c) return { ok: false, error: 'No character yet.' }
  const text = clean(raw, 240); if (!text) return { ok: false, error: 'Say something.' }
  const [last] = await pipe([['HGET', KX.sayT, uid]]); if (ws.now - Number(last ?? 0) < 2500) return { ok: false, error: 'Slow down. Let them answer.' }
  const at: W.Cell = [c.q, c.r]
  const x: Said = { id: `s${ws.now.toString(36)}${uid.slice(-4)}`, t: ws.now, uid, nick: W.nickIn(ws, uid), q: at[0], r: at[1], text }
  await pipe([['LPUSH', KX.say, JSON.stringify(x)], ['LTRIM', KX.say, 0, 199], ['HSET', KX.sayT, uid, ws.now]])
  return { ok: true, data: await withLetters(W.viewOf(ws, uid), uid) }
}

/* ================= answers slipped under the Gate: only the admin reads them ================= */
type Reply = { id: string; t: number; uid: string; nick: string; text: string; to?: string }
async function replyUnderGate(ws: W.WState, d: W.Dirty, uid: string, raw: unknown): Promise<{ ok: true; data: object } | { ok: false; error: string; status?: number }> {
  W.stepAll(ws, d); await save(ws, d)
  const c = ws.chars[uid]; if (!c) return { ok: false, error: 'No character yet.' }
  if (c.path.length || W.dist([c.q, c.r], W.GATE_CELL) > 1) return { ok: false, error: 'Walk to the North Gate. The gap under it is the only way out.' }
  const text = clean(raw, 1500); if (text.length < 2) return { ok: false, error: 'Write something first.' }
  const [last] = await pipe([['HGET', KX.replyT, uid]]); const wait = 30 * 60_000 - (ws.now - Number(last ?? 0))
  if (wait > 0) return { ok: false, error: `Your last note has hardly reached the snow. Again in ${Math.ceil(wait / 60000)} min.` }
  const r: Reply = { id: `r${ws.now.toString(36)}${uid.slice(-4)}`, t: ws.now, uid, nick: W.nickIn(ws, uid), text }
  await pipe([['LPUSH', KX.replies, JSON.stringify(r)], ['LTRIM', KX.replies, 0, 499], ['HSET', KX.replyT, uid, ws.now]])
  return { ok: true, data: await withLetters(W.viewOf(ws, uid), uid) }
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
    const to = b.to ? String(b.to).trim().slice(0, 80) : ''
    const l: Letter = { id: 'l' + at.toString(36), at, until: at + hours * 3600_000, from: String(b.from ?? 'the twelve').slice(0, 60), title, text, ...(to ? { to } : {}) }
    await pipe([['HSET', KX.letters, l.id, JSON.stringify(l)]])
  } else if (cmd === 'mail') {
    const text = clean(b.text, 1200), to = String(b.to ?? '').trim(), hands = String(b.hands ?? '').trim()
    if (!text || !to) return { ok: false as const, error: 'A letter needs a reader and a text.' }
    const [hs] = await pipe([['HGETALL', K.houses]]); const houses = parseAll<W.HouseLite>(hs)
    const find = (w: string) => Object.entries(houses).find(([k, h]) => k.toLowerCase() === w.toLowerCase() || (h.nick ?? '').toLowerCase() === w.toLowerCase())
    const reader = find(to); if (!reader) return { ok: false as const, error: 'No such reader.' }
    const carrier = hands ? find(hands) : null; if (hands && !carrier) return { ok: false as const, error: 'No such carrier.' }
    const from = String(b.from ?? 'T. V.').slice(0, 60)
    const x: Mail = { id: `m${now.toString(36)}adm`, at: now, from: 'story', fromNick: from, to: reader[0], toNick: reader[1].nick ?? 'someone', text, where: carrier ? 'hands' : 'sack', holder: carrier ? carrier[0] : null, sealBy: null, trail: carrier ? [{ uid: carrier[0], nick: carrier[1].nick ?? 'someone', t: now }] : [] }
    await putMail(x)
  } else if (cmd === 'maildel') await pipe([['HDEL', KX.mail, String(b.id ?? '')]])
  else if (cmd === 'del') await pipe([['HDEL', KX.letters, String(b.id ?? '')]])
  else if (cmd === 'phase') { story.phase = Math.max(0, Math.min(3, Number(b.phase) || 0)); await pipe([['SET', KX.story, JSON.stringify(story)]]) }
  else if (cmd === 'hush') { story.hush = Math.max(0, Math.min(W.HUSH_MAX, Number(b.hush) || 0)); story.ht = now; await pipe([['SET', KX.story, JSON.stringify(story)]]) }
  else if (cmd === 'unveil') { story.unveil = { at: now, until: now + (Number(b.hours) || 3) * 3600_000 }; await pipe([['SET', KX.story, JSON.stringify(story)], ['LPUSH', K.events, JSON.stringify({ id: `uv${now}`, t: now, topic: 'unveil', by: '', tab: 'server', data: { until: story.unveil.until } })]]) }
  else if (cmd === 'calm') { story.unveil = null; await pipe([['SET', KX.story, JSON.stringify(story)]]) }
  const [cnt] = await pipe([['HGETALL', KX.letters + ':n']]); const n = pairs(cnt)
  const [rl] = await pipe([['LRANGE', KX.replies, 0, 99]])
  const replies = ((rl as string[]) ?? []).map(x => safe(x)).filter(Boolean)
  const mail = (await mailAll()).slice(-60).reverse().map(m => ({ id: m.id, at: m.at, fromNick: m.anon ? `${m.fromNick} (unsigned)` : m.fromNick, toNick: m.toNick, where: m.where, holder: m.holder, sealBy: m.sealBy, hands: m.trail.map(x => x.nick), text: m.text, reported: !!m.reported, burnedBy: m.burnedBy }))
  return { ok: true as const, data: { story: { ...story, hush: Math.round(W.hushNow(story, now)) }, letters: (await lettersAll()).map(l => ({ ...l, reads: Number(n[l.id] ?? 0) })), replies, mail } }
}
