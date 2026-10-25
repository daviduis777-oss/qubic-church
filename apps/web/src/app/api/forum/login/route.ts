import { NextResponse } from 'next/server'
import { QUBIC_ID, cleanName, handleFor, loginMessage, sessionCookie, tripcode, verifyToken, type ForumUser } from '@/lib/forum/auth'
import { verifyQubicSignature } from '@/lib/forum/qubic'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, string> | null
  if (!body) return NextResponse.json({ error: 'bad request' }, { status: 400 })
  const name = cleanName(body.name ?? '')
  if (name.length < 2) return NextResponse.json({ error: 'Pick a name, 2 to 24 characters.' }, { status: 400 })

  let user: ForumUser
  if (body.method === 'qubic') {
    const identity = (body.identity ?? '').toUpperCase()
    if (!QUBIC_ID.test(identity)) return NextResponse.json({ error: 'Not a Qubic ID.' }, { status: 400 })
    const nonce = verifyToken<{ nonce: string }>('nonce', body.token)
    if (!nonce) return NextResponse.json({ error: 'Login challenge expired. Try again.' }, { status: 400 })
    const ok = await verifyQubicSignature(identity, loginMessage(nonce.nonce), body.signature ?? '')
    if (!ok) return NextResponse.json({ error: 'Signature does not match this ID.' }, { status: 401 })
    user = { auth: 'qubic', id: identity, name, handle: handleFor({ auth: 'qubic', id: identity }) }
  } else if (body.method === 'trip') {
    const secret = (body.secret ?? '').trim()
    if (secret.length < 8) return NextResponse.json({ error: 'The secret word needs at least 8 characters. Keep it: it is your only key.' }, { status: 400 })
    const id = `trip:${tripcode(secret)}`
    user = { auth: 'trip', id, name, handle: handleFor({ auth: 'trip', id }) }
  } else {
    return NextResponse.json({ error: 'unknown method' }, { status: 400 })
  }
  const res = NextResponse.json({ user })
  res.cookies.set(sessionCookie(user))
  return res
}
