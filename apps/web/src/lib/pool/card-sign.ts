/**
 * Share card links: the card's numbers travel in the URL, signed with HMAC-SHA256 (key FORUM_SECRET, a
 * domain prefix so no forum token can pass as a card) and a short expiry. An edited number or an old
 * link draws nothing. Nothing is stored: the token is the whole state.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import { RIG } from './config.ts'
import { type CardData, checkCard } from './rig.ts'

const PREFIX = 'qc-pool-card|v1|'

const mac = (body: string, secret: string) => createHmac('sha256', secret).update(PREFIX + body).digest('base64url')

/** The signing key: FORUM_SECRET; dev and tests fall back to a fixed one, production refuses. */
export function cardSecret(env: Record<string, string | undefined> = process.env): string | null {
  const s = env.FORUM_SECRET
  if (s && s.length >= 16) return s
  return env.NODE_ENV === 'production' ? null : 'qc-pool-card-dev-secret-not-for-production'
}

/** token = base64url(json with exp).signature */
export function signCard(card: CardData, secret: string, nowMs = Date.now(), ttlS: number = RIG.cardTtlS): { token: string; exp: number } {
  const exp = Math.floor(nowMs / 1000) + ttlS
  const body = Buffer.from(JSON.stringify({ ...card, exp })).toString('base64url')
  return { token: `${body}.${mac(body, secret)}`, exp }
}

/** The card, or null when the signature is wrong, the link expired, or the payload does not check out. */
export function verifyCard(token: string | null | undefined, secret: string, nowMs = Date.now()): CardData | null {
  if (!token || token.length > 4000) return null
  const [body, sig, extra] = token.split('.')
  if (!body || !sig || extra !== undefined) return null
  const want = Buffer.from(mac(body, secret))
  const got = Buffer.from(sig)
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null
  try {
    const j = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Record<string, unknown>
    if (typeof j.exp !== 'number' || j.exp < nowMs / 1000) return null
    const { exp: _exp, ...rest } = j
    // signed cards were checked before signing; a pool card is allowed here because only the server signs those
    const c = checkCard(rest, { allowPool: true })
    return c.ok ? c.value : null
  } catch {
    return null
  }
}
