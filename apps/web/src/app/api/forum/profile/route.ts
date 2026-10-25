import { NextResponse } from 'next/server'
import { getSession } from '@/lib/forum/auth'
import { readJson, writeFile, writeJson } from '@/lib/forum/github'
import { PROFILES_PATH, memberOfLogin, type Profile } from '@/lib/forum/publish'

export const dynamic = 'force-dynamic'

const X = /^[A-Za-z0-9_]{1,15}$/
const AVATAR_PATH = (h: string) => `apps/web/public/forum/avatars/${h}.jpg`

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Login first.' }, { status: 401 })
  try {
    const { handle, name, exists } = await memberOfLogin(user)
    const { data } = await readJson<Record<string, Profile>>(PROFILES_PATH)
    return NextResponse.json({ handle, name, exists, profile: data[handle.toLowerCase()] ?? {} })
  } catch (e) {
    return NextResponse.json({ error: `Could not load the profile: ${(e as Error).message.slice(0, 120)}` }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Login first.' }, { status: 401 })
  const b = (await req.json().catch(() => null)) as { x?: string; signature?: string; bio?: string; avatar?: string; removeAvatar?: boolean } | null
  if (!b) return NextResponse.json({ error: 'bad request' }, { status: 400 })
  const x = (b.x ?? '').replace(/^@/, '').trim()
  if (x && !X.test(x)) return NextResponse.json({ error: 'An X handle is 1 to 15 letters, digits or underscores.' }, { status: 400 })
  const signature = (b.signature ?? '').replace(/\s+/g, ' ').trim().slice(0, 160)
  const bio = (b.bio ?? '').replace(/\r/g, '').trim().slice(0, 600)
  let jpeg: Buffer | null = null
  if (b.avatar) {
    const m = b.avatar.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/)
    if (!m) return NextResponse.json({ error: 'The avatar must be a JPEG.' }, { status: 400 })
    jpeg = Buffer.from(m[1]!, 'base64')
    if (jpeg.length > 60_000) return NextResponse.json({ error: 'The avatar is too large (60 KB max).' }, { status: 400 })
    if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) return NextResponse.json({ error: 'The avatar must be a JPEG.' }, { status: 400 })
  }
  try {
    const me = await memberOfLogin(user)
    const handle = me.handle.toLowerCase()
    const owner = me.known.find(k => k.handle.toLowerCase() === x.toLowerCase())
    if (x && owner && owner.handle.toLowerCase() !== handle) return NextResponse.json({ error: `@${owner.handle} is the X account of member ${owner.author}. If that is you, ask a moderator to link your login to them.` }, { status: 409 })
    const { data, sha } = await readJson<Record<string, Profile>>(PROFILES_PATH)
    const cur = data[handle] ?? {}
    const next: Profile = { ...cur }
    if (x) next.x = x
    else delete next.x
    if (signature) next.signature = signature
    else delete next.signature
    if (bio) next.bio = bio
    else delete next.bio
    if (jpeg) {
      await writeFile(AVATAR_PATH(handle), jpeg.toString('base64'), `forum: avatar of ${handle}`)
      next.avatar = `/forum/avatars/${handle}.jpg?v=${Date.now().toString(36)}`
    } else if (b.removeAvatar) delete next.avatar
    data[handle] = next
    await writeJson(PROFILES_PATH, data, sha, `forum: profile of ${handle}`)
    return NextResponse.json({ ok: true, handle, profile: next })
  } catch (e) {
    return NextResponse.json({ error: `Could not save: ${(e as Error).message.slice(0, 160)}` }, { status: 500 })
  }
}
