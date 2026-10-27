import 'server-only'
import { randomBytes } from 'node:crypto'
import { type ForumUser, modKeyOk } from '@/lib/forum/auth'
import { K, pairs, pipe, run } from './store'

/**
 * Who can enter Aigarth while it is closed.
 * - admins: whoever entered the mod key once while logged in (or is listed in W4W_ADMINS).
 * - players: people who redeemed an invite code an admin made.
 * The account is the same one the Crypt and BPP-9000 use.
 */
export type Access = { player: boolean; admin: boolean }

const envAdmins = () => (process.env.W4W_ADMINS ?? '').split(',').map(s => s.trim()).filter(Boolean)

export async function accessOf(user: ForumUser | null): Promise<Access> {
  if (!user) return { player: false, admin: false }
  if (envAdmins().includes(user.handle)) return { player: true, admin: true }
  try {
    const [a, p] = (await pipe([['SISMEMBER', K.admins, user.handle], ['SISMEMBER', K.players, user.handle]])) as number[]
    return { admin: a === 1, player: a === 1 || p === 1 }
  } catch {
    return { player: false, admin: false }
  }
}

export type Invite = { code: string; by: string; at: number; usedBy?: string; usedName?: string; usedAt?: number; note?: string }

const remember = (u: ForumUser) => ['HSET', K.who, u.handle, JSON.stringify({ name: u.name, auth: u.auth, at: Date.now() })]

/** Redeem an invite code, or the mod key to become an admin. */
export async function redeem(user: ForumUser, raw: string): Promise<{ ok: true; admin: boolean } | { ok: false; error: string }> {
  const code = raw.trim()
  if (!code) return { ok: false, error: 'Enter the code.' }
  if (modKeyOk(code)) {
    await pipe([['SADD', K.admins, user.handle], ['SADD', K.players, user.handle], remember(user)])
    return { ok: true, admin: true }
  }
  const key = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const json = await run<string | null>('HGET', K.invites, key)
  if (!json) return { ok: false, error: 'This code does not open the gate.' }
  const inv = JSON.parse(json) as Invite
  if (inv.usedBy && inv.usedBy !== user.handle) return { ok: false, error: 'This code was already used.' }
  inv.usedBy = user.handle
  inv.usedName = user.name
  inv.usedAt = inv.usedAt ?? Date.now()
  await pipe([['HSET', K.invites, key, JSON.stringify(inv)], ['SADD', K.players, user.handle], remember(user)])
  return { ok: true, admin: false }
}

export async function makeInvite(admin: ForumUser, note?: string): Promise<Invite> {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const b = randomBytes(8)
  const code = Array.from(b, x => alphabet[x % alphabet.length]).join('')
  const inv: Invite = { code, by: admin.handle, at: Date.now(), note: note?.slice(0, 60) || undefined }
  await run('HSET', K.invites, code, JSON.stringify(inv))
  return inv
}

export async function adminView() {
  const [inv, players, admins, who] = await pipe([['HGETALL', K.invites], ['SMEMBERS', K.players], ['SMEMBERS', K.admins], ['HGETALL', K.who]])
  const names = Object.fromEntries(Object.entries(pairs(who)).map(([h, j]) => [h, (JSON.parse(j) as { name: string }).name]))
  const adminSet = new Set(admins as string[])
  return {
    invites: Object.values(pairs(inv)).map(j => JSON.parse(j) as Invite).sort((a, b) => b.at - a.at),
    players: (players as string[]).map(h => ({ handle: h, name: names[h] ?? h, admin: adminSet.has(h) })),
  }
}

export async function revoke(handle: string) {
  await pipe([['SREM', K.players, handle]])
}

export async function dropInvite(code: string) {
  await run('HDEL', K.invites, code)
}
