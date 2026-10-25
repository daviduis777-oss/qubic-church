import 'server-only'
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

/**
 * Forum identity with no personal data.
 * - qubic: the user signed a login message with a Qubic wallet; we keep the public ID only.
 * - trip: an imageboard-style tripcode (name#secret); we keep a hash of the secret only.
 * Sessions and nonces are HMAC-signed tokens, so there is no session table anywhere.
 */
export type ForumUser = {
  auth: 'qubic' | 'trip'
  /** 60-char Qubic ID, or "trip:<code>" */
  id: string
  /** display name chosen by the user */
  name: string
  /** url-safe member key used for profile pages */
  handle: string
}

const COOKIE = 'qcf_session'
const SESSION_DAYS = 30

function secret(): Buffer {
  const s = process.env.FORUM_SECRET
  if (!s || s.length < 16) throw new Error('FORUM_SECRET is not set')
  return Buffer.from(s, 'utf8')
}

const b64u = (b: Buffer) => b.toString('base64url')
const hmac = (data: string) => b64u(createHmac('sha256', secret()).update(data).digest())

/** token = base64url(json).signature */
export function signToken(payload: Record<string, unknown>, ttlSeconds: number): string {
  const body = b64u(Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds })))
  return `${body}.${hmac(body)}`
}

export function verifyToken<T extends Record<string, unknown>>(token: string | undefined | null): (T & { exp: number }) | null {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expect = hmac(body)
  if (expect.length !== sig.length || !timingSafeEqual(Buffer.from(expect), Buffer.from(sig))) return null
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T & { exp: number }
    if (typeof data.exp !== 'number' || data.exp < Date.now() / 1000) return null
    return data
  } catch {
    return null
  }
}

/** A login challenge. The wallet signs loginMessage(nonce); the server checks the nonce token and the signature. */
export function makeNonce(): { nonce: string; token: string; message: string } {
  const nonce = b64u(randomBytes(18))
  const token = signToken({ nonce }, 10 * 60)
  return { nonce, token, message: loginMessage(nonce) }
}

export const loginMessage = (nonce: string) => `Qubic Church Forum login\nnonce: ${nonce}\nThis signature only proves you hold this ID. It moves nothing.`

export const QUBIC_ID = /^[A-Z]{60}$/

/** Tripcode: a short code derived from the secret, never the secret itself. */
export function tripcode(secretWord: string): string {
  return b64u(createHmac('sha256', secret()).update(`trip:${secretWord}`).digest()).replace(/[-_]/g, '').slice(0, 10)
}

export const cleanName = (s: string) => s.replace(/[^\p{L}\p{N} _.'-]/gu, '').trim().slice(0, 24)

export function handleFor(user: Pick<ForumUser, 'auth' | 'id'>): string {
  return user.auth === 'qubic' ? `q-${user.id.slice(0, 12).toLowerCase()}` : `t-${user.id.replace(/^trip:/, '').toLowerCase()}`
}

export async function getSession(): Promise<ForumUser | null> {
  const jar = await cookies()
  const t = verifyToken<ForumUser>(jar.get(COOKIE)?.value)
  if (!t) return null
  const { auth, id, name, handle } = t
  return { auth, id, name, handle }
}

export function sessionCookie(user: ForumUser) {
  return {
    name: COOKIE,
    value: signToken(user as unknown as Record<string, unknown>, SESSION_DAYS * 86400),
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 86400,
  }
}

export const clearedCookie = { name: COOKIE, value: '', path: '/', maxAge: 0 }

export function modKeyOk(key: string | null | undefined): boolean {
  const k = process.env.FORUM_MOD_KEY
  if (!k || !key || k.length !== key.length) return false
  return timingSafeEqual(Buffer.from(k), Buffer.from(key))
}
